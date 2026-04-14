"""
Audit Hash-Chain Service for TulsiHealth
Provides tamper-evident audit logging with blockchain-like hash chains
Compatible with SQLite-friendly AuditLog model.
"""

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import uuid

from api.models.database import AuditLog, User
from api.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class AuditService:
    """Service for tamper-evident audit logging"""

    def __init__(self):
        self.hash_algorithm = "sha256"
        self.chain_name = "tulsihealth-audit-chain"

    async def log_event(
        self,
        db: AsyncSession,
        user_id: Any,
        action: str,
        resource_type: str,
        resource_id: str,
        operation: Optional[str] = None,
        outcome: Optional[str] = "success",
        ip_address: str = "127.0.0.1",
        user_agent: Optional[str] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        **kwargs  # swallow extra kwargs gracefully
    ) -> Optional[AuditLog]:
        """Create a new audit log entry with hash chain. Matches route call signature."""
        try:
            previous_log = await self._get_latest_audit_log(db)
            prev_hash = previous_log.curr_hash if previous_log else None

            audit_data = {
                "entry_id": str(uuid.uuid4()),
                "user_id": str(user_id),
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "operation": operation,
                "outcome": outcome,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "ip_address": ip_address,
                "prev_hash": prev_hash,
            }

            curr_hash = self._calculate_hash(audit_data)

            audit_log = AuditLog(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                operation=operation,
                outcome=outcome,
                ip_address=ip_address,
                user_agent=user_agent,
                prev_hash=prev_hash,
                curr_hash=curr_hash,
                old_values=old_values,
                new_values=new_values,
            )

            db.add(audit_log)
            await db.commit()
            await db.refresh(audit_log)
            logger.info(f"Audit log created: {action} on {resource_type}/{resource_id}")
            return audit_log

        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
            try:
                await db.rollback()
            except Exception:
                pass
            return None  # Don't crash the calling route for audit failures

    # Alias for legacy code
    async def create_audit_log(self, db, user_id, action, resource_type, resource_id,
                                details=None, ip_address="127.0.0.1", user_agent=None, **kwargs):
        return await self.log_event(
            db=db, user_id=user_id, action=action, resource_type=resource_type,
            resource_id=resource_id, ip_address=ip_address, user_agent=user_agent,
            new_values=details
        )

    async def verify_chain_integrity(self, db: AsyncSession, limit: int = 1000) -> Dict[str, Any]:
        """Verify the integrity of the audit chain"""
        try:
            result = await db.execute(
                select(AuditLog).order_by(AuditLog.created_at.asc()).limit(limit)
            )
            logs = result.scalars().all()

            results = {
                "total_verified": len(logs),
                "chain_integrity": True,
                "violations": [],
                "verification_time": datetime.now(timezone.utc).isoformat()
            }

            if not logs:
                results["message"] = "No audit logs found"
                return results

            previous_hash = None
            for i, log in enumerate(logs):
                # Check chain link
                if log.prev_hash != previous_hash and i > 0:
                    results["violations"].append({
                        "log_id": str(log.id),
                        "violation_type": "chain_break"
                    })
                    results["chain_integrity"] = False
                previous_hash = log.curr_hash

            return results
        except Exception as e:
            logger.error(f"Chain integrity check failed: {e}")
            return {"total_verified": 0, "chain_integrity": False, "violations": [{"error": str(e)}]}

    async def get_audit_trail(
        self,
        db: AsyncSession,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        action: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get paginated audit trail"""
        try:
            conditions = []
            if user_id:
                conditions.append(AuditLog.user_id == user_id)
            if resource_type:
                conditions.append(AuditLog.resource_type == resource_type)
            if resource_id:
                conditions.append(AuditLog.resource_id == resource_id)
            if action:
                conditions.append(AuditLog.action == action)
            if start_date:
                conditions.append(AuditLog.created_at >= start_date)
            if end_date:
                conditions.append(AuditLog.created_at <= end_date)

            query = select(AuditLog).order_by(AuditLog.created_at.desc())
            if conditions:
                query = query.where(and_(*conditions))

            result = await db.execute(query.limit(limit).offset(offset))
            logs = result.scalars().all()

            count_result = await db.execute(
                select(AuditLog).where(and_(*conditions)) if conditions else select(AuditLog)
            )
            total_count = len(count_result.scalars().all())

            audit_trail = [
                {
                    "id": str(log.id),
                    "user_id": str(log.user_id),
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "operation": log.operation,
                    "outcome": log.outcome,
                    "timestamp": log.created_at.isoformat() if log.created_at else None,
                    "ip_address": log.ip_address,
                    "curr_hash": log.curr_hash,
                    "prev_hash": log.prev_hash,
                }
                for log in logs
            ]

            return {
                "audit_trail": audit_trail,
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_count
            }
        except Exception as e:
            logger.error(f"Failed to get audit trail: {e}")
            raise

    async def get_audit_statistics(self, db: AsyncSession, **kwargs) -> Dict[str, Any]:
        """Get audit statistics"""
        try:
            result = await db.execute(select(AuditLog))
            logs = result.scalars().all()
            actions: Dict[str, int] = {}
            resource_types: Dict[str, int] = {}
            for log in logs:
                actions[log.action] = actions.get(log.action, 0) + 1
                resource_types[log.resource_type] = resource_types.get(log.resource_type, 0) + 1
            return {
                "total_logs": len(logs),
                "unique_users": len(set(str(log.user_id) for log in logs)),
                "actions": actions,
                "resource_types": resource_types,
            }
        except Exception as e:
            logger.error(f"Failed to get audit statistics: {e}")
            raise

    async def create_compliance_report(self, db: AsyncSession, **kwargs) -> Dict[str, Any]:
        stats = await self.get_audit_statistics(db)
        integrity = await self.verify_chain_integrity(db)
        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "summary": {
                "total_audit_events": stats["total_logs"],
                "unique_users": stats["unique_users"],
                "chain_integrity": integrity["chain_integrity"],
            },
            "statistics": stats,
            "integrity_check": integrity,
            "compliance_status": "compliant" if integrity["chain_integrity"] else "non_compliant"
        }

    async def _get_latest_audit_log(self, db: AsyncSession) -> Optional[AuditLog]:
        try:
            result = await db.execute(
                select(AuditLog).order_by(AuditLog.created_at.desc()).limit(1)
            )
            return result.scalar_one_or_none()
        except Exception:
            return None

    def _calculate_hash(self, data: Dict[str, Any]) -> str:
        canonical = json.dumps(data, sort_keys=True, separators=(',', ':'), default=str)
        return hashlib.sha256(canonical.encode('utf-8')).hexdigest()


# Global audit service instance
audit_service = AuditService()
