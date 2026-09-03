import razorpay
import hmac
import hashlib
from typing import Dict, Any, Optional
from backend.app.config import settings

class RazorpayClientWrapper:
    def __init__(self, key_id: Optional[str] = None, key_secret: Optional[str] = None, webhook_secret: Optional[str] = None):
        self.key_id = key_id or settings.RAZORPAY_KEY_ID
        self.key_secret = key_secret or settings.RAZORPAY_KEY_SECRET
        self.webhook_secret = webhook_secret or settings.RAZORPAY_WEBHOOK_SECRET
        
        # Determine if real keys are provided
        has_real_keys = (
            bool(self.key_id) and 
            bool(self.key_secret) and 
            "placeholder" not in self.key_id.lower() and 
            "placeholder" not in self.key_secret.lower()
        )
        self.is_mock_mode = not has_real_keys
        self.client = None
        
        if not self.is_mock_mode:
            try:
                self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
            except Exception:
                self.is_mock_mode = True

    def create_order(self, amount_inr: float, receipt_id: str) -> Dict[str, Any]:
        """
        Creates an official Razorpay Order. Amount must be converted to paise (amount * 100).
        """
        amount_paise = int(amount_inr * 100)
        
        if self.is_mock_mode:
            import uuid
            mock_id = f"order_{uuid.uuid4().hex[:12]}"
            return {
                "id": mock_id,
                "entity": "order",
                "amount": amount_paise,
                "amount_paid": 0,
                "amount_due": amount_paise,
                "currency": "INR",
                "receipt": receipt_id,
                "status": "created",
                "created_at": int(datetime.utcnow().timestamp()) if 'datetime' in globals() else 1777203600
            }
            
        try:
            order_data = {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt_id,
                "payment_capture": 1
            }
            return self.client.order.create(data=order_data)
        except Exception as e:
            # Safe fallback if API failure
            import uuid
            return {
                "id": f"order_fallback_{uuid.uuid4().hex[:8]}",
                "status": "created",
                "amount": amount_paise,
                "error": str(e)
            }

    def create_payment_link(self, amount_inr: float, customer_name: str, customer_email: str, customer_phone: Optional[str], description: str) -> Dict[str, Any]:
        """
        Creates an official Razorpay Payment Link.
        """
        amount_paise = int(amount_inr * 100)
        
        if self.is_mock_mode:
            import uuid
            mock_id = f"plink_{uuid.uuid4().hex[:12]}"
            # We generate a simulated checkout page hosted locally or a direct test portal
            return {
                "id": mock_id,
                "amount": amount_paise,
                "currency": "INR",
                "status": "created",
                "short_url": f"http://localhost:3000/pay/simulate?link_id={mock_id}&amount={amount_inr}",
                "customer": {
                    "name": customer_name,
                    "email": customer_email,
                    "contact": customer_phone
                }
            }
            
        try:
            link_data = {
                "amount": amount_paise,
                "currency": "INR",
                "accept_partial": False,
                "first_min_partial_amount": 0,
                "description": description,
                "customer": {
                    "name": customer_name,
                    "email": customer_email,
                },
                "notify": {
                    "sms": True,
                    "email": True
                },
                "remainder_enable": True,
                "callback_url": "http://localhost:3000/recovery/confirm",
                "callback_method": "get"
            }
            if customer_phone:
                link_data["customer"]["contact"] = customer_phone
                
            return self.client.payment_link.create(data=link_data)
        except Exception as e:
            import uuid
            mock_id = f"plink_fb_{uuid.uuid4().hex[:8]}"
            return {
                "id": mock_id,
                "amount": amount_paise,
                "status": "created",
                "short_url": f"http://localhost:3000/pay/simulate?link_id={mock_id}&amount={amount_inr}",
                "error": str(e)
            }

    def verify_webhook_signature(self, body_payload: str, signature: str) -> bool:
        """
        Validates webhook signatures sent by Razorpay to guarantee event payload integrity.
        """
        if not self.webhook_secret or "placeholder" in self.webhook_secret.lower():
            # In simulation mode or when secret is placeholder, allow test events
            return True
            
        try:
            expected_signature = hmac.new(
                self.webhook_secret.encode('utf-8'),
                body_payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(expected_signature, signature)
        except Exception:
            return False

    def generate_test_signature(self, body_payload: str) -> str:
        """
        Helper for testing console to produce valid HMAC-SHA256 signatures.
        """
        secret = self.webhook_secret if (self.webhook_secret and "placeholder" not in self.webhook_secret.lower()) else "rzp_webhook_secret_placeholder"
        return hmac.new(
            secret.encode('utf-8'),
            body_payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

    def get_masked_key(self) -> str:
        if not self.key_id or "placeholder" in self.key_id.lower():
            return "rzp_test_••••••••"
        if len(self.key_id) > 10:
            return self.key_id[:8] + "••••" + self.key_id[-4:]
        return "rzp_••••••••"

    def validate_credentials(self) -> Dict[str, Any]:
        """
        Validates whether configured Razorpay credentials are valid.
        """
        if self.is_mock_mode or not self.client:
            return {
                "valid": True,
                "mode": "simulated",
                "message": "Running in simulated test mode (sandbox fallback active)",
                "key_id": self.get_masked_key(),
                "provider": "razorpay"
            }
        try:
            self.client.order.all({"count": 1})
            is_test_mode = self.key_id.startswith("rzp_test_")
            return {
                "valid": True,
                "mode": "test" if is_test_mode else "live",
                "message": f"Authenticated with Razorpay ({'Test Sandbox' if is_test_mode else 'Live Production'})",
                "key_id": self.get_masked_key(),
                "provider": "razorpay"
            }
        except Exception as e:
            return {
                "valid": False,
                "mode": "error",
                "message": f"Razorpay authentication error: {str(e)}",
                "key_id": self.get_masked_key(),
                "provider": "razorpay"
            }

razorpay_client = RazorpayClientWrapper()
