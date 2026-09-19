"""
Load trained models and generate AQI forecasts using Ridge + Random Forest ensemble.
Features: AQI lags + weather lags + rolling stats + time features.
"""
import joblib
import os
import numpy as np
from datetime import datetime, timedelta
from app.aqi import aqi_category, calculate_aqi
from app.data_fetcher import fetch_forecast_raw, fetch_current_data

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
WEATHER_COLS = ["temperature", "humidity", "wind_speed", "wind_direction", "precipitation", "pressure", "cloud_cover"]
LAG_HOURS = [1, 2, 3, 6, 12, 24]
FORECAST_HORIZONS = [1, 2, 4, 6, 8, 12, 24]

_models_cache: dict = {}


def _load_models():
    if _models_cache:
        return _models_cache
    if not os.path.exists(MODELS_DIR):
        return {}
    meta_path = os.path.join(MODELS_DIR, "metadata.joblib")
    if not os.path.exists(meta_path):
        return {}
    _models_cache["metadata"] = joblib.load(meta_path)
    for h in FORECAST_HORIZONS:
        for prefix in ["ridge", "rf", "scaler"]:
            p = os.path.join(MODELS_DIR, f"{prefix}_{h}h.joblib")
            if os.path.exists(p):
                _models_cache[f"{prefix}_{h}"] = joblib.load(p)
    return _models_cache


def models_loaded() -> bool:
    cache = _load_models()
    return any(k.startswith("ridge_") for k in cache)


def get_model_info() -> dict:
    cache = _load_models()
    results = cache.get("metadata", {})
    meta = results.get("metadata", results) if isinstance(results, dict) else {}
    return {
        "loaded": models_loaded(),
        "trained_at": meta.get("trained_at"),
        "n_samples": meta.get("n_samples"),
        "stations": meta.get("stations", []),
        "horizons": FORECAST_HORIZONS,
        "models": ["Ridge Regression", "Random Forest"],
        "feature_count": len(meta.get("feature_cols", [])),
    }


def _build_feature_vector(aqi_history: list, weather_history: list, target_time: datetime) -> np.ndarray:
    """Build feature array from AQI history + weather history."""
    features = {}

    # AQI lags
    for lag in LAG_HOURS:
        idx = len(aqi_history) - lag
        features[f"aqi_lag{lag}"] = aqi_history[idx] if 0 <= idx < len(aqi_history) else (aqi_history[-1] if aqi_history else 0)

    # Weather lags
    for lag in LAG_HOURS:
        idx = len(weather_history) - lag
        for col in WEATHER_COLS:
            if 0 <= idx < len(weather_history):
                features[f"{col}_lag{lag}"] = weather_history[idx].get(col, 0)
            elif weather_history:
                features[f"{col}_lag{lag}"] = weather_history[-1].get(col, 0)
            else:
                features[f"{col}_lag{lag}"] = 0

    # Rolling AQI stats
    recent_aqi = aqi_history[-24:] if aqi_history else [0]
    features["aqi_roll_mean_6"] = float(np.mean(recent_aqi[-6:])) if len(recent_aqi) >= 1 else 0
    features["aqi_roll_std_6"] = float(np.std(recent_aqi[-6:])) if len(recent_aqi) > 1 else 0
    features["aqi_roll_mean_12"] = float(np.mean(recent_aqi[-12:])) if len(recent_aqi) >= 1 else 0
    features["aqi_roll_mean_24"] = float(np.mean(recent_aqi[-24:])) if len(recent_aqi) >= 1 else 0

    # Time features
    features["hour"] = target_time.hour
    features["day_of_week"] = target_time.weekday()
    features["month"] = target_time.month
    features["sin_hour"] = np.sin(2 * np.pi * target_time.hour / 24)
    features["cos_hour"] = np.cos(2 * np.pi * target_time.hour / 24)
    features["sin_dow"] = np.sin(2 * np.pi * target_time.weekday() / 7)
    features["cos_dow"] = np.cos(2 * np.pi * target_time.weekday() / 7)

    # Build ordered array
    aqi_lag_cols = [f"aqi_lag{l}" for l in LAG_HOURS]
    weather_lag_cols = [f"{c}_lag{l}" for l in LAG_HOURS for c in WEATHER_COLS]
    roll_cols = ["aqi_roll_mean_6", "aqi_roll_std_6", "aqi_roll_mean_12", "aqi_roll_mean_24"]
    time_cols = ["hour", "day_of_week", "month", "sin_hour", "cos_hour", "sin_dow", "cos_dow"]
    order = aqi_lag_cols + weather_lag_cols + roll_cols + time_cols
    return np.array([[features.get(c, 0) for c in order]])


def predict_aqi(lat: float, lon: float, station_name: str, hours: int = 24) -> dict:
    """Generate ML-enhanced AQI forecast for a station."""
    cache = _load_models()
    if not models_loaded():
        return {"error": "Models not trained", "station": station_name, "predictions": []}

    # Fetch raw forecast from Open-Meteo (provides weather forecast + base AQI)
    raw = fetch_forecast_raw(lat, lon, max(hours, 24))
    raw_hours = raw.get("hours", [])
    if not raw_hours:
        return {"error": "Could not fetch base forecast data", "station": station_name, "predictions": []}

    # Fetch current conditions for initial AQI
    current = fetch_current_data(lat, lon, station_name)
    current_aqi = current.get("aqi", 0) if current else (raw_hours[0].get("aqi", 0) if raw_hours else 0)

    # Build AQI history from raw hours (base AQI values from Open-Meteo)
    aqi_history = [h.get("aqi", current_aqi) for h in raw_hours[:max(LAG_HOURS)]]
    weather_history = raw_hours[:max(LAG_HOURS)]

    predictions = []
    for i, h in enumerate(raw_hours[:hours]):
        hour_offset = i + 1
        horizon = min(FORECAST_HORIZONS, key=lambda x: abs(x - hour_offset))
        if f"ridge_{horizon}" not in cache:
            horizon = max(h2 for h2 in FORECAST_HORIZONS if f"ridge_{h2}" in cache)

        target_time = datetime.fromisoformat(h["time"].replace("Z", "+00:00")).replace(tzinfo=None)
        X = _build_feature_vector(aqi_history, weather_history, target_time)

        scaler = cache.get(f"scaler_{horizon}")
        ridge_model = cache.get(f"ridge_{horizon}")
        rf_model = cache.get(f"rf_{horizon}")

        ridge_pred = 0
        rf_pred = 0
        if scaler and ridge_model:
            X_scaled = scaler.transform(X)
            ridge_pred = max(0, ridge_model.predict(X_scaled)[0])
        if rf_model:
            rf_pred = max(0, rf_model.predict(X)[0])

        # Ensemble: weighted average (RF gets more weight)
        ensemble_pred = round(0.35 * ridge_pred + 0.65 * rf_pred)
        base_aqi = h.get("aqi", 0)

        # Update history with our prediction for autoregressive forecasting
        aqi_history.append(ensemble_pred)
        weather_history = raw_hours[:max(max(LAG_HOURS), i + 1)]

        confidence = max(55, min(95, round(92 - hour_offset * 0.4)))

        predictions.append({
            "time": h["time"],
            "timestamp": h["timestamp"],
            "hour": target_time.strftime("%I:%M %p"),
            "base_aqi": base_aqi,
            "ridge_prediction": round(ridge_pred),
            "rf_prediction": round(rf_pred),
            "predicted_aqi": ensemble_pred,
            "category": aqi_category(ensemble_pred),
            "confidence": confidence,
            "pm25": h.get("pm25", 0), "pm10": h.get("pm10", 0),
            "no2": h.get("no2", 0), "so2": h.get("so2", 0),
            "co": h.get("co", 0), "o3": h.get("o3", 0),
            "temperature": h.get("temperature", 0), "humidity": h.get("humidity", 0),
            "wind_speed": h.get("wind_speed", 0), "precipitation": h.get("precipitation", 0),
        })

    return {
        "station": station_name, "lat": lat, "lon": lon,
        "model": "Ridge + Random Forest Ensemble",
        "current_aqi": current_aqi,
        "predictions": predictions,
    }
