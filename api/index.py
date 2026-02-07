"""
Vercel serverless function entry point.
Wraps the FastAPI app to handle all /api/* routes.
"""
import sys
import os

# Add the backend directory to Python path so imports work
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend')
sys.path.insert(0, backend_dir)

# Now import the FastAPI app
from main import app

# Vercel expects the ASGI app to be named 'app' or 'handler'
# FastAPI is ASGI-native, so this works directly
handler = app
