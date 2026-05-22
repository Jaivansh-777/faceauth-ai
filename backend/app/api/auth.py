import os
import uuid
import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User, FaceSample, AuthLog
from app.services.face_service import face_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/")
async def authenticate(
    file: UploadFile = File(...),
    camera_id: str = Form("default"),
    db: Session = Depends(get_db),
):
    if not face_service.is_ready():
        raise HTTPException(503, "Face detection system unavailable")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, "Image too large")

    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(400, "Invalid image data")

    faces = face_service.detect_faces(img)
    if len(faces) == 0:
        log = AuthLog(success=False, failure_reason="No face detected", camera_id=camera_id)
        db.add(log)
        db.commit()
        return {"status": "denied", "reason": "No face detected", "confidence": 0.0}

    if len(faces) > 1:
        log = AuthLog(success=False, failure_reason="Multiple faces detected", camera_id=camera_id)
        db.add(log)
        db.commit()
        return {"status": "denied", "reason": "Multiple faces detected", "confidence": 0.0}

    face = faces[0]
    is_good, quality_msg = face_service.check_quality(img, face)
    if not is_good:
        log = AuthLog(success=False, failure_reason=quality_msg, camera_id=camera_id)
        db.add(log)
        db.commit()
        return {"status": "denied", "reason": quality_msg, "confidence": 0.0}

    face_img = face_service.crop_face(img, face)

    users = db.query(User).filter(User.is_active == True).all()
    if not users:
        log = AuthLog(success=False, failure_reason="No enrolled users found", camera_id=camera_id)
        db.add(log)
        db.commit()
        return {"status": "denied", "reason": "No enrolled users found", "confidence": 0.0}

    best_score = 0.0
    matched_user = None

    FACE_MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.3"))

    for user in users:
        stored_samples = db.query(FaceSample).filter(FaceSample.user_id == user.id).all()
        if not stored_samples:
            continue
        for sample in stored_samples:
            try:
                if not os.path.exists(sample.image_path):
                    continue
                stored_img = cv2.imread(sample.image_path)
                if stored_img is None:
                    continue
                score = face_service.compare_faces(face_img, stored_img)
                if score > best_score:
                    best_score = score
                    matched_user = user
            except Exception:
                continue

    granted = best_score >= FACE_MATCH_THRESHOLD

    if granted and matched_user:
        from datetime import datetime
        matched_user.last_login = datetime.utcnow()
        log = AuthLog(
            user_id=matched_user.id,
            user_name=matched_user.name,
            confidence=round(best_score * 100, 2),
            success=True,
            camera_id=camera_id,
        )
        db.add(log)
        db.commit()
        return {
            "status": "granted",
            "user": matched_user.name,
            "confidence": round(best_score * 100, 2),
        }

    screenshot_name = f"fail_{uuid.uuid4().hex}.jpg"
    screenshot_path = os.path.join(UPLOAD_DIR, screenshot_name)
    cv2.imwrite(screenshot_path, img)

    log = AuthLog(
        user_name="unknown",
        confidence=round(best_score * 100, 2),
        success=False,
        camera_id=camera_id,
        failure_reason="Low similarity score",
        screenshot_path=screenshot_path,
    )
    db.add(log)
    db.commit()
    return {
        "status": "denied",
        "reason": "Face not recognized",
        "confidence": round(best_score * 100, 2),
    }
