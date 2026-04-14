import json
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import Request

from api.models.audit import AuditEvent
from api.models.user import User


class AuditService:
    def __init__(self):
        pass
    
    def log_event(
        self,
        db: Session,
        user_id: Optional[int],
        action: str,  # C, R, U, D, E
        resource_type: str,
        resource_id: str,
        operation: str,
        outcome: str,  # 0, 4, 8, 12
        request_data: Optional[Dict[Any, Any]] = None,
        response_data: Optional[Dict[Any, Any]] = None,
        patient_id: Optional[int] = None,
        purpose_of_use: Optional[str] = None,
        consent_reference: Optional[str] = None,
        source_ip: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log an audit event"""
        
        # Get previous audit event for hash chain
        previous_event = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
        previous_hash = previous_event.current_hash if previous_event else None
        
        # Create audit event
        audit_event = AuditEvent(
            action=action,
            outcome=outcome,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            operation=operation,
            request_data=request_data,
            response_data=self._sanitize_response_data(response_data),
            purpose_of_use=purpose_of_use,
            consent_reference=consent_reference,
            patient_id=patient_id,
            source_ip=source_ip,
            user_agent=user_agent,
            previous_hash=previous_hash
        )
        
        # Calculate and set current hash
        audit_event.current_hash = audit_event.calculate_hash()
        
        # Save to database
        db.add(audit_event)
        db.commit()
        
        return audit_event
    
    def _sanitize_response_data(self, response_data: Optional[Dict[Any, Any]]) -> Optional[Dict[Any, Any]]:
        """Sanitize response data to remove sensitive information"""
        if not response_data:
            return None
        
        # Create a copy to avoid modifying the original
        sanitized = response_data.copy()
        
        # Remove sensitive fields
        sensitive_fields = [
            "hashed_password", "face_embedding", "consent_token", 
            "qr_code_data", "access_token", "refresh_token"
        ]
        
        for field in sensitive_fields:
            if field in sanitized:
                sanitized[field] = "[REDACTED]"
        
        # Handle nested objects
        if isinstance(sanitized, dict):
            self._sanitize_nested_dict(sanitized, sensitive_fields)
        
        return sanitized
    
    def _sanitize_nested_dict(self, data: Dict, sensitive_fields: list):
        """Recursively sanitize nested dictionaries"""
        for key, value in data.items():
            if isinstance(value, dict):
                self._sanitize_nested_dict(value, sensitive_fields)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        self._sanitize_nested_dict(item, sensitive_fields)
            
            # Check if this is a sensitive field
            if key in sensitive_fields:
                data[key] = "[REDACTED]"
    
    def validate_hash_chain(self, db: Session) -> bool:
        """Validate the entire audit hash chain"""
        events = db.query(AuditEvent).order_by(AuditEvent.id.asc()).all()
        
        previous_hash = None
        for event in events:
            if not event.validate_hash_chain(previous_hash):
                # Mark chain as broken
                event.hash_chain_valid = "broken"
                db.commit()
                return False
            
            event.hash_chain_valid = "valid"
            previous_hash = event.current_hash
        
        db.commit()
        return True
    
    def get_audit_trail(
        self,
        db: Session,
        user_id: Optional[int] = None,
        patient_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        action: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> list:
        """Get audit trail with filters"""
        
        query = db.query(AuditEvent)
        
        # Apply filters
        if user_id:
            query = query.filter(AuditEvent.user_id == user_id)
        
        if patient_id:
            query = query.filter(AuditEvent.patient_id == patient_id)
        
        if resource_type:
            query = query.filter(AuditEvent.resource_type == resource_type)
        
        if action:
            query = query.filter(AuditEvent.action == action)
        
        if start_date:
            query = query.filter(AuditEvent.recorded >= start_date)
        
        if end_date:
            query = query.filter(AuditEvent.recorded <= end_date)
        
        # Order and limit
        events = query.order_by(AuditEvent.recorded.desc()).limit(limit).all()
        
        return events
    
    def create_compliance_report(
        self,
        db: Session,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Generate compliance report for a date range"""
        
        # Get all events in date range
        events = db.query(AuditEvent).filter(
            AuditEvent.recorded >= start_date,
            AuditEvent.recorded <= end_date
        ).all()
        
        # Calculate statistics
        total_events = len(events)
        successful_events = len([e for e in events if e.outcome == "0"])
        failed_events = total_events - successful_events
        
        # Events by action type
        action_counts = {}
        for event in events:
            action_counts[event.action] = action_counts.get(event.action, 0) + 1
        
        # Events by resource type
        resource_counts = {}
        for event in events:
            resource_counts[event.resource_type] = resource_counts.get(event.resource_type, 0) + 1
        
        # Hash chain validation
        hash_chain_valid = self.validate_hash_chain(db)
        
        # Top users
        user_counts = {}
        for event in events:
            if event.user_id:
                user_counts[event.user_id] = user_counts.get(event.user_id, 0) + 1
        
        # Get user details for top users
        top_users = []
        if user_counts:
            top_user_ids = sorted(user_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            user_details = db.query(User).filter(User.id.in_([uid for uid, _ in top_user_ids])).all()
            
            for user in user_details:
                top_users.append({
                    "user_id": user.id,
                    "username": user.username,
                    "full_name": user.full_name,
                    "role": user.role,
                    "event_count": user_counts[user.id]
                })
        
        return {
            "report_period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "summary": {
                "total_events": total_events,
                "successful_events": successful_events,
                "failed_events": failed_events,
                "success_rate": (successful_events / total_events * 100) if total_events > 0 else 0
            },
            "action_breakdown": action_counts,
            "resource_breakdown": resource_counts,
            "hash_chain_valid": hash_chain_valid,
            "top_users": top_users,
            "compliance_status": "COMPLIANT" if hash_chain_valid else "NON_COMPLIANT"
        }


# Global audit service instance
audit_service = AuditService()
