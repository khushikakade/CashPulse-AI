from fastapi import APIRouter, Request, Header, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import WebhookEvent, Payment, Invoice, RecoveryCase, RecoveryAction, AuditLog
from backend.app.services.razorpay_client import razorpay_client
from datetime import datetime
from backend.app.services.event_publisher import EventPublisher

router = APIRouter()

@router.post("/razorpay")
async def handle_razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    body_bytes = await request.body()
    body_str = body_bytes.decode("utf-8")
    
    # 1. Signature Verification
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing signature header")
        
    is_valid = razorpay_client.verify_webhook_signature(body_str, x_razorpay_signature)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid signature verification failed")
        
    # Parse payload
    try:
        import json
        payload = json.loads(body_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
        
    event_id = payload.get("id")
    event_type = payload.get("event")
    
    if not event_id:
        raise HTTPException(status_code=400, detail="Missing event ID")
        
    # 2. Idempotency Check
    existing_event = db.query(WebhookEvent).filter(WebhookEvent.event_id == event_id).first()
    if existing_event:
        return {"status": "ignored", "reason": "Duplicate webhook event"}
        
    # Create event log
    db_event = WebhookEvent(
        event_id=event_id,
        event_type=event_type,
        payload=payload,
        signature_valid=True,
        processed=False
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    # 3. Handle specific events
    # We want to match: payment.captured, payment.failed, payment_link.paid
    try:
        if event_type == "payment.captured":
            payment_data = payload["payload"]["payment"]["entity"]
            rzp_payment_id = payment_data["id"]
            amount = payment_data["amount"] / 100.0 # convert from paise
            
            # Settle locally if order matches
            rzp_order_id = payment_data.get("order_id")
            if rzp_order_id:
                # Find matching payment or case
                action = db.query(RecoveryAction).filter(
                    RecoveryAction.rzp_payment_link_id == rzp_payment_id
                ).first()
                
                # Update case
                if action:
                    action.status = "executed"
                    case = db.query(RecoveryCase).filter(RecoveryCase.id == action.case_id).first()
                    if case:
                        case.current_status = "recovered"
                        # update original entities
                        if case.reference_type == "payment":
                            p = db.query(Payment).filter(Payment.id == case.reference_id).first()
                            if p:
                                p.status = "captured"
                        else:
                            inv = db.query(Invoice).filter(Invoice.id == case.reference_id).first()
                            if inv:
                                inv.status = "paid"
                        db.commit()
                        
                        db.add(AuditLog(
                            action_id=action.id,
                            event_type="PAYMENT_RECOVERED",
                            message=f"Payment link webhook received. Successfully recovered ₹{amount:,.2f} from case ref {case.id}.",
                            payload={"recovered_amount": amount, "event_id": event_id}
                        ))
                        db.commit()
                        EventPublisher.publish("payment.recovered", {"amount": amount, "ref": case.id})
                        
        elif event_type == "payment.failed":
            payment_data = payload["payload"]["payment"]["entity"]
            rzp_payment_id = payment_data["id"]
            amount = payment_data["amount"] / 100.0
            error_desc = payment_data.get("error_description", "Timeout on bank payment server")
            email = payment_data.get("email", "payment_client@example.com")
            
            # Find or create customer
            from backend.app.models import Business
            active_b = db.query(Business).order_by(Business.created_at.desc()).first()
            active_b_id = active_b.id if active_b else None
            
            cust = db.query(Customer).filter(Customer.email == email, Customer.business_id == active_b_id).first()
            if not cust:
                cust = Customer(
                    name=email.split("@")[0].capitalize(),
                    email=email,
                    reliability_score=0.8,
                    payment_delay_days=1,
                    business_id=active_b_id
                )
                db.add(cust)
                db.commit()
                db.refresh(cust)
                
            # Create failed payment
            p = db.query(Payment).filter(Payment.rzp_payment_id == rzp_payment_id).first()
            if not p:
                p = Payment(
                    rzp_payment_id=rzp_payment_id,
                    amount=amount,
                    status="failed",
                    failure_reason=error_desc,
                    customer_id=cust.id
                )
                db.add(p)
                db.commit()
                
            # Run scan to create case
            from backend.app.services.agent_orchestrator import AgentOrchestrator
            AgentOrchestrator.scan_and_detect_risks(db)
            EventPublisher.publish("payment.failed", {"amount": amount, "error": error_desc})
            
        elif event_type == "payment_link.paid":
            pl_data = payload["payload"]["payment_link"]["entity"]
            pl_id = pl_data["id"]
            amount = pl_data["amount"] / 100.0
            
            action = db.query(RecoveryAction).filter(RecoveryAction.rzp_payment_link_id == pl_id).first()
            if action:
                action.status = "executed"
                case = db.query(RecoveryCase).filter(RecoveryCase.id == action.case_id).first()
                if case:
                    case.current_status = "recovered"
                    db.commit()
                    
                    if case.reference_type == "payment":
                        p = db.query(Payment).filter(Payment.id == case.reference_id).first()
                        if p:
                            p.status = "captured"
                    else:
                        inv = db.query(Invoice).filter(Invoice.id == case.reference_id).first()
                        if inv:
                            inv.status = "paid"
                    db.commit()
                    
                    db.add(AuditLog(
                        action_id=action.id,
                        event_type="PAYMENT_RECOVERED",
                        message=f"Razorpay Payment Link {pl_id} was paid. Settle transaction of ₹{amount:,.2f}.",
                        payload={"recovered_amount": amount, "event_id": event_id}
                    ))
                    db.commit()
                    EventPublisher.publish("payment.recovered", {"amount": amount, "ref": case.id})
                    
        db_event.processed = True
        db.commit()
        
    except Exception as e:
        db_event.error = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Error processing webhook: {str(e)}")
        
    return {"status": "processed"}
