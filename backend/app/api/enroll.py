import os
import uuid
import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User, FaceSample
from app.services.face_service import face_service

router = APIRouter(prefix="/enroll", tags=["Enrollment"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/")
async def enroll_user(
    name: str = Form(...),
    email: str = Form(None),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    if not name or not name.strip():
        raise HTTPException(400, "Name is required")
    if len(name.strip()) > 255:
        raise HTTPException(400, "Name too long (max 255 characters)")

    if email and email.strip():
        if "@" not in email or "." not in email:
            raise HTTPException(400, "Invalid email format")
        if len(email) > 255:
            raise HTTPException(400, "Email too long (max 255 characters)")

    clean_name = name.strip()
    clean_email = email.strip() if email else None

    if not face_service.is_ready():
        raise HTTPException(503, "Face detection system unavailable")

    if len(files) < 5:
        raise HTTPException(400, "Need at least 5 face samples")

    existing = db.query(User).filter(User.name == clean_name).first()
    if existing:
        raise HTTPException(409, "A user with this name already exists")

    if clean_email:
        existing_email = db.query(User).filter(User.email == clean_email).first()
        if existing_email:
            raise HTTPException(409, "A user with this email already exists")

    user = User(name=clean_name, email=clean_email)
    db.add(user)
    db.flush()

    user_dir = os.path.join(UPLOAD_DIR, str(user.id))
    os.makedirs(user_dir, exist_ok=True)

    quality_ok = 0
    errors = []

    for idx, file in enumerate(files):
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            errors.append(f"Sample {idx + 1}: Image too large")
            continue
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            errors.append(f"Sample {idx + 1}: Invalid image data")
            continue

        faces = face_service.detect_faces(img)
        if len(faces) == 0:
            errors.append(f"Sample {idx + 1}: No face detected")
            continue
        if len(faces) > 1:
            errors.append(f"Sample {idx + 1}: Multiple faces detected")
            continue

        face = faces[0]
        is_good, quality_msg = face_service.check_quality(img, face)
        if not is_good:
            errors.append(f"Sample {idx + 1}: {quality_msg}")
            continue

        face_img = face_service.crop_face(img, face)
        filename = f"{uuid.uuid4().hex}.jpg"
        filepath = os.path.join(user_dir, filename)
        cv2.imwrite(filepath, face_img)

        fs = FaceSample(user_id=user.id, image_path=filepath, quality_score=1.0)
        db.add(fs)
        quality_ok += 1

    if quality_ok < 3:
        db.rollback()
        import shutil
        shutil.rmtree(user_dir, ignore_errors=True)
        detail = f"Only {quality_ok} quality samples obtained. Need at least 3."
        if errors:
            detail += " Details: " + "; ".join(errors[:3])
        raise HTTPException(400, detail)

    db.commit()
    return {"status": "ok", "user_id": user.id, "name": clean_name, "samples_enrolled": quality_ok}
