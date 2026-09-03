import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional
import httpx
from backend.app.config import settings

class EmailService:
    @staticmethod
    def send_email(
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Dispatches transactional email via Resend API, SMTP, or simulated mock logger.
        """
        import uuid
        msg_id = f"email_{uuid.uuid4().hex[:12]}"
        
        # 1. Resend API Integration
        if settings.RESEND_API_KEY and "placeholder" not in settings.RESEND_API_KEY:
            try:
                headers = {
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "from": settings.EMAIL_FROM,
                    "to": [to_email],
                    "subject": subject,
                    "html": html_body,
                    "text": text_body or html_body
                }
                with httpx.Client(timeout=10) as client:
                    res = client.post("https://api.resend.com/emails", json=payload, headers=headers)
                    if res.status_code in [200, 201]:
                        data = res.json()
                        return {
                            "success": True,
                            "provider": "resend",
                            "message_id": data.get("id", msg_id),
                            "recipient": to_email
                        }
                    else:
                        return {
                            "success": False,
                            "provider": "resend",
                            "error": f"Resend API error {res.status_code}: {res.text}",
                            "recipient": to_email
                        }
            except Exception as e:
                return {
                    "success": False,
                    "provider": "resend",
                    "error": str(e),
                    "recipient": to_email
                }

        # 2. SMTP Integration
        if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = settings.EMAIL_FROM
                msg["To"] = to_email

                if text_body:
                    msg.attach(MIMEText(text_body, "plain"))
                msg.attach(MIMEText(html_body, "html"))

                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                    server.starttls()
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(settings.EMAIL_FROM, [to_email], msg.as_string())

                return {
                    "success": True,
                    "provider": "smtp",
                    "message_id": msg_id,
                    "recipient": to_email
                }
            except Exception as e:
                return {
                    "success": False,
                    "provider": "smtp",
                    "error": str(e),
                    "recipient": to_email
                }

        # 3. Development / Mock fallback
        return {
            "success": True,
            "provider": "mock",
            "message_id": f"sim_{msg_id}",
            "recipient": to_email,
            "note": "Dispatched via development mock logger (Configure RESEND_API_KEY or SMTP for live delivery)"
        }

    @staticmethod
    def send_payment_reminder(
        customer_name: str,
        customer_email: str,
        amount_inr: float,
        payment_link: str,
        invoice_ref: str,
        brand_name: str = "द्वीSakhi Merch Co."
    ) -> Dict[str, Any]:
        """
        Builds a branded, responsive HTML payment notice and dispatches it.
        """
        subject = f"Friendly Payment Update from {brand_name} • Ref: {invoice_ref}"
        
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F6; margin: 0; padding: 24px; color: #141312; }}
    .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E5E1D8; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }}
    .badge {{ display: inline-block; background: #EAF3ED; color: #194F34; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px; }}
    .amount {{ font-size: 28px; font-weight: 800; color: #194F34; margin: 12px 0; }}
    .btn {{ display: inline-block; background: #194F34; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 600; font-size: 13px; margin: 16px 0; text-align: center; }}
    .footer {{ font-size: 11px; color: #706B63; margin-top: 24px; border-top: 1px solid #E5E1D8; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Payment Reminder</span>
    <h2 style="margin: 0; font-size: 20px;">Hello {customer_name},</h2>
    <p style="font-size: 14px; color: #54504A; line-height: 1.5; margin-top: 8px;">
      We hope you're loving your order from <strong>{brand_name}</strong>! We noticed that invoice <strong>#{invoice_ref}</strong> is currently pending settlement.
    </p>
    <div class="amount">₹{amount_inr:,.2f}</div>
    <p style="font-size: 13px; color: #54504A;">
      You can complete your payment securely in 1-tap via UPI, NetBanking, or card using this direct link:
    </p>
    <div style="text-align: center;">
      <a href="{payment_link}" class="btn" target="_blank">Complete Payment in 1-Tap</a>
    </div>
    <p style="font-size: 11px; color: #706B63; word-break: break-all;">
      Or copy link: <a href="{payment_link}" style="color: #194F34;">{payment_link}</a>
    </p>
    <div class="footer">
      Sent with care by {brand_name} Finance Operations • Powered by CashPulse AI
    </div>
  </div>
</body>
</html>
"""
        text_body = f"""Hello {customer_name},\n\nWe noticed that invoice #{invoice_ref} for INR {amount_inr:,.2f} is pending. Please complete payment using this secure link:\n{payment_link}\n\nThank you,\n{brand_name} Finance Operations"""

        return EmailService.send_email(
            to_email=customer_email,
            subject=subject,
            html_body=html_body,
            text_body=text_body
        )

email_service = EmailService()
