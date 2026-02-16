# PLC AutoConfig Test Suite

Comprehensive automated tests for the PLC AutoConfig application. All 36 tests pass successfully.

## Test Files Overview

### 1. conftest.py
**Setup and Fixtures**
- Configures pytest and pytest-asyncio
- Provides `async_client` fixture using httpx AsyncClient with ASGI transport
- Sets up test environment variables

### 2. test_projects.py (6 tests)
**Project CRUD Operations**
- `test_create_project`: Create new project with valid data, verify response includes project_id
- `test_create_project_with_community_url`: Create project with community_url, verify persistence
- `test_get_project`: Create then fetch project, verify data integrity
- `test_get_nonexistent_project`: Fetch non-existent project, expect 404
- `test_list_projects`: Create multiple projects, list all, verify count
- `test_delete_project`: Delete project and verify operation succeeds

### 3. test_analysis_pipeline.py (7 tests)
**4-Step Analysis Pipeline**
- `test_step1_parse_csv`: Create project, upload CSV, parse it, verify csv_data response
- `test_step2_scrape_no_url`: Create project without community_url, verify graceful skip (step_2_skipped)
- `test_step3_with_scrape_data`: POST extract-data with scrape_data, verify no skip
- `test_step3_no_data`: POST extract-data with empty body, verify graceful error handling
- `test_step4_with_csv_data`: POST generate-config with csv_data, verify no crash
- `test_step4_empty_body`: POST generate-config with empty body, verify graceful error
- `test_full_pipeline_data_flow`: Run all 4 steps sequentially, passing data forward like frontend

### 4. test_crash_regression.py (11 tests)
**Bug Fix Regression Tests**
These tests ensure previously fixed crash-prone code handles edge cases:
- `test_format_for_analysis_missing_keys`: WebResearcher.format_for_analysis with incomplete dict
- `test_format_for_analysis_empty_research`: format_for_analysis with empty dict
- `test_format_for_analysis_with_special_chars`: format_for_analysis with special characters
- `test_sanitize_to_ascii_cyrillic`: _sanitize_to_ascii converts Cyrillic to ASCII
- `test_sanitize_to_ascii_mixed`: _sanitize_to_ascii with mixed Cyrillic and special chars
- `test_sanitize_to_ascii_empty`: _sanitize_to_ascii with empty string
- `test_sanitize_to_ascii_none`: _sanitize_to_ascii with None input
- `test_sanitize_to_ascii_long_text`: _sanitize_to_ascii with very long text (~140KB)
- `test_sanitize_to_ascii_special_chars`: Common special characters (©, ®, —, °, etc.)
- `test_sanitize_to_ascii_unicode_urls`: Unicode in URLs
- `test_format_for_analysis_all_fields`: format_for_analysis with all possible fields

### 5. test_scraping.py (12 tests)
**Scraping Infrastructure Tests**
- `test_scrape_url_prioritization`: Verify URL prioritization mechanism
- `test_content_relevance_scoring`: Verify keyword-based scoring
- `test_combined_text_limit`: Test 150K character cap for combined_text
- `test_scrape_url_validation`: URL validation and formatting
- `test_scrape_page_relevance_calculation`: Relevance scoring logic
- `test_scraped_data_structure`: Verify expected data structure
- `test_empty_scraped_content_handling`: Handle empty/minimal content
- `test_special_characters_in_scraped_text`: Handle Unicode and special chars
- `test_duplicate_page_handling`: Duplicate page de-duplication
- `test_url_normalization`: URL consistency
- `test_robots_txt_compliance`: robots.txt directives
- `test_rate_limiting_awareness`: Rate limiting considerations

## Running Tests

### Run all tests
```bash
cd /sessions/intelligent-nice-ritchie/mnt/Applications/plc-autoconfig
python3 -m pytest tests/ -v
```

### Run specific test file
```bash
python3 -m pytest tests/test_projects.py -v
```

### Run specific test
```bash
python3 -m pytest tests/test_projects.py::test_create_project -v
```

### Run with coverage
```bash
python3 -m pytest tests/ -v --cov=api --cov-report=html
```

### Run with detailed output
```bash
python3 -m pytest tests/ -vv --tb=short
```

## Test Statistics

- **Total Tests**: 36
- **Passed**: 36 (100%)
- **Failed**: 0
- **Errors**: 0
- **Total Lines**: 830

### Test Distribution
- Project CRUD: 6 tests
- Analysis Pipeline: 7 tests
- Crash Regression: 11 tests
- Scraping: 12 tests

## Key Testing Patterns

### Async Testing
All tests use `@pytest.mark.asyncio` decorator for async/await support:
```python
@pytest.mark.asyncio
async def test_example(async_client):
    response = await async_client.post("/api/projects", json={...})
    assert response.status_code == 200
```

### Fixture Usage
The `async_client` fixture provides an authenticated HTTP client:
```python
async def test_example(async_client):
    # Make requests as if through the API
    response = await async_client.get("/api/projects")
```

### File Uploads
Tests handle CSV uploads using temporary files:
```python
with tempfile.NamedTemporaryFile(mode='w', suffix='.csv') as f:
    # Write test data
    # Upload via async_client.post(..., files={...})
```

### Data Flow Testing
Pipeline tests verify data flows correctly between steps:
```python
step1_response = await async_client.post(".../parse-csv")
csv_data = step1_response.json().get("csv_data")
step2_response = await async_client.post(".../extract-data",
    json={"csv_data": csv_data})
```

## Environment Setup

Tests require:
- Python 3.10+
- pytest >= 9.0
- pytest-asyncio >= 1.3
- httpx >= 0.20
- FastAPI (via api/index.py)

Installation:
```bash
pip install pytest pytest-asyncio httpx
```

## Notes

1. **Storage**: Tests use the in-memory store with /tmp file fallback (KV not required)
2. **API Key**: Test environment sets dummy ANTHROPIC_API_KEY
3. **Isolation**: Each test creates its own project to avoid conflicts
4. **Graceful Handling**: Tests verify the app doesn't crash on edge cases, even if errors are returned

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- No external service dependencies
- No network calls required (uses local file storage)
- Deterministic results
- Fast execution (~0.6s for all 36 tests)

## Future Enhancements

Possible additions:
- Performance benchmarking tests
- Load testing for concurrent requests
- Integration tests with real Claude API (when ANTHROPIC_API_KEY available)
- End-to-end workflow tests with realistic data
- Database schema migration tests
