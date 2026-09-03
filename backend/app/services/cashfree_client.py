import hmac
import hashlib
import base64
import time
import requests
from typing import Dict, Any, Optional
from datetime import datetime
from backend.app.config import settings

class CashfreeClientWrapper:
    def __init__(
        self,
        app_id: Optional[str] = None,
        secret_key: Optional[str] = None,
        env: Optional[str] = None,
        api_version: Optional[str] = None
    ):
        self.app_id = app_id or settings.CASHFREE_APP_ID
        self.secret_key = secret_key or settings.CASHFREE_SECRET_KEY
        self.env = (env or settings.CASHFREE_ENV).upper()
        self.api_version = api_version or settings.CASHFREE_API_VERSION
        
        # Check if real keys are provided
        has_real_keys = (
            bool(self.app_id) and
            bool(self.secret_key) and
            "placeholder" not in self.app_id.lower() and
            "placeholder" not in self.secret_key.lower()
        )
        self.is_mock_mode = not has_real_keys
        
        # Base URL setup
        if self.env == "PRODUCTION":
            self.base_url = "https://api.cashfree.com/pg"
        else:
            self.base_url = "https://sandbox.cashfree.com/pg"

    def _headers(self) -> Dict[str, str]:
        return {
            "x-client-id": self.app_id,
            "x-client-secret": self.secret_key,
            "x-api-version": self.api_version,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def create_order(
        self,
        amount_inr: float,
        customer_id: str,
        customer_email: str,
        customer_phone: Optional[str] = None,
        order_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates a Cashfree PG Order.
        """
        import uuid
        oid = order_id or f"cf_ord_{uuid.uuid4().hex[:12]}"
        phone = customer_phone or "9820112345"
        
        if self.is_mock_mode:
            return {
                "cf_order_id": f"cf_pg_{uuid.uuid4().hex[:10]}",
                "order_id": oid,
                "order_amount": amount_inr,
                "order_currency": "INR",
                "payment_session_id": f"session_{uuid.uuid4().hex[:16]}",
                "order_status": "ACTIVE",
                "payment_link": f"http://localhost:3000/pay/simulate?link_id={oid}&amount={amount_inr}&gateway=cashfree"
            }
            
        try:
            payload = {
                "order_id": oid,
                "order_amount": round(float(amount_inr), 2),
                "order_currency": "INR",
                "customer_details": {
                    "customer_id": customer_id,
                    "customer_email": customer_email,
                    "customer_phone": phone
                },
                "order_meta": {
                    "return_url": "http://localhost:3000/recovery/confirm?order_id={order_id}"
                }
            }
            res = requests.post(f"{self.base_url}/orders", json=payload, headers=self._headers(), timeout=10)
            if res.status_code in [200, 201]:
                return res.json()
            return {
                "order_id": oid,
                "error": res.text,
                "payment_link": f"http://localhost:3000/pay/simulate?link_id={oid}&amount={amount_inr}&gateway=cashfree"
            }
        except Exception as e:
            return {
                "order_id": oid,
                "error": str(e),
                "payment_link": f"http://localhost:3000/pay/simulate?link_id={oid}&amount={amount_inr}&gateway=cashfree"
            }

    def create_payment_link(
        self,
        amount_inr: float,
        customer_name: str,
        customer_email: str,
        customer_phone: Optional[str],
        description: str,
        link_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates a Cashfree Payment Link.
        """
        import uuid
        lid = link_id or f"cf_link_{uuid.uuid4().hex[:10]}"
        phone = customer_phone or "9820112345"
        
        if self.is_mock_mode:
            return {
                "cf_link_id": lid,
                "link_id": lid,
                "link_status": "ACTIVE",
                "link_currency": "INR",
                "link_amount": amount_inr,
                "link_url": f"http://localhost:3000/pay/simulate?link_id={lid}&amount={amount_inr}&gateway=cashfree"
            }
            
        try:
            payload = {
                "link_id": lid,
                "link_amount": round(float(amount_inr), 2),
                "link_currency": "INR",
                "link_purpose": description,
                "customer_details": {
                    "customer_name": customer_name,
                    "customer_email": customer_email,
                    "customer_phone": phone
                },
                "link_meta": {
                    "return_url": "http://localhost:3000/recovery/confirm?link_id={link_id}"
                },
                "link_notify": {
                    "send_sms": bool(customer_phone),
                    "send_email": True
                }
            }
            res = requests.post(f"{self.base_url}/links", json=payload, headers=self._headers(), timeout=10)
            if res.status_code in [200, 201]:
                return res.json()
            return {
                "link_id": lid,
                "link_url": f"http://localhost:3000/pay/simulate?link_id={lid}&amount={amount_inr}&gateway=cashfree",
                "error": res.text
            }
        except Exception as e:
            return {
                "link_id": lid,
                "link_url": f"http://localhost:3000/pay/simulate?link_id={lid}&amount={amount_inr}&gateway=cashfree",
                "error": str(e)
            }

    def verify_webhook_signature(self, raw_body: str, timestamp: str, signature: str) -> bool:
        """
        Validates Cashfree webhook signature using HMAC-SHA256 base64 algorithm:
        computed_signature = Base64(HMAC-SHA256(timestamp + raw_body, secret_key))
        """
        if not self.secret_key or "placeholder" in self.secret_key.lower():
            # In simulation mode or placeholder setup, allow test events
            return True
            
        try:
            data = f"{timestamp}{raw_body}".encode("utf-8")
            mac = hmac.new(self.secret_key.encode("utf-8"), data, hashlib.sha256).digest()
            computed_signature = base64.b64encode(mac).decode("utf-8")
            return hmac.compare_digest(computed_signature, signature)
        except Exception:
            return False

    def generate_test_signature(self, raw_body: str, timestamp: str) -> str:
        """
        Generates valid Cashfree webhook signature for simulation and testing console.
        """
        secret = self.secret_key if (self.secret_key and "placeholder" not in self.secret_key.lower()) else "cf_test_placeholder_secret_key"
        data = f"{timestamp}{raw_body}".encode("utf-8")
        mac = hmac.new(secret.encode("utf-8"), data, hashlib.sha256).digest()
        return base64.b64encode(mac).decode("utf-8")

    def get_masked_app_id(self) -> str:
        if not self.app_id or "placeholder" in self.app_id.lower():
            return "cf_test_••••••••"
        if len(self.app_id) > 8:
            return self.app_id[:4] + "••••" + self.app_id[-4:]
        return "cf_••••••••"

    def validate_credentials(self) -> Dict[str, Any]:
        """
        Validates whether configured Cashfree credentials are valid.
        """
        if self.is_mock_mode:
            return {
                "valid": True,
                "mode": "simulated",
                "message": f"Running in simulated mode ({self.env} fallback active)",
                "app_id": self.get_masked_app_id(),
                "env": self.env,
                "provider": "cashfree"
            }
        try:
            # Lightweight ping
            res = requests.get(f"{self.base_url}/orders?limit=1", headers=self._headers(), timeout=5)
            if res.status_code in [200, 404]:
                return {
                    "valid": True,
                    "mode": "live" if self.env == "PRODUCTION" else "sandbox",
                    "message": f"Authenticated with Cashfree ({'Production' if self.env == 'PRODUCTION' else 'Sandbox'})",
                    "app_id": self.get_masked_app_id(),
                    "env": self.env,
                    "provider": "cashfree"
                }
            return {
                "valid": False,
                "mode": "error",
                "message": f"Cashfree returned HTTP {res.status_code}: {res.text[:120]}",
                "app_id": self.get_masked_app_id(),
                "env": self.env,
                "provider": "cashfree"
            }
        except Exception as e:
            return {
                "valid": False,
                "mode": "error",
                "message": f"Cashfree connection error: {str(e)}",
                "app_id": self.get_masked_app_id(),
                "env": self.env,
                "provider": "cashfree"
            }

cashfree_client = CashfreeClientWrapper()
