# CashPulse AI

> **Protect revenue. Rescue cash. Keep MSMEs moving.**

CashPulse AI is a competition-grade, production-oriented financial operations layer for MSMEs. It detects revenue at risk, diagnoses payment/receivables bottlenecks, enforces safety guidelines via a policy engine, and triggers automated recoveries using Razorpay Test Mode APIs.

Built for the **Razorpay AI Buildathon** (Track 03 — AI Revenue Recovery, incorporating Track 04 — AI Finance Controller).

---

## 🚀 Core Capabilities

1. **Revenue at Risk Classification**: Instantly flags failed checkouts, overdue receivables, and anomalies.
2. **AI Investigator (LLM & ML)**: Decides *why* transactions failed (e.g. temporary method failures vs credit delinquency) and outputs structured reasoning schemas.
3. **Bounded Autonomy Policy Engine**: Prevents unauthorized interventions by enforcing maximum retries, cooling-off delays, and high-value limits requiring human approval.
4. **Cash Flow Runway Forecasting**: Runs time-series regressions showing 90-day cash trends with stochastic uncertainty envelopes.
5. **Ledger Reconciliation Matcher**: Integrates order records with bank statements and payment records to locate cash leaks.
6. **"What-If" Scenario Simulator**: Injects financial chaos modes (e.g., spike in payment failure rate or receivable crisis) to stress-test collection models.

---

## 🛠️ Tech Stack

* **Backend**: FastAPI (Python), SQLAlchemy, SQLite/PostgreSQL, scikit-learn, Pydantic settings.
* **Frontend**: Next.js 15 (React, TypeScript), Tailwind CSS, Recharts for runway analytics.
* **Integrations**: Official Razorpay SDK for order and payment link generations.

---

## 🏃 Local Setup (Quickstart)

### 1. Prerequisites
Ensure you have **Python 3.10+** and **Node.js 18+** installed.

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root folder:
```bash
cp .env.example .env
```

### 3. Start Backend API
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn backend.app.main:app --reload
```
The API server runs on `http://localhost:8000`. You can inspect interactive OpenAPI documents at `http://localhost:8000/docs`.

### 4. Start Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to access the application.

---

## 🧪 Testing

Run pytest suite to verify logic models, ML forecasting, and policy engine limits:
```bash
python -m pytest backend/tests
```

---

## 🐳 Docker Deployment

To spin up the entire multi-container environment (Next.js + FastAPI):
```bash
docker-compose up --build
```
* **Frontend**: `http://localhost:3000`
* **Backend API**: `http://localhost:8000`
