"""
Audit Routes for TulsiHealth
Handles tamper-evident audit logging and compliance reporting
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from api.models.database import User, UserRole
from api.services.audit_service import audit_service
from api.database import get_db
from api.deps import get_current_active_user, require_role, get_client_ip

router = APIRouter()


class AuditLogRequest(BaseModel):
    """Request model for creating audit log"""
    action: str
    resource_type: str
    resource_id: str
    details: Optional[Dict[str, Any]] = None


class AuditSearchRequest(BaseModel):
    """Request model for audit search"""
    search_term: str
    search_fields: Optional[List[str]] = None
    limit: int = 100
    offset: int = 0


class ComplianceReportRequest(BaseModel):
    """Request model for compliance report"""
    report_type: str = "full"
    start_date: Optional[str] = None
    end_date: Optional[str] = None


@router.post("/log", response_model=Dict[str, Any])
async def create_audit_log(
    request: AuditLogRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    http_request: Request = None
):
    """Create a new audit log entry"""
    try:
        # Get request metadata
        ip_address = get_client_ip(http_request) if http_request else None
        user_agent = http_request.headers.get("User-Agent") if http_request else None
        
        # Create audit log
        audit_log = await audit_service.create_audit_log(
            db=db,
            user_id=str(current_user.id),
            action=request.action,
            resource_type=request.resource_type,
            resource_id=request.resource_id,
            details=request.details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return {
            "success": True,
            "message": "Audit log created successfully",
            "audit_log": {
                "id": str(audit_log.id),
                "timestamp": audit_log.created_at.isoformat(),
                "action": audit_log.action,
                "resource_type": audit_log.resource_type,
                "resource_id": audit_log.resource_id,
                "current_hash": audit_log.curr_hash
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create audit log: {str(e)}"
        )


@router.get("/trail", response_model=Dict[str, Any])
async def get_audit_trail(
    user_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    action: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get audit trail with filtering"""
    try:
        # Check permissions
        if current_user.role not in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.ADMIN]:
            # Users can only see their own audit logs
            if user_id and user_id != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
            user_id = str(current_user.id)
        
        # Parse dates
        start_dt = None
        end_dt = None
        
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                if start_dt.tzinfo is None:
                    start_dt = start_dt.replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid start_date format. Use ISO format."
                )
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                if end_dt.tzinfo is None:
                    end_dt = end_dt.replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid end_date format. Use ISO format."
                )
        
        # Get audit trail
        trail = await audit_service.get_audit_trail(
            db=db,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            action=action,
            start_date=start_dt,
            end_date=end_dt,
            limit=limit,
            offset=offset
        )
        
        return trail
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get audit trail: {str(e)}"
        )


@router.post("/search", response_model=Dict[str, Any])
async def search_audit_logs(
    request: AuditSearchRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Search audit logs by text content"""
    try:
        # Check permissions
        if current_user.role not in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        # Validate search fields
        valid_fields = ["action", "resource_type", "resource_id", "details", "ip_address", "user_agent"]
        if request.search_fields:
            invalid_fields = [f for f in request.search_fields if f not in valid_fields]
            if invalid_fields:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid search fields: {', '.join(invalid_fields)}"
                )
        
        # Search logs
        results = await audit_service.search_audit_logs(
            db=db,
            search_term=request.search_term,
            search_fields=request.search_fields,
            limit=request.limit,
            offset=request.offset
        )
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search audit logs: {str(e)}"
        )


@router.get("/statistics", response_model=Dict[str, Any])
async def get_audit_statistics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get audit statistics"""
    try:
        # Check permissions
        if current_user.role not in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        # Parse dates
        start_dt = None
        end_dt = None
        
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                if start_dt.tzinfo is None:
                    start_dt = start_dt.replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid start_date format. Use ISO format."
                )
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                if end_dt.tzinfo is None:
                    end_dt = end_dt.replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid end_date format. Use ISO format."
                )
        
        # Get statistics
        stats = await audit_service.get_audit_statistics(
            db=db,
            start_date=start_dt,
            end_date=end_dt
        )
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get audit statistics: {str(e)}"
        )


@router.post("/compliance-report", response_model=Dict[str, Any])
async def generate_compliance_report(
    request: ComplianceReportRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Generate compliance report"""
    try:
        # Parse dates
        start_dt = None
        end_dt = None
        
        if request.start_date:
            try:
                start_dt = datetime.fromisoformat(request.start_date.replace('Z', '+00:00'))
                if start_dt.tzinfo is None:
                    start_dt = start_dt.replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid start_date format. Use ISO format."
                )
        
        if request.end_date:
            try:
                end_dt = datetime.fromisoformat(request.end_date.replace('Z', '+00:00'))
                if end_dt.tzinfo is None:
                    end_dt = end_dt.replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid end_date format. Use ISO format."
                )
        
        # Generate report
        report = await audit_service.create_compliance_report(
            db=db,
            report_type=request.report_type,
            start_date=start_dt,
            end_date=end_dt
        )
        
        return report
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate compliance report: {str(e)}"
        )


@router.get("/verify-integrity", response_model=Dict[str, Any])
async def verify_chain_integrity(
    limit: int = 1000,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Verify audit chain integrity"""
    try:
        # Validate limit
        if limit < 1 or limit > 10000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be between 1 and 10000"
            )
        
        # Verify integrity
        verification = await audit_service.verify_chain_integrity(
            db=db,
            limit=limit
        )
        
        return verification
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify chain integrity: {str(e)}"
        )


@router.get("/export", response_model=Dict[str, Any])
async def export_audit_chain(
    format: str = "json",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Export audit chain for backup or analysis"""
    try:
        # Validate format
        if format not in ["json", "csv"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Format must be 'json' or 'csv'"
            )
        
        # Parse dates
        start_dt = None
        end_dt = None
        
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                if start_dt.tzinfo is None:
                    start_dt = start_dt.replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid start_date format. Use ISO format."
                )
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                if end_dt.tzinfo is None:
                    end_dt = end_dt.replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid end_date format. Use ISO format."
                )
        
        # Export data
        export_data = await audit_service.export_audit_chain(
            db=db,
            format=format,
            start_date=start_dt,
            end_date=end_dt
        )
        
        return export_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export audit chain: {str(e)}"
        )


@router.get("/health", response_model=Dict[str, Any])
async def audit_health_check(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Health check for audit service"""
    try:
        # Get basic statistics
        result = await db.execute(
            select(AuditLog).limit(1)
        )
        has_logs = len(result.scalars().all()) > 0
        
        # Verify chain integrity for recent logs
        integrity = await audit_service.verify_chain_integrity(db, limit=100)
        
        return {
            "status": "healthy",
            "has_audit_logs": has_logs,
            "chain_integrity": integrity["chain_integrity"],
            "recent_violations": len(integrity["violations"]),
            "service": "audit-service",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "service": "audit-service",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


@router.get("/my-activity", response_model=Dict[str, Any])
async def get_user_activity(
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's audit activity"""
    try:
        # Validate limit
        if limit < 1 or limit > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be between 1 and 100"
            )
        
        # Get user's audit trail
        trail = await audit_service.get_audit_trail(
            db=db,
            user_id=str(current_user.id),
            limit=limit
        )
        
        # Add user context
        user_context = {
            "user_id": str(current_user.id),
            "user_name": current_user.name,
            "user_role": current_user.role.value,
            "total_activities": trail["total_count"]
        }
        
        return {
            **trail,
            "user_context": user_context
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user activity: {str(e)}"
        )


@router.delete("/cleanup", response_model=Dict[str, Any])
async def cleanup_old_audit_logs(
    days: int = 365,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Clean up old audit logs (admin only)"""
    try:
        # Validate days
        if days < 30:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete logs newer than 30 days"
            )
        
        # Calculate cutoff date
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Count logs to be deleted
        from sqlalchemy import delete
        count_query = select(AuditLog).where(AuditLog.timestamp < cutoff_date)
        count_result = await db.execute(count_query)
        logs_to_delete = len(count_result.scalars().all())
        
        if logs_to_delete == 0:
            return {
                "message": "No old audit logs to delete",
                "deleted_count": 0,
                "cutoff_date": cutoff_date.isoformat()
            }
        
        # Delete old logs
        delete_query = delete(AuditLog).where(AuditLog.timestamp < cutoff_date)
        await db.execute(delete_query)
        await db.commit()
        
        return {
            "message": f"Deleted {logs_to_delete} old audit logs",
            "deleted_count": logs_to_delete,
            "cutoff_date": cutoff_date.isoformat(),
            "warning": "This action cannot be undone"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup audit logs: {str(e)}"
        )
