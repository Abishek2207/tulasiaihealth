"""
Face Recognition Service for TulsiHealth
Provides biometric patient verification using face_recognition (dlib-based).
"""

import logging
import numpy as np
import cv2
from typing import List, Optional, Dict, Any
import face_recognition
from io import BytesIO
from PIL import Image

from api.core.config import settings

logger = logging.getLogger(__name__)

class FaceService:
    """Service for biometric face verification"""

    def __init__(self):
        self.threshold = settings.face_recognition_threshold
        self.embedding_size = settings.face_embedding_size

    def get_embedding(self, image_bytes: bytes) -> Optional[List[float]]:
        """Generate a 128-d face embedding from image bytes"""
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                logger.error("Failed to decode image bytes")
                return None

            # Convert to RGB (face_recognition expects RGB)
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

            # Detect faces
            face_locations = face_recognition.face_locations(rgb_img)
            if not face_locations:
                logger.warning("No faces detected in image")
                return None

            # Generate embeddings
            embeddings = face_recognition.face_encodings(rgb_img, face_locations)
            if not embeddings:
                return None

            # Return the first face's embedding as a list
            return embeddings[0].tolist()

        except Exception as e:
            logger.error(f"Error generating face embedding: {e}")
            return None

    def verify_face(self, source_embedding: List[float], target_image_bytes: bytes) -> Dict[str, Any]:
        """Verify if a face in the target image matches the source embedding"""
        try:
            target_embedding = self.get_embedding(target_image_bytes)
            if target_embedding is None:
                return {"verified": False, "confidence": 0.0, "error": "No face detected in target image"}

            # Convert to numpy arrays for calculation
            source_arr = np.array(source_embedding)
            target_arr = np.array(target_embedding)

            # Calculate distance (lower is better)
            distance = face_recognition.face_distance([source_arr], target_arr)[0]
            
            # Simple confidence score (inverse of distance)
            confidence = max(0.0, 1.0 - (distance / 1.5)) 
            
            verified = distance <= (1.0 - self.threshold) # Tolerance is usually 0.6 if threshold is 0.4
            
            return {
                "verified": bool(verified),
                "confidence": round(float(confidence), 3),
                "distance": round(float(distance), 3)
            }

        except Exception as e:
            logger.error(f"Face verification failed: {e}")
            return {"verified": False, "confidence": 0.0, "error": str(e)}

    def batch_verify(self, source_embedding: List[float], target_embeddings: List[List[float]]) -> List[bool]:
        """Compare one source against multiple targets"""
        source_arr = np.array(source_embedding)
        target_arrs = [np.array(te) for te in target_embeddings]
        
        matches = face_recognition.compare_faces(target_arrs, source_arr, tolerance=1.0-self.threshold)
        return list(matches)

face_service = FaceService()
