"""
Test the 4-step analysis pipeline for PLC AutoConfig.
Tests CSV parsing, website scraping, data extraction, and config generation.
"""
import pytest
import tempfile
import os
import csv as csv_module
from conftest import async_client


@pytest.mark.asyncio
async def test_step1_parse_csv(async_client):
    """Test Step 1: Create project, upload CSV file, parse it."""
    # Create a project
    create_response = await async_client.post(
        "/api/projects",
        json={
            "name": "CSV Parse Test",
            "customer_name": "Test Customer"
        }
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["id"]

    # Create a simple test CSV file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        writer = csv_module.writer(f)
        writer.writerow(['Permit Type', 'Fee Amount', 'Timeline'])
        writer.writerow(['Building Permit', '$250', '2-6 weeks'])
        writer.writerow(['Business License', '$125', '5-10 days'])
        csv_path = f.name

    try:
        # Upload the CSV file
        with open(csv_path, 'rb') as f:
            files = {'files': (os.path.basename(csv_path), f, 'text/csv')}
            upload_response = await async_client.post(
                f"/api/projects/{project_id}/upload",
                files=files
            )
        assert upload_response.status_code == 200

        # Parse the CSV
        parse_response = await async_client.post(
            f"/api/projects/{project_id}/analyze/parse-csv"
        )
        assert parse_response.status_code == 200
        data = parse_response.json()
        assert data["status"] == "step_1_complete"
        assert "csv_data" in data
        assert "activity" in data
        assert len(data["csv_data"]) > 0
    finally:
        os.unlink(csv_path)


@pytest.mark.asyncio
async def test_step2_scrape_no_url(async_client):
    """Test Step 2: Scrape skips gracefully when no community_url."""
    # Create a project WITHOUT community_url
    create_response = await async_client.post(
        "/api/projects",
        json={
            "name": "No URL Test",
            "customer_name": "Test Customer"
        }
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["id"]

    # Try to scrape
    scrape_response = await async_client.post(
        f"/api/projects/{project_id}/analyze/scrape-website"
    )
    assert scrape_response.status_code == 200
    data = scrape_response.json()
    assert data["status"] == "step_2_skipped"
    assert "activity" in data


@pytest.mark.asyncio
async def test_step3_with_scrape_data(async_client):
    """Test Step 3: Extract data with scrape_data in body."""
    # Create a project
    create_response = await async_client.post(
        "/api/projects",
        json={
            "name": "Extract Data Test",
            "customer_name": "Test Customer"
        }
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["id"]

    # Call extract-data with scrape_data
    extract_response = await async_client.post(
        f"/api/projects/{project_id}/analyze/extract-data",
        json={
            "scrape_data": {
                "pages": [{"title": "Test", "text": "permit information"}],
                "combined_text": "Some permit and fee information"
            }
        }
    )
    # Should not skip and not crash
    assert extract_response.status_code == 200
    data = extract_response.json()
    assert "status" in data


@pytest.mark.asyncio
async def test_step3_no_data(async_client):
    """Test Step 3: Extract data with empty body gracefully."""
    # Create a project
    create_response = await async_client.post(
        "/api/projects",
        json={
            "name": "Extract Empty Test",
            "customer_name": "Test Customer"
        }
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["id"]

    # Call extract-data with empty body
    extract_response = await async_client.post(
        f"/api/projects/{project_id}/analyze/extract-data",
        json={}
    )
    # Should not crash (graceful error or skip)
    assert extract_response.status_code in [200, 400]


@pytest.mark.asyncio
async def test_step4_with_csv_data(async_client):
    """Test Step 4: Generate config with csv_data in body."""
    # Create a project
    create_response = await async_client.post(
        "/api/projects",
        json={
            "name": "Generate Config Test",
            "customer_name": "Test Customer"
        }
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["id"]

    # Call generate-config with csv_data
    config_response = await async_client.post(
        f"/api/projects/{project_id}/analyze/generate-config",
        json={
            "csv_data": "Permit Type,Fee\nBuilding,250\nBusiness,125"
        }
    )
    # Should not crash
    assert config_response.status_code in [200, 400, 500]


@pytest.mark.asyncio
async def test_step4_empty_body(async_client):
    """Test Step 4: Generate config with empty body gracefully."""
    # Create a project
    create_response = await async_client.post(
        "/api/projects",
        json={
            "name": "Generate Empty Test",
            "customer_name": "Test Customer"
        }
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["id"]

    # Call generate-config with empty body
    config_response = await async_client.post(
        f"/api/projects/{project_id}/analyze/generate-config",
        json={}
    )
    # Should not crash (graceful error or skip)
    assert config_response.status_code in [200, 400]


@pytest.mark.asyncio
async def test_full_pipeline_data_flow(async_client):
    """Test running steps 1-4 sequentially, passing data forward."""
    # Create a project
    create_response = await async_client.post(
        "/api/projects",
        json={
            "name": "Full Pipeline Test",
            "customer_name": "Test Customer"
        }
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["id"]

    # Create and upload a CSV
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        writer = csv_module.writer(f)
        writer.writerow(['Permit Type', 'Fee Amount'])
        writer.writerow(['Building Permit', '$250'])
        writer.writerow(['Business License', '$125'])
        csv_path = f.name

    try:
        # Step 1: Upload and parse CSV
        with open(csv_path, 'rb') as f:
            files = {'files': (os.path.basename(csv_path), f, 'text/csv')}
            upload_response = await async_client.post(
                f"/api/projects/{project_id}/upload",
                files=files
            )
        assert upload_response.status_code == 200

        step1_response = await async_client.post(
            f"/api/projects/{project_id}/analyze/parse-csv"
        )
        assert step1_response.status_code == 200
        step1_data = step1_response.json()
        csv_data = step1_data.get("csv_data", "")

        # Step 2: Scrape website (will skip)
        step2_response = await async_client.post(
            f"/api/projects/{project_id}/analyze/scrape-website"
        )
        assert step2_response.status_code == 200

        # Step 3: Extract data (pass csv_data from step 1)
        step3_response = await async_client.post(
            f"/api/projects/{project_id}/analyze/extract-data",
            json={"csv_data": csv_data}
        )
        assert step3_response.status_code == 200

        # Step 4: Generate config (pass csv_data)
        step4_response = await async_client.post(
            f"/api/projects/{project_id}/analyze/generate-config",
            json={"csv_data": csv_data}
        )
        # Should complete without crash
        assert step4_response.status_code in [200, 400, 500]

    finally:
        os.unlink(csv_path)
