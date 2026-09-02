from sqlalchemy.orm import Session
from backend.scripts.seed_dwisakhi import seed_dwisakhi_data, populate_default_policies

def generate_synthetic_data(db: Session, scenario: str = "healthy", business_id: str = None):
    """
    Unified generator that produces the realistic DwiSakhi dataset.
    Used by onboarding, startup fallback, and scenario testing.
    """
    return seed_dwisakhi_data(db, scenario=scenario, specific_business_id=business_id)
