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
