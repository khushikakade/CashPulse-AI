import os
import sys
import uuid
import random
from datetime import datetime, timedelta

# Add repository root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from backend.app.database import SessionLocal, engine, Base
from backend.app.models import (
    Business, Customer, Order, Payment, Invoice, CashEvent, PolicySetting,
    RecoveryCase, RecoveryAction, AuditLog
)

# -----------------------------------------------------------------------------
# DwiSakhi Brand Catalog & Realistic Indian College Demographics
# -----------------------------------------------------------------------------

STUDENT_FIRST_NAMES = [
    "Ananya", "Riya", "Aarav", "Tanvi", "Shreya", "Ishaan", "Aditi", "Rohan",
    "Meera", "Kabir", "Diya", "Pranav", "Suhani", "Aryan", "Kavya", "Varun",
    "Sneha", "Kunal", "Tara", "Dhruv", "Pooja", "Siddharth", "Nisha", "Aditya",
    "Zoya", "Manav", "Isha", "Arjun", "Simran", "Nikhil", "Gauri", "Vikram",
    "Anushka", "Harsh", "Radhika", "Yash", "Bhavna", "Dev", "Alia", "Tushar"
]

STUDENT_LAST_NAMES = [
    "Sharma", "Patel", "Deshmukh", "Kulkarni", "Sen", "Verma", "Nair", "Joshi",
    "Sundaram", "Shah", "Gupta", "Mehta", "Iyer", "Rao", "Chopra", "Malhotra",
    "Bhat", "Kapoor", "Chatterjee", "Reddy", "Banerjee", "Menon", "Saxena", "Choudhury"
]

CITIES = [
    "Delhi NCR", "Mumbai", "Bengaluru", "Pune", "Ahmedabad", "Jaipur",
    "Chandigarh", "Kolkata", "Hyderabad", "Chennai", "Kochi", "Indore"
]

D2C_PRODUCTS = [
    {"name": "Corduroy Aesthetic Tote Bag - Forest Green", "price": 499.0, "category": "totes"},
    {"name": "Everyday Heavyweight Canvas Tote - Off White", "price": 399.0, "category": "totes"},
    {"name": "Floral Embroidered Canvas Tote Bag", "price": 549.0, "category": "totes"},
    {"name": "Vintage Washed Corduroy Bucket Hat - Olive", "price": 520.0, "category": "hats"},
    {"name": "Reversible Pastel Bucket Hat - Sage & Peach", "price": 480.0, "category": "hats"},
    {"name": "Minimalist 'Overthinking' Embroidered Cap", "price": 449.0, "category": "caps"},
    {"name": "Vintage Washed Baseball Cap - Espresso", "price": 399.0, "category": "caps"},
    {"name": "Zippered Corduroy Utility Pouch - Mustard", "price": 249.0, "category": "pouches"},
    {"name": "Quilted Mini Makeup Pouch - Lavender", "price": 299.0, "category": "pouches"},
    {"name": "Mini Corduroy Coin Pouch with Keychain", "price": 179.0, "category": "pouches"},
    {"name": "Anime & Chai Holographic DTF Sticker Pack (5 pcs)", "price": 79.0, "category": "stickers"},
    {"name": "Gen-Z Desi Slogans Matte DTF Sticker Pack (8 pcs)", "price": 89.0, "category": "stickers"},
    {"name": "Campus Nostalgia Waterproof Sticker Sheet", "price": 69.0, "category": "stickers"},
    {"name": "DwiSakhi Mystery Goodie Bundle (Tote + Cap + Stickers)", "price": 799.0, "category": "bundles"},
]

COLLEGE_FEST_ACCOUNTS = [
    {
        "name": "Mood Indigo IIT Bombay - Merch Committee",
        "poc": "Kabir Sen",
        "email": "merch@moodi.org",
        "phone": "+91 98201 12345",
        "reliability": 0.88,
        "delay": 8
    },
    {
        "name": "Malhar Fest Organizers - St. Xavier's College Mumbai",
        "poc": "Diya Shah",
        "email": "logistics@malharfest.org",
        "phone": "+91 98192 23456",
        "reliability": 0.92,
        "delay": 4
    },
    {
        "name": "Sympulse Fest Merch Cell - Symbiosis Pune",
        "poc": "Ananya Roy",
        "email": "finance@sympulse.in",
        "phone": "+91 97654 34567",
        "reliability": 0.80,
        "delay": 12
    },
    {
        "name": "Waves Festival Core - BITS Pilani Goa",
        "poc": "Tanmay Rao",
        "email": "waves.merch@goa.bits-pilani.ac.in",
        "phone": "+91 99887 45678",
        "reliability": 0.75,
        "delay": 14
    },
    {
        "name": "Crossroads Youth Fest - SRCC Delhi University",
        "poc": "Pranav Gupta",
        "email": "crossroads.merch@srcc.du.ac.in",
        "phone": "+91 98111 56789",
        "reliability": 0.95,
        "delay": 3
    },
    {
        "name": "Rotaract Club Youth Conclave - Bengaluru",
        "poc": "Rhea Mehra",
        "email": "president@rotaractbangalore.org",
        "phone": "+91 96543 67890",
        "reliability": 0.85,
        "delay": 6
    },
]

def populate_default_policies(db):
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

def seed_dwisakhi_data(db, scenario: str = "healthy", specific_business_id: str = None):
    """
    Cleans up old data and builds the complete, realistic dataset for:
    द्वीSakhi (DwiSakhi) — Gen-Z D2C Merch brand run by Neha & Khushi.
    """
    print("🌱 Starting DwiSakhi realistic seed dataset generation...")

    # Clean existing data cleanly
    if specific_business_id:
        business = db.query(Business).filter(Business.id == specific_business_id).first()
        if not business:
            return None
        cust_ids = [c.id for c in db.query(Customer).filter(Customer.business_id == specific_business_id).all()]
        db.query(CashEvent).filter(CashEvent.business_id == specific_business_id).delete(synchronize_session=False)
        if cust_ids:
            case_ids = [c.id for c in db.query(RecoveryCase).filter(RecoveryCase.customer_id.in_(cust_ids)).all()]
            if case_ids:
                action_ids = [a.id for a in db.query(RecoveryAction).filter(RecoveryAction.case_id.in_(case_ids)).all()]
                if action_ids:
                    db.query(AuditLog).filter(AuditLog.action_id.in_(action_ids)).delete(synchronize_session=False)
                    db.query(RecoveryAction).filter(RecoveryAction.id.in_(action_ids)).delete(synchronize_session=False)
                db.query(RecoveryCase).filter(RecoveryCase.id.in_(case_ids)).delete(synchronize_session=False)
            db.query(Payment).filter(Payment.customer_id.in_(cust_ids)).delete(synchronize_session=False)
            db.query(Order).filter(Order.customer_id.in_(cust_ids)).delete(synchronize_session=False)
            db.query(Invoice).filter(Invoice.customer_id.in_(cust_ids)).delete(synchronize_session=False)
            db.query(Customer).filter(Customer.business_id == specific_business_id).delete(synchronize_session=False)
        db.commit()
    else:
        db.query(AuditLog).delete(synchronize_session=False)
        db.query(RecoveryAction).delete(synchronize_session=False)
        db.query(RecoveryCase).delete(synchronize_session=False)
        db.query(CashEvent).delete(synchronize_session=False)
        db.query(Invoice).delete(synchronize_session=False)
        db.query(Payment).delete(synchronize_session=False)
        db.query(Order).delete(synchronize_session=False)
        db.query(Customer).delete(synchronize_session=False)
        db.query(Business).delete(synchronize_session=False)
        db.commit()

        # 1. Create Business
        business = Business(
            name="द्वीSakhi",
            business_type="D2C Brand",
            currency="INR",
            product_sold="Tote Bags, Bucket Hats, Caps, Pouches, DTF Stickers",
            payment_method_preference="COD + UPI/Razorpay",
            monthly_revenue=420000.0,
            customer_count=180,
            payment_terms="COD + UPI/Razorpay",
            automation_level="ask_before_action",
            auto_limit=50000.0,
            max_retries=2
        )
        db.add(business)
        db.commit()
        db.refresh(business)

    # 2. Setup Policies
    populate_default_policies(db)

    # 3. Create Customers: 180 College Students + 6 College Fest Accounts
    now = datetime.utcnow()
    customers = []

    # A. 6 College Fest Bulk Accounts
    for fest in COLLEGE_FEST_ACCOUNTS:
        c = Customer(
            business_id=business.id,
            name=fest["name"],
            email=fest["email"],
            phone=fest["phone"],
            reliability_score=fest["reliability"],
            payment_delay_days=fest["delay"]
        )
        db.add(c)
        customers.append(c)

    # B. 180 Individual D2C College Students
    random.seed(42) # Deterministic realism
    for i in range(180):
        fname = random.choice(STUDENT_FIRST_NAMES)
        lname = random.choice(STUDENT_LAST_NAMES)
        cname = f"{fname} {lname}"
        handle = f"{fname.lower()}.{lname.lower()}{random.randint(10, 99)}"
        email = f"{handle}@{random.choice(['gmail.com', 'outlook.com', 'yahoo.in'])}"
        phone = f"+91 {random.randint(90000, 99999)} {random.randint(10000, 99999)}"
        
        # Reliability: 80% of students pay smoothly, 15% occasional UPI drop, 5% chronic drop
        reliability = random.choices([0.95, 0.85, 0.70, 0.40], weights=[60, 25, 10, 5])[0]
        delay_days = random.choices([0, 1, 3, 7], weights=[70, 15, 10, 5])[0]

        c = Customer(
            business_id=business.id,
            name=cname,
            email=email,
            phone=phone,
            reliability_score=reliability,
            payment_delay_days=delay_days
        )
        db.add(c)
        customers.append(c)

    db.commit()

    # Refresh customer list with IDs
    db_customers = db.query(Customer).filter(Customer.business_id == business.id).all()
    fest_customers = [c for c in db_customers if "Committee" in c.name or "Fest" in c.name or "Club" in c.name]
    student_customers = [c for c in db_customers if c not in fest_customers]

    # 4. Generate Order & Payment History (Past 6 months: 180 days)
    # Seasonal spikes around College Fest months (August-November, January-March)
    run_seed = uuid.uuid4().hex[:6]
    order_count = 0
    total_sales_inflow = 0.0

    print("📦 Generating 150+ realistic D2C merchandise orders and fest bulk orders...")

    # Individual D2C Orders (160 orders across past 180 days)
    for i in range(160):
        cust = random.choice(student_customers)
        # Weight dates towards recent 60 days + seasonal peaks
        days_ago = random.choices(
            [random.randint(1, 30), random.randint(31, 90), random.randint(91, 180)],
            weights=[50, 30, 20]
        )[0]
        order_date = now - timedelta(days=days_ago)

        # Pick 1-3 items
        items_count = random.choices([1, 2, 3], weights=[70, 25, 5])[0]
        selected_items = random.sample(D2C_PRODUCTS, items_count)
        order_amount = sum(item["price"] for item in selected_items)

        order = Order(
            customer_id=cust.id,
            rzp_order_id=f"order_{run_seed}_{1000 + i}",
            amount=order_amount,
            status="paid",
            created_at=order_date
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        # Payment failure probability
        is_failed = False
        if scenario == "payment_failure_spike" and days_ago <= 7 and random.random() < 0.45:
            is_failed = True
        elif random.random() > cust.reliability_score:
            is_failed = True

        if is_failed:
            order.status = "failed"
            failure_reason = random.choice([
                "UPI_INTENT_ABANDONED",
                "BANK_SERVER_TIMEOUT",
                "COD_CUSTOMER_UNAVAILABLE",
                "INSUFFICIENT_FUNDS"
            ])
            payment = Payment(
                order_id=order.id,
                customer_id=cust.id,
                rzp_payment_id=f"pay_{run_seed}_{2000 + i}",
                amount=order_amount,
                status="failed",
                payment_method=random.choice(["upi", "upi", "cod", "card"]),
                failure_reason=failure_reason,
                created_at=order_date
            )
            db.add(payment)
        else:
            payment = Payment(
                order_id=order.id,
                customer_id=cust.id,
                rzp_payment_id=f"pay_{run_seed}_{2000 + i}",
                amount=order_amount,
                status="captured",
                payment_method=random.choice(["upi", "upi", "card"]),
                created_at=order_date
            )
            db.add(payment)
            total_sales_inflow += order_amount

            # Log cash inflow event
            cash_event = CashEvent(
                business_id=business.id,
                event_type="inflow",
                category="d2c_sales",
                amount=order_amount,
                event_date=order_date,
                description=f"D2C Website/IG Order: {selected_items[0]['name']}"
            )
            db.add(cash_event)

        order_count += 1

    # B2B College Fest Bulk Orders (Past 6 months: 8 bulk orders)
    fest_order_data = [
        {"cust_idx": 0, "amount": 54000.0, "items": "150x Custom Embroidered Caps + 300x Stickers", "days_ago": 28, "status": "unpaid"},
        {"cust_idx": 1, "amount": 36000.0, "items": "120x Aesthetic Canvas Totes", "days_ago": 22, "status": "unpaid"},
        {"cust_idx": 2, "amount": 64000.0, "items": "200x Custom Printed Merch Totes", "days_ago": 15, "status": "unpaid"},
        {"cust_idx": 3, "amount": 28000.0, "items": "80x Vintage Corduroy Bucket Hats", "days_ago": 45, "status": "unpaid"},
        {"cust_idx": 4, "amount": 42000.0, "items": "100x Crossroads Fest Totes & Caps", "days_ago": 75, "status": "paid"},
        {"cust_idx": 5, "amount": 18000.0, "items": "60x Corduroy Event Pouches", "days_ago": 8, "status": "unpaid"},
        {"cust_idx": 0, "amount": 48000.0, "items": "100x Pre-Fest Merch Drop Hoodies & Totes", "days_ago": 120, "status": "paid"},
        {"cust_idx": 1, "amount": 32000.0, "items": "100x Malhar Volunteer Caps", "days_ago": 140, "status": "paid"},
    ]

    for f_idx, fo in enumerate(fest_order_data):
        cust = fest_customers[fo["cust_idx"]]
        order_date = now - timedelta(days=fo["days_ago"])

        order = Order(
            customer_id=cust.id,
            rzp_order_id=f"order_{run_seed}_fest_{3000 + f_idx}",
            amount=fo["amount"],
            status=fo["status"],
            created_at=order_date
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        if fo["status"] == "paid":
            payment = Payment(
                order_id=order.id,
                customer_id=cust.id,
                rzp_payment_id=f"pay_{run_seed}_fest_{4000 + f_idx}",
                amount=fo["amount"],
                status="captured",
                payment_method="netbanking",
                created_at=order_date
            )
            db.add(payment)
            total_sales_inflow += fo["amount"]

            db.add(CashEvent(
                business_id=business.id,
                event_type="inflow",
                category="b2b_fest_sales",
                amount=fo["amount"],
                event_date=order_date,
                description=f"College Fest Settlement: {fo['items']}"
            ))

    db.commit()

    # 5. Invoices & Receivables (The core source of truth for Receivables, Dashboard & What-If)
    print("📜 Generating invoices for DwiSakhi college fest accounts and pending student orders...")

    invoices_to_create = [
        # 1. High-Value Fest Order (Mood Indigo IITB) - Overdue, exceeds 50K threshold -> Awaiting Approval!
        {
            "cust": fest_customers[0],
            "inv_num": f"INV-{now.year}-MOODI-01",
            "amount": 54000.0,
            "days_due": -8, # 8 days overdue
            "status": "overdue",
            "prob": 0.85,
            "desc": "150x Custom Embroidered Caps & DTF Sticker Bundles for Mood Indigo IITB Fest"
        },
        # 2. Malhar St. Xavier's Fest - Overdue by 4 days
        {
            "cust": fest_customers[1],
            "inv_num": f"INV-{now.year}-MALHAR-02",
            "amount": 36000.0,
            "days_due": -4,
            "status": "overdue",
            "prob": 0.90,
            "desc": "120x Aesthetic Canvas Tote Bags for Malhar Cultural Fest"
        },
        # 3. Sympulse Fest Pune - Due in 12 days
        {
            "cust": fest_customers[2],
            "inv_num": f"INV-{now.year}-SYMPULSE-03",
            "amount": 64000.0,
            "days_due": 12,
            "status": "unpaid",
            "prob": 0.88,
            "desc": "200x Custom Printed Merch Totes for Sympulse Pune"
        },
        # 4. Waves BITS Pilani - Overdue by 14 days (Slow paying)
        {
            "cust": fest_customers[3],
            "inv_num": f"INV-{now.year}-WAVES-04",
            "amount": 28000.0,
            "days_due": -14,
            "status": "overdue",
            "prob": 0.72,
            "desc": "80x Vintage Corduroy Bucket Hats for BITS Waves Core Team"
        },
        # 5. Rotaract Youth Club - Due in 5 days
        {
            "cust": fest_customers[5],
            "inv_num": f"INV-{now.year}-ROTARACT-05",
            "amount": 18000.0,
            "days_due": 5,
            "status": "unpaid",
            "prob": 0.92,
            "desc": "60x Corduroy Event Pouches for Youth Conclave"
        },
        # 6. College Dance Society Bulk Totes (Student Account)
        {
            "cust": student_customers[2], # e.g. Aarav Deshmukh
            "inv_num": f"INV-{now.year}-CAMPUS-06",
            "amount": 2580.0,
            "days_due": -2,
            "status": "overdue",
            "prob": 0.85,
            "desc": "6x Corduroy Forest Green Totes for College Dance Society"
        }
    ]

    # Scenario adjustments if stress is triggered
    if scenario == "receivables_crisis":
        invoices_to_create[2]["days_due"] = -5 # Sympulse overdue
        invoices_to_create[4]["days_due"] = -10 # Rotaract overdue
        invoices_to_create[3]["prob"] = 0.40

    for inv in invoices_to_create:
        due_date = now + timedelta(days=inv["days_due"])
        db_inv = Invoice(
            customer_id=inv["cust"].id,
            invoice_number=inv["inv_num"],
            amount=inv["amount"],
            due_date=due_date,
            status=inv["status"],
            probability_of_payment=inv["prob"],
            created_at=due_date - timedelta(days=21)
        )
        db.add(db_inv)

    db.commit()

    # 6. Generate Realistic Cash Events (Operating Inflows & Outflows)
    print("💸 Populating DwiSakhi realistic monthly revenues, studio rent, fabric, and DTF expenses...")

    # Monthly realistic cycle for the past 4 months
    for m in range(4):
        offset = m * 30
        p_date = now - timedelta(days=offset)

        # Monthly Revenue Inflows (D2C Website + Instagram drops + College fest advances)
        db.add(CashEvent(
            business_id=business.id,
            event_type="inflow",
            category="website_sales",
            amount=245000.0,
            event_date=p_date - timedelta(days=10),
            description="Shopify & Instagram D2C tote, cap & sticker sales (Monthly batch)"
        ))
        db.add(CashEvent(
            business_id=business.id,
            event_type="inflow",
            category="fest_advances",
            amount=115000.0,
            event_date=p_date - timedelta(days=20),
            description="College Fest merchandise advances & bulk deposits"
        ))

        # Operating Expenses
        # A. Cotton Blank Totes & Fabric Vendor (Tirupur / Surat)
        db.add(CashEvent(
            business_id=business.id,
            event_type="outflow",
            category="raw_materials",
            amount=78000.0,
            event_date=p_date - timedelta(days=12),
            description="Cotton blank canvas totes & corduroy fabric roll (Tirupur Supplier)"
        ))

        # B. DTF Printing & Embroidery Unit (Shahpur Jat / Okhla)
        db.add(CashEvent(
            business_id=business.id,
            event_type="outflow",
            category="manufacturing",
            amount=42000.0,
            event_date=p_date - timedelta(days=18),
            description="DTF film printing & cap embroidery partner billing"
        ))

        # C. Small Studio & Packing Room Rent (Shahpur Jat, New Delhi)
        db.add(CashEvent(
            business_id=business.id,
            event_type="outflow",
            category="rent",
            amount=24000.0,
            event_date=p_date - timedelta(days=1),
            description="Studio & packing room rent (Shahpur Jat, Delhi)"
        ))

        # D. Shiprocket & Delhivery Logistics
        db.add(CashEvent(
            business_id=business.id,
            event_type="outflow",
            category="shipping",
            amount=31500.0,
            event_date=p_date - timedelta(days=7),
            description="D2C Courier logistics & COD remittance fees (Shiprocket)"
        ))

        # E. Meta / Instagram Ad Spend
        db.add(CashEvent(
            business_id=business.id,
            event_type="outflow",
            category="marketing",
            amount=26000.0,
            event_date=p_date - timedelta(days=15),
            description="Instagram Ads for Monsoon & College Fest Tote drops"
        ))

        # F. Two Packing & Dispatch Interns Stipend
        db.add(CashEvent(
            business_id=business.id,
            event_type="outflow",
            category="payroll",
            amount=12000.0,
            event_date=p_date - timedelta(days=5),
            description="Stipend for 2 part-time packing & inventory interns"
        ))

        # G. Founder Living Draws (Neha & Khushi - ₹40k each)
        db.add(CashEvent(
            business_id=business.id,
            event_type="outflow",
            category="founder_draws",
            amount=80000.0,
            event_date=p_date - timedelta(days=2),
            description="Founder living draws (Neha & Khushi - ₹40k each)"
        ))

    # Upcoming obligations (Next 30 days)
    db.add(CashEvent(
        business_id=business.id,
        event_type="outflow",
        category="rent",
        amount=24000.0,
        event_date=now + timedelta(days=2),
        description="Studio & packing room rent (Upcoming 1st of month)"
    ))
    db.add(CashEvent(
        business_id=business.id,
        event_type="outflow",
        category="payroll",
        amount=12000.0,
        event_date=now + timedelta(days=5),
        description="Intern stipends for packaging & order fulfillment (Upcoming)"
    ))
    db.add(CashEvent(
        business_id=business.id,
        event_type="outflow",
        category="shipping",
        amount=32000.0,
        event_date=now + timedelta(days=10),
        description="Shiprocket monthly invoice settlement (Upcoming)"
    ))
    db.add(CashEvent(
        business_id=business.id,
        event_type="outflow",
        category="raw_materials",
        amount=65000.0,
        event_date=now + timedelta(days=14),
        description="Bulk cotton tote replenishment for upcoming winter fests (Upcoming)"
    ))

    if scenario == "cash_crunch":
        # Sudden fabric import tax / GST assessment
        db.add(CashEvent(
            business_id=business.id,
            event_type="outflow",
            category="taxes",
            amount=45000.0,
            event_date=now + timedelta(days=4),
            description="Quarterly GST assessment liability settlement"
        ))

    db.commit()

    # 7. Seed Recovery Cases & Real Audit Logs
    print("🔍 Generating realistic DwiSakhi recovery cases and audit trail logs...")

    # Fetch newly created records
    overdue_invoices = db.query(Invoice).join(Customer).filter(
        Customer.business_id == business.id,
        Invoice.status == "overdue"
    ).all()

    failed_payments = db.query(Payment).join(Customer).filter(
        Customer.business_id == business.id,
        Payment.status == "failed"
    ).all()

    # Create Recovery Cases for Overdue Invoices
    for inv in overdue_invoices:
        cust = db.query(Customer).filter(Customer.id == inv.customer_id).first()
        is_high_value = inv.amount > 50000.0
        
        # Case
        case = RecoveryCase(
            customer_id=cust.id,
            reference_type="invoice",
            reference_id=inv.id,
            risk_score=35.0 if cust.reliability_score > 0.8 else 65.0,
            recovery_probability=inv.probability_of_payment,
            expected_recovery_value=round(inv.amount * inv.probability_of_payment, 2),
            current_status="human_review" if is_high_value else "in_progress",
            risk_level="high" if is_high_value else ("medium" if cust.reliability_score < 0.8 else "low"),
            root_cause="COLLEGE_FEST_PAYMENT_APPROVAL_CYCLE",
            explanation=f"Bulk merchandise delivery confirmed. College student council reimbursement cycle caused a delay of {abs((now - inv.due_date).days)} days. {cust.name} has a {int(cust.reliability_score*100)}% reliability record.",
            recommended_action="ESCALATE_TO_HUMAN" if is_high_value else "SEND_PAYMENT_LINK",
        )
        db.add(case)
        db.commit()
        db.refresh(case)

        # Action
        act = RecoveryAction(
            case_id=case.id,
            action_type="ESCALATE_TO_HUMAN" if is_high_value else "SEND_PAYMENT_LINK",
            cost=0.0,
            customer_friction="low",
            status="pending_approval" if is_high_value else "executed",
            rzp_payment_link_id=f"plink_{run_seed}_{inv.id[:8]}",
            checkout_url=f"/pay/simulate?link_id=plink_{run_seed}_{inv.id[:8]}&amount={int(inv.amount)}",
            notes=f"Exceeds ₹50,000 threshold. Paused for Neha & Khushi's manual sign-off." if is_high_value else "Dispatched 1-tap WhatsApp collection link to student fest coordinator."
        )
        db.add(act)
        db.commit()
        db.refresh(act)

        # Audit Log
        if is_high_value:
            db.add(AuditLog(
                action_id=act.id,
                event_type="APPROVAL_PAUSED",
                message=f"Paused ₹{inv.amount:,.0f} bulk merchandise invoice for {cust.name} because amount exceeds ₹50,000 safety threshold. Awaiting Neha & Khushi's review.",
                payload={"case_id": case.id, "amount": inv.amount}
            ))
        else:
            db.add(AuditLog(
                action_id=act.id,
                event_type="REMINDER_DISPATCHED",
                message=f"Dispatched polite WhatsApp payment link to {cust.name} for overdue balance of ₹{inv.amount:,.0f}.",
                payload={"case_id": case.id, "amount": inv.amount}
            ))

    # Create Recovery Cases for Failed Checkout Payments (D2C Students)
    for p in failed_payments[:4]: # Select top 4 dropped payments
        cust = db.query(Customer).filter(Customer.id == p.customer_id).first()
        prob = 0.82
        exp_val = round(p.amount * prob, 2)

        case = RecoveryCase(
            customer_id=cust.id,
            reference_type="payment",
            reference_id=p.id,
            risk_score=28.0,
            recovery_probability=prob,
            expected_recovery_value=exp_val,
            current_status="in_progress",
            risk_level="low",
            root_cause="UPI_INTENT_ABANDONED",
            explanation=f"Customer attempted checkout for D2C order but bank UPI intent was abandoned. Re-sending direct 1-tap Razorpay payment link via WhatsApp.",
            recommended_action="GENERATE_LINK",
        )
        db.add(case)
        db.commit()
        db.refresh(case)

        act = RecoveryAction(
            case_id=case.id,
            action_type="GENERATE_LINK",
            cost=0.0,
            customer_friction="low",
            status="executed",
            rzp_payment_link_id=f"plink_upi_{run_seed}_{p.id[:8]}",
            checkout_url=f"/pay/simulate?link_id=plink_upi_{run_seed}_{p.id[:8]}&amount={int(p.amount)}",
            notes="Automated WhatsApp recovery link dispatched within 15 minutes of dropped checkout."
        )
        db.add(act)
        db.commit()
        db.refresh(act)

        db.add(AuditLog(
            action_id=act.id,
            event_type="RETRY_DISPATCHED",
            message=f"Generated instant UPI retry link of ₹{p.amount:,.0f} for {cust.name}'s dropped tote/hat checkout.",
            payload={"case_id": case.id, "amount": p.amount}
        ))

    # Add a successfully recovered case (Malhar volunteer merch payment settled)
    recovered_fest_cust = fest_customers[1]
    rec_case = RecoveryCase(
        customer_id=recovered_fest_cust.id,
        reference_type="invoice",
        reference_id=f"inv_rec_{run_seed}",
        risk_score=15.0,
        recovery_probability=1.0,
        expected_recovery_value=32000.0,
        current_status="recovered",
        risk_level="low",
        root_cause="PAYMENT_METHOD_ISSUE",
        explanation="Payment link sent via WhatsApp was settled in full by Malhar festival finance team.",
        recommended_action="GENERATE_LINK"
    )
    db.add(rec_case)
    db.commit()
    db.refresh(rec_case)

    rec_act = RecoveryAction(
        case_id=rec_case.id,
        action_type="GENERATE_LINK",
        cost=0.0,
        customer_friction="low",
        status="executed",
        rzp_payment_link_id=f"plink_done_{run_seed}",
        checkout_url="",
        notes="Settled in full via Razorpay UPI."
    )
    db.add(rec_act)
    db.commit()
    db.refresh(rec_act)

    db.add(AuditLog(
        action_id=rec_act.id,
        event_type="PAYMENT_RECOVERED",
        message=f"Recovered ₹32,000 from {recovered_fest_cust.name} for 100x Volunteer Caps via direct payment link.",
        payload={"recovered_amount": 32000.0}
    ))

    db.commit()

    print("✨ DwiSakhi dataset successfully generated and linked!")
    return business

if __name__ == "__main__":
    db = SessionLocal()
    try:
        b = seed_dwisakhi_data(db, scenario="healthy")
        print(f"✅ Success! Created business: {b.name} (ID: {b.id})")
    finally:
        db.close()
