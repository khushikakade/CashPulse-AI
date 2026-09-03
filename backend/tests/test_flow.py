import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database import Base
from backend.app.models import Customer, RecoveryCase, RecoveryAction
from backend.app.services.policy_engine import PolicyEngine
from backend.app.services.ml_engine import MLEngine

# Setup in-memory sqlite engine for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_ml_recovery_probability():
    # Setup mock customer
    cust = Customer(reliability_score=0.90, payment_delay_days=2)
    
    # Low value retry failure 1
    prob = MLEngine.calculate_payment_recovery_probability(cust, 10000.0, 1)
    assert prob == 0.68  # 0.90 * 0.75
    
    # High value retry failure 2
    prob2 = MLEngine.calculate_payment_recovery_probability(cust, 65000.0, 2)
    assert prob2 == 0.46  # 0.90 * 0.90 (high val) * 0.75^2 = 0.455

def test_policy_engine_evaluation(db_session):
    # Setup case
    cust = Customer(name="Test Corp", email="test@test.com", reliability_score=0.90)
    db_session.add(cust)
    db_session.commit()
    
    case = RecoveryCase(
        customer_id=cust.id,
        reference_type="payment",
        reference_id="pay_test_1",
        risk_score=20.0,
        recovery_probability=0.80,
        expected_recovery_value=8000.0,
        current_status="open"
    )
    db_session.add(case)
    db_session.commit()
    
    # 1. Under limit: Should be allowed automatically
    result = PolicyEngine.evaluate_action(db_session, case, "RETRY_PAYMENT", 15000.0)
    assert result["allowed"] is True
    assert result["needs_approval"] is False
    
    # 2. Exceeds high value threshold (>= 50,000 INR): Should force human approval
    result_high_val = PolicyEngine.evaluate_action(db_session, case, "RETRY_PAYMENT", 60000.0)
    assert result_high_val["allowed"] is True
    assert result_high_val["needs_approval"] is True
    
    # 3. Simulate exceeding retry limits
    action1 = RecoveryAction(case_id=case.id, action_type="RETRY_PAYMENT", status="executed")
    action2 = RecoveryAction(case_id=case.id, action_type="RETRY_PAYMENT", status="executed")
    db_session.add(action1)
    db_session.add(action2)
    db_session.commit()
    
    result_blocked = PolicyEngine.evaluate_action(db_session, case, "RETRY_PAYMENT", 1000.0)
    assert result_blocked["allowed"] is False
    assert "MAX_PAYMENT_RETRIES limit reached" in result_blocked["blocked_by"]

def test_razorpay_webhook_signature_verification():
    from backend.app.services.razorpay_client import razorpay_client, RazorpayClientWrapper
    # In simulated/placeholder mode, verification passes
    assert razorpay_client.verify_webhook_signature("{}", "any_signature") is True
    
    # With explicit secret
    wrapper = RazorpayClientWrapper(key_id="rzp_test_123", key_secret="sec_123", webhook_secret="my_wh_secret_999")
    payload = '{"event": "payment.captured", "id": "evt_test_123"}'
    valid_sig = wrapper.generate_test_signature(payload)
    assert wrapper.verify_webhook_signature(payload, valid_sig) is True
    assert wrapper.verify_webhook_signature(payload, "tampered_signature") is False

def test_cashfree_webhook_signature_verification():
    from backend.app.services.cashfree_client import cashfree_client, CashfreeClientWrapper
    # In simulated mode, verification passes
    assert cashfree_client.verify_webhook_signature("{}", "1777200000", "any_sig") is True
    
    # With explicit secret
    cf_wrapper = CashfreeClientWrapper(app_id="cf_app_123", secret_key="cf_sec_key_xyz")
    payload = '{"type": "PAYMENT_SUCCESS_WEBHOOK", "data": {"order": {"order_id": "cf_ord_99"}}}'
    ts = "1777203600"
    valid_sig = cf_wrapper.generate_test_signature(payload, ts)
    assert cf_wrapper.verify_webhook_signature(payload, ts, valid_sig) is True
    assert cf_wrapper.verify_webhook_signature(payload, ts, "invalid_sig_base64==") is False

def test_email_service_dispatch():
    from backend.app.services.email_service import EmailService
    res = EmailService.send_payment_reminder(
        customer_name="Rohan Verma",
        customer_email="rohan@example.com",
        amount_inr=1499.0,
        payment_link="http://localhost:3000/pay/simulate?link_id=pl_test",
        invoice_ref="INV-8821"
    )
    assert res["success"] is True
    assert "rohan@example.com" in res["recipient"]

def test_bank_statement_parser(db_session):
    from backend.app.services.statement_parser import BankStatementParser
    from backend.app.models import Invoice, Customer
    
    cust = Customer(name="Pooja Sharma", email="pooja@test.com", reliability_score=0.9)
    db_session.add(cust)
    db_session.commit()
    
    from datetime import datetime
    inv = Invoice(
        customer_id=cust.id,
        invoice_number="INV-2026-01",
        amount=500.0,
        due_date=datetime.utcnow(),
        status="pending"
    )
    db_session.add(inv)
    db_session.commit()
    
    # Sample statement with clean match and MDR fee match
    csv_data = """Date,Narration,Chq/Ref No,Withdrawal Amt,Deposit Amt,Closing Balance
01/09/2026,UPI/523910294122/Pooja Sharma Payment,523910294122,0.00,489.02,10489.02
02/09/2026,CHQ WDL-PRINTING COST,CHQ100,200.00,0.00,10289.02
"""
    result = BankStatementParser.parse_and_reconcile(csv_data, db_session)
    assert result["success"] is True
    assert result["matched_count"] >= 1
    assert result["total_fees_detected_inr"] > 0
    assert result["items"][0]["status"] == "MATCHED_WITH_MDR"
    assert result["items"][0]["mdr_fee"] == 10.98

def test_background_scanner_telemetry():
    from backend.app.services.scheduler import background_scanner
    status = background_scanner.get_status()
    assert "running" in status
    assert "interval_seconds" in status
    assert status["interval_seconds"] == 1800
