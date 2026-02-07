#!/usr/bin/env python3
"""
Simple test script for PLC AutoConfig Backend API
Run after starting the server with: python main.py
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000"
TIMEOUT = 5


def test_health():
    """Test health endpoint"""
    print("\n1. Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=TIMEOUT)
        response.raise_for_status()
        print("✓ Health check passed")
        return True
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False


def test_create_project():
    """Test project creation"""
    print("\n2. Testing project creation...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/projects",
            json={
                "name": "Test Project",
                "customer_name": "Test Municipality",
                "product_type": "PLC"
            },
            timeout=TIMEOUT
        )
        response.raise_for_status()
        project = response.json()
        print(f"✓ Project created: {project['id']}")
        return project['id']
    except Exception as e:
        print(f"✗ Project creation failed: {e}")
        return None


def test_list_projects():
    """Test listing projects"""
    print("\n3. Testing list projects...")
    try:
        response = requests.get(f"{BASE_URL}/api/projects", timeout=TIMEOUT)
        response.raise_for_status()
        projects = response.json()
        print(f"✓ Found {len(projects)} project(s)")
        return True
    except Exception as e:
        print(f"✗ List projects failed: {e}")
        return False


def test_get_sample_csv(project_id):
    """Test getting sample CSV"""
    print("\n4. Testing sample CSV generation...")
    try:
        response = requests.get(
            f"{BASE_URL}/api/projects/{project_id}/sample-csv",
            timeout=TIMEOUT
        )
        response.raise_for_status()
        data = response.json()
        csv_lines = data['content'].split('\n')
        print(f"✓ Sample CSV generated: {len(csv_lines)} lines, {data['filename']}")
        return data['content']
    except Exception as e:
        print(f"✗ Sample CSV failed: {e}")
        return None


def test_upload_csv(project_id, csv_content):
    """Test CSV upload"""
    print("\n5. Testing CSV file upload...")
    try:
        files = {'files': ('test.csv', csv_content, 'text/csv')}
        response = requests.post(
            f"{BASE_URL}/api/projects/{project_id}/upload",
            files=files,
            timeout=TIMEOUT
        )
        response.raise_for_status()
        data = response.json()
        print(f"✓ CSV uploaded: {len(data['files'])} file(s)")
        for f in data['files']:
            print(f"  - {f['filename']}: {f['rows_count']} rows, {len(f['columns'])} columns")
        return True
    except Exception as e:
        print(f"✗ CSV upload failed: {e}")
        return False


def test_start_analysis(project_id):
    """Test starting analysis"""
    print("\n6. Testing analysis start...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/projects/{project_id}/analyze",
            timeout=TIMEOUT
        )
        response.raise_for_status()
        data = response.json()
        print(f"✓ Analysis started: {data['status']}")
        return True
    except Exception as e:
        print(f"✗ Analysis start failed: {e}")
        return False


def test_analysis_progress(project_id, max_wait=30):
    """Test monitoring analysis progress"""
    print(f"\n7. Testing analysis progress (waiting up to {max_wait}s)...")
    try:
        start_time = time.time()
        last_progress = 0

        while time.time() - start_time < max_wait:
            response = requests.get(
                f"{BASE_URL}/api/projects/{project_id}/analysis-status",
                timeout=TIMEOUT
            )
            response.raise_for_status()
            data = response.json()

            if data['progress'] > last_progress:
                print(f"  Progress: {data['progress']}% - {data['stage']}")
                last_progress = data['progress']

            if data['progress'] >= 100:
                print(f"✓ Analysis complete!")
                return True

            time.sleep(1)

        print(f"✗ Analysis did not complete within {max_wait}s")
        return False

    except Exception as e:
        print(f"✗ Progress check failed: {e}")
        return False


def test_get_configuration(project_id):
    """Test getting generated configuration"""
    print("\n8. Testing configuration retrieval...")
    try:
        response = requests.get(
            f"{BASE_URL}/api/projects/{project_id}/configurations",
            timeout=TIMEOUT
        )
        response.raise_for_status()
        config = response.json()

        print(f"✓ Configuration retrieved:")
        print(f"  - Record Types: {len(config['record_types'])}")
        print(f"  - Departments: {len(config['departments'])}")
        print(f"  - User Roles: {len(config['user_roles'])}")

        if config['record_types']:
            rt = config['record_types'][0]
            print(f"\n  First Record Type: {rt['name']}")
            print(f"    - Form Fields: {len(rt['form_fields'])}")
            print(f"    - Workflow Steps: {len(rt['workflow_steps'])}")
            print(f"    - Fees: {len(rt['fees'])}")
            print(f"    - Documents: {len(rt['required_documents'])}")

        return True

    except Exception as e:
        print(f"✗ Configuration retrieval failed: {e}")
        return False


def test_get_project(project_id):
    """Test getting project details"""
    print("\n9. Testing project details...")
    try:
        response = requests.get(
            f"{BASE_URL}/api/projects/{project_id}",
            timeout=TIMEOUT
        )
        response.raise_for_status()
        project = response.json()
        print(f"✓ Project details:")
        print(f"  - Name: {project['name']}")
        print(f"  - Status: {project['status']}")
        print(f"  - Customer: {project['customer_name']}")
        print(f"  - Files Uploaded: {len(project['uploaded_files'])}")
        print(f"  - Configuration Generated: {project['configuration'] is not None}")
        return True
    except Exception as e:
        print(f"✗ Project details failed: {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("PLC AutoConfig Backend - API Test Suite")
    print("=" * 60)

    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=2)
    except Exception as e:
        print(f"\n✗ Cannot connect to backend at {BASE_URL}")
        print(f"  Make sure the server is running: python main.py")
        print(f"  Error: {e}")
        sys.exit(1)

    # Run tests
    if not test_health():
        sys.exit(1)

    if not test_list_projects():
        sys.exit(1)

    project_id = test_create_project()
    if not project_id:
        sys.exit(1)

    csv_content = test_get_sample_csv(project_id)
    if not csv_content:
        sys.exit(1)

    if not test_upload_csv(project_id, csv_content):
        sys.exit(1)

    if not test_start_analysis(project_id):
        sys.exit(1)

    if not test_analysis_progress(project_id):
        sys.exit(1)

    if not test_get_configuration(project_id):
        sys.exit(1)

    if not test_get_project(project_id):
        sys.exit(1)

    # Summary
    print("\n" + "=" * 60)
    print("✓ All tests passed!")
    print("=" * 60)
    print(f"\nProject ID: {project_id}")
    print(f"API Docs: {BASE_URL}/docs")
    print(f"Try in browser: {BASE_URL}/docs")
    print()


if __name__ == "__main__":
    main()
