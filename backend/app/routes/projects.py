from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List
import os
import json
from ..models.schemas import Project, CreateProjectRequest, UploadedFile
from ..storage.in_memory import store
from ..services.csv_parser import CSVParser
from ..services.claude_service import claude_service
from ..services.web_researcher import web_researcher

router = APIRouter(prefix="/api/projects", tags=["projects"])

# Use /tmp on Vercel, local dir otherwise
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/tmp/plc-uploads" if os.environ.get("VERCEL") else "uploads")


@router.post("", response_model=Project)
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


@router.get("", response_model=List[Project])
async def list_projects():
    """List all projects"""
    return store.list_projects()


@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """Get a specific project"""
    project = store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    if not store.delete_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return {"success": True}


@router.post("/{project_id}/upload")
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

        # Parse CSV to get metadata
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


@router.post("/{project_id}/research")
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


@router.get("/{project_id}/research")
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


@router.post("/{project_id}/analyze")
async def analyze_project(project_id: str):
    """Analyze a project's uploaded files synchronously"""
    project = store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not project.uploaded_files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    try:
        store.update_project(project_id, status="analyzing", analysis_progress=10, analysis_stage="Parsing CSV files...")

        # Read all CSV files
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

        # Community research
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

        # AI Analysis
        store.update_project(project_id, analysis_progress=60, analysis_stage="AI analyzing record types...")

        combined_data = all_csv_data
        if community_context:
            combined_data += f"\n\n{'='*50}\n{community_context}"

        configuration = claude_service.analyze_csv_data(combined_data)

        # Save configuration
        store.save_configuration(project_id, configuration)
        store.update_project(project_id, status="configured", analysis_progress=100, analysis_stage="Complete")

        return {"status": "configured", "message": "Analysis complete"}

    except Exception as e:
        error_msg = f"Error: {str(e)}"
        store.update_project(project_id, status="error", analysis_stage=error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/{project_id}/analysis-status")
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


@router.get("/{project_id}/sample-csv")
async def get_sample_csv(project_id: str):
    """Return a sample CSV for demo purposes"""
    from ..services.mock_generator import MockGenerator
    csv_content = MockGenerator.generate_sample_csv()
    return {"content": csv_content, "filename": "sample_permits_data.csv"}
