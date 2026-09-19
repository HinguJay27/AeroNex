"""
AeroNex ML Backend - FastAPI Server
Run: python -m app.main (uses uvicorn)
Or:  uvicorn app.main:app --host 0.0.0.0 --port 8000
"""
import uvicorn
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
