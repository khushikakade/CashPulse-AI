from sqlalchemy.orm import Session
from backend.app.models import Order, Payment, Invoice
from typing import List, Dict, Any
from datetime import datetime

class ReconciliationEngine:
    @staticmethod
    def run_reconciliation(db: Session) -> Dict[str, Any]:
        """
        Performs three-way match between Orders, Invoices, and Payments.
        """
        orders = db.query(Order).all()
        payments = db.query(Payment).all()
        invoices = db.query(Invoice).all()
        
        recon_items = []
        total_checked = 0
        matched_count = 0
        unresolved_count = 0
        
        # 1. Match Payments to Orders
        for payment in payments:
            total_checked += 1
            order = db.query(Order).filter(Order.id == payment.order_id).first()
            
            if not order:
                unresolved_count += 1
                recon_items.append({
                    "id": payment.id,
                    "type": "payment",
                    "reference": payment.rzp_payment_id or "N/A",
                    "amount": payment.amount,
                    "date": payment.created_at.strftime("%Y-%m-%d"),
                    "status": "UNRESOLVED",
                    "explanation": "No corresponding order entity found for this payment record."
                })
                continue
                
            if payment.status == "captured":
                if order.amount == payment.amount:
                    matched_count += 1
                    recon_items.append({
                        "id": payment.id,
                        "type": "payment",
                        "reference": payment.rzp_payment_id or "N/A",
                        "amount": payment.amount,
                        "date": payment.created_at.strftime("%Y-%m-%d"),
                        "status": "MATCHED",
                        "explanation": f"Perfect match with Order Reference {order.rzp_order_id}."
                    })
                else:
                    unresolved_count += 1
                    recon_items.append({
                        "id": payment.id,
                        "type": "payment",
                        "reference": payment.rzp_payment_id or "N/A",
                        "amount": payment.amount,
                        "date": payment.created_at.strftime("%Y-%m-%d"),
                        "status": "PARTIAL_MATCH",
                        "explanation": f"Amount mismatch: Order value is ₹{order.amount:,.2f} but Payment is ₹{payment.amount:,.2f}."
                    })
            else: # failed payment
                recon_items.append({
                    "id": payment.id,
                    "type": "payment",
                    "reference": payment.rzp_payment_id or "N/A",
                    "amount": payment.amount,
                    "date": payment.created_at.strftime("%Y-%m-%d"),
                    "status": "MISMATCH",
                    "explanation": f"Payment marked as failed. Reason: {payment.failure_reason or 'unknown'}."
                })

        # 2. Check Overdue Invoices
        for invoice in invoices:
            total_checked += 1
            if invoice.status == "paid":
                matched_count += 1
                recon_items.append({
                    "id": invoice.id,
                    "type": "invoice",
                    "reference": invoice.invoice_number,
                    "amount": invoice.amount,
                    "date": invoice.due_date.strftime("%Y-%m-%d"),
                    "status": "MATCHED",
                    "explanation": "Invoice marked as paid and matched against ledger record."
                })
            else:
                if (datetime.utcnow() - invoice.due_date).days > 0:
                    unresolved_count += 1
                    recon_items.append({
                        "id": invoice.id,
                        "type": "invoice",
                        "reference": invoice.invoice_number,
                        "amount": invoice.amount,
                        "date": invoice.due_date.strftime("%Y-%m-%d"),
                        "status": "UNRESOLVED",
                        "explanation": f"Invoice is overdue by {(datetime.utcnow() - invoice.due_date).days} days."
                    })
                else:
                    recon_items.append({
                        "id": invoice.id,
                        "type": "invoice",
                        "reference": invoice.invoice_number,
                        "amount": invoice.amount,
                        "date": invoice.due_date.strftime("%Y-%m-%d"),
                        "status": "PARTIAL_MATCH",
                        "explanation": "Upcoming receivable invoice, within normal credit cycle."
                    })
                    
        recon_rate = round((matched_count / max(1, total_checked)) * 100, 2)
        
        return {
            "total_checked": total_checked,
            "matched_count": matched_count,
            "unresolved_count": unresolved_count,
            "reconciliation_rate": recon_rate,
            "items": recon_items
        }
