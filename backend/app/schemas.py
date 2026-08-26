from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# Business Schemas
class BusinessBase(BaseModel):
    name: str
    business_type: str
    currency: str = "INR"

class BusinessCreate(BusinessBase):
    pass

class BusinessResponse(BusinessBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    reliability_score: float = 1.0
    payment_delay_days: int = 0

class CustomerResponse(CustomerBase):
    id: str
    class Config:
        from_attributes = True

# Order and Payment Schemas
class OrderResponse(BaseModel):
    id: str
    amount: float
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class PaymentResponse(BaseModel):
    id: str
    amount: float
    status: str
    payment_method: Optional[str]
    failure_reason: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

# Invoice / Receivables
class InvoiceBase(BaseModel):
    invoice_number: str
    amount: float
    due_date: datetime
    status: str = "unpaid"
    probability_of_payment: float = 1.0

class InvoiceResponse(InvoiceBase):
    id: str
    customer: CustomerResponse
    class Config:
        from_attributes = True

# Recovery Action Schemas
class RecoveryActionBase(BaseModel):
    action_type: str
    cost: float = 0.0
    customer_friction: str = "low"
    status: str = "pending_approval"
    notes: Optional[str] = None

class RecoveryActionResponse(RecoveryActionBase):
    id: str
    rzp_payment_link_id: Optional[str] = None
    checkout_url: Optional[str] = None
    created_at: datetime
    executed_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# Audit Log Schema
class AuditLogResponse(BaseModel):
    id: str
    event_type: str
    message: str
    payload: Optional[Any] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Recovery Case Schemas
class RecoveryCaseResponse(BaseModel):
    id: str
    customer: CustomerResponse
    reference_type: str
    reference_id: str
    risk_score: float
    recovery_probability: float
    expected_recovery_value: float
    current_status: str
    root_cause: Optional[str]
    explanation: Optional[str]
    recommended_action: Optional[str]
    risk_level: str
    created_at: datetime
    updated_at: datetime
    actions: List[RecoveryActionResponse] = []
    class Config:
        from_attributes = True

# Dashboard Metrics
class DashboardMetrics(BaseModel):
    financial_health_score: int
    cash_available: float
    expected_30day_cash: float
    revenue_at_risk: float
    recoverable_value: float
    recovered_this_month: float
    outstanding_receivables: float
    failed_payments_value: float
    cash_runway_days: int
    projected_shortfall_value: float

class RecommendedActionItem(BaseModel):
    case_id: str
    action_id: str
    title: str
    description: str
    impact_value: float
    confidence: float
    risk_level: str
    needs_approval: bool

class DashboardOverview(BaseModel):
    metrics: DashboardMetrics
    top_actions: List[RecommendedActionItem]

# Cash Flow Forecasting
class ForecastDataPoint(BaseModel):
    date: str
    expected: float
    lower_bound: float
    upper_bound: float

class CashFlowForecastResponse(BaseModel):
    forecast: List[ForecastDataPoint]
    runway_days: int
    shortfall_probability: float
    message: str

# Financial Reconciliation
class ReconItem(BaseModel):
    id: str
    type: str  # "payment", "refund", "invoice"
    reference: str
    amount: float
    date: str
    status: str  # "MATCHED", "PARTIAL_MATCH", "MISMATCH", "UNRESOLVED"
    explanation: str

class ReconOverview(BaseModel):
    total_checked: int
    matched_count: int
    unresolved_count: int
    reconciliation_rate: float
    items: List[ReconItem]

# Scenarios / Chaos Simulator
class ScenarioTrigger(BaseModel):
    scenario_name: str  # "payment_failure_spike", "receivables_crisis", "cash_crunch", "healthy"

# Settings / Config API
class PolicySettingUpdate(BaseModel):
    key: str
    value: str
