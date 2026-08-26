from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from backend.app.models import Business, Customer, Order, Payment, Invoice, CashEvent, PolicySetting

def populate_default_policies(db: Session):
    policies = [
        {"key": "MAX_PAYMENT_RETRIES", "value": "2", "value_type": "int", "description": "Maximum automatic retries before stopping and escalating"},
        {"key": "MAX_AUTOMATED_REMINDERS", "value": "2", "value_type": "int", "description": "Maximum number of reminders sent to a single customer"},
        {"key": "MIN_HOURS_BETWEEN_REMINDERS", "value": "24", "value_type": "int", "description": "Minimum wait time before sending another notification"},
        {"key": "MAX_AUTOMATED_DISCOUNT", "value": "5", "value_type": "float", "description": "Maximum automated early settlement discount percentage"},
        {"key": "HIGH_VALUE_THRESHOLD", "value": "50000", "value_type": "float", "description": "Threshold above which human approval is mandatory for any intervention"},
    ]
    for p in policies:
        exists = db.query(PolicySetting).filter(PolicySetting.key == p["key"]).first()
        if not exists:
            db.add(PolicySetting(**p))
    db.commit()

def generate_synthetic_data(db: Session, scenario: str = "healthy", business_id: str = None):
    # Clear existing data first to prevent duplicates in demo mode
    if business_id:
        business = db.query(Business).filter(Business.id == business_id).first()
        if not business:
            return
        cust_ids = [c.id for c in db.query(Customer).filter(Customer.business_id == business_id).all()]
        db.query(CashEvent).filter(CashEvent.business_id == business_id).delete()
        if cust_ids:
            db.query(Payment).filter(Payment.customer_id.in_(cust_ids)).delete()
            db.query(Order).filter(Order.customer_id.in_(cust_ids)).delete()
            db.query(Invoice).filter(Invoice.customer_id.in_(cust_ids)).delete()
            db.query(Customer).filter(Customer.business_id == business_id).delete()
        db.commit()
    else:
        db.query(CashEvent).delete()
        db.query(Invoice).delete()
        db.query(Payment).delete()
        db.query(Order).delete()
        db.query(Customer).delete()
        db.query(Business).delete()
        db.commit()
        
        # 1. Create Business
        business = Business(
            name="Aarav HomeTech",
            business_type="Small Electronics Retailer",
            currency="INR"
        )
        db.add(business)
        db.commit()
        db.refresh(business)
    
    # 2. Populate policies
    populate_default_policies(db)
    
    # 3. Create Customers (with distinct payment behavior profiles)
    customer_profiles = [
        {"name": "Venkatesh Enterprises", "email": "venkatesh@enterprises.com", "phone": "9876543210", "reliability": 0.95, "delay": 2},
        {"name": "Ananya Sharma (Retail)", "email": "ananya@gmail.com", "phone": "9812345678", "reliability": 0.85, "delay": 1},
        {"name": "Karan Johar Designs", "email": "contact@karanjohar.co", "phone": "9898989898", "reliability": 0.40, "delay": 15}, # Slow paying / high risk
        {"name": "Sai Ram Distributors", "email": "info@sairamdist.in", "phone": "9765432109", "reliability": 0.90, "delay": 4},
        {"name": "Aditya Birla Retail Corp", "email": "ap@adityabirla.com", "phone": "9988776655", "reliability": 0.98, "delay": 5}, # High value
        {"name": "Sneha Patil (Retail)", "email": "sneha.patil@outlook.com", "phone": "9555667788", "reliability": 0.15, "delay": 20}, # Chronic failure profile
        {"name": "Vikram Seth (Retail)", "email": "vikramseth@yahoo.com", "phone": "9444555666", "reliability": 0.75, "delay": 3},
        {"name": "Rohan Mehta Ltd", "email": "rohan@mehtaltd.com", "phone": "9222333444", "reliability": 0.80, "delay": 8},
    ]
    
    db_customers = []
    for c in customer_profiles:
        cust = Customer(
            business_id=business.id,
            name=c["name"],
            email=c["email"],
            phone=c["phone"],
            reliability_score=c["reliability"],
            payment_delay_days=c["delay"]
        )
        db.add(cust)
        db_customers.append(cust)
    db.commit()
    
    # 4. Generate Orders and Payments (Historical - past 30 days)
    now = datetime.utcnow()
    
    for i in range(50):
        cust = random.choice(db_customers)
        date = now - timedelta(days=random.randint(1, 30))
        amount = random.randint(5000, 45000)
        
        order = Order(
            customer_id=cust.id,
            rzp_order_id=f"order_hist_{1000 + i}",
            amount=amount,
            status="paid",
            created_at=date
        )
        db.add(order)
        db.commit()
        db.refresh(order)
        
        # Payment probability depends on customer reliability unless scenario overrides it
        payment_failed = False
        if scenario == "payment_failure_spike" and random.random() < 0.40:
            payment_failed = True
        elif random.random() > cust.reliability_score:
            payment_failed = True
            
        if payment_failed:
            order.status = "failed"
            payment = Payment(
                order_id=order.id,
                customer_id=cust.id,
                rzp_payment_id=f"pay_hist_{2000 + i}",
                amount=amount,
                status="failed",
                payment_method=random.choice(["card", "upi", "netbanking"]),
                failure_reason=random.choice(["BAD_CREDENTIALS", "INSUFFICIENT_FUNDS", "BANK_SERVER_DOWN", "TIMED_OUT"]),
                created_at=date
            )
        else:
            payment = Payment(
                order_id=order.id,
                customer_id=cust.id,
                rzp_payment_id=f"pay_hist_{2000 + i}",
                amount=amount,
                status="captured",
                payment_method=random.choice(["card", "upi"]),
                created_at=date
            )
        db.add(payment)
        
        # Log Cash inflow if payment was captured
        if not payment_failed:
            cash_event = CashEvent(
                business_id=business.id,
                event_type="inflow",
                category="sales",
                amount=amount,
                event_date=date,
                description=f"Payment received for order_hist_{1000 + i}"
            )
            db.add(cash_event)
            
    db.commit()
    
    # 5. Generate Invoices / Receivables
    invoice_data = [
        {"cust_idx": 0, "amount": 120000.0, "days_due": -5, "status": "unpaid"},  # Venkatesh Enterprises (Overdue)
        {"cust_idx": 2, "amount": 240000.0, "days_due": -12, "status": "unpaid"}, # Karan Johar (Overdue)
        {"cust_idx": 4, "amount": 480000.0, "days_due": 10, "status": "unpaid"},  # Aditya Birla (Upcoming)
        {"cust_idx": 3, "amount": 80000.0, "days_due": -2, "status": "unpaid"},   # Sai Ram Distributors (Overdue)
        {"cust_idx": 7, "amount": 150000.0, "days_due": 15, "status": "unpaid"},  # Rohan Mehta (Upcoming)
        {"cust_idx": 1, "amount": 25000.0, "days_due": -1, "status": "unpaid"},   # Ananya Sharma (Overdue)
    ]
    
    # If receivables crisis scenario, make more invoices overdue and delay payment probabilities
    if scenario == "receivables_crisis":
        invoice_data[2]["days_due"] = -4  # Aditya Birla overdue
        invoice_data[4]["days_due"] = -8  # Rohan Mehta overdue
        invoice_data.append({"cust_idx": 2, "amount": 180000.0, "days_due": -20, "status": "unpaid"})
        
    for idx, inv in enumerate(invoice_data):
        cust = db_customers[inv["cust_idx"]]
        due_date = now + timedelta(days=inv["days_due"])
        
        # Payment probability calculation
        base_prob = cust.reliability_score
        if inv["days_due"] < 0:
            overdue_days = abs(inv["days_due"])
            # Decay probability as invoice gets older
            base_prob = max(0.1, base_prob - (overdue_days * 0.03))
            
        db_inv = Invoice(
            customer_id=cust.id,
            invoice_number=f"INV-2026-00{idx+1}",
            amount=inv["amount"],
            due_date=due_date,
            status="overdue" if inv["days_due"] < 0 else "unpaid",
            probability_of_payment=base_prob,
            created_at=due_date - timedelta(days=30)
        )
        db.add(db_inv)
    db.commit()
    
    # 6. Generate Cash Events (Expenses / Rent / Payroll)
    # Historic monthly expenses
    for m in range(2):
        month_offset = m * 30
        payroll_date = now - timedelta(days=5 + month_offset)
        rent_date = now - timedelta(days=1 + month_offset)
        supplier_date = now - timedelta(days=15 + month_offset)
        
        db.add(CashEvent(business_id=business.id, event_type="outflow", category="payroll", amount=150000.0, event_date=payroll_date, description="Employee payroll"))
        db.add(CashEvent(business_id=business.id, event_type="outflow", category="rent", amount=50000.0, event_date=rent_date, description="Office / warehouse rent"))
        db.add(CashEvent(business_id=business.id, event_type="outflow", category="supplier", amount=200000.0, event_date=supplier_date, description="Vendor raw materials"))
    
    # Upcoming obligations (next 30 days)
    # Rent and payroll coming up
    db.add(CashEvent(business_id=business.id, event_type="outflow", category="payroll", amount=150000.0, event_date=now + timedelta(days=5), description="Employee payroll (Upcoming)"))
    db.add(CashEvent(business_id=business.id, event_type="outflow", category="rent", amount=50000.0, event_date=now + timedelta(days=1), description="Office / warehouse rent (Upcoming)"))
    db.add(CashEvent(business_id=business.id, event_type="outflow", category="supplier", amount=250000.0, event_date=now + timedelta(days=12), description="Supplier payment (Upcoming)"))
    
    if scenario == "cash_crunch":
        # Inject additional sudden supplier obligations or reduce starting cash flow
        db.add(CashEvent(business_id=business.id, event_type="outflow", category="taxes", amount=120000.0, event_date=now + timedelta(days=7), description="Unexpected Tax Assessment (GST)"))
        
    db.commit()
