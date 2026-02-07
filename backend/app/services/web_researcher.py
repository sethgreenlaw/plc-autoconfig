import os
import json
from typing import Optional


class WebResearcher:
    """Researches local government websites to gather ordinances, fees, and processes."""

    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "")

    def research_community(self, community_url: str, community_name: str = "") -> dict:
        """Research a community's government website for PLC configuration data.
        Returns dict with: fees, ordinances, departments, processes, permits, documents_required
        """
        # For prototype, return mock research data
        # In production, this would:
        # 1. Crawl the community website
        # 2. Find pages about permits, fees, ordinances
        # 3. Extract structured data
        # 4. Use Claude to summarize and structure findings

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
