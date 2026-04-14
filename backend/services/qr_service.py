import qrcode
import io
import base64
from datetime import datetime, timedelta
from typing import Tuple

from core.config import settings


class QRService:
    def __init__(self):
        self.expiry_minutes = settings.QR_CODE_EXPIRY_MINUTES
    
    def generate_patient_qr(self, patient_id: str, consent_token: str) -> str:
        """Generate QR code for patient"""
        
        # Create QR data
        qr_data = f"{patient_id}:{consent_token}"
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    def validate_qr_expiry(self, consent_token: str, created_at: datetime) -> bool:
        """Validate if QR code is still valid"""
        
        expiry_time = created_at + timedelta(minutes=self.expiry_minutes)
        return datetime.utcnow() <= expiry_time
    
    def decode_qr_data(self, qr_image_data: str) -> Tuple[str, str]:
        """Decode QR data from image"""
        
        # For now, return the data as-is
        # In production, this would use a QR code library to decode the image
        if ":" in qr_image_data:
            return qr_image_data.split(":", 1)
        
        return None, None


# Global QR service instance
qr_service = QRService()
