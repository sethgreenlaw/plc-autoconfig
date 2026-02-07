# PLC AutoConfig Backend - Quick Start Guide

## 30-Second Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. (Optional) Add API Key
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Anthropic API key
# ANTHROPIC_API_KEY=sk-ant-xxx...
```

**Note**: The app works great without an API key! It will use realistic demo data.

### 3. Start the Server
```bash
python main.py
```

Server runs at `http://localhost:8000`

## Try It Out

### Visit the API docs
Open your browser to: **http://localhost:8000/docs**

### Create a Project
```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "customer_name": "Test City",
    "product_type": "PLC"
  }'
```

Response:
```json
{
  "id": "abc123def456",
  "name": "Test Project",
  "customer_name": "Test City",
  "status": "setup",
  ...
}
```

### Get Sample CSV
```bash
curl "http://localhost:8000/api/projects/{project_id}/sample-csv" | jq '.content' > sample.csv
```

### Upload the CSV
```bash
curl -X POST http://localhost:8000/api/projects/{project_id}/upload \
  -F "files=@sample.csv"
```

### Analyze the Data
```bash
curl -X POST http://localhost:8000/api/projects/{project_id}/analyze
```

### Check Progress
```bash
curl http://localhost:8000/api/projects/{project_id}/analysis-status
```

Response shows progress and current stage:
```json
{
  "status": "analyzing",
  "progress": 55,
  "stage": "Extracting workflows and fees..."
}
```

Wait for progress to reach 100...

### Get the Generated Configuration
```bash
curl http://localhost:8000/api/projects/{project_id}/configurations | jq .
```

You'll get a complete PLC configuration with:
- 5 Record Types (Building Permits, Business Licenses, Code Violations, etc.)
- 4 Departments (Planning & Zoning, Business Licensing, Code Enforcement, Fire)
- 7 User Roles (Admin, Reviewer, Inspector, etc.)
- Complete workflows, form fields, fees, and documents for each type

## File Structure

```
backend/
├── main.py                 # Start here - FastAPI app
├── requirements.txt        # Python dependencies
├── app/
│   ├── models/
│   │   └── schemas.py     # All data models
│   ├── services/
│   │   ├── csv_parser.py      # Parse uploaded CSVs
│   │   ├── claude_service.py  # Claude AI integration
│   │   └── mock_generator.py  # Demo data (no API key needed!)
│   ├── storage/
│   │   └── in_memory.py   # Data storage
│   └── routes/
│       ├── projects.py    # Project endpoints
│       └── configuration.py   # Config endpoints
└── uploads/               # Where files are saved
```

## Key Features

### 1. Works Without API Key
- Without `ANTHROPIC_API_KEY`: Returns realistic demo configuration
- With API Key: Uses Claude Sonnet 4 to analyze your CSV

### 2. Complete Data Models
All models defined in `app/models/schemas.py`:
- Project, Configuration, RecordType
- Department, UserRole, FormField
- WorkflowStep, Fee, RequiredDocument

### 3. CSV Analysis
`app/services/csv_parser.py`:
- Parses any CSV
- Extracts columns, types, statistics
- Creates summary for AI analysis

### 4. Mock Data Generator
`app/services/mock_generator.py`:
- Generates realistic PLC data
- Sample CSV with 150+ permit records
- Demo configuration with 5 record types

### 5. Background Analysis
- Upload and analysis run in background
- Check progress with status endpoint
- No blocking of API

## API Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/projects` | POST | Create project |
| `/api/projects` | GET | List projects |
| `/api/projects/{id}` | GET | Get project details |
| `/api/projects/{id}/upload` | POST | Upload CSV files |
| `/api/projects/{id}/analyze` | POST | Start analysis |
| `/api/projects/{id}/analysis-status` | GET | Check progress |
| `/api/projects/{id}/configurations` | GET | Get configuration |
| `/api/projects/{id}/sample-csv` | GET | Get demo CSV |

## Example: Complete Workflow

```bash
#!/bin/bash

# 1. Create project
PROJECT=$(curl -s -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Springfield",
    "customer_name": "City of Springfield",
    "product_type": "PLC"
  }' | jq -r '.id')

echo "Created project: $PROJECT"

# 2. Get sample CSV
curl -s "http://localhost:8000/api/projects/$PROJECT/sample-csv" | jq -r '.content' > permits.csv

# 3. Upload CSV
curl -s -X POST "http://localhost:8000/api/projects/$PROJECT/upload" \
  -F "files=@permits.csv"

# 4. Start analysis
curl -s -X POST "http://localhost:8000/api/projects/$PROJECT/analyze"

# 5. Wait for completion
while true; do
  STATUS=$(curl -s "http://localhost:8000/api/projects/$PROJECT/analysis-status")
  PROGRESS=$(echo $STATUS | jq '.progress')
  STAGE=$(echo $STATUS | jq -r '.stage')
  echo "Progress: $PROGRESS% - $STAGE"
  if [ "$PROGRESS" == "100" ]; then break; fi
  sleep 2
done

# 6. Get configuration
curl "http://localhost:8000/api/projects/$PROJECT/configurations" | jq . > config.json

echo "Configuration saved to config.json"
```

## Common Issues

### ImportError: No module named 'fastapi'
```bash
pip install -r requirements.txt
```

### Port 8000 already in use
```bash
# Find and kill the process
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### FileNotFoundError: uploads directory
App auto-creates it on startup. Check permissions if error persists.

## Testing the Full System

### Without Frontend
The backend is fully functional on its own:
```bash
# Terminal 1: Start backend
python main.py

# Terminal 2: Run tests
python test_api.py
```

### With Frontend (when ready)
Connect a React/Vue frontend to `http://localhost:8000`
- The backend has CORS enabled for localhost:5173
- See `/docs` for all API endpoints

## Next Steps

1. **Review the code**: Start with `main.py`, then explore `app/`
2. **Try the API**: Use the `/docs` Swagger UI
3. **Understand the data**: Check `schemas.py` for all models
4. **Add Anthropic key**: Optional - Claude will enhance analysis
5. **Build the frontend**: Connect to these backend APIs

## Production Deployment

For production use:
1. Add database (PostgreSQL, MongoDB)
2. Add authentication (JWT, OAuth)
3. Add caching (Redis)
4. Use proper async I/O for files
5. Add logging and monitoring
6. Use environment-specific configs

See `README.md` for full details.

## Support

All code is well-commented. Key files:
- `main.py` - Application setup
- `app/models/schemas.py` - All data models
- `app/services/claude_service.py` - AI integration
- `app/storage/in_memory.py` - Data persistence

Happy configuring!
