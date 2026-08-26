# CashPulse AI

> **Protect revenue. Rescue cash. Keep MSMEs moving.**

CashPulse AI is a competition-grade, production-oriented financial operations layer for MSMEs. It detects cash at risk, diagnoses payment bottlenecks, enforces safety guidelines via a policy engine, and triggers automated recoveries using Razorpay Test Mode APIs.

Built for the **Razorpay AI Buildathon** (Track 03 — AI Revenue Recovery, incorporating Track 04 — AI Finance Controller).

---

## 🛠️ Human-First UX Philosophy

Rather than exposing complex machine learning parameters and multi-agent terminology, CashPulse translates the entire application context into plain-language business answers:
* **Home Page**: Answers 4 core questions:
  1. *How much money do I have?* (Money Available)
  2. *How much money is coming?* (Money Coming In)
  3. *How much money might I lose?* (Money at Risk)
  4. *What should I do today?* (Action priorities)
* **What-If Scenarios**: Slide the late payment percentage controls to dynamically recalculate stressed balances.
* **Explainable Recommendations**: Click "Why?" on any priority suggestion to see plain-English validations (e.g. customer's historical payment record) alongside layered advanced data logs.
* **Global Command Bar**: Press `Ctrl + K` from any page to open the business query modal.

---

## 🚀 Core Capabilities

1. **Failed Payments & Money Owed**: Instantly flags checkout errors, overdue invoices, and settlement delays.
2. **Reconciliation Matcher**: Maps transaction pipelines (Customer &rarr; Order &rarr; Gateway &rarr; Settlement Escrow) using the visual **Money Leak Detective**.
3. **Bounded Autonomy Safety Rules**: Prevents automated actions from exceeding retry limits or thresholds (>= ₹50,000) without explicit confirmation.
4. **Cash Runway Forecast**: Computes 90-day cash trends with high-probability expected and stressed envelopes.

---

## 🏃 Local Setup

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
The API server runs on `http://localhost:8000`.

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
