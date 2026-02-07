import json
import os
from anthropic import Anthropic
from ..models.schemas import (
    Configuration, RecordType, Department, UserRole, FormField, WorkflowStep, Fee, RequiredDocument
)


class ClaudeService:
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.client = Anthropic(api_key=self.api_key) if self.api_key else None

    def is_available(self) -> bool:
        return self.client is not None and bool(self.api_key)

    def analyze_csv_data(self, csv_summary: str) -> Configuration:
        """Send CSV data to Claude for analysis, return Configuration"""
        if not self.is_available():
            from .mock_generator import MockGenerator
            return MockGenerator.generate_configuration()

        prompt = self._build_prompt(csv_summary)

        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8000,
            messages=[{"role": "user", "content": prompt}]
        )

        response_text = message.content[0].text
        # Extract JSON from response
        config_data = self._parse_response(response_text)
        return self._build_configuration(config_data)

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
            # Remove markdown code blocks
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
            # Try to find JSON object in text
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

            # Link to department
            if dept_id:
                for dept in departments:
                    if dept.id == dept_id:
                        dept.record_type_ids.append(record_type.id)

        from datetime import datetime
        return Configuration(
            record_types=record_types,
            departments=departments,
            user_roles=roles,
            generated_at=datetime.utcnow(),
            summary=data.get("summary", "Configuration generated from CSV analysis")
        )


claude_service = ClaudeService()
