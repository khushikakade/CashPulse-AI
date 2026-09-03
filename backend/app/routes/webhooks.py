import json
import uuid
import time
from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Request, Header, HTTPException, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import (
    WebhookEvent, Payment, Invoice, Customer, Business,
    RecoveryCase, RecoveryAction, AuditLog
)
from backend.app.services.razorpay_client import razorpay_client
from backend.app.services.cashfree_client import cashfree_client
from backend.app.services.event_publisher import EventPublisher
from backend.app.services.agent_orchestrator import AgentOrchestrator

router = APIRouter()


# -----------------------------------------------------------------------------
# 1. Razorpay Official Webhook Handler
# -----------------------------------------------------------------------------
@router.post("/razorpay")
async def handle_razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    body_bytes = await request.body()
    body_str = body_bytes.decode("utf-8")
    
    # Signature Verification
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header")
        
    is_valid = razorpay_client.verify_webhook_signature(body_str, x_razorpay_signature)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid Razorpay HMAC signature")
        
    # Parse payload
    try:
        payload = json.loads(body_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
        
    event_id = payload.get("id") or f"rzp_evt_{uuid.uuid4().hex[:12]}"
    event_type = payload.get("event")
    
    if not event_type:
        raise HTTPException(status_code=400, detail="Missing event type in payload")
        
    # Idempotency check
    existing_event = db.query(WebhookEvent).filter(WebhookEvent.event_id == event_id).first()
    if existing_event:
        return {"status": "ignored", "reason": "Duplicate webhook event already processed"}
        
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
    
    try:
        if event_type == "payment.captured":
            payment_data = payload.get("payload", {}).get("payment", {}).get("entity", {})
            rzp_payment_id = payment_data.get("id")
            amount = float(payment_data.get("amount", 0)) / 100.0
            order_id = payment_data.get("order_id")
            
            # Find matching recovery action or payment
            action = None
            if rzp_payment_id:
                action = db.query(RecoveryAction).filter(
                    RecoveryAction.rzp_payment_link_id == rzp_payment_id
                ).first()
            if not action and order_id:
                action = db.query(RecoveryAction).filter(
                    RecoveryAction.rzp_payment_link_id == order_id
                ).first()
                
            if action:
                action.status = "executed"
                case = db.query(RecoveryCase).filter(RecoveryCase.id == action.case_id).first()
                if case:
                    case.current_status = "recovered"
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
                        details=f"Razorpay webhook: Settle ₹{amount:,.2f} for case {case.id} ({event_id}).",
                        status="SUCCESS"
                    ))
                    db.commit()
                    EventPublisher.publish("payment.recovered", {"amount": amount, "ref": case.id, "gateway": "razorpay"})
                    
        elif event_type == "payment.failed":
            payment_data = payload.get("payload", {}).get("payment", {}).get("entity", {})
            rzp_payment_id = payment_data.get("id", f"pay_fail_{uuid.uuid4().hex[:8]}")
            amount = float(payment_data.get("amount", 0)) / 100.0
            error_desc = payment_data.get("error_description", "Bank server timed out or payment was declined")
            email = payment_data.get("email", "customer@example.com")
            
            # Locate active business
            active_b = db.query(Business).order_by(Business.created_at.desc()).first()
            active_b_id = active_b.id if active_b else None
            
            cust = db.query(Customer).filter(Customer.email == email, Customer.business_id == active_b_id).first()
            if not cust:
                cust = Customer(
                    name=payment_data.get("contact_name") or email.split("@")[0].capitalize(),
                    email=email,
                    reliability_score=0.82,
                    payment_delay_days=1,
                    business_id=active_b_id
                )
                db.add(cust)
                db.commit()
                db.refresh(cust)
                
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
                
            AgentOrchestrator.scan_and_detect_risks(db)
            EventPublisher.publish("payment.failed", {"amount": amount, "error": error_desc, "gateway": "razorpay"})
            
        elif event_type == "payment_link.paid":
            pl_data = payload.get("payload", {}).get("payment_link", {}).get("entity", {})
            pl_id = pl_data.get("id")
            amount = float(pl_data.get("amount", 0)) / 100.0
            
            action = None
            if pl_id:
                action = db.query(RecoveryAction).filter(RecoveryAction.rzp_payment_link_id == pl_id).first()
            if not action:
                # Find most recent pending recovery action
                action = db.query(RecoveryAction).filter(RecoveryAction.status == "pending").first()
                
            if action:
                action.status = "executed"
                case = db.query(RecoveryCase).filter(RecoveryCase.id == action.case_id).first()
                if case:
                    case.current_status = "recovered"
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
                        details=f"Razorpay Payment Link {pl_id} was paid. Settle transaction of ₹{amount:,.2f}.",
                        status="SUCCESS"
                    ))
                    db.commit()
                    EventPublisher.publish("payment.recovered", {"amount": amount, "ref": case.id, "gateway": "razorpay"})
                    
        db_event.processed = True
        db.commit()
        return {"status": "processed", "event_id": event_id, "gateway": "razorpay"}
    except Exception as e:
        db_event.error = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Razorpay webhook processing error: {str(e)}")


# -----------------------------------------------------------------------------
# 2. Cashfree Official Webhook Handler
# -----------------------------------------------------------------------------
@router.post("/cashfree")
async def handle_cashfree_webhook(
    request: Request,
    x_webhook_signature: str = Header(None),
    x_webhook_timestamp: str = Header(None),
    db: Session = Depends(get_db)
):
    body_bytes = await request.body()
    body_str = body_bytes.decode("utf-8")
    
    # Signature Verification
    if not x_webhook_signature:
        raise HTTPException(status_code=400, detail="Missing x-webhook-signature header")
    if not x_webhook_timestamp:
        raise HTTPException(status_code=400, detail="Missing x-webhook-timestamp header")
        
    is_valid = cashfree_client.verify_webhook_signature(body_str, x_webhook_timestamp, x_webhook_signature)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid Cashfree HMAC signature")
        
    try:
        payload = json.loads(body_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
        
    event_type = payload.get("type") or payload.get("event")
    data = payload.get("data", {})
    order_data = data.get("order", {})
    payment_data = data.get("payment", {})
    
    order_id = order_data.get("order_id") or data.get("order_id") or f"cf_{uuid.uuid4().hex[:10]}"
    event_id = f"cf_evt_{order_id}_{uuid.uuid4().hex[:6]}"
    
    # Idempotency check
    existing_event = db.query(WebhookEvent).filter(WebhookEvent.event_id == event_id).first()
    if existing_event:
        return {"status": "ignored", "reason": "Duplicate Cashfree webhook event"}
        
    db_event = WebhookEvent(
        event_id=event_id,
        event_type=event_type or "CASHFREE_EVENT",
        payload=payload,
        signature_valid=True,
        processed=False
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    try:
        if event_type in ["PAYMENT_SUCCESS_WEBHOOK", "ORDER_PAID_WEBHOOK"]:
            amount = float(payment_data.get("payment_amount") or order_data.get("order_amount") or 0.0)
            
            # Find matching action or open recovery case
            action = None
            if order_id:
                action = db.query(RecoveryAction).filter(RecoveryAction.rzp_payment_link_id == order_id).first()
            if not action:
                action = db.query(RecoveryAction).filter(RecoveryAction.status == "pending").first()
                
            if action:
                action.status = "executed"
                case = db.query(RecoveryCase).filter(RecoveryCase.id == action.case_id).first()
                if case:
                    case.current_status = "recovered"
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
                        details=f"Cashfree webhook: Order {order_id} settled ₹{amount:,.2f} cleanly.",
                        status="SUCCESS"
                    ))
                    db.commit()
                    EventPublisher.publish("payment.recovered", {"amount": amount, "ref": case.id, "gateway": "cashfree"})
                    
        elif event_type in ["PAYMENT_FAILED_WEBHOOK", "USER_DROPPED_WEBHOOK"]:
            amount = float(payment_data.get("payment_amount") or order_data.get("order_amount") or 0.0)
            reason = payment_data.get("payment_message") or "Checkout dropped by customer or payment failed"
            cust_details = data.get("customer_details", {})
            email = cust_details.get("customer_email", "cf_customer@example.com")
            
            active_b = db.query(Business).order_by(Business.created_at.desc()).first()
            active_b_id = active_b.id if active_b else None
            
            cust = db.query(Customer).filter(Customer.email == email, Customer.business_id == active_b_id).first()
            if not cust:
                cust = Customer(
                    name=cust_details.get("customer_name") or email.split("@")[0].capitalize(),
                    email=email,
                    reliability_score=0.85,
                    payment_delay_days=1,
                    business_id=active_b_id
                )
                db.add(cust)
                db.commit()
                db.refresh(cust)
                
            p = Payment(
                rzp_payment_id=f"cf_pay_{uuid.uuid4().hex[:10]}",
                amount=amount,
                status="failed",
                failure_reason=reason,
                customer_id=cust.id
            )
            db.add(p)
            db.commit()
            
            AgentOrchestrator.scan_and_detect_risks(db)
            EventPublisher.publish("payment.failed", {"amount": amount, "error": reason, "gateway": "cashfree"})
            
        db_event.processed = True
        db.commit()
        return {"status": "processed", "event_id": event_id, "gateway": "cashfree"}
    except Exception as e:
        db_event.error = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Cashfree webhook processing error: {str(e)}")


# -----------------------------------------------------------------------------
# 3. Interactive Webhook Testing & Simulation API
# -----------------------------------------------------------------------------
class WebhookSimulationRequest(BaseModel):
    gateway: str = "razorpay"  # "razorpay" or "cashfree"
    event_type: str = "payment.captured"
    case_id: Optional[str] = None
    amount: Optional[float] = None
    customer_name: Optional[str] = "Pooja Mehta"
    customer_email: Optional[str] = "pooja.mehta@students.mu.ac.in"


@router.post("/simulate")
async def simulate_gateway_webhook(
    req: WebhookSimulationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Simulates a gateway webhook delivery by generating an authentic payload,
    computing the valid HMAC signature, and running it through the verification pipeline.
    """
    amount = req.amount or 499.0
    now_ts = str(int(time.time()))
    
    # If case_id is provided, look up details
    target_case = None
    if req.case_id:
        target_case = db.query(RecoveryCase).filter(RecoveryCase.id == req.case_id).first()
        if target_case:
            amount = target_case.amount
            if target_case.customer:
                req.customer_name = target_case.customer.name
                req.customer_email = target_case.customer.email

    if req.gateway.lower() == "cashfree":
        # Build Cashfree standard payload
        cf_order_id = f"order_{uuid.uuid4().hex[:10]}"
        if target_case and target_case.actions:
            for act in target_case.actions:
                if act.rzp_payment_link_id:
                    cf_order_id = act.rzp_payment_link_id
                    break

        cf_event = req.event_type if req.event_type in ["PAYMENT_SUCCESS_WEBHOOK", "PAYMENT_FAILED_WEBHOOK", "USER_DROPPED_WEBHOOK"] else "PAYMENT_SUCCESS_WEBHOOK"
        
        payload = {
            "data": {
                "order": {
                    "order_id": cf_order_id,
                    "order_amount": amount,
                    "order_currency": "INR"
                },
                "payment": {
                    "cf_payment_id": f"cf_p_{uuid.uuid4().hex[:10]}",
                    "payment_status": "SUCCESS" if cf_event == "PAYMENT_SUCCESS_WEBHOOK" else "FAILED",
                    "payment_amount": amount,
                    "payment_currency": "INR",
                    "payment_message": "Transaction completed via Cashfree UPI" if cf_event == "PAYMENT_SUCCESS_WEBHOOK" else "Payment cancelled by customer"
                },
                "customer_details": {
                    "customer_name": req.customer_name,
                    "customer_email": req.customer_email,
                    "customer_phone": "9820112345"
                }
            },
            "event_time": datetime.utcnow().isoformat(),
            "type": cf_event
        }
        raw_body = json.dumps(payload)
        signature = cashfree_client.generate_test_signature(raw_body, now_ts)
        
        # Verify and process
        class MockRequest:
            async def body(self):
                return raw_body.encode("utf-8")
                
        res = await handle_cashfree_webhook(
            request=MockRequest(),
            x_webhook_signature=signature,
            x_webhook_timestamp=now_ts,
            db=db
        )
        return {
            "success": True,
            "gateway": "cashfree",
            "event_type": cf_event,
            "signature_verified": True,
            "signature": signature[:16] + "...",
            "timestamp": now_ts,
            "amount": amount,
            "result": res
        }

    else:
        # Build Razorpay standard payload
        rzp_event = req.event_type if req.event_type in ["payment.captured", "payment.failed", "payment_link.paid"] else "payment.captured"
        rzp_pay_id = f"pay_{uuid.uuid4().hex[:12]}"
        
        # Look up link id if case has actions
        pl_id = f"plink_{uuid.uuid4().hex[:10]}"
        if target_case and target_case.actions:
            for act in target_case.actions:
                if act.rzp_payment_link_id:
                    pl_id = act.rzp_payment_link_id
                    break

        if rzp_event == "payment_link.paid":
            payload = {
                "entity": "event",
                "account_id": "acc_dwisakhi_official",
                "event": "payment_link.paid",
                "id": f"evt_{uuid.uuid4().hex[:12]}",
                "payload": {
                    "payment_link": {
                        "entity": {
                            "id": pl_id,
                            "amount": int(amount * 100),
                            "currency": "INR",
                            "status": "paid",
                            "customer": {
                                "name": req.customer_name,
                                "email": req.customer_email
                            }
                        }
                    }
                }
            }
        elif rzp_event == "payment.failed":
            payload = {
                "entity": "event",
                "account_id": "acc_dwisakhi_official",
                "event": "payment.failed",
                "id": f"evt_{uuid.uuid4().hex[:12]}",
                "payload": {
                    "payment": {
                        "entity": {
                            "id": rzp_pay_id,
                            "amount": int(amount * 100),
                            "currency": "INR",
                            "status": "failed",
                            "error_description": "UPI Pin entered was incorrect or session timed out",
                            "email": req.customer_email,
                            "contact_name": req.customer_name
                        }
                    }
                }
            }
        else:
            payload = {
                "entity": "event",
                "account_id": "acc_dwisakhi_official",
                "event": "payment.captured",
                "id": f"evt_{uuid.uuid4().hex[:12]}",
                "payload": {
                    "payment": {
                        "entity": {
                            "id": rzp_pay_id,
                            "order_id": pl_id,
                            "amount": int(amount * 100),
                            "currency": "INR",
                            "status": "captured",
                            "email": req.customer_email
                        }
                    }
                }
            }

        raw_body = json.dumps(payload)
        signature = razorpay_client.generate_test_signature(raw_body)
        
        class MockRequest:
            async def body(self):
                return raw_body.encode("utf-8")
                
        res = await handle_razorpay_webhook(
            request=MockRequest(),
            x_razorpay_signature=signature,
            db=db
        )
        return {
            "success": True,
            "gateway": "razorpay",
            "event_type": rzp_event,
            "signature_verified": True,
            "signature": signature[:16] + "...",
            "amount": amount,
            "result": res
        }
