from sqlalchemy.orm import Session
from backend.app.models import PolicySetting, RecoveryCase, RecoveryAction
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple

class PolicyEngine:
    @staticmethod
    def get_setting(db: Session, key: str, default: Any) -> Any:
        setting = db.query(PolicySetting).filter(PolicySetting.key == key).first()
        if not setting:
            return default
        if setting.value_type == "int":
            return int(setting.value)
        elif setting.value_type == "float":
            return float(setting.value)
        elif setting.value_type == "bool":
            return setting.value.lower() in ("true", "1", "yes")
        return setting.value

    @staticmethod
    def evaluate_action(db: Session, case: RecoveryCase, action_type: str, amount: float) -> Dict[str, Any]:
        """
        Validates if a recovery action is allowed by policy, blocked, or requires human intervention.
        """
        # 1. Check high value approval threshold
        high_value_limit = PolicyEngine.get_setting(db, "HIGH_VALUE_THRESHOLD", 50000.0)
        needs_approval = False
        
        if amount >= high_value_limit:
            # Force human-in-the-loop approval for high value actions
            needs_approval = True
            
        # 2. Check previous attempts in this case
        previous_actions = db.query(RecoveryAction).filter(
            RecoveryAction.case_id == case.id,
            RecoveryAction.status == "executed"
        ).all()
        
        # Filter by type
        retries = [a for a in previous_actions if a.action_type == "RETRY_PAYMENT"]
        reminders = [a for a in previous_actions if a.action_type in ["SEND_REMINDER", "GENERATE_LINK"]]
        
        if action_type == "RETRY_PAYMENT":
            max_retries = PolicyEngine.get_setting(db, "MAX_PAYMENT_RETRIES", 2)
            if len(retries) >= max_retries:
                return {
                    "allowed": False,
                    "blocked_by": f"MAX_PAYMENT_RETRIES limit reached ({max_retries} attempts executed)",
                    "needs_approval": False
                }
                
        if action_type in ["SEND_REMINDER", "GENERATE_LINK"]:
            max_reminders = PolicyEngine.get_setting(db, "MAX_AUTOMATED_REMINDERS", 2)
            if len(reminders) >= max_reminders:
                return {
                    "allowed": False,
                    "blocked_by": f"MAX_AUTOMATED_REMINDERS limit reached ({max_reminders} reminders sent)",
                    "needs_approval": False
                }
                
            # Check minimum time between notifications
            min_hours = PolicyEngine.get_setting(db, "MIN_HOURS_BETWEEN_REMINDERS", 24)
            if reminders:
                last_reminder = max(reminders, key=lambda a: a.executed_at or a.created_at)
                last_time = last_reminder.executed_at or last_reminder.created_at
                if datetime.utcnow() - last_time < timedelta(hours=min_hours):
                    return {
                        "allowed": False,
                        "blocked_by": f"MIN_HOURS_BETWEEN_REMINDERS check failed. Must wait at least {min_hours} hours between reminders.",
                        "needs_approval": False
                    }
                    
        return {
            "allowed": True,
            "blocked_by": None,
            "needs_approval": needs_approval
        }
