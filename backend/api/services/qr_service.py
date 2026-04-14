import qrcode
import io
import base64
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional

class QRService:
    """Service for generating and validating QR codes for patients"""
    
    def generate_token(self) -> str:
        """Generate a random unique token for QR identification"""
        return str(uuid.uuid4())
    
    def generate_qr_base64(self, tulsi_id: str, qr_token: str) -> str:
        """Generate a Base64 encoded PNG of a QR code containing Tulsi ID and token"""
        try:
            # Data format: TULSI:tulsi_id:qr_token
            data = f"TULSI:{tulsi_id}:{qr_token}"
            
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(data)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            
            qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
            return f"data:image/png;base64,{qr_base64}"
            
        except Exception as e:
            print(f"Error generating QR code: {e}")
            return ""

    def validate_qr_data(self, qr_data: str) -> Optional[Dict[str, str]]:
        """Validate and parse QR data string"""
        if not qr_data.startswith("TULSI:"):
            return None
            
        parts = qr_data.split(":")
        if len(parts) != 3:
            return None
            
        return {
            "tulsi_id": parts[1],
            "qr_token": parts[2]
        }

# Global instance
qr_service = QRService()
