from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import RecoveryCase, RecoveryAction, AuditLog, CashEvent, Invoice, Payment, Customer, Business, Order
from backend.app.schemas import (
    DashboardOverview, DashboardMetrics, RecommendedActionItem,
    RecoveryCaseResponse, CashFlowForecastResponse, ReconOverview,
    ScenarioTrigger, PolicySettingUpdate
)
from backend.app.services.ml_engine import MLEngine
from backend.app.services.reconciliation_engine import ReconciliationEngine
from backend.app.services.agent_orchestrator import AgentOrchestrator
from backend.app.services.synthetic_data import generate_synthetic_data
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import List

router = APIRouter()

class OnboardingRequest(BaseModel):
    name: str
    business_type: str
    product_sold: str
    monthly_revenue: float
    customer_count: int
    payment_terms: str

@router.post("/onboarding")
def create_business_onboarding(req: OnboardingRequest, db: Session = Depends(get_db)):
    # Create business
    business = Business(
        name=req.name,
        business_type=req.business_type,
        product_sold=req.product_sold,
        monthly_revenue=req.monthly_revenue,
        customer_count=req.customer_count,
        payment_terms=req.payment_terms
    )
    db.add(business)
    db.commit()
    db.refresh(business)
    
    # Pre-populate custom mock data based on input
    generate_synthetic_data(db, "healthy")
    # Update the generated business reference to our new onboarding business
    custs = db.query(Customer).all()
    for c in custs:
        c.business_id = business.id
    db.commit()
    
    # Run first scan
    AgentOrchestrator.scan_and_detect_risks(db)
    
    return {"status": "success", "business_id": business.id}

@router.get("/business/active")
def get_active_business(db: Session = Depends(get_db)):
    b = db.query(Business).order_by(Business.created_at.desc()).first()
    if not b:
        return {"active": False}
    return {"active": True, "id": b.id, "name": b.name, "business_type": b.business_type}

@router.get("/dashboard/metrics", response_model=DashboardOverview)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    business = db.query(Business).order_by(Business.created_at.desc()).first()
    if not business:
        # If no business onboarded yet, return empty defaults
        metrics = DashboardMetrics(
            financial_health_score=100, cash_available=0.0, expected_30day_cash=0.0,
            revenue_at_risk=0.0, recoverable_value=0.0, recovered_this_month=0.0,
            outstanding_receivables=0.0, failed_payments_value=0.0, cash_runway_days=0,
            projected_shortfall_value=0.0
        )
        return DashboardOverview(metrics=metrics, top_actions=[])
        
    # Scan for new risks dynamically
    AgentOrchestrator.scan_and_detect_risks(db)
    
    # Financial indicators
    cash_events = db.query(CashEvent).filter(CashEvent.business_id == business.id).all()
    inflows = sum(e.amount for e in cash_events if e.event_type == "inflow")
    outflows = sum(e.amount for e in cash_events if e.event_type == "outflow")
    
    cash_available = max(50000.0, inflows - outflows)
    
    invoices = db.query(Invoice).filter(Invoice.status != "paid").all()
    outstanding_receivables = sum(i.amount for i in invoices)
    
    failed_payments = db.query(Payment).filter(Payment.status == "failed").all()
    unrecovered_payments_value = sum(fp.amount for fp in failed_payments)
            
    # Recovery statistics
    recovered_actions = db.query(AuditLog).filter(AuditLog.event_type == "PAYMENT_RECOVERED").all()
    recovered_this_month = sum(log.payload.get("recovered_amount", 0.0) if log.payload else 0.0 for log in recovered_actions)
    
    open_cases = db.query(RecoveryCase).filter(RecoveryCase.current_status.in_(["open", "in_progress", "human_review"])).all()
    revenue_at_risk = sum(case.expected_recovery_value / max(0.1, case.recovery_probability) for case in open_cases)
    recoverable_value = sum(case.expected_recovery_value for case in open_cases)
    
    daily_burn = 12000.0
    cash_runway_days = int(cash_available / daily_burn) if cash_available > 0 else 0
    
    metrics = DashboardMetrics(
        financial_health_score=max(35, min(99, 100 - int(len(open_cases) * 5) - int(unrecovered_payments_value / 50000))),
        cash_available=cash_available,
        expected_30day_cash=cash_available + (outstanding_receivables * 0.70) - 200000.0,
        revenue_at_risk=revenue_at_risk,
        recoverable_value=recoverable_value,
        recovered_this_month=recovered_this_month,
        outstanding_receivables=outstanding_receivables,
        failed_payments_value=unrecovered_payments_value,
        cash_runway_days=cash_runway_days,
        projected_shortfall_value=max(0.0, 250000.0 - cash_available)
    )
    
    top_actions = []
    for idx, case in enumerate(open_cases[:3]):
        cust = db.query(Customer).filter(Customer.id == case.customer_id).first()
        act = db.query(RecoveryAction).filter(RecoveryAction.case_id == case.id).first()
        action_id = act.id if act else f"temp_act_{case.id}"
        
        top_actions.append(RecommendedActionItem(
            case_id=case.id,
            action_id=action_id,
            title=f"Recover ₹{case.expected_recovery_value:,.0f} from {cust.name if cust else 'Unknown'}",
            description=f"Action: {case.recommended_action or 'SEND_REMINDER'}. Reason: {case.root_cause}. Explanation: {case.explanation}",
            impact_value=case.expected_recovery_value,
            confidence=case.recovery_probability,
            risk_level=case.risk_level,
            needs_approval=case.risk_level in ["high", "medium"] or case.expected_recovery_value > 50000.0
        ))
        
    return DashboardOverview(metrics=metrics, top_actions=top_actions)

@router.get("/recovery/cases", response_model=List[RecoveryCaseResponse])
def get_recovery_cases(db: Session = Depends(get_db)):
    return db.query(RecoveryCase).all()

@router.get("/recovery/cases/{case_id}", response_model=RecoveryCaseResponse)
def get_recovery_case_by_id(case_id: str, db: Session = Depends(get_db)):
    case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.post("/recovery/cases/{case_id}/process")
def process_recovery_case(case_id: str, db: Session = Depends(get_db)):
    res = AgentOrchestrator.process_recovery_case(db, case_id)
    return res

@router.get("/cashflow/forecast", response_model=CashFlowForecastResponse)
def get_cashflow_forecast(db: Session = Depends(get_db)):
    business = db.query(Business).order_by(Business.created_at.desc()).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    points = MLEngine.forecast_cash_flow(db, business.id, 90)
    lowers = [p["lower_bound"] for p in points]
    has_shortfall = any(l <= 50000.0 for l in lowers)
    shortfall_prob = 0.65 if has_shortfall else 0.05
    
    return CashFlowForecastResponse(
        forecast=points,
        runway_days=len(points),
        shortfall_probability=shortfall_prob,
        message="Cash reserves stable. Recommended to secure ₹80K in upcoming invoices to maintain runway."
    )

@router.get("/receivables/queue", response_model=List[InvoiceResponse])
def get_receivables_queue(db: Session = Depends(get_db)):
    return db.query(Invoice).filter(Invoice.status != "paid").order_by(Invoice.probability_of_payment.asc()).all()

@router.get("/reconciliation/report", response_model=ReconOverview)
def get_reconciliation_report(db: Session = Depends(get_db)):
    return ReconciliationEngine.run_reconciliation(db)

@router.post("/scenarios/trigger")
def trigger_scenario(trigger: ScenarioTrigger, db: Session = Depends(get_db)):
    generate_synthetic_data(db, trigger.scenario_name)
    AgentOrchestrator.scan_and_detect_risks(db)
    return {"status": "success", "scenario": trigger.scenario_name}

@router.get("/approvals/queue")
def get_approvals_queue(db: Session = Depends(get_db)):
    actions = db.query(RecoveryAction).filter(RecoveryAction.status == "pending_approval").all()
    res = []
    for a in actions:
        case = db.query(RecoveryCase).filter(RecoveryCase.id == a.case_id).first()
        customer = db.query(Customer).filter(Customer.id == case.customer_id).first() if case else None
        
        amount = 0.0
        if case:
            if case.reference_type == "payment":
                p = db.query(Payment).filter(Payment.id == case.reference_id).first()
                amount = p.amount if p else 0.0
            else:
                inv = db.query(Invoice).filter(Invoice.id == case.reference_id).first()
                amount = inv.amount if inv else 0.0
                
        res.append({
            "action_id": a.id,
            "case_id": case.id if case else "",
            "customer_name": customer.name if customer else "Unknown",
            "amount": amount,
            "action_type": a.action_type,
            "confidence": case.recovery_probability if case else 0.0,
            "risk_level": case.risk_level if case else "low",
            "reason": case.explanation if case else ""
        })
    return res

@router.post("/approvals/{action_id}/decide")
def decide_approval(action_id: str, approve: boolean, db: Session = Depends(get_db)):
    action = db.query(RecoveryAction).filter(RecoveryAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    case = db.query(RecoveryCase).filter(RecoveryCase.id == action.case_id).first()
    
    if approve:
        action.status = "approved"
        db.commit()
        return AgentOrchestrator.execute_action(db, action.id)
    else:
        action.status = "rejected"
        if case:
            case.current_status = "closed_failed"
        db.commit()
        
        db.add(AuditLog(
            action_id=action.id,
            event_type="ACTION_REJECTED",
            message=f"Human reviewer rejected recovery action {action.action_type} for this case.",
            payload={"case_id": case.id if case else ""}
        ))
        db.commit()
        return {"status": "rejected"}

@router.get("/audit/trail", response_model=List[AuditLogResponse])
def get_audit_trail(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).all()
