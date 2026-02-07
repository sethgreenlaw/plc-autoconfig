from fastapi import APIRouter, HTTPException
from ..models.schemas import (
    Configuration, RecordType, UpdateRecordTypeRequest,
    UpdateDepartmentRequest, UpdateRoleRequest
)
from ..storage.in_memory import store

router = APIRouter(prefix="/api/projects/{project_id}/configurations", tags=["configurations"])


@router.get("")
async def get_configurations(project_id: str):
    """Get the configuration for a project"""
    project = store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not project.configuration:
        raise HTTPException(status_code=404, detail="No configuration generated yet")
    return project.configuration


@router.put("/record-types/{rt_id}")
async def update_record_type(project_id: str, rt_id: str, request: UpdateRecordTypeRequest):
    """Update a record type in the configuration"""
    project = store.get_project(project_id)
    if not project or not project.configuration:
        raise HTTPException(status_code=404, detail="Project or configuration not found")

    updates = request.model_dump(exclude_none=True)
    updated = store.update_record_type(project_id, rt_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Record type not found")
    return updated


@router.post("/record-types")
async def add_record_type(project_id: str, record_type: RecordType):
    """Add a new record type to the configuration"""
    project = store.get_project(project_id)
    if not project or not project.configuration:
        raise HTTPException(status_code=404, detail="Project or configuration not found")

    result = store.add_record_type(project_id, record_type)
    return result


@router.delete("/record-types/{rt_id}")
async def delete_record_type(project_id: str, rt_id: str):
    """Delete a record type from the configuration"""
    if not store.delete_record_type(project_id, rt_id):
        raise HTTPException(status_code=404, detail="Record type not found")
    return {"success": True}


@router.put("/departments/{dept_id}")
async def update_department(project_id: str, dept_id: str, request: UpdateDepartmentRequest):
    """Update a department in the configuration"""
    project = store.get_project(project_id)
    if not project or not project.configuration:
        raise HTTPException(status_code=404, detail="Project or configuration not found")

    updates = request.model_dump(exclude_none=True)
    updated = store.update_department(project_id, dept_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Department not found")
    return updated


@router.put("/roles/{role_id}")
async def update_role(project_id: str, role_id: str, request: UpdateRoleRequest):
    """Update a user role in the configuration"""
    project = store.get_project(project_id)
    if not project or not project.configuration:
        raise HTTPException(status_code=404, detail="Project or configuration not found")

    updates = request.model_dump(exclude_none=True)
    updated = store.update_role(project_id, role_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Role not found")
    return updated


@router.post("/deploy")
async def deploy_configuration(project_id: str):
    """Placeholder for PLC API deployment"""
    project = store.get_project(project_id)
    if not project or not project.configuration:
        raise HTTPException(status_code=404, detail="Project or configuration not found")

    return {
        "success": False,
        "message": "PLC API integration is not yet configured. This is a placeholder for future deployment functionality.",
        "record_types_count": len(project.configuration.record_types),
        "departments_count": len(project.configuration.departments),
        "roles_count": len(project.configuration.user_roles),
    }
