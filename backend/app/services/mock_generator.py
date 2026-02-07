from datetime import datetime
import random
from ..models.schemas import (
    Configuration, RecordType, Department, UserRole, FormField, WorkflowStep, Fee, RequiredDocument, Condition
)


class MockGenerator:
    @staticmethod
    def generate_configuration() -> Configuration:
        # Create departments
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

        # Building Permit
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

        # Business License
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

        # Code Violation
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

        # Encroachment Permit
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

        # Fire Permit
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

        # Update department record_type_ids
        planning.record_type_ids = ["rt_bldg", "rt_enc"]
        licensing.record_type_ids = ["rt_bus"]
        enforcement.record_type_ids = ["rt_code"]
        fire.record_type_ids = ["rt_fire"]

        # User Roles
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
