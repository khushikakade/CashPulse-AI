from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.routes import api, webhooks, gateways

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(api.router, prefix=settings.API_V1_STR)
app.include_router(webhooks.router, prefix=f"{settings.API_V1_STR}/webhooks")
app.include_router(gateways.router, prefix=f"{settings.API_V1_STR}/gateways")

@app.on_event("startup")
async def startup_event():
    from backend.app.services.scheduler import background_scanner
    background_scanner.start()

@app.on_event("shutdown")
async def shutdown_event():
    from backend.app.services.scheduler import background_scanner
    background_scanner.stop()

@app.get("/health")
def health_check():
    """
    Observability endpoint for health probes.
    """
    return {"status": "healthy", "service": settings.PROJECT_NAME}

@app.get("/ready")
def readiness_probe():
    """
    Readiness probe to verify database connectivity.
    """
    try:
        # Simple test query
        from sqlalchemy import text
        from backend.app.database import SessionLocal
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ready"}
    except Exception as e:
        return {"status": "unready", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
