import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CashPulse AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecretkeychangeinproduction12345"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week
    
    # DB and Redis settings
    DATABASE_URL: str = "sqlite:///./cashpulse.db"
    REDIS_URL: Optional[str] = None
    
    # Razorpay Credentials (test/live mode)
    RAZORPAY_KEY_ID: str = "rzp_test_placeholder_key"
    RAZORPAY_KEY_SECRET: str = "rzp_test_placeholder_secret"
    RAZORPAY_WEBHOOK_SECRET: str = "rzp_webhook_secret_placeholder"
    
    # Cashfree Credentials (sandbox/live mode)
    CASHFREE_APP_ID: str = "cf_test_placeholder_app_id"
    CASHFREE_SECRET_KEY: str = "cf_test_placeholder_secret_key"
    CASHFREE_API_VERSION: str = "2023-08-01"
    CASHFREE_ENV: str = "SANDBOX"  # Options: SANDBOX, PRODUCTION
    
    # LLM settings
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    LLM_PROVIDER: str = "mock"  # Options: mock, gemini, openai
    
    # Transactional Email settings (Resend / SMTP)
    RESEND_API_KEY: Optional[str] = None
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "Finance Ops <billing@cashpulse.ai>"

    # Autonomous Scanner Settings
    SCANNER_INTERVAL_SECONDS: int = 1800  # 30 minutes
    SCANNER_ENABLED: bool = True

    # System settings
    ENVIRONMENT: str = "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
