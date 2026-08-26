from sqlalchemy.orm import Session
from backend.app.models import Payment, Invoice, Customer, RecoveryCase, RecoveryAction, AuditLog
from backend.app.services.ml_engine import MLEngine
from backend.app.services.llm_service import LLMService
from backend.app.services.policy_engine import PolicyEngine
from backend.app.services.razorpay_client import razorpay_client
from datetime import datetime
from typing import Dict, Any, List

class AgentOrchestrator:
    @staticmethod
    def scan_and_detect_risks(db: Session) -> int:
        """
        Scans for failed payments and overdue invoices to create recovery cases.
        """
        new_cases_count = 0
        
        # 1. Failed payments
        failed_payments = db.query(Payment).filter(Payment.status == "failed").all()
        for payment in failed_payments:
            # Check if case already exists for this payment
            exists = db.query(RecoveryCase).filter(
                RecoveryCase.reference_type == "payment",
                RecoveryCase.reference_id == payment.id
            ).first()
            
            if not exists:
                customer = db.query(Customer).filter(Customer.id == payment.customer_id).first()
                if not customer:
                    continue
                    
                # Compute recovery metrics
                prob = MLEngine.calculate_payment_recovery_probability(customer, payment.amount, 1)
                expected_val = prob * payment.amount
                
                # Deduce risk score (inverse of recovery probability scaled)
                risk_score = (1.0 - prob) * 100
                
                case = RecoveryCase(
                    customer_id=customer.id,
                    reference_type="payment",
                    reference_id=payment.id,
                    risk_score=risk_score,
                    recovery_probability=prob,
                    expected_recovery_value=expected_val,
                    current_status="open",
                    risk_level="high" if risk_score > 60 else ("medium" if risk_score > 30 else "low")
                )
                db.add(case)
                db.commit()
                db.refresh(case)
                
                # Investigate root cause
                investigation = LLMService.investigate_case(
                    customer_name=customer.name,
                    ref_type="payment",
                    amount=payment.amount,
                    failure_reason=payment.failure_reason,
                    history=f"Reliability: {customer.reliability_score * 100}%, Avg Delay: {customer.payment_delay_days} days."
                )
                
                case.root_cause = investigation.root_cause
                case.explanation = investigation.explanation
                case.recommended_action = investigation.recommended_action
                db.commit()
                
                # Log detection event
                db.add(AuditLog(
                    event_type="RISK_DETECTED",
                    message=f"Detected failed payment risk of ₹{payment.amount:,.2f} from {customer.name}. Assigned score: {risk_score:.1f}% risk.",
                    payload={"case_id": case.id}
                ))
                db.commit()
                new_cases_count += 1
                
        # 2. Overdue invoices
        overdue_invoices = db.query(Invoice).filter(Invoice.status == "overdue").all()
        for invoice in overdue_invoices:
            exists = db.query(RecoveryCase).filter(
                RecoveryCase.reference_type == "invoice",
                RecoveryCase.reference_id == invoice.id
            ).first()
            
            if not exists:
                customer = db.query(Customer).filter(Customer.id == invoice.customer_id).first()
                if not customer:
                    continue
                    
                overdue_days = (datetime.utcnow() - invoice.due_date).days
                prob = MLEngine.calculate_invoice_recovery_probability(customer, invoice.amount, overdue_days)
                expected_val = prob * invoice.amount
                risk_score = (1.0 - prob) * 100
                
                case = RecoveryCase(
                    customer_id=customer.id,
                    reference_type="invoice",
                    reference_id=invoice.id,
                    risk_score=risk_score,
                    recovery_probability=prob,
                    expected_recovery_value=expected_val,
                    current_status="open",
                    risk_level="high" if risk_score > 60 else ("medium" if risk_score > 30 else "low")
                )
                db.add(case)
                db.commit()
                db.refresh(case)
                
                investigation = LLMService.investigate_case(
                    customer_name=customer.name,
                    ref_type="invoice",
                    amount=invoice.amount,
                    history=f"Reliability: {customer.reliability_score * 100}%, Overdue: {overdue_days} days."
                )
                
                case.root_cause = investigation.root_cause
                case.explanation = investigation.explanation
                case.recommended_action = investigation.recommended_action
                db.commit()
                
                db.add(AuditLog(
                    event_type="RISK_DETECTED",
                    message=f"Detected overdue invoice risk of ₹{invoice.amount:,.2f} from {customer.name}. Overdue: {overdue_days} days.",
                    payload={"case_id": case.id}
                ))
                db.commit()
                new_cases_count += 1
                
        return new_cases_count

    @staticmethod
    def process_recovery_case(db: Session, case_id: str) -> Dict[str, Any]:
        """
        Takes an open case, checks policy limits, decides on action and executes or triggers human approval.
        """
        case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
        if not case or case.current_status != "open":
            return {"status": "ignored", "reason": "Case not open"}
            
        customer = db.query(Customer).filter(Customer.id == case.customer_id).first()
        amount = 0.0
        if case.reference_type == "payment":
            p = db.query(Payment).filter(Payment.id == case.reference_id).first()
            amount = p.amount if p else 0.0
        else:
            inv = db.query(Invoice).filter(Invoice.id == case.reference_id).first()
            amount = inv.amount if inv else 0.0
            
        action_type = case.recommended_action or "SEND_REMINDER"
        
        # Policy Check
        policy_result = PolicyEngine.evaluate_action(db, case, action_type, amount)
        
        if not policy_result["allowed"]:
            case.current_status = "closed_failed"
            db.commit()
            
            db.add(AuditLog(
                event_type="POLICY_BLOCKED",
                message=f"Policy engine blocked action {action_type} for {customer.name}. Reason: {policy_result['blocked_by']}.",
                payload={"case_id": case.id}
            ))
            db.commit()
            return {"status": "blocked", "reason": policy_result["blocked_by"]}
            
        # Create RecoveryAction
        action = RecoveryAction(
            case_id=case.id,
            action_type=action_type,
            cost=10.0 if action_type == "RETRY_PAYMENT" else 1.0,
            customer_friction="low" if action_type == "RETRY_PAYMENT" else "medium",
            status="pending_approval" if policy_result["needs_approval"] else "approved"
        )
        db.add(action)
        db.commit()
        db.refresh(action)
        
        if policy_result["needs_approval"]:
            case.current_status = "human_review"
            db.commit()
            db.add(AuditLog(
                action_id=action.id,
                event_type="PENDING_APPROVAL",
                message=f"Action {action_type} (₹{amount:,.2f}) requires human approval due to high value threshold policy.",
                payload={"case_id": case.id, "action_id": action.id}
            ))
            db.commit()
            return {"status": "needs_approval", "action_id": action.id}
        else:
            return AgentOrchestrator.execute_action(db, action.id)

    @staticmethod
    def execute_action(db: Session, action_id: str) -> Dict[str, Any]:
        """
        Executes a recovery action by integrating with Razorpay or triggering automated notices.
        """
        action = db.query(RecoveryAction).filter(RecoveryAction.id == action_id).first()
        if not action or action.status not in ["approved", "pending_approval"]:
            return {"status": "error", "message": "Action not executable in current state"}
            
        case = db.query(RecoveryCase).filter(RecoveryCase.id == action.case_id).first()
        customer = db.query(Customer).filter(Customer.id == case.customer_id).first()
        
        amount = 0.0
        if case.reference_type == "payment":
            p = db.query(Payment).filter(Payment.id == case.reference_id).first()
            amount = p.amount if p else 0.0
        else:
            inv = db.query(Invoice).filter(Invoice.id == case.reference_id).first()
            amount = inv.amount if inv else 0.0
            
        action.status = "executed"
        action.executed_at = datetime.utcnow()
        case.current_status = "in_progress"
        db.commit()
        
        # Razorpay Test Mode execution
        if action.action_type == "GENERATE_LINK" or action.action_type == "SEND_REMINDER":
            # Generate actual payment link
            pl_resp = razorpay_client.create_payment_link(
                amount_inr=amount,
                customer_name=customer.name,
                customer_email=customer.email,
                customer_phone=customer.phone,
                description=f"Revenue recovery for {case.reference_type} ref: {case.reference_id}"
            )
            action.rzp_payment_link_id = pl_resp.get("id")
            action.checkout_url = pl_resp.get("short_url")
            action.notes = f"Payment link generated: {pl_resp.get('short_url')}"
            db.commit()
            
            db.add(AuditLog(
                action_id=action.id,
                event_type="PAYMENT_LINK_CREATED",
                message=f"Razorpay Payment Link generated for {customer.name} (₹{amount:,.2f}). Link: {action.checkout_url}",
                payload={"case_id": case.id, "action_id": action.id}
            ))
            db.commit()
            
        elif action.action_type == "RETRY_PAYMENT":
            # Direct retry simulation
            # Create a mock success state 70% of the time on retry
            import random
            success = random.random() < 0.70
            
            if success:
                # Trigger a simulated webhook event internally to mark recovery
                action.notes = "Direct transaction retry succeeded via payment gateway."
                db.commit()
                
                # Settle cases
                case.current_status = "recovered"
                db.commit()
                
                # Mark original payment or invoice as paid
                if case.reference_type == "payment":
                    orig_p = db.query(Payment).filter(Payment.id == case.reference_id).first()
                    if orig_p:
                        orig_p.status = "captured"
                else:
                    orig_inv = db.query(Invoice).filter(Invoice.id == case.reference_id).first()
                    if orig_inv:
                        orig_inv.status = "paid"
                db.commit()
                
                db.add(AuditLog(
                    action_id=action.id,
                    event_type="PAYMENT_RECOVERED",
                    message=f"Successfully recovered ₹{amount:,.2f} from {customer.name} via direct retry.",
                    payload={"case_id": case.id, "action_id": action.id, "recovered_amount": amount}
                ))
                db.commit()
            else:
                action.status = "failed"
                action.notes = "Transaction retry failed. Insufficient balance or gateway authentication issue."
                case.current_status = "open" # retry again or escalate
                db.commit()
                
                db.add(AuditLog(
                    action_id=action.id,
                    event_type="RETRY_FAILED",
                    message=f"Direct transaction retry failed for {customer.name}.",
                    payload={"case_id": case.id, "action_id": action.id}
                ))
                db.commit()
                
        return {"status": "executed", "action_id": action.id}
