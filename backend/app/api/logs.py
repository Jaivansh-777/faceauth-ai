from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.models.user import AuthLog

router = APIRouter(prefix="/logs", tags=["Logs"])


@router.get("/")
def get_logs(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    success: bool = None,
    db: Session = Depends(get_db),
):
    query = db.query(AuthLog)
    if success is not None:
        query = query.filter(AuthLog.success == success)
    logs = query.order_by(desc(AuthLog.created_at)).offset(offset).limit(limit).all()
    return [
        {
            "id": log.id,
            "user_name": log.user_name,
            "confidence": log.confidence,
            "success": log.success,
            "camera_id": log.camera_id,
            "failure_reason": log.failure_reason,
            "timestamp": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]
