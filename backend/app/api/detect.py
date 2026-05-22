import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.face_service import face_service

router = APIRouter(prefix="/detect", tags=["Face Detection"])


@router.post("/")
async def detect_face(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image too large")

        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image")

        if not face_service.is_ready():
            raise HTTPException(status_code=503, detail="Face detection system unavailable")

        faces = face_service.detect_faces(img)
        count = len(faces)

        if count == 0:
            return {
                "detected": False,
                "faces": 0,
                "face_count": 0,
                "status": "no_face",
                "message": "No face detected",
            }

        face = faces[0]
        is_good, quality_msg = face_service.check_quality(img, face)
        if not is_good:
            return {
                "detected": True,
                "faces": 1,
                "face_count": 1,
                "status": "poor_quality",
                "message": quality_msg,
            }

        return {
            "detected": True,
            "faces": 1,
            "face_count": 1,
            "status": "face_locked",
            "message": "Face locked",
        }

    except HTTPException:
        raise
    except Exception as e:
        import sys
        print(f"Detect endpoint error: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Face detection failed")
