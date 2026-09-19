"""
Fetch historical air quality + weather data from Open-Meteo APIs for model training.
"""
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import time
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app.aqi import calculate_aqi

OPEN_METEO_AQ = "https://air-quality-api.open-meteo.com/v1/air-quality"
OPEN_METEO_WEATHER = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_ARCHIVE_AQ = "https://air-quality-api.open-meteo.com/v1/air-quality"
OPEN_METEO_ARCHIVE_W = "https://archive-api.open-meteo.com/v1/archive"

AQ_PARAMS = "pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ozone"
WEATHER_PARAMS = "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,surface_pressure,cloud_cover"

STATIONS = [
    {"name": "New Delhi",   "lat": 28.6139, "lon": 77.2090},
    {"name": "North Delhi", "lat": 28.7041, "lon": 77.1025},
    {"name": "South Delhi", "lat": 28.5355, "lon": 77.2510},
    {"name": "East Delhi",  "lat": 28.6280, "lon": 77.2980},
    {"name": "West Delhi",  "lat": 28.6500, "lon": 77.1210},
    {"name": "Noida",       "lat": 28.5355, "lon": 77.3910},
    {"name": "Gurugram",    "lat": 28.4595, "lon": 77.0266},
    {"name": "Faridabad",   "lat": 28.4089, "lon": 77.3178},
    {"name": "Ghaziabad",   "lat": 28.6692, "lon": 77.4538},
]


def _fetch_with_retry(url: str, params: dict, max_retries: int = 3) -> dict:
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, params=params, timeout=60)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"  Failed after {max_retries} retries: {e}")
                return {}
            time.sleep(2)


def fetch_training_data(days: int = 365) -> pd.DataFrame:
    """Fetch historical hourly data for all stations, compute AQI, return combined DataFrame.
    Uses forecast API with past_days (max ~92 days per call) and chunks for longer ranges."""
    # Open-Meteo forecast API supports up to ~92 past_days per call
    chunk_days = min(days, 92)
    chunks = []
    remaining = days
    while remaining > 0:
        chunk = min(remaining, 92)
        chunks.append(chunk)
        remaining -= chunk

    all_data = []
    for station in STATIONS:
        print(f"  Fetching {station['name']} ({station['lat']}, {station['lon']})...")
        station_dfs = []
        for chunk in chunks:
            aq_data = _fetch_with_retry(OPEN_METEO_ARCHIVE_AQ, {
                "latitude": station["lat"], "longitude": station["lon"],
                "past_days": chunk,
                "hourly": AQ_PARAMS, "timezone": "Asia/Kolkata"
            })
            w_data = _fetch_with_retry(OPEN_METEO_WEATHER, {
                "latitude": station["lat"], "longitude": station["lon"],
                "past_days": chunk,
                "hourly": WEATHER_PARAMS, "timezone": "Asia/Kolkata"
            })
            if not aq_data or not w_data or "hourly" not in aq_data or "hourly" not in w_data:
                continue
            aq_h = aq_data["hourly"]
            w_h = w_data["hourly"]
            aq_times = aq_h.get("time", [])
            w_times = w_h.get("time", [])
            # Align by time - only keep timestamps present in both
            w_map = {t: i for i, t in enumerate(w_times)}
            common_idx = [(i, w_map[t]) for i, t in enumerate(aq_times) if t in w_map]
            if not common_idx:
                continue
            aq_idx = [c[0] for c in common_idx]
            w_idx = [c[1] for c in common_idx]
            n = len(common_idx)
            df = pd.DataFrame({
                "time": pd.to_datetime([aq_times[i] for i in aq_idx]),
                "station": station["name"],
                "lat": station["lat"], "lon": station["lon"],
                "pm25": [aq_h.get("pm2_5", [None]*len(aq_times))[i] for i in aq_idx],
                "pm10": [aq_h.get("pm10", [None]*len(aq_times))[i] for i in aq_idx],
                "no2": [aq_h.get("nitrogen_dioxide", [None]*len(aq_times))[i] for i in aq_idx],
                "so2": [aq_h.get("sulphur_dioxide", [None]*len(aq_times))[i] for i in aq_idx],
                "co": [round((aq_h.get("carbon_monoxide", [None]*len(aq_times))[i] or 0) / 1000, 4) for i in aq_idx],
                "o3": [aq_h.get("ozone", [None]*len(aq_times))[i] for i in aq_idx],
                "temperature": [w_h.get("temperature_2m", [None]*len(w_times))[i] for i in w_idx],
                "humidity": [w_h.get("relative_humidity_2m", [None]*len(w_times))[i] for i in w_idx],
                "wind_speed": [w_h.get("wind_speed_10m", [None]*len(w_times))[i] for i in w_idx],
                "wind_direction": [w_h.get("wind_direction_10m", [None]*len(w_times))[i] for i in w_idx],
                "precipitation": [w_h.get("precipitation", [None]*len(w_times))[i] for i in w_idx],
                "pressure": [w_h.get("surface_pressure", [None]*len(w_times))[i] for i in w_idx],
                "cloud_cover": [w_h.get("cloud_cover", [None]*len(w_times))[i] for i in w_idx],
            })
            station_dfs.append(df)
            time.sleep(1)
        if station_dfs:
            station_df = pd.concat(station_dfs).drop_duplicates(subset=["time", "station"]).sort_values("time")
            print(f"    Got {len(station_df)} rows")
            all_data.append(station_df)

    if not all_data:
        raise RuntimeError("No training data could be fetched")

    combined = pd.concat(all_data, ignore_index=True)
    combined = combined.sort_values(["station", "time"]).reset_index(drop=True)
    combined["aqi"] = combined.apply(
        lambda r: calculate_aqi({k: r[k] for k in ["pm25", "pm10", "no2", "so2", "co", "o3"]}), axis=1
    )
    combined = combined.dropna(subset=["aqi", "pm25", "pm10", "temperature", "humidity", "wind_speed"])
    combined = combined[combined["aqi"] > 0]
    print(f"  Total training rows: {len(combined)}")
    return combined


def fetch_current_data(lat: float, lon: float, station_name: str = "Unknown") -> dict:
    """Fetch current air quality + weather for a single station."""
    aq = _fetch_with_retry(OPEN_METEO_AQ, {
        "latitude": lat, "longitude": lon,
        "current": AQ_PARAMS, "timezone": "Asia/Kolkata"
    })
    weather = _fetch_with_retry(OPEN_METEO_WEATHER, {
        "latitude": lat, "longitude": lon,
        "current": WEATHER_PARAMS, "timezone": "Asia/Kolkata"
    })
    if not aq or not weather:
        return {}

    aq_c = aq.get("current", {})
    w_c = weather.get("current", {})
    pollutants = {
        "pm25": aq_c.get("pm2_5", 0), "pm10": aq_c.get("pm10", 0),
        "no2": aq_c.get("nitrogen_dioxide", 0), "so2": aq_c.get("sulphur_dioxide", 0),
        "co": round((aq_c.get("carbon_monoxide", 0) or 0) / 1000, 4), "o3": aq_c.get("ozone", 0),
    }
    return {
        "station": station_name, "lat": lat, "lon": lon,
        **pollutants,
        "temperature": w_c.get("temperature_2m", 0),
        "humidity": w_c.get("relative_humidity_2m", 0),
        "wind_speed": w_c.get("wind_speed_10m", 0),
        "wind_direction": w_c.get("wind_direction_10m", 0),
        "precipitation": w_c.get("precipitation", 0),
        "pressure": w_c.get("surface_pressure", 0),
        "cloud_cover": w_c.get("cloud_cover", 0),
        "aqi": calculate_aqi(pollutants),
        "updated_at": aq_c.get("time", datetime.now().isoformat()),
    }


def fetch_forecast_raw(lat: float, lon: float, hours: int = 72) -> dict:
    """Fetch raw hourly forecast from Open-Meteo (base data before ML adjustment)."""
    days = max(1, (hours // 24) + 1)
    aq = _fetch_with_retry(OPEN_METEO_AQ, {
        "latitude": lat, "longitude": lon,
        "hourly": AQ_PARAMS, "forecast_days": min(days + 1, 7),
        "timezone": "Asia/Kolkata"
    })
    weather = _fetch_with_retry(OPEN_METEO_WEATHER, {
        "latitude": lat, "longitude": lon,
        "hourly": WEATHER_PARAMS, "forecast_days": min(days + 1, 7),
        "timezone": "Asia/Kolkata"
    })
    if not aq or not weather:
        return {"hours": []}

    aq_h = aq["hourly"]
    w_h = weather["hourly"]
    times = aq_h.get("time", [])
    now = datetime.now().astimezone().timestamp() * 1000
    result = []
    for i, t in enumerate(times):
        ts = pd.to_datetime(t).timestamp() * 1000
        if ts < now - 3600000:
            continue
        pollutants = {
            "pm25": aq_h.get("pm2_5", [0]*len(times))[i] or 0,
            "pm10": aq_h.get("pm10", [0]*len(times))[i] or 0,
            "no2": aq_h.get("nitrogen_dioxide", [0]*len(times))[i] or 0,
            "so2": aq_h.get("sulphur_dioxide", [0]*len(times))[i] or 0,
            "co": round((aq_h.get("carbon_monoxide", [0]*len(times))[i] or 0) / 1000, 4),
            "o3": aq_h.get("ozone", [0]*len(times))[i] or 0,
        }
        aqi = calculate_aqi(pollutants)
        result.append({
            "time": t, "timestamp": ts,
            **pollutants, "aqi": aqi,
            "temperature": w_h.get("temperature_2m", [0]*len(times))[i] or 0,
            "humidity": w_h.get("relative_humidity_2m", [0]*len(times))[i] or 0,
            "wind_speed": w_h.get("wind_speed_10m", [0]*len(times))[i] or 0,
            "wind_direction": w_h.get("wind_direction_10m", [0]*len(times))[i] or 0,
            "precipitation": w_h.get("precipitation", [0]*len(times))[i] or 0,
            "pressure": w_h.get("surface_pressure", [0]*len(times))[i] or 0,
            "cloud_cover": w_h.get("cloud_cover", [0]*len(times))[i] or 0,
        })
        if len(result) >= hours:
            break
    return {"hours": result}
