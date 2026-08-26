import json
import httpx
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from backend.app.config import settings

class InvestigationOutput(BaseModel):
    root_cause: str = Field(description="One-word category matching: TEMPORARY_PAYMENT_FAILURE, PAYMENT_METHOD_ISSUE, CUSTOMER_BEHAVIOR, HIGH_RISK_TRANSACTION, REPEATED_FAILURE, OVERDUE_RECEIVABLE")
    explanation: str = Field(description="Detailed human-readable explanation of why the payment failed or why the receivable is delayed.")
    recommended_action: str = Field(description="Action enum matching: RETRY_PAYMENT, SEND_REMINDER, GENERATE_LINK, ESCALATE_TO_HUMAN, DO_NOTHING")
    alternative_action: str = Field(description="Next best action if primary is rejected.")
    why_alternative_rejected: str = Field(description="Why alternative action was not selected as primary.")

class CustomerMessageOutput(BaseModel):
    subject: str = Field(description="Subject line for email notifications")
    email_body: str = Field(description="Rich, formal, professional email text")
    sms_body: str = Field(description="Brief SMS copy (under 160 chars)")
    whatsapp_body: str = Field(description="Engaging WhatsApp template text with placeholders")

class LLMService:
    @staticmethod
    def investigate_case(customer_name: str, ref_type: str, amount: float, failure_reason: Optional[str] = None, history: str = "") -> InvestigationOutput:
        """
        Runs structured LLM reasoning to determine root cause and select recovery intervention.
        """
        # If API key is set, attempt live LLM request (Gemini / OpenAI)
        if settings.GEMINI_API_KEY and settings.LLM_PROVIDER == "gemini":
            try:
                response = LLMService._call_gemini_structured(customer_name, ref_type, amount, failure_reason, history)
                if response:
                    return InvestigationOutput(**response)
            except Exception as e:
                # Log error and fall back
                pass

        # Fallback deterministic generator
        return LLMService._get_deterministic_investigation(customer_name, ref_type, amount, failure_reason, history)

    @staticmethod
    def generate_customer_comms(customer_name: str, amount: float, action_type: str, contact_details: Dict[str, str]) -> CustomerMessageOutput:
        """
        Generates payment reminders, links, and escalation alerts with localized tone.
        """
        if settings.GEMINI_API_KEY and settings.LLM_PROVIDER == "gemini":
            try:
                response = LLMService._call_gemini_comms(customer_name, amount, action_type)
                if response:
                    return CustomerMessageOutput(**response)
            except Exception as e:
                pass
                
        return LLMService._get_deterministic_comms(customer_name, amount, action_type)

    @staticmethod
    def _call_gemini_structured(customer_name: str, ref_type: str, amount: float, failure_reason: Optional[str], history: str) -> Optional[Dict[str, Any]]:
        prompt = f"""
        Investigate a financial delay for customer: {customer_name}.
        Type of delay: {ref_type}.
        Amount: {amount} INR.
        Failure Reason (if payment failure): {failure_reason}.
        Historical Behavior: {history}.
        
        Analyze the root cause and output a JSON object adhering exactly to this schema:
        {{
            "root_cause": "TEMPORARY_PAYMENT_FAILURE" | "PAYMENT_METHOD_ISSUE" | "CUSTOMER_BEHAVIOR" | "HIGH_RISK_TRANSACTION" | "REPEATED_FAILURE" | "OVERDUE_RECEIVABLE",
            "explanation": "Human readable explanation.",
            "recommended_action": "RETRY_PAYMENT" | "SEND_REMINDER" | "GENERATE_LINK" | "ESCALATE_TO_HUMAN" | "DO_NOTHING",
            "alternative_action": "RETRY_PAYMENT" | "SEND_REMINDER" | "GENERATE_LINK" | "ESCALATE_TO_HUMAN" | "DO_NOTHING",
            "why_alternative_rejected": "Brief reason why."
        }}
        """
        url = f"https://generativetoolkit.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text)
        return None

    @staticmethod
    def _call_gemini_comms(customer_name: str, amount: float, action_type: str) -> Optional[Dict[str, Any]]:
        prompt = f"""
        Generate communication text for customer {customer_name} regarding a pending amount of {amount} INR.
        Action type: {action_type}.
        
        Output a JSON object with keys: "subject", "email_body", "sms_body", "whatsapp_body".
        """
        url = f"https://generativetoolkit.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text)
        return None

    @staticmethod
    def _get_deterministic_investigation(customer_name: str, ref_type: str, amount: float, failure_reason: Optional[str], history: str) -> InvestigationOutput:
        if ref_type == "payment":
            if failure_reason in ["INSUFFICIENT_FUNDS", "BAD_CREDENTIALS"]:
                return InvestigationOutput(
                    root_cause="CUSTOMER_BEHAVIOR",
                    explanation=f"Transaction failed due to {failure_reason or 'payment failure'}. The customer represents a valid account but needs to choose an alternative method or replenish funds.",
                    recommended_action="GENERATE_LINK",
                    alternative_action="SEND_REMINDER",
                    why_alternative_rejected="Reminding the customer without providing a clean Razorpay Payment Link increases friction and delays settlement."
                )
            else:
                return InvestigationOutput(
                    root_cause="TEMPORARY_PAYMENT_FAILURE",
                    explanation="Payment gateway reported a network timeout or temporary bank infrastructure failure. The transaction has a high self-recovery potential with a clean retry.",
                    recommended_action="RETRY_PAYMENT",
                    alternative_action="GENERATE_LINK",
                    why_alternative_rejected="Direct retries are zero-friction for the customer compared to sending a link which requires active manual interaction."
                )
        else: # invoice overdue
            if "Slow paying" in history or amount > 200000:
                return InvestigationOutput(
                    root_cause="OVERDUE_RECEIVABLE",
                    explanation=f"Invoice has exceeded the credit terms. Due to high value (₹{amount:,.2f}) and historical delays, automated collection requires structured escalation.",
                    recommended_action="ESCALATE_TO_HUMAN",
                    alternative_action="SEND_REMINDER",
                    why_alternative_rejected="Simple automated reminders are historically ignored by this entity; personal manual follow-up is necessary to preserve credit relationship."
                )
            else:
                return InvestigationOutput(
                    root_cause="OVERDUE_RECEIVABLE",
                    explanation=f"Normal credit delay. {customer_name} has a reliable history of payment within 5 days of due dates.",
                    recommended_action="SEND_REMINDER",
                    alternative_action="DO_NOTHING",
                    why_alternative_rejected="Doing nothing runs the risk of invoice aging past critical cycles; a gentle automated reminder maintains top-of-mind awareness."
                )

    @staticmethod
    def _get_deterministic_comms(customer_name: str, amount: float, action_type: str) -> CustomerMessageOutput:
        formatted_amount = f"₹{amount:,.2f}"
        if action_type == "RETRY_PAYMENT":
            return CustomerMessageOutput(
                subject="Payment retry initiated",
                email_body=f"Dear {customer_name},\n\nWe noticed a temporary issue with your transaction of {formatted_amount}. Our system is automatically retrying the charge safely via Razorpay. No action is required from your side.\n\nThank you,\nFinance Operations",
                sms_body=f"We are retrying your failed transaction of {formatted_amount} automatically. No action needed. - CashPulse Operations",
                whatsapp_body=f"Hi {customer_name}, we noticed a temporary payment failure of *{formatted_amount}*. We are automatically retrying this via Razorpay safely. You will receive an invoice receipt shortly."
            )
        elif action_type == "GENERATE_LINK":
            return CustomerMessageOutput(
                subject="Complete your payment securely",
                email_body=f"Dear {customer_name},\n\nYour recent checkout of {formatted_amount} did not go through. Please use this secure Razorpay link to complete your payment directly: {{link}}\n\nThank you,\nFinance Operations",
                sms_body=f"Your transaction of {formatted_amount} failed. Complete it securely here: {{link}} - CashPulse",
                whatsapp_body=f"Hi {customer_name}, your payment of *{formatted_amount}* was unsuccessful. Complete it securely in 1 click here: {{link}}"
            )
        else:
            return CustomerMessageOutput(
                subject="Outstanding Balance Reminder",
                email_body=f"Dear {customer_name},\n\nThis is a friendly reminder that invoice INV-2026 for {formatted_amount} is now past due. Please settle this balance as soon as possible via this link: {{link}}\n\nThank you,\nFinance Operations",
                sms_body=f"Friendly reminder: Your invoice of {formatted_amount} is outstanding. Settle here: {{link}}",
                whatsapp_body=f"Hi {customer_name}, this is a gentle reminder that your invoice of *{formatted_amount}* is pending. Please click here to settle: {{link}}"
            )
        
        
