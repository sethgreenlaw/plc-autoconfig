from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime
import uuid


class Condition(BaseModel):
    """Conditional logic rule: if field X has value Y, then do Z"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    source_field: str = ""  # field name that triggers the condition
    operator: str = "equals"  # equals, not_equals, contains, greater_than, less_than, is_empty, is_not_empty
    value: Any = None  # value to compare against
    description: str = ""  # human-readable description of the rule


class FormField(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    field_type: str  # text, email, phone, date, number, select, textarea, file, checkbox, address
    required: bool = True
    description: str = ""
    options: Optional[List[str]] = None  # for select/checkbox types
    conditions: List[Condition] = []  # show this field only when conditions are met


class WorkflowStep(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    order: int
    assigned_role: str = ""
    status_from: Optional[str] = None
    status_to: str
    actions: List[str] = []
    conditions: List[Condition] = []  # activate this step only when conditions are met


class Fee(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    amount: float
    fee_type: str  # application, processing, permit, inspection, annual
    when_applied: str  # upfront, upon_approval, upon_inspection, annual
    conditions: List[Condition] = []  # apply this fee only when conditions are met
    formula: str = ""  # optional formula e.g. "project_value * 0.01" for calculated fees


class RequiredDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    required: bool = True
    description: str = ""
    stage: str  # application, review, approval, inspection
    conditions: List[Condition] = []  # require this doc only when conditions are met


class RecordType(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    description: str = ""
    department_id: str = ""
    category: str = ""  # permit, license, code_enforcement, inspection
    form_fields: List[FormField] = []
    workflow_steps: List[WorkflowStep] = []
    fees: List[Fee] = []
    required_documents: List[RequiredDocument] = []


class Department(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    description: str = ""
    record_type_ids: List[str] = []


class UserRole(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    description: str = ""
    permissions: List[str] = []
    department_ids: List[str] = []


class UploadedFile(BaseModel):
    filename: str
    size: int
    upload_time: datetime = Field(default_factory=datetime.utcnow)
    rows_count: int = 0
    columns: List[str] = []


class Configuration(BaseModel):
    record_types: List[RecordType] = []
    departments: List[Department] = []
    user_roles: List[UserRole] = []
    generated_at: Optional[datetime] = None
    summary: str = ""


class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    customer_name: str
    product_type: str = "PLC"
    status: str = "setup"  # setup, uploading, analyzing, configured, deployed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    uploaded_files: List[UploadedFile] = []
    configuration: Optional[Configuration] = None
    analysis_progress: int = 0
    analysis_stage: str = ""
    community_url: Optional[str] = ""
    community_name: Optional[str] = ""
    community_research: Optional[str] = ""


# Request/Response models
class CreateProjectRequest(BaseModel):
    name: str
    customer_name: str
    product_type: str = "PLC"
    community_url: Optional[str] = ""


class UpdateRecordTypeRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    department_id: Optional[str] = None
    category: Optional[str] = None
    form_fields: Optional[List[FormField]] = None
    workflow_steps: Optional[List[WorkflowStep]] = None
    fees: Optional[List[Fee]] = None
    required_documents: Optional[List[RequiredDocument]] = None


class UpdateDepartmentRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class UpdateRoleRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None
    department_ids: Optional[List[str]] = None
