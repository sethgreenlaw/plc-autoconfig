# PLC AutoConfig Backend

FastAPI backend for the PLC AutoConfig application - an AI-powered tool for generating PLC (Permitting, Licensing, and Code Enforcement) software configurations from customer CSV data.

## Features

- **Project Management**: Create and manage PLC configuration projects
- **CSV Upload**: Upload customer historical records in CSV format
- **AI Analysis**: Leverage Claude AI to analyze data and generate configurations
- **Configuration Management**: Edit and refine generated configurations
- **Mock Mode**: Works without API key using realistic demo data
- **RESTful API**: Complete REST API for all operations

## Project Structure

```
backend/
├── app/
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py          # Pydantic models for all data
│   ├── services/
│   │   ├── __init__.py
│   │   ├── csv_parser.py       # CSV parsing and analysis
│   │   ├── claude_service.py   # Claude AI integration
│   │   └── mock_generator.py   # Demo data generator
│   ├── storage/
│   │   ├── __init__.py
│   │   └── in_memory.py        # In-memory data store
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── projects.py         # Project endpoints
│   │   └── configuration.py    # Configuration endpoints
│   └── __init__.py
├── main.py                      # FastAPI application entry point
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variables template
├── uploads/                     # Directory for uploaded CSV files
└── README.md                    # This file
```

## Installation

### 1. Create virtual environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key (optional - app works without it):
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Running the Server

### Development

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload
```

Server will start at `http://localhost:8000`

### Production

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once running, visit:
- **Interactive API Docs**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc

## API Endpoints

### Projects

- `POST /api/projects` - Create a new project
- `GET /api/projects` - List all projects
- `GET /api/projects/{project_id}` - Get project details
- `DELETE /api/projects/{project_id}` - Delete a project

### File Upload & Analysis

- `POST /api/projects/{project_id}/upload` - Upload CSV files
- `POST /api/projects/{project_id}/analyze` - Start AI analysis
- `GET /api/projects/{project_id}/analysis-status` - Get analysis progress
- `GET /api/projects/{project_id}/sample-csv` - Get sample CSV

### Configuration

- `GET /api/projects/{project_id}/configurations` - Get configuration
- `PUT /api/projects/{project_id}/configurations/record-types/{rt_id}` - Update record type
- `POST /api/projects/{project_id}/configurations/record-types` - Add record type
- `DELETE /api/projects/{project_id}/configurations/record-types/{rt_id}` - Delete record type
- `PUT /api/projects/{project_id}/configurations/departments/{dept_id}` - Update department
- `PUT /api/projects/{project_id}/configurations/roles/{role_id}` - Update role
- `POST /api/projects/{project_id}/configurations/deploy` - Deploy configuration (placeholder)

## Data Models

### Project
- **id**: Unique project identifier
- **name**: Project name
- **customer_name**: Customer/municipality name
- **product_type**: Type of product (default: "PLC")
- **status**: Current status (setup, uploading, analyzing, configured, deployed)
- **created_at**: Creation timestamp
- **updated_at**: Last update timestamp
- **uploaded_files**: List of uploaded files with metadata
- **configuration**: Generated PLC configuration
- **analysis_progress**: Progress percentage (0-100)
- **analysis_stage**: Current analysis stage description

### Configuration
Contains:
- **record_types**: List of permit/license types (Building Permits, Business Licenses, etc.)
- **departments**: Organizational departments
- **user_roles**: User roles with permissions
- **generated_at**: Configuration generation timestamp
- **summary**: Brief summary of configuration

### Record Type
- **name**: Record type name
- **description**: Detailed description
- **category**: Type (permit, license, code_enforcement, inspection)
- **form_fields**: Application form fields
- **workflow_steps**: Processing workflow stages
- **fees**: Associated fees and charges
- **required_documents**: Required supporting documents

## Features

### CSV Upload
Upload customer CSV data with permit/license records. The system parses:
- Column names and data types
- Data patterns and statistics
- Sample rows for AI analysis

### AI Analysis
Using Claude Sonnet, the system:
1. Analyzes CSV structure and content
2. Identifies record types and patterns
3. Generates realistic workflows
4. Creates form field specifications
5. Defines fee schedules
6. Documents requirements

### Mock Mode
Without an API key, the system provides:
- Realistic demo PLC configuration
- 5 complete record types with all details
- 4 departments with proper organization
- 7 user roles with permissions
- Sample CSV with 150+ rows

## Usage Example

### 1. Create a Project
```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "City of Springfield",
    "customer_name": "Springfield",
    "product_type": "PLC"
  }'
```

### 2. Upload CSV
```bash
curl -X POST http://localhost:8000/api/projects/{project_id}/upload \
  -F "files=@permits.csv"
```

### 3. Start Analysis
```bash
curl -X POST http://localhost:8000/api/projects/{project_id}/analyze
```

### 4. Monitor Progress
```bash
curl http://localhost:8000/api/projects/{project_id}/analysis-status
```

### 5. Get Configuration
```bash
curl http://localhost:8000/api/projects/{project_id}/configurations
```

## Configuration Options

### Environment Variables
- `ANTHROPIC_API_KEY`: Claude API key (optional)
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)

### CORS Settings
Currently allows:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative dev server)
- `http://127.0.0.1:5173`

Modify in `main.py` for production URLs.

## Storage

Data is stored in-memory and will be lost when the server restarts. For production:
1. Implement persistent storage (PostgreSQL, MongoDB, etc.)
2. Modify `app/storage/in_memory.py` to use a database backend
3. Add migration utilities

## Development

### Code Structure
- **Pydantic models**: Type validation and serialization
- **In-memory store**: Simple persistence layer (implement DB as needed)
- **CSV parser**: Analyzes data structure and content
- **Claude service**: Wraps Anthropic API with fallback
- **Mock generator**: Creates realistic demo data

### Testing
Create `test_api.py`:
```python
import requests

BASE_URL = "http://localhost:8000"

# Test health check
response = requests.get(f"{BASE_URL}/health")
print(response.json())
```

### Extending the System
1. **Add database backend**: Implement persistent storage
2. **Add authentication**: JWT tokens or OAuth
3. **Add export formats**: Generate JSON/YAML/XML configs
4. **Webhook support**: Notify frontend of progress updates
5. **Batch operations**: Process multiple projects

## Troubleshooting

### Port Already in Use
```bash
# Find process on port 8000
lsof -i :8000
# Kill it
kill -9 <PID>
```

### Upload File Size Limit
Increase in `main.py`:
```python
app.add_middleware(
    RequestSizeMiddleware,
    max_size=50 * 1024 * 1024  # 50MB
)
```

### Claude API Errors
- Check API key in `.env`
- Verify account has available credits
- Check rate limits
- Falls back to mock mode automatically

## Performance Notes

- **File Upload**: CSV parsing happens synchronously during upload
- **Analysis**: Runs in background task, doesn't block API
- **Storage**: In-memory store suitable for ~1000 projects
- **Scaling**: Consider async database for >100 concurrent projects

## Dependencies

- **fastapi**: Modern async web framework
- **uvicorn**: ASGI server
- **pydantic**: Data validation and serialization
- **anthropic**: Claude API client
- **python-multipart**: File upload support
- **python-dotenv**: Environment configuration
- **aiofiles**: Async file operations

## License

Internal use - Springfield PLC AutoConfig System

## Support

For issues or questions, contact the development team.
