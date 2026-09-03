from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional

from backend.app.config import settings
from backend.app.services.razorpay_client import razorpay_client
from backend.app.services.cashfree_client import cashfree_client

router = APIRouter()

class TestGatewayRequest(BaseModel):
    provider: str  # "razorpay" or "cashfree"
    key_id: Optional[str] = None
    key_secret: Optional[str] = None

@router.get("/status")
def get_gateways_status() -> Dict[str, Any]:
    """
    Returns the real-time operational status and credential mode for all configured payment gateways.
    """
    rzp_val = razorpay_client.validate_credentials()
    cf_val = cashfree_client.validate_credentials()
    
    return {
        "gateways": {
            "razorpay": {
                "name": "Razorpay Payments",
                "provider": "razorpay",
                "valid": rzp_val["valid"],
                "mode": rzp_val["mode"],
                "message": rzp_val["message"],
                "masked_id": razorpay_client.get_masked_key(),
                "webhook_path": "/api/v1/webhooks/razorpay",
                "webhook_secret_set": bool(settings.RAZORPAY_WEBHOOK_SECRET and "placeholder" not in settings.RAZORPAY_WEBHOOK_SECRET)
            },
            "cashfree": {
                "name": "Cashfree Payment Gateway",
                "provider": "cashfree",
                "valid": cf_val["valid"],
                "mode": cf_val["mode"],
                "message": cf_val["message"],
                "masked_id": cashfree_client.get_masked_app_id(),
                "env": cashfree_client.env,
                "webhook_path": "/api/v1/webhooks/cashfree",
                "webhook_secret_set": bool(settings.CASHFREE_SECRET_KEY and "placeholder" not in settings.CASHFREE_SECRET_KEY)
            }
        },
        "simulation_enabled": True
    }

@router.post("/test")
def test_gateway_connection(req: TestGatewayRequest) -> Dict[str, Any]:
    """
    Triggers an instant connectivity and authentication check against the live or sandbox gateway API.
    """
    provider = req.provider.lower()
    if provider == "razorpay":
        if req.key_id and req.key_secret:
            from backend.app.services.razorpay_client import RazorpayClientWrapper
            temp_client = RazorpayClientWrapper(key_id=req.key_id, key_secret=req.key_secret)
            return temp_client.validate_credentials()
        return razorpay_client.validate_credentials()
    elif provider == "cashfree":
        if req.key_id and req.key_secret:
            from backend.app.services.cashfree_client import CashfreeClientWrapper
            temp_client = CashfreeClientWrapper(app_id=req.key_id, secret_key=req.key_secret)
            return temp_client.validate_credentials()
        return cashfree_client.validate_credentials()
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {req.provider}")
