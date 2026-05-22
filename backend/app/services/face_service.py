import os
import cv2
import numpy as np
from typing import List, Tuple

FACE_MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.3"))


class FaceService:
    def __init__(self):
        self._cascade = None
        self._initialized = False

    def _ensure_models(self):
        if self._initialized:
            return
        try:
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            if not os.path.exists(cascade_path):
                cascade_path = "/usr/share/opencv4/haarcascades/haarcascade_frontalface_default.xml"
            if not os.path.exists(cascade_path):
                cascade_path = os.path.join(os.path.dirname(cv2.__file__), "data", "haarcascade_frontalface_default.xml")
            self._cascade = cv2.CascadeClassifier(cascade_path)
            if self._cascade.empty():
                raise RuntimeError("Failed to load Haar Cascade")
            self._initialized = True
            print("Haar Cascade loaded successfully")
        except Exception as e:
            self._cascade = None
            self._initialized = True
            print(f"Haar Cascade load skipped: {e}")

    def is_ready(self) -> bool:
        self._ensure_models()
        return self._cascade is not None

    def detect_faces(self, image: np.ndarray) -> List:
        self._ensure_models()
        if self._cascade is None:
            return []
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self._cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
        )
        result = []
        for x, y, w, h in faces:
            class Obj:
                pass
            obj = Obj()
            obj.x = x
            obj.y = y
            obj.w = w
            obj.h = h
            obj.bbox = np.array([x, y, x + w, y + h, 0.99])
            result.append(obj)
        return result

    def check_quality(self, image: np.ndarray, face) -> Tuple[bool, str]:
        if face is None:
            return False, "No face detected"
        x, y, w, h = face.x, face.y, face.w, face.h
        h_img, w_img = image.shape[:2]
        if w < 60 or h < 60:
            return False, "Face too small"
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 50:
            return False, "Image too blurry"
        brightness = np.mean(gray[y:y + h, x:x + w])
        if brightness < 40 or brightness > 220:
            return False, "Poor lighting"
        center_x = (x + w / 2) / w_img
        center_y = (y + h / 2) / h_img
        if abs(center_x - 0.5) > 0.3 or abs(center_y - 0.5) > 0.3:
            return False, "Face not centered"
        return True, "OK"

    def crop_face(self, image: np.ndarray, face, margin: float = 0.2) -> np.ndarray:
        x, y, w, h = face.x, face.y, face.w, face.h
        h_img, w_img = image.shape[:2]
        mx = int(w * margin)
        my = int(h * margin)
        x1 = max(0, x - mx)
        y1 = max(0, y - my)
        x2 = min(w_img, x + w + mx)
        y2 = min(h_img, y + h + my)
        return image[y1:y2, x1:x2]

    def compare_faces(self, face1: np.ndarray, face2: np.ndarray) -> float:
        gray1 = cv2.cvtColor(face1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(face2, cv2.COLOR_BGR2GRAY)
        size = (100, 100)
        gray1 = cv2.resize(gray1, size)
        gray2 = cv2.resize(gray2, size)
        hist1 = cv2.calcHist([gray1], [0], None, [64], [0, 256])
        hist2 = cv2.calcHist([gray2], [0], None, [64], [0, 256])
        cv2.normalize(hist1, hist1, 0, 1, cv2.NORM_MINMAX)
        cv2.normalize(hist2, hist2, 0, 1, cv2.NORM_MINMAX)
        similarity = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
        return max(0.0, similarity)

    def authenticate(self, face_img: np.ndarray, stored_faces: List[np.ndarray]) -> Tuple[float, bool]:
        best_score = 0.0
        for stored_face in stored_faces:
            score = self.compare_faces(face_img, stored_face)
            if score > best_score:
                best_score = score
        granted = best_score >= FACE_MATCH_THRESHOLD
        return best_score, granted


face_service = FaceService()
