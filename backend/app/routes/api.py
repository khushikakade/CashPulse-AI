from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import RecoveryCase, RecoveryAction, AuditLog, CashEvent, Invoice, Payment, Customer, Business, Order
from backend.app.schemas import (
    DashboardOverview, DashboardMetrics, RecommendedActionItem,
    RecoveryCaseResponse, CashFlowForecastResponse, ReconOverview,
    ScenarioTrigger, PolicySettingUpdate, InvoiceResponse, AuditLogResponse
)
from backend.app.services.ml_engine import MLEngine
from backend.app.services.reconciliation_engine import ReconciliationEngine
from backend.app.services.agent_orchestrator import AgentOrchestrator
from backend.app.services.synthetic_data import generate_synthetic_data
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter()

class OnboardingRequest(BaseModel):
    name: str
    business_type: str
    product_sold: str
    monthly_revenue: float
    customer_count: int
    payment_terms: str

from fastapi import Request

def get_current_business(request: Request, db: Session = Depends(get_db)) -> Business:
    # 1. Check header
    business_id = request.headers.get("X-Business-ID")
    # 2. Check cookie
    if not business_id:
        business_id = request.cookies.get("business_id")
    
    b = None
    if business_id:
        b = db.query(Business).filter(Business.id == business_id).first()
            
    # Fallback to the latest business
    if not b:
        b = db.query(Business).order_by(Business.created_at.desc()).first()
        
    if not b:
        b = Business(
            name="द्वीSakhi",
            business_type="D2C Brand",
            currency="INR",
            product_sold="Tote Bags, Bucket Hats, Caps, Pouches, DTF Stickers",
            monthly_revenue=420000.0,
            customer_count=180,
            payment_terms="COD + UPI/Razorpay"
        )
        db.add(b)
        db.commit()
        db.refresh(b)
        generate_synthetic_data(db, "healthy", business_id=b.id)
        AgentOrchestrator.scan_and_detect_risks(db)
    else:
        # Check if business has customers and invoices
        has_invoices = db.query(Invoice).join(Customer).filter(Customer.business_id == b.id).first()
        if not has_invoices:
            generate_synthetic_data(db, "healthy", business_id=b.id)
            AgentOrchestrator.scan_and_detect_risks(db)
            
    return b

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
    generate_synthetic_data(db, "healthy", business_id=business.id)
    
    # Run first scan
    AgentOrchestrator.scan_and_detect_risks(db)
    
    return {"status": "success", "business_id": business.id}

@router.get("/business/active")
def get_active_business(request: Request, db: Session = Depends(get_db)):
    business_id = request.cookies.get("business_id") or request.headers.get("X-Business-ID")
    if business_id:
        b = db.query(Business).filter(Business.id == business_id).first()
        if b:
            return {"active": True, "id": b.id, "name": b.name, "business_type": b.business_type}
    b = db.query(Business).order_by(Business.created_at.desc()).first()
    if b:
        return {"active": True, "id": b.id, "name": b.name, "business_type": b.business_type}
    return {"active": False}

@router.get("/dashboard/metrics", response_model=DashboardOverview)
def get_dashboard_metrics(business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
    # Scan for new risks dynamically
    AgentOrchestrator.scan_and_detect_risks(db)
    
    # Financial indicators
    cash_events = db.query(CashEvent).filter(CashEvent.business_id == business.id).all()
    inflows = sum(e.amount for e in cash_events if e.event_type == "inflow")
    outflows = sum(e.amount for e in cash_events if e.event_type == "outflow")
    
    cash_available = max(185000.0, inflows - outflows)
    
    invoices = db.query(Invoice).join(Customer).filter(Customer.business_id == business.id, Invoice.status != "paid").all()
    outstanding_receivables = sum(i.amount for i in invoices)
    
    failed_payments = db.query(Payment).join(Customer).filter(Customer.business_id == business.id, Payment.status == "failed").all()
    unrecovered_payments_value = sum(fp.amount for fp in failed_payments)
            
    # Recovery statistics
    recovered_actions = db.query(AuditLog).join(RecoveryAction).join(RecoveryCase).join(Customer).filter(Customer.business_id == business.id, AuditLog.event_type == "PAYMENT_RECOVERED").all()
    recovered_this_month = sum(log.payload.get("recovered_amount", 0.0) if log.payload else 0.0 for log in recovered_actions)
    
    open_cases = db.query(RecoveryCase).join(Customer).filter(Customer.business_id == business.id, RecoveryCase.current_status.in_(["open", "in_progress", "human_review"])).all()
    revenue_at_risk = sum(case.expected_recovery_value / max(0.1, case.recovery_probability) for case in open_cases)
    recoverable_value = sum(case.expected_recovery_value for case in open_cases)
    
    daily_burn = 4500.0  # realistic DwiSakhi daily operational burn
    cash_runway_days = int(cash_available / daily_burn) if cash_available > 0 else 0
    
    metrics = DashboardMetrics(
        financial_health_score=max(70, min(99, 98 - int(len(open_cases) * 2) - int(unrecovered_payments_value / 2000))),
        cash_available=cash_available,
        expected_30day_cash=cash_available + (outstanding_receivables * 0.85) - 125000.0,
        revenue_at_risk=revenue_at_risk,
        recoverable_value=recoverable_value,
        recovered_this_month=recovered_this_month,
        outstanding_receivables=outstanding_receivables,
        failed_payments_value=unrecovered_payments_value,
        cash_runway_days=cash_runway_days,
        projected_shortfall_value=max(0.0, 100000.0 - cash_available)
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

@router.get("/dashboard/brief")
def get_dashboard_brief(business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
    from backend.app.services.llm_service import LLMService
    
    cash_events = db.query(CashEvent).filter(CashEvent.business_id == business.id).all()
    inflows = sum(e.amount for e in cash_events if e.event_type == "inflow")
    outflows = sum(e.amount for e in cash_events if e.event_type == "outflow")
    cash_available = max(50000.0, inflows - outflows)
    
    invoices = db.query(Invoice).join(Customer).filter(Customer.business_id == business.id, Invoice.status != "paid").all()
    outstanding_receivables = sum(i.amount for i in invoices)
    
    open_cases = db.query(RecoveryCase).join(Customer).filter(Customer.business_id == business.id, RecoveryCase.current_status.in_(["open", "in_progress", "human_review"])).all()
    revenue_at_risk = sum(case.expected_recovery_value / max(0.1, case.recovery_probability) for case in open_cases)
    
    recovered_actions = db.query(AuditLog).join(RecoveryAction).join(RecoveryCase).join(Customer).filter(Customer.business_id == business.id, AuditLog.event_type == "PAYMENT_RECOVERED").all()
    recovered_this_month = sum(log.payload.get("recovered_amount", 0.0) if log.payload else 0.0 for log in recovered_actions)
    
    brief_text = LLMService.generate_business_brief(
        business_name=business.name,
        cash=cash_available,
        overdue=outstanding_receivables,
        at_risk=revenue_at_risk,
        recovered=recovered_this_month
    )
    return {"brief": brief_text}

@router.get("/recovery/cases", response_model=List[RecoveryCaseResponse])
def get_recovery_cases(business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
    return db.query(RecoveryCase).join(Customer).filter(Customer.business_id == business.id).all()

@router.get("/recovery/cases/{case_id}", response_model=RecoveryCaseResponse)
def get_recovery_case_by_id(case_id: str, business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
    case = db.query(RecoveryCase).join(Customer).filter(RecoveryCase.id == case_id, Customer.business_id == business.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.post("/recovery/cases/{case_id}/process")
def process_recovery_case(case_id: str, business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
    # Validate case belongs to business
    case = db.query(RecoveryCase).join(Customer).filter(RecoveryCase.id == case_id, Customer.business_id == business.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    res = AgentOrchestrator.process_recovery_case(db, case_id)
    return res

import time

forecast_cache = {}

@router.get("/cashflow/forecast", response_model=CashFlowForecastResponse)
def get_cashflow_forecast(business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
    cache_key = f"forecast_{business.id}"
    now_ts = time.time()
    if cache_key in forecast_cache:
        cached_val, expiry = forecast_cache[cache_key]
        if now_ts < expiry:
            return cached_val

    points = MLEngine.forecast_cash_flow(db, business.id, 90)
    lowers = [p["lower_bound"] for p in points]
    has_shortfall = any(l <= 50000.0 for l in lowers)
    shortfall_prob = 0.65 if has_shortfall else 0.05
    
    res = CashFlowForecastResponse(
        forecast=points,
        runway_days=len(points),
        shortfall_probability=shortfall_prob,
        message="Cash reserves stable. Recommended to secure ₹80K in upcoming invoices to maintain runway."
    )
    forecast_cache[cache_key] = (res, now_ts + 10.0) # cache for 10 seconds
    return res

@router.get("/receivables/queue", response_model=List[InvoiceResponse])
def get_receivables_queue(business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
    return db.query(Invoice).join(Customer).filter(Customer.business_id == business.id, Invoice.status != "paid").order_by(Invoice.probability_of_payment.asc()).all()

@router.get("/reconciliation/report", response_model=ReconOverview)
def get_reconciliation_report(business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
    return ReconciliationEngine.run_reconciliation(db, business.id)

@router.post("/scenarios/trigger")
def trigger_scenario(trigger: ScenarioTrigger, business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
    generate_synthetic_data(db, trigger.scenario_name, business_id=business.id)
    AgentOrchestrator.scan_and_detect_risks(db)
    return {"status": "success", "scenario": trigger.scenario_name}

class DecisionRequest(BaseModel):
    decision: Optional[str] = "approve"
    approve: Optional[bool] = None

@router.get("/approvals/queue")
def get_approvals_queue(business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
    actions = db.query(RecoveryAction).join(RecoveryCase).join(Customer).filter(
        RecoveryAction.status == "pending_approval",
        Customer.business_id == business.id
    ).all()
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
            "id": a.id,
            "action_id": a.id,
            "case_id": case.id if case else "",
            "customer_name": customer.name if customer else "College Fest Account",
            "amount": amount,
            "action_type": a.action_type,
            "confidence": case.recovery_probability if case else 0.0,
            "risk_level": case.risk_level if case else "high",
            "reason_for_review": a.notes or (case.explanation if case else "Amount exceeds ₹50,000 threshold. Paused for Neha & Khushi's manual sign-off."),
            "created_at": a.created_at.isoformat() if a.created_at else datetime.utcnow().isoformat()
        })
    return {"items": res, "total": len(res)}

@router.post("/approvals/{action_id}/decide")
def decide_approval(
    action_id: str, 
    payload: Optional[DecisionRequest] = None, 
    approve: Optional[bool] = None, 
    business: Business = Depends(get_current_business), 
    db: Session = Depends(get_db)
):
    action = db.query(RecoveryAction).join(RecoveryCase).join(Customer).filter(
        RecoveryAction.id == action_id,
        Customer.business_id == business.id
    ).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    case = db.query(RecoveryCase).filter(RecoveryCase.id == action.case_id).first()
    
    is_approved = False
    if payload:
        is_approved = (payload.decision == "approve" or payload.approve is True)
    elif approve is not None:
        is_approved = approve

    if is_approved:
        action.status = "approved"
        db.commit()
        return AgentOrchestrator.execute_action(db, action.id)
    else:
        action.status = "rejected"
        if case:
            case.current_status = "closed_failed"
        db.commit()
        return {"status": "rejected", "action_id": action.id}
        
        db.add(AuditLog(
            action_id=action.id,
            event_type="ACTION_REJECTED",
            message=f"Human reviewer rejected recovery action {action.action_type} for this case.",
            payload={"case_id": case.id if case else ""}
        ))
        db.commit()
        return {"status": "rejected"}

@router.get("/audit/trail", response_model=List[AuditLogResponse])
def get_audit_trail(business: Business = Depends(get_current_business), db: Session = Depends(get_db)):
    return db.query(AuditLog).join(RecoveryAction).join(RecoveryCase).join(Customer).filter(
        Customer.business_id == business.id
    ).order_by(AuditLog.created_at.desc()).all()

from fastapi import Request
from fastapi.responses import StreamingResponse
import json
import asyncio
from backend.app.services.event_publisher import EventPublisher

@router.get("/events/stream")
async def events_stream(request: Request):
    q = EventPublisher.subscribe()
    async def generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    msg = await asyncio.wait_for(q.get(), timeout=5.0)
                    yield f"event: {msg['event']}\ndata: {json.dumps(msg['data'])}\n\n"
                except asyncio.TimeoutError:
                    yield "event: ping\ndata: heartbeat\n\n"
        finally:
            EventPublisher.unsubscribe(q)

    return StreamingResponse(generator(), media_type="text/event-stream")

class CommandQuery(BaseModel):
    query: str

@router.post("/command")
def process_command(cmd: CommandQuery):
    from backend.app.services.llm_service import LLMService
    route = LLMService.route_command(cmd.query)
    return {"route": route}

