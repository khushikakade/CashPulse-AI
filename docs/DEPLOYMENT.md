# CashPulse AI: Production Cloud Deployment Guide

This guide details how to deploy CashPulse AI to production platforms including **Render**, **Railway**, **Fly.io**, or any standard **Docker / Linux VPS** (AWS Lightsail, DigitalOcean, Hetzner).

---

## 1. Environment Variables Reference

### Backend (`/backend/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Runtime environment | `production` |
| `PROJECT_NAME` | Service title | `"CashPulse AI"` |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./cashpulse.db` or PostgreSQL |
| `RAZORPAY_KEY_ID` | Official Razorpay Key ID | `rzp_live_...` or `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Official Razorpay Secret | Secret string |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification secret | Secret string |
| `CASHFREE_APP_ID` | Cashfree Merchant App ID | App ID |
| `CASHFREE_SECRET_KEY` | Cashfree Merchant Secret | Secret string |
| `CASHFREE_ENV` | Cashfree mode | `PRODUCTION` or `SANDBOX` |
| `RESEND_API_KEY` | Resend transactional email key | `re_...` (optional) |
| `SCANNER_ENABLED` | Background overdue scanner | `true` |
| `SCANNER_INTERVAL_SECONDS`| Periodic scan frequency | `1800` (30 mins) |

### Frontend (`/frontend/.env.production`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Accessible URL of FastAPI backend | `https://api.yourdomain.com/api/v1` |

---

## 2. Option A: 1-Click Deploy via Render Blueprint

CashPulse AI includes a root [`render.yaml`](../render.yaml) specification:

1. Push your repository to GitHub.
2. Sign in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** &rarr; **Blueprint**.
4. Connect your `CashPulse-AI` repository.
5. Render will automatically provision both services:
   - `cashpulse-backend` (FastAPI Python service)
   - `cashpulse-frontend` (Next.js Node.js service)
6. Add your live Razorpay and Cashfree keys under the backend environment settings.

---

## 3. Option B: Deploy via Docker Compose

Run both services with production containers on any VPS:

```bash
# 1. Clone repository on your server
git clone https://github.com/khushikakade/CashPulse-AI.git
cd CashPulse-AI

# 2. Configure production environment
cp .env.example .env
nano .env

# 3. Build and launch daemonized services
docker compose up -d --build

# 4. Check status and health probes
docker compose ps
curl http://localhost:8000/health
```

---

## 4. Option C: Deploy via Railway

1. Connect your GitHub repository on [Railway.app](https://railway.app).
2. Create two services:
   - **Backend**: Root directory `/backend`, build command `pip install -r requirements.txt`, start command `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
   - **Frontend**: Root directory `/frontend`, build command `npm ci && npm run build`, start command `npm run start`.
3. Link the backend domain variable `NEXT_PUBLIC_API_URL` to the frontend.

---

## 5. Webhook Registration in Merchant Dashboards

Once your backend is live:

- **Razorpay Dashboard**:
  - URL: `https://<YOUR-BACKEND-DOMAIN>/api/v1/webhooks/razorpay`
  - Active Events: `payment.captured`, `payment.failed`, `payment_link.paid`
- **Cashfree Dashboard**:
  - URL: `https://<YOUR-BACKEND-DOMAIN>/api/v1/webhooks/cashfree`
  - Active Events: `PAYMENT_SUCCESS_WEBHOOK`, `PAYMENT_FAILED_WEBHOOK`, `USER_DROPPED_WEBHOOK`
