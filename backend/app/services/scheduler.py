import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import SessionLocal
from backend.app.services.agent_orchestrator import AgentOrchestrator
from backend.app.services.event_publisher import EventPublisher
from backend.app.models import Business, Invoice, RecoveryCase, AuditLog

logger = logging.getLogger(__name__)

class BackgroundScanner:
    def __init__(self):
        self.is_running = False
        self._task: Optional[asyncio.Task] = None
        self.last_run_at: Optional[datetime] = None
        self.total_runs: int = 0
        self.last_cases_found: int = 0
        self.interval_seconds = settings.SCANNER_INTERVAL_SECONDS

    def get_status(self) -> Dict[str, Any]:
        return {
            "running": self.is_running,
            "interval_seconds": self.interval_seconds,
            "interval_minutes": round(self.interval_seconds / 60, 1),
            "total_runs": self.total_runs,
            "last_run_at": self.last_run_at.isoformat() if self.last_run_at else None,
            "last_cases_found": self.last_cases_found,
            "status": "ACTIVE" if self.is_running else "IDLE"
        }

    async def trigger_scan_now(self) -> Dict[str, Any]:
        """
        Manually triggers a full scan cycle immediately.
        """
        return await asyncio.to_thread(self._run_scan_sync)

    def _run_scan_sync(self) -> Dict[str, Any]:
        """
        Synchronous scanning logic that inspects database tables for overdue receivables and dropped checkouts.
        """
        db: Session = SessionLocal()
        try:
            now = datetime.utcnow()
            # 1. Update aging invoices to overdue
            pending_invoices = db.query(Invoice).filter(
                Invoice.status == "pending",
                Invoice.due_date < now
            ).all()
            for inv in pending_invoices:
                inv.status = "overdue"
            if pending_invoices:
                db.commit()

            # 2. Run orchestrator risk detection
            detected_cases = AgentOrchestrator.scan_and_detect_risks(db)
            cases_count = len(detected_cases) if detected_cases else 0

            self.last_run_at = datetime.utcnow()
            self.total_runs += 1
            self.last_cases_found = cases_count

            # 3. Log audit event if cases found
            if cases_count > 0:
                db.add(AuditLog(
                    action_id=f"scan_{int(now.timestamp())}",
                    event_type="BACKGROUND_SCAN_COMPLETED",
                    details=f"Autonomous background scanner evaluated ledger. Flagged {cases_count} actionable items.",
                    status="SUCCESS"
                ))
                db.commit()

            EventPublisher.publish("scanner.completed", {
                "cases_count": cases_count,
                "timestamp": self.last_run_at.isoformat()
            })

            return {
                "success": True,
                "cases_count": cases_count,
                "invoices_aged": len(pending_invoices),
                "timestamp": self.last_run_at.isoformat()
            }
        except Exception as e:
            logger.error(f"Background scanner error: {str(e)}")
            return {"success": False, "error": str(e)}
        finally:
            db.close()

    async def _loop(self):
        """
        Continuous async loop executing every interval.
        """
        self.is_running = True
        logger.info(f"Background scanner started with interval {self.interval_seconds}s")
        try:
            while self.is_running:
                await self.trigger_scan_now()
                await asyncio.sleep(self.interval_seconds)
        except asyncio.CancelledError:
            self.is_running = False
            logger.info("Background scanner task cancelled")
        except Exception as e:
            self.is_running = False
            logger.error(f"Unexpected scanner loop error: {str(e)}")

    def start(self):
        if not self.is_running and settings.SCANNER_ENABLED:
            loop = asyncio.get_event_loop()
            self._task = loop.create_task(self._loop())

    def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()

background_scanner = BackgroundScanner()
