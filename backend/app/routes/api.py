from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import RecoveryCase, RecoveryAction, AuditLog, CashEvent, Invoice, Payment, Customer, Business
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
import random
from typing import List

router = APIRouter()

@router.get("/dashboard/metrics", response_model=DashboardOverview)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    # Create synthetic business/data if none exists
    business = db.query(Business).first()
    if not business:
        generate_synthetic_data(db, "healthy")
        business = db.query(Business).first()
        # Scan once to populate recovery cases
        AgentOrchestrator.scan_and_detect_risks(db)
        
    # Scan for new risks dynamically
    AgentOrchestrator.scan_and_detect_risks(db)
    
    # Financial indicators
    cash_events = db.query(CashEvent).filter(CashEvent.business_id == business.id).all()
    inflows = sum(e.amount for e in cash_events if e.event_type == "inflow")
    outflows = sum(e.amount for e in cash_events if e.event_type == "outflow")
    
    # Net cash
    cash_available = max(50000.0, inflows - outflows)
    
    # Receivables & Failed Payments
    invoices = db.query(Invoice).filter(Invoice.status != "paid").all()
    outstanding_receivables = sum(i.amount for i in invoices)
    
    failed_payments = db.query(Payment).filter(Payment.status == "failed").all()
    # Check if failed payment is already recovered via a captured one
    unrecovered_payments_value = 0.0
    for fp in failed_payments:
        # Check if order is paid now
        order = db.query(Order).filter(Order.id == fp.order_id).first() if 'Order' in globals() else None
        if not order or order.status != "paid":
            unrecovered_payments_value += fp.amount
            
    # Recovery statistics
    recovered_actions = db.query(AuditLog).filter(AuditLog.event_type == "PAYMENT_RECOVERED").all()
    recovered_this_month = sum(log.payload.get("recovered_amount", 0.0) if log.payload else 0.0 for log in recovered_actions)
    
    open_cases = db.query(RecoveryCase).filter(RecoveryCase.current_status.in_(["open", "in_progress", "human_review"])).all()
    revenue_at_risk = sum(case.expected_recovery_value / max(0.1, case.recovery_probability) for case in open_cases)
    recoverable_value = sum(case.expected_recovery_value for case in open_cases)
    
    # Runway estimation
    daily_burn = 12000.0 # historical MSME default daily burn rate
    cash_runway_days = int(cash_available / daily_burn) if cash_available > 0 else 0
    
    # Metrics
    metrics = DashboardMetrics(
        financial_health_score=max(35, min(99, 100 - int(len(open_cases) * 5) - int(unrecovered_payments_value / 50000))),
        cash_available=cash_available,
        expected_30day_cash=cash_available + (outstanding_receivables * 0.70) - 200000.0, # factoring upcoming payroll
        revenue_at_risk=revenue_at_risk,
        recoverable_value=recoverable_value,
        recovered_this_month=recovered_this_month,
        outstanding_receivables=outstanding_receivables,
        failed_payments_value=unrecovered_payments_value,
        cash_runway_days=cash_runway_days,
        projected_shortfall_value=max(0.0, 250000.0 - cash_available)
    )
    
    # Top 3 Financial Actions
    top_actions = []
    for idx, case in enumerate(open_cases[:3]):
        cust = db.query(Customer).filter(Customer.id == case.customer_id).first()
        
        # Check if there is an active action
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
    business = db.query(Business).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    points = MLEngine.forecast_cash_flow(db, business.id, 90)
    
    # Calculate shortfall parameters
    lowers = [p["lower_bound"] for p in points]
    has_shortfall = any(l <= 50000.0 for l in lowers)
    shortfall_prob = 0.65 if has_shortfall else 0.05
    
    return CashFlowForecastResponse(
        forecast=points,
        runway_days=len(points),
        shortfall_probability=shortfall_prob,
        message="Cash reserves stable. Recommended to secure ₹80K in upcoming invoices to maintain baseline runway."
    )

@router.get("/receivables/queue", response_model=List[InvoiceResponse])
def get_receivables_queue(db: Session = Depends(get_db)):
    # Return priority list of unpaid/overdue invoices
    return db.query(Invoice).filter(Invoice.status != "paid").order_type(Invoice.probability_of_payment.desc()) if hasattr(db.query(Invoice), 'order_type') else db.query(Invoice).filter(Invoice.status != "paid").order_by(Invoice.probability_of_payment.asc()).all()

@router.get("/reconciliation/report", response_model=ReconOverview)
def get_reconciliation_report(db: Session = Depends(get_db)):
    return ReconciliationEngine.run_reconciliation(db)

@router.post("/scenarios/trigger")
def trigger_scenario(trigger: ScenarioTrigger, db: Session = Depends(get_db)):
    generate_synthetic_data(db, trigger.scenario_name)
    # Re-scan to generate corresponding cases
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
def decide_approval(action_id: str, approve: bool, db: Session = Depends(get_db)):
    action = db.query(RecoveryAction).filter(RecoveryAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    case = db.query(RecoveryCase).filter(RecoveryCase.id == action.case_id).first()
    
    if approve:
        action.status = "approved"
        db.commit()
        # Trigger execution directly
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
