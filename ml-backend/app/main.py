"""
FastAPI server for AeroNex ML backend.
Provides endpoints for current AQI, ML-powered forecasts, and model status.
"""
import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import threading
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.aqi import calculate_aqi, aqi_category
from app.data_fetcher import fetch_current_data, fetch_forecast_raw, STATIONS
from app.predict import predict_aqi, models_loaded, get_model_info

app = FastAPI(title="AeroNex ML API", version="1.0.0", description="Air Pollution–Weather Coupled Forecasting System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class StationRequest(BaseModel):
    lat: float
    lon: float
    name: str = "Unknown"
    hours: int = 24


@app.get("/")
def root():
    return {"service": "AeroNex ML API", "version": "1.0.0", "status": "running", "models_loaded": models_loaded()}


@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat(), "models_loaded": models_loaded()}


@app.get("/api/model-info")
def model_info():
    info = get_model_info()
    return {
        "loaded": info["loaded"],
        "trained_at": info.get("trained_at"),
        "n_samples": info.get("n_samples"),
        "stations": info.get("stations", []),
        "horizons": info.get("horizons", []),
        "models": info.get("models", []),
        "feature_count": len(info.get("features", [])),
    }


@app.get("/api/stations")
def stations():
    return {"stations": STATIONS}


@app.get("/api/current")
def current_aqi(lat: float, lon: float, name: str = "Unknown"):
    data = fetch_current_data(lat, lon, name)
    if not data:
        raise HTTPException(status_code=502, detail="Could not fetch current data from Open-Meteo")
    return data


@app.get("/api/current-all")
def current_all():
    results = []
    for s in STATIONS:
        data = fetch_current_data(s["lat"], s["lon"], s["name"])
        if data:
            results.append(data)
        time.sleep(0.3)
    return {"stations": results, "count": len(results)}


@app.get("/api/forecast")
def forecast(lat: float, lon: float, name: str = "Unknown", hours: int = 24):
    if not models_loaded():
        raise HTTPException(status_code=503, detail="ML models not trained. Run training first.")
    result = predict_aqi(lat, lon, name, hours)
    if "error" in result:
        raise HTTPException(status_code=502, detail=result["error"])
    return result


@app.get("/api/forecast-raw")
def forecast_raw(lat: float, lon: float, hours: int = 24):
    return fetch_forecast_raw(lat, lon, hours)


@app.post("/api/predict")
def predict(req: StationRequest):
    if not models_loaded():
        raise HTTPException(status_code=503, detail="ML models not trained")
    result = predict_aqi(req.lat, req.lon, req.name, req.hours)
    if "error" in result:
        raise HTTPException(status_code=502, detail=result["error"])
    return result


# Background model training trigger
_training = False
_training_status = {"status": "idle", "message": ""}


@app.get("/api/train-status")
def train_status():
    return _training_status


@app.post("/api/train")
def train_models_bg():
    global _training, _training_status
    if _training:
        return {"message": "Training already in progress", "status": _training_status}
    _training = True
    _training_status = {"status": "training", "message": "Fetching historical data..."}

    def run_training():
        global _training, _training_status
        try:
            from app.train import train_models
            _training_status = {"status": "training", "message": "Fetching 1 year of data from Open-Meteo..."}
            results = train_models()
            _training_status = {"status": "complete", "message": f"Trained {len(results.get('ridge', {}))} horizon models successfully"}
        except Exception as e:
            _training_status = {"status": "error", "message": str(e)}
        finally:
            _training = False

    thread = threading.Thread(target=run_training, daemon=True)
    thread.start()
    return {"message": "Training started in background", "status": "training"}
