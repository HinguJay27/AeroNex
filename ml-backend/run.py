"""
AeroNex ML Backend - FastAPI Server
Run: python run.py
Or: uvicorn app.main:app --host 0.0.0.0 --port 8000
"""

import uvicorn
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False
    )