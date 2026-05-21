import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.face_service import face_service

router = APIRouter(prefix="/detect", tags=["Face Detection"])


@router.post("/")
async def detect_face(file: UploadFile = File(...)):
    if not face_service.is_ready():
        raise HTTPException(503, "Face recognition system unavailable")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, "Image too large")

    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return {"face_count": 0, "status": "error", "message": "Invalid image data"}

    faces = face_service.detect_faces(img)
    count = len(faces)

    if count == 0:
        return {"face_count": 0, "status": "no_face", "message": "No face detected"}
    elif count == 1:
        face = faces[0]
        is_good, quality_msg = face_service.check_quality(img, face)
        if not is_good:
            return {"face_count": 1, "status": "poor_quality", "message": quality_msg}
        return {"face_count": 1, "status": "face_locked", "message": "Face locked"}
    else:
        return {"face_count": count, "status": "multiple_faces", "message": "Multiple faces detected"}
