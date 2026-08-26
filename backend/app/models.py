import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Business(Base):
    __tablename__ = "businesses"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    business_type = Column(String, nullable=False)  # D2C Fashion, B2B Manufacturer, etc.
    currency = Column(String, default="INR")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    customers = relationship("Customer", back_populates="business")
    cash_events = relationship("CashEvent", back_populates="business")

class Customer(Base):
    __tablename__ = "customers"
    id = Column(String, primary_key=True, default=generate_uuid)
    business_id = Column(String, ForeignKey("businesses.id"))
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    reliability_score = Column(Float, default=1.0) # 0 to 1
    payment_delay_days = Column(Integer, default=0) # average historical delay
    created_at = Column(DateTime, default=datetime.utcnow)
    
    business = relationship("Business", back_populates="customers")
    orders = relationship("Order", back_populates="customer")
    invoices = relationship("Invoice", back_populates="customer")
    recovery_cases = relationship("RecoveryCase", back_populates="customer")

class Order(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True, default=generate_uuid)
    customer_id = Column(String, ForeignKey("customers.id"))
    rzp_order_id = Column(String, unique=True, nullable=True)
    amount = Column(Float, nullable=False)
    status = Column(String, default="created")  # created, paid, failed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="orders")
    payments = relationship("Payment", back_populates="order")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String, ForeignKey("orders.id"))
    customer_id = Column(String, ForeignKey("customers.id"))
    rzp_payment_id = Column(String, unique=True, nullable=True)
    amount = Column(Float, nullable=False)
    status = Column(String, nullable=False)  # captured, failed, refunded
    payment_method = Column(String, nullable=True)  # card, upi, netbanking
    failure_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    order = relationship("Order", back_populates="payments")

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(String, primary_key=True, default=generate_uuid)
    customer_id = Column(String, ForeignKey("customers.id"))
    invoice_number = Column(String, unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    due_date = Column(DateTime, nullable=False)
    status = Column(String, default="unpaid")  # paid, unpaid, overdue, bad_debt
    probability_of_payment = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="invoices")

class RecoveryCase(Base):
    __tablename__ = "recovery_cases"
    id = Column(String, primary_key=True, default=generate_uuid)
    customer_id = Column(String, ForeignKey("customers.id"))
    reference_type = Column(String, nullable=False)  # payment, invoice
    reference_id = Column(String, nullable=False)  # ID of the payment or invoice
    risk_score = Column(Float, nullable=False)  # 0 to 100
    recovery_probability = Column(Float, nullable=False)  # 0 to 1
    expected_recovery_value = Column(Float, nullable=False)
    current_status = Column(String, default="open")  # open, in_progress, recovered, closed_failed, human_review
    root_cause = Column(String, nullable=True)
    explanation = Column(Text, nullable=True)
    recommended_action = Column(String, nullable=True)
    risk_level = Column(String, default="low")  # low, medium, high
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="recovery_cases")
    actions = relationship("RecoveryAction", back_populates="case")

class RecoveryAction(Base):
    __tablename__ = "recovery_actions"
    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("recovery_cases.id"))
    action_type = Column(String, nullable=False)  # RETRY_PAYMENT, SEND_REMINDER, GENERATE_LINK, etc.
    cost = Column(Float, default=0.0)
    customer_friction = Column(String, default="low")  # low, medium, high
    status = Column(String, default="pending_approval")  # pending_approval, approved, rejected, executed, failed
    rzp_payment_link_id = Column(String, nullable=True)
    checkout_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    executed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    
    case = relationship("RecoveryCase", back_populates="actions")
    audit_logs = relationship("AuditLog", back_populates="action")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=generate_uuid)
    action_id = Column(String, ForeignKey("recovery_actions.id"), nullable=True)
    event_type = Column(String, nullable=False) # e.g. "RISK_DETECTED", "ACTION_APPROVED", "PAYMENT_RECOVERED"
    message = Column(Text, nullable=False)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    action = relationship("RecoveryAction", back_populates="audit_logs")

class CashEvent(Base):
    __tablename__ = "cash_events"
    id = Column(String, primary_key=True, default=generate_uuid)
    business_id = Column(String, ForeignKey("businesses.id"))
    event_type = Column(String, nullable=False)  # inflow, outflow
    category = Column(String, nullable=False)  # sales, payroll, rent, supplier, taxes
    amount = Column(Float, nullable=False)
    event_date = Column(DateTime, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    business = relationship("Business", back_populates="cash_events")

class WebhookEvent(Base):
    __tablename__ = "webhook_events"
    id = Column(String, primary_key=True, default=generate_uuid)
    event_id = Column(String, unique=True, nullable=False)
    event_type = Column(String, nullable=False)
    received_at = Column(DateTime, default=datetime.utcnow)
    payload = Column(JSON, nullable=False)
    signature_valid = Column(Boolean, default=False)
    processed = Column(Boolean, default=False)
    processing_attempts = Column(Integer, default=0)
    error = Column(Text, nullable=True)

class PolicySetting(Base):
    __tablename__ = "policy_settings"
    id = Column(String, primary_key=True, default=generate_uuid)
    key = Column(String, unique=True, nullable=False)
    value = Column(String, nullable=False)
    value_type = Column(String, default="str")  # int, float, bool, str
    description = Column(Text, nullable=True)
