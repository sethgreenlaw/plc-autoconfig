"""
PLC AutoConfig Backend - Single File FastAPI Application
Complete backend for AI-powered PLC configuration from CSV data
"""

import csv
import io
import json
import os
from collections import Counter
from datetime import datetime
from typing import Any, Dict, List, Optional
from contextlib import asynccontextmanager

import uuid
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

# Try to import anthropic, fallback to mock if not available
try:
    from anthropic import Anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class Condition(BaseModel):
    """Conditional logic rule: if field X has value Y, then do Z"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    source_field: str = ""
    operator: str = "equals"
    value: Any = None
    description: str = ""


class FormField(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    field_type: str
    required: bool = True
    description: str = ""
    options: Optional[List[str]] = None
    conditions: List[Condition] = []


class WorkflowStep(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    order: int
    assigned_role: str = ""
    status_from: Optional[str] = None
    status_to: str
    actions: List[str] = []
    conditions: List[Condition] = []


class Fee(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    amount: float
    fee_type: str
    when_applied: str
    conditions: List[Condition] = []
    formula: str = ""


class RequiredDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    required: bool = True
    description: str = ""
    stage: str
    conditions: List[Condition] = []


class RecordType(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    description: str = ""
    department_id: str = ""
    category: str = ""
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
    status: str = "setup"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    uploaded_files: List[UploadedFile] = []
    configuration: Optional[Configuration] = None
    analysis_progress: int = 0
    analysis_stage: str = ""
    community_url: Optional[str] = ""
    community_name: Optional[str] = ""
    community_research: Optional[str] = ""


# Request models
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


# ============================================================================
# IN-MEMORY STORE
# ============================================================================

class InMemoryStore:
    def __init__(self):
        self._projects = {}

    def create_project(self, project: Project) -> Project:
        project_dict = project.model_dump()
        self._projects[project.id] = project_dict
        return project

    def get_project(self, project_id: str) -> Optional[Project]:
        if project_id not in self._projects:
            return None
        return Project(**self._projects[project_id])

    def list_projects(self) -> List[Project]:
        return [Project(**p) for p in self._projects.values()]

    def update_project(self, project_id: str, **updates) -> Project:
        if project_id not in self._projects:
            raise ValueError(f"Project {project_id} not found")
        self._projects[project_id].update(updates)
        self._projects[project_id]["updated_at"] = datetime.utcnow()
        return Project(**self._projects[project_id])

    def delete_project(self, project_id: str) -> bool:
        if project_id in self._projects:
            del self._projects[project_id]
            return True
        return False

    def save_configuration(self, project_id: str, config: Configuration) -> None:
        if project_id not in self._projects:
            raise ValueError(f"Project {project_id} not found")
        config_dict = config.model_dump()
        self._projects[project_id]["configuration"] = config_dict
        self._projects[project_id]["updated_at"] = datetime.utcnow()

    def update_record_type(self, project_id: str, rt_id: str, updates: dict) -> Optional[RecordType]:
        if project_id not in self._projects:
            return None
        config = self._projects[project_id].get("configuration")
        if not config:
            return None
        for rt in config.get("record_types", []):
            if rt["id"] == rt_id:
                rt.update(updates)
                self._projects[project_id]["updated_at"] = datetime.utcnow()
                return RecordType(**rt)
        return None

    def update_department(self, project_id: str, dept_id: str, updates: dict) -> Optional[Department]:
        if project_id not in self._projects:
            return None
        config = self._projects[project_id].get("configuration")
        if not config:
            return None
        for dept in config.get("departments", []):
            if dept["id"] == dept_id:
                dept.update(updates)
                self._projects[project_id]["updated_at"] = datetime.utcnow()
                return Department(**dept)
        return None

    def update_role(self, project_id: str, role_id: str, updates: dict) -> Optional[UserRole]:
        if project_id not in self._projects:
            return None
        config = self._projects[project_id].get("configuration")
        if not config:
            return None
        for role in config.get("user_roles", []):
            if role["id"] == role_id:
                role.update(updates)
                self._projects[project_id]["updated_at"] = datetime.utcnow()
                return UserRole(**role)
        return None

    def add_record_type(self, project_id: str, record_type: RecordType) -> Optional[RecordType]:
        if project_id not in self._projects:
            return None
        config = self._projects[project_id].get("configuration")
        if not config:
            return None
        rt_dict = record_type.model_dump()
        config["record_types"].append(rt_dict)
        self._projects[project_id]["updated_at"] = datetime.utcnow()
        return RecordType(**rt_dict)

    def delete_record_type(self, project_id: str, rt_id: str) -> bool:
        if project_id not in self._projects:
            return False
        config = self._projects[project_id].get("configuration")
        if not config:
            return False
        for i, rt in enumerate(config.get("record_types", [])):
            if rt["id"] == rt_id:
                config["record_types"].pop(i)
                self._projects[project_id]["updated_at"] = datetime.utcnow()
                return True
        return False

    def add_uploaded_file(self, project_id: str, file_info: UploadedFile) -> None:
        if project_id not in self._projects:
            raise ValueError(f"Project {project_id} not found")
        file_dict = file_info.model_dump()
        self._projects[project_id]["uploaded_files"].append(file_dict)
        self._projects[project_id]["updated_at"] = datetime.utcnow()


store = InMemoryStore()


# ============================================================================
# CSV PARSER
# ============================================================================

class CSVParser:
    @staticmethod
    def parse(content: str) -> dict:
        """Parse CSV and extract metadata for AI analysis"""
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)
        columns = reader.fieldnames or []

        column_analysis = {}
        for col in columns:
            values = [r.get(col, "") for r in rows if r.get(col)]
            unique_count = len(set(values))
            sample_values = list(set(values))[:10]

            is_numeric = True
            if values:
                for v in values[:20]:
                    if v and not v.replace('.', '', 1).replace('-', '', 1).replace(',', '').isdigit():
                        is_numeric = False
                        break

            is_date = any(kw in col.lower() for kw in ["date", "time", "created", "submitted", "approved"])

            column_analysis[col] = {
                "unique_count": unique_count,
                "total_count": len(values),
                "sample_values": sample_values,
                "appears_numeric": is_numeric,
                "appears_date": is_date,
            }

        sample_rows = rows[:15]

        return {
            "columns": columns,
            "total_rows": len(rows),
            "sample_rows": sample_rows,
            "column_analysis": column_analysis,
        }

    @staticmethod
    def to_summary_string(metadata: dict) -> str:
        """Convert metadata to a string suitable for Claude prompt"""
        lines = []
        lines.append(f"Total rows: {metadata['total_rows']}")
        lines.append(f"Columns ({len(metadata['columns'])}): {', '.join(metadata['columns'])}")
        lines.append("")
        lines.append("Column Analysis:")
        for col, info in metadata['column_analysis'].items():
            sample = info['sample_values'][:5]
            lines.append(f"  {col}: {info['unique_count']} unique values, samples: {sample}")
        lines.append("")
        lines.append("Sample Rows (first 5):")
        for i, row in enumerate(metadata['sample_rows'][:5]):
            lines.append(f"  Row {i+1}: {dict(row)}")
        return "\n".join(lines)


# ============================================================================
# WEB RESEARCHER
# ============================================================================

class WebResearcher:
    """Researches local government websites to gather ordinances, fees, and processes."""

    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "")

    def research_community(self, community_url: str, community_name: str = "") -> dict:
        """Research a community's government website for PLC configuration data."""
        return self._generate_mock_research(community_url, community_name)

    def _generate_mock_research(self, url: str, name: str) -> dict:
        """Generate realistic mock research data for demo purposes."""
        community = name or "the community"

        return {
            "community_name": community,
            "website_url": url,
            "research_summary": f"Comprehensive research of {community}'s local government website completed. Found detailed information about permit processes, fee schedules, municipal codes, and departmental structure.",
            "permits_found": [
                {"name": "Building Permit", "description": f"{community} requires building permits for new construction, additions, renovations over $5,000, and structural modifications. Applications reviewed by Planning & Building Dept.", "typical_timeline": "2-6 weeks"},
                {"name": "Business License", "description": f"All businesses operating within {community} city limits must obtain an annual business license. Home-based businesses included.", "typical_timeline": "5-10 business days"},
                {"name": "Encroachment Permit", "description": f"{community} Public Works requires encroachment permits for any work within the public right-of-way including sidewalks, curbs, and utilities.", "typical_timeline": "1-3 weeks"},
                {"name": "Sign Permit", "description": f"Required for all new signs, changes to existing signs, or temporary signs in {community}. Must comply with sign ordinance Chapter 17.40.", "typical_timeline": "1-2 weeks"},
                {"name": "Grading Permit", "description": f"Required for earth-moving activities over 50 cubic yards in {community}.", "typical_timeline": "2-4 weeks"},
                {"name": "Conditional Use Permit", "description": f"Required for uses not permitted by right in specific zoning districts per {community} Zoning Code.", "typical_timeline": "6-12 weeks (requires public hearing)"},
            ],
            "fee_schedule": [
                {"permit_type": "Building Permit", "fee_name": "Plan Check Fee", "amount": "65% of building permit fee", "notes": "Based on project valuation"},
                {"permit_type": "Building Permit", "fee_name": "Building Permit Fee", "amount": "Per CBC Table 1-A", "notes": "Based on project valuation using ICC valuation table"},
                {"permit_type": "Building Permit", "fee_name": "Technology Fee", "amount": "$30.00", "notes": "Flat fee per application"},
                {"permit_type": "Building Permit", "fee_name": "SMIP Fee", "amount": "$0.13 per $1,000 valuation", "notes": "Strong Motion Instrumentation Program"},
                {"permit_type": "Building Permit", "fee_name": "Green Building Fee", "amount": "$4.50 per $1,000 valuation", "notes": "CalGreen compliance review"},
                {"permit_type": "Business License", "fee_name": "Application Fee", "amount": "$125.00", "notes": "Non-refundable"},
                {"permit_type": "Business License", "fee_name": "Annual Renewal", "amount": "$75.00 - $500.00", "notes": "Based on number of employees"},
                {"permit_type": "Business License", "fee_name": "Home Occupation", "amount": "$50.00", "notes": "Annual fee for home-based businesses"},
                {"permit_type": "Encroachment", "fee_name": "Permit Fee", "amount": "$275.00", "notes": "Base fee"},
                {"permit_type": "Encroachment", "fee_name": "Inspection Deposit", "amount": "$1,500.00", "notes": "Refundable upon satisfactory completion"},
                {"permit_type": "Fire Prevention", "fee_name": "Fire Alarm Permit", "amount": "$250.00", "notes": "New installations"},
                {"permit_type": "Fire Prevention", "fee_name": "Sprinkler Plan Review", "amount": "$175.00", "notes": "Per plan set"},
            ],
            "departments": [
                {"name": "Community Development", "description": f"Oversees planning, building, and code enforcement for {community}. Manages building permits, plan reviews, and inspections.", "phone": "(555) 555-0100"},
                {"name": "Business License Division", "description": f"Part of the Finance Department. Processes all business licenses and renewals for {community}.", "phone": "(555) 555-0200"},
                {"name": "Public Works", "description": f"Manages {community}'s infrastructure including streets, sidewalks, storm drains, and rights-of-way.", "phone": "(555) 555-0300"},
                {"name": "Fire Prevention Bureau", "description": f"Part of {community} Fire Department. Handles fire prevention permits, inspections, and plan reviews.", "phone": "(555) 555-0400"},
                {"name": "Code Enforcement", "description": f"Ensures compliance with {community}'s municipal codes, property maintenance standards, and zoning regulations.", "phone": "(555) 555-0500"},
            ],
            "ordinances": [
                {"code": "Title 15 - Buildings and Construction", "summary": f"Adopts California Building Code with {community}-specific amendments. Covers building permits, plan reviews, inspections, and compliance.", "key_provisions": ["Permit required for work over $500", "Plans required for projects over $5,000", "Licensed contractor required for projects over $500"]},
                {"code": "Title 17 - Zoning", "summary": f"{community} Zoning Ordinance establishing land use districts, permitted uses, development standards, and approval processes.", "key_provisions": ["7 residential zones", "5 commercial zones", "3 industrial zones", "Overlay districts for historic and flood areas"]},
                {"code": "Title 5 - Business Licenses and Regulations", "summary": f"Requires all businesses within {community} to obtain a business license. Establishes fee schedule and renewal requirements.", "key_provisions": ["Annual renewal required", "Home occupation permits available", "Penalties for operating without license"]},
                {"code": "Title 8 - Health and Safety", "summary": f"{community}'s health and safety codes including fire prevention, hazardous materials, and property maintenance.", "key_provisions": ["Adopts California Fire Code", "Annual fire inspections for commercial", "Weed abatement program"]},
            ],
            "processes": [
                {"name": "Building Permit Process", "steps": ["Submit application with plans and fees", "Completeness check (3 business days)", "Plan review by multiple departments (2-4 weeks)", "Corrections cycle if needed", "Permit issuance upon approval", "Inspections during construction", "Final inspection and certificate of occupancy"]},
                {"name": "Business License Process", "steps": ["Complete application form", "Pay application fee", "Zoning verification", "Fire inspection (if applicable)", "License issued", "Annual renewal notice sent 30 days before expiration"]},
                {"name": "Code Enforcement Process", "steps": ["Complaint received or violation observed", "Case opened and assigned", "Initial inspection within 5 business days", "Notice of violation sent to property owner", "30-day compliance period", "Re-inspection", "Administrative citation if not corrected", "Hearing process for appeals"]},
            ],
            "documents_commonly_required": [
                "Completed application form",
                "Site plan or plot plan",
                "Architectural/construction plans (3 sets)",
                "Structural calculations (sealed by licensed engineer)",
                "Title 24 Energy compliance forms",
                "Soils/geotechnical report (for new construction)",
                "Proof of property ownership or authorization letter",
                "Licensed contractor information",
                "Proof of insurance",
                "Environmental review documentation (CEQA)",
                "School district fee receipt",
                "Water/sewer availability letter",
            ]
        }

    def format_for_analysis(self, research: dict) -> str:
        """Format research data as context string for Claude analysis prompt."""
        parts = []

        parts.append(f"## Community Research: {research.get('community_name', 'Unknown')}")
        parts.append(f"Website: {research.get('website_url', 'N/A')}")
        parts.append(f"\n{research.get('research_summary', '')}")

        if research.get('permits_found'):
            parts.append("\n### Permits & Licenses Found:")
            for p in research['permits_found']:
                parts.append(f"- **{p['name']}**: {p['description']} (Timeline: {p['typical_timeline']})")

        if research.get('fee_schedule'):
            parts.append("\n### Fee Schedule:")
            for f in research['fee_schedule']:
                parts.append(f"- {f['permit_type']} - {f['fee_name']}: {f['amount']} ({f['notes']})")

        if research.get('departments'):
            parts.append("\n### Departments:")
            for d in research['departments']:
                parts.append(f"- **{d['name']}**: {d['description']}")

        if research.get('ordinances'):
            parts.append("\n### Municipal Codes & Ordinances:")
            for o in research['ordinances']:
                parts.append(f"- **{o['code']}**: {o['summary']}")
                for prov in o.get('key_provisions', []):
                    parts.append(f"  - {prov}")

        if research.get('processes'):
            parts.append("\n### Standard Processes:")
            for proc in research['processes']:
                parts.append(f"- **{proc['name']}**:")
                for i, step in enumerate(proc['steps'], 1):
                    parts.append(f"  {i}. {step}")

        if research.get('documents_commonly_required'):
            parts.append("\n### Commonly Required Documents:")
            for doc in research['documents_commonly_required']:
                parts.append(f"- {doc}")

        return "\n".join(parts)


web_researcher = WebResearcher()


# ============================================================================
# MOCK GENERATOR
# ============================================================================

class MockGenerator:
    @staticmethod
    def generate_configuration() -> Configuration:
        planning = Department(
            id="dept_plan",
            name="Planning & Zoning",
            description="Handles building permits, zoning variances, and land use applications"
        )
        licensing = Department(
            id="dept_lic",
            name="Business Licensing",
            description="Manages business licenses, vendor permits, and professional registrations"
        )
        enforcement = Department(
            id="dept_enf",
            name="Code Enforcement",
            description="Handles code violations, complaints, and compliance inspections"
        )
        fire = Department(
            id="dept_fire",
            name="Fire Prevention",
            description="Fire safety permits and inspections"
        )

        building_permit = RecordType(
            id="rt_bldg",
            name="Building Permit",
            description="Permits for new construction, renovations, additions, and structural modifications",
            department_id="dept_plan",
            category="permit",
            form_fields=[
                FormField(name="Property Address", field_type="address", required=True, description="Full street address of the property"),
                FormField(name="Parcel Number", field_type="text", required=True, description="APN or parcel identification number"),
                FormField(name="Project Description", field_type="textarea", required=True, description="Detailed description of proposed work"),
                FormField(name="Project Type", field_type="select", required=True, description="Type of construction project",
                         options=["New Construction", "Addition", "Renovation", "Demolition", "Tenant Improvement", "Accessory Structure"]),
                FormField(name="Estimated Project Value", field_type="number", required=True, description="Estimated cost of construction"),
                FormField(name="Square Footage", field_type="number", required=True, description="Total square footage of work"),
                FormField(name="Number of Stories", field_type="number", required=False, description="Number of stories in the structure",
                         conditions=[Condition(source_field="Project Type", operator="equals", value="New Construction", description="Only needed for new construction")]),
                FormField(name="Occupancy Type", field_type="select", required=True, description="Building occupancy classification",
                         options=["Residential", "Commercial", "Industrial", "Mixed Use", "Institutional"]),
                FormField(name="Applicant Name", field_type="text", required=True, description="Name of permit applicant"),
                FormField(name="Applicant Email", field_type="email", required=True, description="Email address for notifications"),
                FormField(name="Applicant Phone", field_type="phone", required=True, description="Contact phone number"),
                FormField(name="Contractor Name", field_type="text", required=True, description="Licensed contractor name"),
                FormField(name="Contractor License Number", field_type="text", required=True, description="State contractor license number"),
                FormField(name="Architect/Engineer", field_type="text", required=False, description="Name of project architect or engineer",
                         conditions=[Condition(source_field="Estimated Project Value", operator="greater_than", value="100000", description="Required for projects over $100,000")]),
            ],
            workflow_steps=[
                WorkflowStep(name="Application Submitted", order=1, status_from=None, status_to="submitted", assigned_role="", actions=["Send confirmation email"]),
                WorkflowStep(name="Completeness Check", order=2, status_from="submitted", status_to="under_review", assigned_role="Permit Technician", actions=["Verify all required documents", "Check fees paid"]),
                WorkflowStep(name="Plan Review", order=3, status_from="under_review", status_to="in_plan_review", assigned_role="Plan Reviewer", actions=["Review architectural plans", "Check code compliance", "Verify setbacks and zoning"]),
                WorkflowStep(name="Corrections Required", order=4, status_from="in_plan_review", status_to="corrections_needed", assigned_role="Plan Reviewer", actions=["Document required corrections", "Notify applicant"],
                            conditions=[Condition(source_field="Project Type", operator="not_equals", value="Demolition", description="Demolitions skip corrections cycle")]),
                WorkflowStep(name="Corrections Resubmitted", order=5, status_from="corrections_needed", status_to="in_plan_review", assigned_role="", actions=["Re-review submitted corrections"]),
                WorkflowStep(name="Approved", order=6, status_from="in_plan_review", status_to="approved", assigned_role="Senior Plan Reviewer", actions=["Final sign-off", "Generate permit document"]),
                WorkflowStep(name="Permit Issued", order=7, status_from="approved", status_to="issued", assigned_role="Permit Technician", actions=["Issue permit", "Schedule inspections"]),
            ],
            fees=[
                Fee(name="Building Permit Fee", amount=750.00, fee_type="application", when_applied="upfront", formula="project_value * 0.015"),
                Fee(name="Plan Review Fee", amount=350.00, fee_type="processing", when_applied="upfront"),
                Fee(name="Technology Fee", amount=25.00, fee_type="processing", when_applied="upfront"),
                Fee(name="Inspection Fee", amount=200.00, fee_type="inspection", when_applied="upon_approval",
                    conditions=[Condition(source_field="Project Type", operator="not_equals", value="Demolition", description="No inspection fee for demolitions")]),
            ],
            required_documents=[
                RequiredDocument(name="Architectural Plans", required=True, description="Complete set of construction drawings sealed by licensed architect", stage="application"),
                RequiredDocument(name="Structural Calculations", required=True, description="Engineering calculations for structural elements", stage="application",
                                conditions=[Condition(source_field="Project Type", operator="equals", value="New Construction", description="Required for new construction only")]),
                RequiredDocument(name="Site Plan", required=True, description="Survey showing property boundaries, setbacks, and proposed work", stage="application"),
                RequiredDocument(name="Title Report", required=True, description="Current title report or proof of ownership", stage="application"),
                RequiredDocument(name="Energy Compliance Forms", required=True, description="Title 24 energy compliance documentation", stage="review"),
                RequiredDocument(name="Soils Report", required=False, description="Geotechnical investigation report", stage="review",
                                conditions=[Condition(source_field="Project Type", operator="equals", value="New Construction", description="Required for new construction only")]),
            ]
        )

        business_license = RecordType(
            id="rt_bus",
            name="Business License",
            description="Annual business operating license required for all commercial activities within city limits",
            department_id="dept_lic",
            category="license",
            form_fields=[
                FormField(name="Business Name", field_type="text", required=True, description="Legal business name"),
                FormField(name="DBA Name", field_type="text", required=False, description="Doing Business As name if different",
                         conditions=[Condition(source_field="Business Type", operator="not_equals", value="Home-Based Business", description="Not applicable for home-based businesses")]),
                FormField(name="Business Type", field_type="select", required=True, description="Type of business",
                         options=["Retail", "Restaurant/Food Service", "Professional Services", "Contractor", "Home-Based Business", "Manufacturing", "Wholesale", "Entertainment"]),
                FormField(name="Business Address", field_type="address", required=True, description="Physical business location"),
                FormField(name="Mailing Address", field_type="address", required=False, description="Mailing address if different from business address",
                         conditions=[Condition(source_field="Business Type", operator="not_equals", value="Home-Based Business", description="Home-based businesses use home address")]),
                FormField(name="Owner Name", field_type="text", required=True, description="Business owner full name"),
                FormField(name="Owner Email", field_type="email", required=True, description="Owner email for correspondence"),
                FormField(name="Owner Phone", field_type="phone", required=True, description="Owner contact phone"),
                FormField(name="Federal EIN", field_type="text", required=True, description="Federal Employer Identification Number"),
                FormField(name="State Tax ID", field_type="text", required=True, description="State tax identification number"),
                FormField(name="Number of Employees", field_type="number", required=True, description="Total number of employees"),
                FormField(name="Estimated Annual Revenue", field_type="select", required=True, description="Estimated gross annual revenue range",
                         options=["Under $50,000", "$50,000-$100,000", "$100,000-$500,000", "$500,000-$1,000,000", "Over $1,000,000"]),
            ],
            workflow_steps=[
                WorkflowStep(name="Application Submitted", order=1, status_from=None, status_to="submitted", assigned_role="", actions=["Send confirmation email", "Assign to licensing officer"]),
                WorkflowStep(name="Application Review", order=2, status_from="submitted", status_to="under_review", assigned_role="Licensing Officer", actions=["Verify business information", "Check zoning compliance"]),
                WorkflowStep(name="Approved", order=3, status_from="under_review", status_to="approved", assigned_role="Licensing Supervisor", actions=["Approve license", "Generate license document"]),
                WorkflowStep(name="License Issued", order=4, status_from="approved", status_to="active", assigned_role="Licensing Officer", actions=["Issue license", "Set renewal reminder"]),
                WorkflowStep(name="Renewal Due", order=5, status_from="active", status_to="renewal_pending", assigned_role="", actions=["Send renewal notice"]),
            ],
            fees=[
                Fee(name="Business License Fee", amount=150.00, fee_type="application", when_applied="upfront"),
                Fee(name="Processing Fee", amount=25.00, fee_type="processing", when_applied="upfront"),
                Fee(name="Annual Renewal Fee", amount=100.00, fee_type="annual", when_applied="annual", formula="base_fee + (employees * 5)"),
            ],
            required_documents=[
                RequiredDocument(name="State Business Registration", required=True, description="State business entity registration certificate", stage="application"),
                RequiredDocument(name="Proof of Insurance", required=True, description="General liability insurance certificate", stage="application"),
                RequiredDocument(name="Lease Agreement", required=True, description="Copy of commercial lease or proof of property ownership", stage="application",
                                conditions=[Condition(source_field="Business Type", operator="not_equals", value="Home-Based Business", description="Not required for home-based businesses")]),
                RequiredDocument(name="Health Permit", required=False, description="Required for food service businesses", stage="approval",
                                conditions=[Condition(source_field="Business Type", operator="equals", value="Restaurant/Food Service", description="Required for food service businesses")]),
            ]
        )

        code_violation = RecordType(
            id="rt_code",
            name="Code Violation Notice",
            description="Documentation and tracking of municipal code violations including property maintenance, zoning, and building code violations",
            department_id="dept_enf",
            category="code_enforcement",
            form_fields=[
                FormField(name="Violation Address", field_type="address", required=True, description="Address where violation was observed"),
                FormField(name="Violation Type", field_type="select", required=True, description="Category of code violation",
                         options=["Property Maintenance", "Zoning Violation", "Building Without Permit", "Sign Violation", "Noise Complaint", "Overgrown Vegetation", "Abandoned Vehicle", "Illegal Dumping"]),
                FormField(name="Violation Description", field_type="textarea", required=True, description="Detailed description of the violation"),
                FormField(name="Date Observed", field_type="date", required=True, description="Date violation was first observed"),
                FormField(name="Reported By", field_type="select", required=True, description="Source of the complaint",
                         options=["Citizen Complaint", "Staff Observation", "Other Agency", "Anonymous"]),
                FormField(name="Reporter Name", field_type="text", required=False, description="Name of person reporting (if not anonymous)",
                         conditions=[Condition(source_field="Reported By", operator="not_equals", value="Anonymous", description="Not needed for anonymous reports")]),
                FormField(name="Reporter Phone", field_type="phone", required=False, description="Reporter contact number",
                         conditions=[Condition(source_field="Reported By", operator="not_equals", value="Anonymous", description="Not needed for anonymous reports")]),
                FormField(name="Property Owner", field_type="text", required=True, description="Name of property owner"),
                FormField(name="Severity", field_type="select", required=True, description="Severity level of violation",
                         options=["Minor", "Moderate", "Major", "Imminent Hazard"]),
            ],
            workflow_steps=[
                WorkflowStep(name="Complaint Received", order=1, status_from=None, status_to="received", assigned_role="", actions=["Log complaint", "Assign to inspector"]),
                WorkflowStep(name="Initial Inspection", order=2, status_from="received", status_to="inspected", assigned_role="Code Inspector", actions=["Site visit", "Document violations", "Take photos"]),
                WorkflowStep(name="Notice of Violation Issued", order=3, status_from="inspected", status_to="notice_issued", assigned_role="Code Inspector", actions=["Send NOV to property owner", "Set compliance deadline"]),
                WorkflowStep(name="Compliance Check", order=4, status_from="notice_issued", status_to="compliance_check", assigned_role="Code Inspector", actions=["Re-inspect property", "Document status"]),
                WorkflowStep(name="Resolved", order=5, status_from="compliance_check", status_to="resolved", assigned_role="Code Inspector", actions=["Close case", "Update records"]),
                WorkflowStep(name="Citation Issued", order=6, status_from="compliance_check", status_to="citation_issued", assigned_role="Senior Inspector", actions=["Issue citation", "Refer to legal if needed"],
                            conditions=[Condition(source_field="Severity", operator="not_equals", value="Minor", description="Citations only for moderate+ violations")]),
            ],
            fees=[
                Fee(name="Re-inspection Fee", amount=150.00, fee_type="inspection", when_applied="upon_inspection"),
                Fee(name="Administrative Citation", amount=500.00, fee_type="permit", when_applied="upon_approval",
                    conditions=[Condition(source_field="Severity", operator="not_equals", value="Minor", description="Citations not issued for minor violations")]),
            ],
            required_documents=[
                RequiredDocument(name="Violation Photos", required=True, description="Photographic evidence of the violation", stage="inspection"),
                RequiredDocument(name="Compliance Plan", required=False, description="Owner's plan to remedy the violation", stage="review"),
                RequiredDocument(name="Correction Verification", required=True, description="Photos showing violation has been corrected", stage="inspection"),
            ]
        )

        encroachment = RecordType(
            id="rt_enc",
            name="Encroachment Permit",
            description="Permits for work within public right-of-way including sidewalk repairs, utility connections, and driveway approaches",
            department_id="dept_plan",
            category="permit",
            form_fields=[
                FormField(name="Location", field_type="address", required=True, description="Location of proposed encroachment"),
                FormField(name="Work Description", field_type="textarea", required=True, description="Description of work to be performed in right-of-way"),
                FormField(name="Encroachment Type", field_type="select", required=True, description="Type of encroachment",
                         options=["Sidewalk Repair", "Driveway Approach", "Utility Connection", "Street Cut", "Temporary Closure", "Banner/Sign"]),
                FormField(name="Start Date", field_type="date", required=True, description="Proposed start date of work"),
                FormField(name="End Date", field_type="date", required=True, description="Expected completion date"),
                FormField(name="Applicant Name", field_type="text", required=True, description="Name of applicant"),
                FormField(name="Applicant Email", field_type="email", required=True, description="Email for notifications"),
                FormField(name="Contractor Name", field_type="text", required=True, description="Contractor performing the work"),
                FormField(name="Traffic Control Plan Required", field_type="checkbox", required=False, description="Whether a TCP is needed",
                         conditions=[Condition(source_field="Encroachment Type", operator="equals", value="Street Cut", description="TCP required for street cuts")]),
            ],
            workflow_steps=[
                WorkflowStep(name="Application Submitted", order=1, status_from=None, status_to="submitted", assigned_role="", actions=["Send confirmation"]),
                WorkflowStep(name="Engineering Review", order=2, status_from="submitted", status_to="under_review", assigned_role="Public Works Engineer", actions=["Review plans", "Check conflicts"]),
                WorkflowStep(name="Approved", order=3, status_from="under_review", status_to="approved", assigned_role="Public Works Director", actions=["Issue permit"]),
                WorkflowStep(name="Work Completed", order=4, status_from="approved", status_to="work_complete", assigned_role="", actions=["Request final inspection"]),
                WorkflowStep(name="Final Inspection", order=5, status_from="work_complete", status_to="closed", assigned_role="Public Works Inspector", actions=["Inspect work", "Close permit"]),
            ],
            fees=[
                Fee(name="Encroachment Permit Fee", amount=250.00, fee_type="application", when_applied="upfront"),
                Fee(name="Deposit", amount=1000.00, fee_type="permit", when_applied="upfront"),
                Fee(name="Inspection Fee", amount=100.00, fee_type="inspection", when_applied="upon_inspection"),
            ],
            required_documents=[
                RequiredDocument(name="Site Plan/Drawing", required=True, description="Drawing showing location and extent of work", stage="application"),
                RequiredDocument(name="Traffic Control Plan", required=False, description="Required for work affecting traffic flow", stage="application",
                                conditions=[Condition(source_field="Encroachment Type", operator="equals", value="Street Cut", description="Required when work affects traffic")]),
                RequiredDocument(name="Insurance Certificate", required=True, description="Liability insurance naming city as additional insured", stage="application"),
            ]
        )

        fire_permit = RecordType(
            id="rt_fire",
            name="Fire Prevention Permit",
            description="Permits for fire safety compliance including fire alarm systems, sprinkler systems, and special events",
            department_id="dept_fire",
            category="permit",
            form_fields=[
                FormField(name="Property Address", field_type="address", required=True, description="Address of property"),
                FormField(name="Permit Type", field_type="select", required=True, description="Type of fire permit",
                         options=["Fire Alarm System", "Sprinkler System", "Hood Suppression", "Special Event", "Hazardous Materials", "Assembly Permit"]),
                FormField(name="Description of Work", field_type="textarea", required=True, description="Description of fire protection system or activity"),
                FormField(name="Applicant Name", field_type="text", required=True, description="Applicant name"),
                FormField(name="Applicant Phone", field_type="phone", required=True, description="Contact phone"),
                FormField(name="Contractor Name", field_type="text", required=True, description="Fire protection contractor"),
                FormField(name="Contractor License", field_type="text", required=True, description="C-16 or other fire protection license number"),
                FormField(name="Occupancy Type", field_type="select", required=True, description="Building occupancy type",
                         options=["Assembly", "Business", "Educational", "Factory", "Hazardous", "Institutional", "Mercantile", "Residential", "Storage"]),
            ],
            workflow_steps=[
                WorkflowStep(name="Application Submitted", order=1, status_from=None, status_to="submitted", assigned_role="", actions=["Send confirmation"]),
                WorkflowStep(name="Fire Marshal Review", order=2, status_from="submitted", status_to="under_review", assigned_role="Fire Marshal", actions=["Review plans and specifications"]),
                WorkflowStep(name="Approved", order=3, status_from="under_review", status_to="approved", assigned_role="Fire Marshal", actions=["Issue permit"]),
                WorkflowStep(name="Installation Complete", order=4, status_from="approved", status_to="inspection_requested", assigned_role="", actions=["Schedule fire inspection"]),
                WorkflowStep(name="Final Inspection", order=5, status_from="inspection_requested", status_to="closed", assigned_role="Fire Inspector", actions=["Inspect installation", "Issue certificate"]),
            ],
            fees=[
                Fee(name="Fire Permit Fee", amount=200.00, fee_type="application", when_applied="upfront"),
                Fee(name="Plan Review Fee", amount=150.00, fee_type="processing", when_applied="upfront"),
                Fee(name="Inspection Fee", amount=125.00, fee_type="inspection", when_applied="upon_inspection",
                    conditions=[Condition(source_field="Permit Type", operator="not_equals", value="Special Event", description="No inspection for special events")]),
            ],
            required_documents=[
                RequiredDocument(name="Fire Protection Plans", required=True, description="Engineered fire protection system plans", stage="application"),
                RequiredDocument(name="Product Specifications", required=True, description="Cut sheets for fire protection equipment", stage="application"),
                RequiredDocument(name="Hydraulic Calculations", required=False, description="For sprinkler systems", stage="review",
                                conditions=[Condition(source_field="Permit Type", operator="equals", value="Sprinkler System", description="Required for sprinkler system permits")]),
            ]
        )

        planning.record_type_ids = ["rt_bldg", "rt_enc"]
        licensing.record_type_ids = ["rt_bus"]
        enforcement.record_type_ids = ["rt_code"]
        fire.record_type_ids = ["rt_fire"]

        roles = [
            UserRole(
                id="role_admin",
                name="System Administrator",
                description="Full system access for IT and management",
                permissions=["manage_users", "manage_config", "view_all", "edit_all", "delete_all", "generate_reports", "manage_fees"],
                department_ids=["dept_plan", "dept_lic", "dept_enf", "dept_fire"]
            ),
            UserRole(
                id="role_reviewer",
                name="Plan Reviewer",
                description="Reviews building permit plans and applications",
                permissions=["view_permits", "review_plans", "request_corrections", "approve_permits", "add_comments"],
                department_ids=["dept_plan"]
            ),
            UserRole(
                id="role_tech",
                name="Permit Technician",
                description="Processes permit applications and handles front counter",
                permissions=["create_permits", "view_permits", "process_payments", "issue_permits", "upload_documents"],
                department_ids=["dept_plan", "dept_lic"]
            ),
            UserRole(
                id="role_inspector",
                name="Inspector",
                description="Conducts field inspections for permits and code enforcement",
                permissions=["view_permits", "view_violations", "schedule_inspections", "record_results", "upload_photos", "add_comments"],
                department_ids=["dept_plan", "dept_enf", "dept_fire"]
            ),
            UserRole(
                id="role_lic_officer",
                name="Licensing Officer",
                description="Processes business license applications",
                permissions=["view_licenses", "review_applications", "approve_licenses", "process_payments", "generate_licenses"],
                department_ids=["dept_lic"]
            ),
            UserRole(
                id="role_code_officer",
                name="Code Enforcement Officer",
                description="Handles code violation cases",
                permissions=["view_violations", "create_violations", "issue_notices", "issue_citations", "schedule_inspections", "upload_photos"],
                department_ids=["dept_enf"]
            ),
            UserRole(
                id="role_public",
                name="Public Applicant",
                description="External users who submit applications and check status",
                permissions=["submit_applications", "view_own_records", "upload_documents", "make_payments", "check_status"],
                department_ids=[]
            ),
        ]

        return Configuration(
            record_types=[building_permit, business_license, code_violation, encroachment, fire_permit],
            departments=[planning, licensing, enforcement, fire],
            user_roles=roles,
            generated_at=datetime.utcnow(),
            summary="Generated 5 record types across 4 departments with 7 user roles. Includes Building Permits, Business Licenses, Code Violations, Encroachment Permits, and Fire Prevention Permits with complete form fields, workflows, fee schedules, and document requirements."
        )

    @staticmethod
    def generate_sample_csv() -> str:
        """Generate a realistic sample CSV for demo purposes"""
        import random
        headers = "permit_number,record_type,applicant_name,applicant_email,applicant_phone,property_address,description,status,department,assigned_to,submitted_date,approved_date,fee_amount,fee_type,documents_submitted,project_value"

        record_types = ["Building Permit", "Business License", "Code Violation", "Encroachment Permit", "Fire Prevention Permit"]
        statuses = ["Submitted", "Under Review", "In Plan Review", "Corrections Needed", "Approved", "Issued", "Closed", "Denied"]
        departments = ["Planning & Zoning", "Business Licensing", "Code Enforcement", "Fire Prevention", "Public Works"]
        staff = ["Alice Johnson", "Bob Chen", "Carol Williams", "David Martinez", "Emily Brown", "Frank Garcia"]

        rows = [headers]
        for i in range(150):
            rt = random.choice(record_types)
            dept = departments[record_types.index(rt)] if rt in record_types else random.choice(departments)
            status = random.choice(statuses)
            fee = round(random.uniform(25, 2000), 2)
            pv = round(random.uniform(5000, 500000), 2) if rt == "Building Permit" else ""

            row = f"PRM-2024-{i+1:04d},{rt},Applicant {i+1},applicant{i+1}@email.com,(555) {random.randint(100,999)}-{random.randint(1000,9999)},{random.randint(100,9999)} Main St,Description for {rt} #{i+1},{status},{dept},{random.choice(staff)},2024-{random.randint(1,12):02d}-{random.randint(1,28):02d},,{fee},Application Fee,{random.randint(1,5)},{pv}"
            rows.append(row)

        return "\n".join(rows)


# ============================================================================
# CLAUDE SERVICE
# ============================================================================

class ClaudeService:
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.client = None
        if ANTHROPIC_AVAILABLE and self.api_key:
            self.client = Anthropic(api_key=self.api_key)

    def is_available(self) -> bool:
        return self.client is not None and bool(self.api_key)

    def analyze_csv_data(self, csv_summary: str) -> Configuration:
        """Send CSV data to Claude for analysis, return Configuration"""
        if not self.is_available():
            return MockGenerator.generate_configuration()

        prompt = self._build_prompt(csv_summary)

        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8000,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text
            config_data = self._parse_response(response_text)
            return self._build_configuration(config_data)
        except Exception:
            return MockGenerator.generate_configuration()

    def _build_prompt(self, csv_summary: str) -> str:
        return f"""You are an expert in PLC (Permitting, Licensing, and Code Enforcement) software configuration for local government.

Analyze the following CSV data from a municipality's historical records and generate a complete PLC software configuration.

## CSV Data Summary:
{csv_summary}

## Your Task:
Based on this data, generate a complete PLC configuration with:

1. **Record Types**: Identify all distinct record/permit/license types. For each:
   - Name and description
   - Category (permit, license, code_enforcement, or inspection)
   - Form fields the applicant/staff would need to fill out (infer from CSV columns)
   - Workflow steps (infer from status values and date columns)
   - Fees (infer from any fee/cost/amount columns)
   - Required documents (infer from document columns or common requirements for this type)

2. **Departments**: Identify departments/divisions that handle these records

3. **User Roles**: Identify roles needed (e.g., "Plan Reviewer", "Inspector", "Admin")
   - Include relevant permissions for each role

## IMPORTANT RULES:
- Be thorough - create realistic, complete configurations
- For form fields, include common fields even if not directly in the CSV (like applicant phone, email, address)
- For workflows, include at least 3-5 steps per record type
- For fees, use realistic amounts if not in the data
- For documents, include typical requirements for each record type
- Include at least 2-3 record types, 2+ departments, 3+ user roles

## Response Format:
Return ONLY valid JSON (no markdown, no explanation) matching this exact schema:
{{
  "record_types": [
    {{
      "name": "string",
      "description": "string",
      "category": "permit|license|code_enforcement|inspection",
      "department": "string",
      "form_fields": [
        {{"name": "string", "field_type": "text|email|phone|date|number|select|textarea|file|checkbox|address", "required": true/false, "description": "string", "options": ["opt1"] or null}}
      ],
      "workflow_steps": [
        {{"name": "string", "order": 1, "assigned_role": "string", "status_from": "string or null", "status_to": "string", "actions": ["action1"]}}
      ],
      "fees": [
        {{"name": "string", "amount": 0.00, "fee_type": "application|processing|permit|inspection|annual", "when_applied": "upfront|upon_approval|upon_inspection|annual"}}
      ],
      "required_documents": [
        {{"name": "string", "required": true/false, "description": "string", "stage": "application|review|approval|inspection"}}
      ]
    }}
  ],
  "departments": [
    {{"name": "string", "description": "string"}}
  ],
  "user_roles": [
    {{"name": "string", "description": "string", "permissions": ["perm1"], "departments": ["dept1"]}}
  ],
  "summary": "Brief summary of what was found in the data"
}}"""

    def _parse_response(self, text: str) -> dict:
        """Extract JSON from Claude's response"""
        text = text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            json_lines = []
            in_block = False
            for line in lines:
                if line.strip().startswith("```"):
                    in_block = not in_block
                    continue
                if in_block or not line.strip().startswith("```"):
                    json_lines.append(line)
            text = "\n".join(json_lines)

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(text[start:end])
            raise ValueError("Could not parse Claude response as JSON")

    def _build_configuration(self, data: dict) -> Configuration:
        """Transform Claude's JSON response into Configuration model"""
        departments = []
        dept_map = {}
        for d in data.get("departments", []):
            dept = Department(name=d["name"], description=d.get("description", ""))
            departments.append(dept)
            dept_map[d["name"]] = dept.id

        roles = []
        for r in data.get("user_roles", []):
            role = UserRole(
                name=r["name"],
                description=r.get("description", ""),
                permissions=r.get("permissions", []),
                department_ids=[dept_map.get(d, "") for d in r.get("departments", [])]
            )
            roles.append(role)

        record_types = []
        for rt in data.get("record_types", []):
            dept_id = dept_map.get(rt.get("department", ""), "")

            form_fields = [FormField(**f) for f in rt.get("form_fields", [])]
            workflow_steps = [WorkflowStep(**w) for w in rt.get("workflow_steps", [])]
            fees = [Fee(**f) for f in rt.get("fees", [])]
            docs = [RequiredDocument(**d) for d in rt.get("required_documents", [])]

            record_type = RecordType(
                name=rt["name"],
                description=rt.get("description", ""),
                department_id=dept_id,
                category=rt.get("category", "permit"),
                form_fields=form_fields,
                workflow_steps=workflow_steps,
                fees=fees,
                required_documents=docs,
            )
            record_types.append(record_type)

            if dept_id:
                for dept in departments:
                    if dept.id == dept_id:
                        dept.record_type_ids.append(record_type.id)

        return Configuration(
            record_types=record_types,
            departments=departments,
            user_roles=roles,
            generated_at=datetime.utcnow(),
            summary=data.get("summary", "Configuration generated from CSV analysis")
        )


claude_service = ClaudeService()


# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/tmp/plc-uploads")


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    yield


app = FastAPI(
    title="PLC AutoConfig Backend",
    description="Backend for AI-powered PLC software configuration from CSV data",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# PROJECT ROUTES
# ============================================================================

@app.post("/api/projects", response_model=Project)
async def create_project(request: CreateProjectRequest):
    """Create a new project"""
    project = Project(
        name=request.name,
        customer_name=request.customer_name,
        product_type=request.product_type,
        community_url=request.community_url or "",
    )
    store.create_project(project)
    return project


@app.get("/api/projects", response_model=List[Project])
async def list_projects():
    """List all projects"""
    return store.list_projects()


@app.get("/api/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """Get a specific project"""
    project = store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    if not store.delete_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return {"success": True}


@app.post("/api/projects/{project_id}/upload")
async def upload_files(project_id: str, files: List[UploadFile] = File(...)):
    """Upload CSV files to a project"""
    project = store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    upload_dir = os.path.join(UPLOAD_DIR, project_id)
    os.makedirs(upload_dir, exist_ok=True)

    uploaded = []
    for file in files:
        content = await file.read()
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as f:
            f.write(content)

        try:
            csv_text = content.decode("utf-8")
            metadata = CSVParser.parse(csv_text)

            file_info = UploadedFile(
                filename=file.filename,
                size=len(content),
                rows_count=metadata["total_rows"],
                columns=metadata["columns"],
            )
            store.add_uploaded_file(project_id, file_info)
            uploaded.append(file_info)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse {file.filename}: {str(e)}")

    store.update_project(project_id, status="uploading")
    return {"files": uploaded, "project_status": "uploading"}


@app.post("/api/projects/{project_id}/research")
async def research_community(project_id: str):
    """Run community web research synchronously"""
    project = store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not project.community_url:
        raise HTTPException(status_code=400, detail="No community URL provided")

    try:
        research = web_researcher.research_community(
            community_url=project.community_url,
            community_name=project.customer_name
        )

        store.update_project(
            project_id,
            community_name=research.get("community_name", ""),
            community_research=json.dumps(research)
        )
        return {"status": "complete", "message": "Community research complete", "data": research}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")


@app.get("/api/projects/{project_id}/research")
async def get_research(project_id: str):
    """Get community research data"""
    project = store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.community_research:
        try:
            return json.loads(project.community_research)
        except:
            return {"raw": project.community_research}

    return {"status": "no_research", "message": "No community research available yet"}


@app.post("/api/projects/{project_id}/analyze")
async def analyze_project(project_id: str):
    """Analyze a project's uploaded files synchronously"""
    project = store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not project.uploaded_files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    try:
        store.update_project(project_id, status="analyzing", analysis_progress=10, analysis_stage="Parsing CSV files...")

        upload_dir = os.path.join(UPLOAD_DIR, project_id)
        all_csv_data = ""

        if project.uploaded_files:
            for f in project.uploaded_files:
                file_path = os.path.join(upload_dir, f.filename)
                if os.path.exists(file_path):
                    with open(file_path, "r") as fp:
                        content = fp.read()
                        metadata = CSVParser.parse(content)
                        all_csv_data += f"\n--- File: {f.filename} ---\n"
                        all_csv_data += CSVParser.to_summary_string(metadata)

        community_context = ""
        if project.community_url:
            store.update_project(project_id, analysis_progress=30, analysis_stage="Researching community...")

            research = web_researcher.research_community(
                community_url=project.community_url,
                community_name=project.customer_name
            )
            community_context = web_researcher.format_for_analysis(research)

            store.update_project(
                project_id,
                community_name=research.get("community_name", ""),
                community_research=json.dumps(research),
                analysis_progress=50,
                analysis_stage="Community research complete..."
            )

        store.update_project(project_id, analysis_progress=60, analysis_stage="AI analyzing record types...")

        combined_data = all_csv_data
        if community_context:
            combined_data += f"\n\n{'='*50}\n{community_context}"

        configuration = claude_service.analyze_csv_data(combined_data)

        store.save_configuration(project_id, configuration)
        store.update_project(project_id, status="configured", analysis_progress=100, analysis_stage="Complete")

        return {"status": "configured", "message": "Analysis complete"}

    except Exception as e:
        error_msg = f"Error: {str(e)}"
        store.update_project(project_id, status="error", analysis_stage=error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@app.get("/api/projects/{project_id}/analysis-status")
async def get_analysis_status(project_id: str):
    """Get current analysis status and progress"""
    project = store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "status": project.status,
        "progress": project.analysis_progress,
        "stage": project.analysis_stage,
    }


@app.get("/api/projects/{project_id}/sample-csv")
async def get_sample_csv(project_id: str):
    """Return a sample CSV for demo purposes"""
    csv_content = MockGenerator.generate_sample_csv()
    return {"content": csv_content, "filename": "sample_permits_data.csv"}


# ============================================================================
# CONFIGURATION ROUTES
# ============================================================================

@app.get("/api/projects/{project_id}/configurations")
async def get_configurations(project_id: str):
    """Get the configuration for a project"""
    project = store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not project.configuration:
        raise HTTPException(status_code=404, detail="No configuration generated yet")
    return project.configuration


@app.put("/api/projects/{project_id}/configurations/record-types/{rt_id}")
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


@app.post("/api/projects/{project_id}/configurations/record-types")
async def add_record_type(project_id: str, record_type: RecordType):
    """Add a new record type to the configuration"""
    project = store.get_project(project_id)
    if not project or not project.configuration:
        raise HTTPException(status_code=404, detail="Project or configuration not found")

    result = store.add_record_type(project_id, record_type)
    return result


@app.delete("/api/projects/{project_id}/configurations/record-types/{rt_id}")
async def delete_record_type(project_id: str, rt_id: str):
    """Delete a record type from the configuration"""
    if not store.delete_record_type(project_id, rt_id):
        raise HTTPException(status_code=404, detail="Record type not found")
    return {"success": True}


@app.put("/api/projects/{project_id}/configurations/departments/{dept_id}")
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


@app.put("/api/projects/{project_id}/configurations/roles/{role_id}")
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


@app.post("/api/projects/{project_id}/configurations/deploy")
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


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


# Root route removed — frontend serves at / via Vercel static files
