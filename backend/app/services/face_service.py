import os
import cv2
import numpy as np
from typing import List, Optional, Tuple
from sklearn.preprocessing import normalize

FACE_MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.72"))


class FaceService:
    def __init__(self):
        self._model = None
        self._detector = None
        self._initialized = False

    def _ensure_models(self):
        if self._initialized:
            return
        try:
            import insightface
            from insightface.app import FaceAnalysis
            os.makedirs("/tmp/insightface", exist_ok=True)
            app = FaceAnalysis(name="buffalo_l", root="/tmp/insightface", providers=["CPUExecutionProvider"])
            app.prepare(ctx_id=-1, det_size=(640, 640))
            self._model = app
            self._detector = app
            self._initialized = True
            print("InsightFace models loaded successfully")
        except Exception as e:
            self._model = None
            self._detector = None
            self._initialized = True
            print(f"InsightFace model load skipped: {e}")

    def is_ready(self) -> bool:
        self._ensure_models()
        return self._model is not None

    def detect_faces(self, image: np.ndarray) -> List:
        self._ensure_models()
        if self._model is None:
            return []
        faces = self._model.get(image)
        return faces

    def get_embedding(self, image: np.ndarray, face) -> Optional[np.ndarray]:
        self._ensure_models()
        if self._model is None or face is None:
            return None
        return face.normed_embedding

    def compute_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        emb1 = normalize(emb1.reshape(1, -1))
        emb2 = normalize(emb2.reshape(1, -1))
        similarity = np.dot(emb1, emb2.T)[0][0]
        return float(similarity)

    def authenticate(self, embedding: np.ndarray, stored_embeddings: List[np.ndarray]) -> Tuple[float, bool]:
        best_score = 0.0
        for stored_emb in stored_embeddings:
            score = self.compute_similarity(embedding, stored_emb)
            if score > best_score:
                best_score = score
        granted = best_score >= FACE_MATCH_THRESHOLD
        return best_score, granted

    def check_quality(self, image: np.ndarray, face) -> Tuple[bool, str]:
        if face is None:
            return False, "No face detected"

        bbox = face.bbox.astype(int)
        x1, y1, x2, y2 = bbox[:4]
        h, w = image.shape[:2]

        face_width = x2 - x1
        face_height = y2 - y1
        if face_width < 60 or face_height < 60:
            return False, "Face too small"

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 50:
            return False, "Image too blurry"

        brightness = np.mean(gray[y1:y2, x1:x2])
        if brightness < 40 or brightness > 220:
            return False, "Poor lighting"

        center_x = (x1 + x2) / 2 / w
        center_y = (y1 + y2) / 2 / h
        if abs(center_x - 0.5) > 0.3 or abs(center_y - 0.5) > 0.3:
            return False, "Face not centered"

        return True, "OK"


face_service = FaceService()
