import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session
from backend.app.models import CashEvent, Payment, Invoice, Customer

class MLEngine:
    @staticmethod
    def forecast_cash_flow(db: Session, business_id: str, days_ahead: int = 90) -> List[Dict[str, Any]]:
        """
        Calculates daily expected cash position using regression over historical inflows/outflows,
        factoring in upcoming fixed costs and stochastic bounds.
        """
        # Fetch historical cash events
        events = db.query(CashEvent).filter(CashEvent.business_id == business_id).all()
        if not events:
            # Fallback mock forecast if no data exists
            now = datetime.utcnow()
            return [{"date": (now + timedelta(days=i)).strftime("%Y-%m-%d"), 
                     "expected": 500000.0 + (i * 2000) - (150000 if i % 30 == 5 else 0),
                     "lower_bound": 450000.0 + (i * 1000), 
                     "upper_bound": 550000.0 + (i * 3000)} for i in range(days_ahead)]
        
        # Build pandas dataframe
        data = []
        for e in events:
            data.append({
                "date": e.event_date.date(),
                "amount": e.amount if e.event_type == "inflow" else -e.amount,
                "type": e.event_type
            })
        
        df = pd.DataFrame(data)
        df["date"] = pd.to_datetime(df["date"])
        
        # Group by day and calculate cumulative cash
        daily = df.groupby("date")["amount"].sum().reset_index()
        daily = daily.sort_values("date")
        
        # Assume a base starting cash of 5,00,000 INR if empty
        base_cash = 500000.0
        daily["cumulative_cash"] = base_cash + daily["amount"].cumsum()
        
        # Fit Linear Regression for trend
        X = np.array((daily["date"] - daily["date"].min()).dt.days).reshape(-1, 1)
        y = daily["cumulative_cash"].values
        
        trend_model = LinearRegression()
        if len(X) > 1:
            trend_model.fit(X, y)
            slope = trend_model.coef_[0]
            intercept = trend_model.intercept_
        else:
            slope = 2000.0
            intercept = base_cash
            
        # Generate projections
        now = datetime.utcnow()
        last_date = daily["date"].max() if len(daily) > 0 else now
        current_cash = daily["cumulative_cash"].iloc[-1] if len(daily) > 0 else base_cash
        
        forecast_points = []
        for i in range(1, days_ahead + 1):
            projected_date = now + timedelta(days=i)
            days_from_start = (projected_date - (daily["date"].min() if len(daily) > 0 else now)).days
            
            # Trend component
            trend_val = slope * days_from_start + intercept
            
            # Incorporate upcoming obligations
            # Find any scheduled database cash events for this specific projected day
            upcoming_outflows = db.query(CashEvent).filter(
                CashEvent.business_id == business_id,
                CashEvent.event_type == "outflow",
                CashEvent.event_date >= projected_date - timedelta(hours=12),
                CashEvent.event_date <= projected_date + timedelta(hours=12)
            ).all()
            
            obligations_impact = sum(e.amount for e in upcoming_outflows)
            
            # Compute final expected value
            expected = current_cash + (slope * i) - obligations_impact
            
            # Random volatility for bounds (widens over time)
            uncertainty = 15000.0 * np.sqrt(i)
            
            forecast_points.append({
                "date": projected_date.strftime("%Y-%m-%d"),
                "expected": round(max(0.0, expected), 2),
                "lower_bound": round(max(0.0, expected - uncertainty), 2),
                "upper_bound": round(expected + uncertainty, 2)
            })
            
            # Cascade expected cash forward
            current_cash = expected - obligations_impact
            
        return forecast_points

    @staticmethod
    def calculate_payment_recovery_probability(customer: Customer, amount: float, failure_count: int) -> float:
        """
        Uses customer reliability parameters to calculate the probability of recovering a failed transaction.
        """
        # Base probability depends on customer reliability score
        prob = customer.reliability_score
        
        # High value transaction penalty (above 50,000 INR has lower probability of self-recovery)
        if amount > 50000:
            prob *= 0.90
            
        # Repeated failures degrade recovery probability rapidly
        if failure_count > 0:
            prob *= (0.75 ** failure_count)
            
        # Safety clip
        return round(max(0.05, min(0.99, prob)), 2)

    @staticmethod
    def calculate_invoice_recovery_probability(customer: Customer, amount: float, overdue_days: int) -> float:
        """
        Calculates probability of recovering an outstanding invoice based on customer history and age.
        """
        prob = customer.reliability_score
        
        # Penalize overdue age (half-life of invoice collection decays every 15 days)
        if overdue_days > 0:
            prob *= (0.92 ** (overdue_days / 5.0))
            
        # Size penalty (larger invoices take longer or require intervention)
        if amount > 100000:
            prob *= 0.85
            
        return round(max(0.02, min(0.99, prob)), 2)

    @staticmethod
    def detect_anomalies(payments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Uses IsolationForest to identify transaction anomalies based on amount and time.
        """
        if len(payments) < 5:
            # Fallback if insufficient data for Isolation Forest
            return [{"id": p["id"], "is_anomaly": False, "anomaly_score": 0.0} for p in payments]
            
        df = pd.DataFrame(payments)
        
        # Feature matrix: Amount & hour of day
        df["hour"] = pd.to_datetime(df["created_at"]).dt.hour
        X = df[["amount", "hour"]].values
        
        iso = IsolationForest(contamination=0.1, random_state=42)
        preds = iso.fit_predict(X)
        scores = iso.decision_function(X)
        
        results = []
        for idx, row in df.iterrows():
            results.append({
                "id": row["id"],
                "is_anomaly": bool(preds[idx] == -1),
                "anomaly_score": float(-scores[idx])
            })
        return results
