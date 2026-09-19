"""
CPCB India AQI calculator.
Computes sub-indices for each pollutant and takes the maximum as the AQI.
"""
import numpy as np

CPCB_BREAKPOINTS = {
    "pm25": [(0, 30, 0, 50), (31, 60, 51, 100), (61, 90, 101, 200), (91, 120, 201, 300), (121, 250, 301, 400), (251, 500, 401, 500)],
    "pm10": [(0, 50, 0, 50), (51, 100, 51, 100), (101, 250, 101, 200), (251, 350, 201, 300), (351, 430, 301, 400), (431, 600, 401, 500)],
    "no2":  [(0, 40, 0, 50), (41, 80, 51, 100), (81, 180, 101, 200), (181, 280, 201, 300), (281, 400, 301, 400), (401, 600, 401, 500)],
    "so2":  [(0, 40, 0, 50), (41, 80, 51, 100), (81, 380, 101, 200), (381, 800, 201, 300), (801, 1600, 301, 400), (1601, 2400, 401, 500)],
    "co":   [(0, 1, 0, 50), (1.1, 2, 51, 100), (2.1, 10, 101, 200), (10.1, 17, 201, 300), (17.1, 34, 301, 400), (34.1, 50, 401, 500)],
    "o3":   [(0, 50, 0, 50), (51, 100, 51, 100), (101, 168, 101, 200), (169, 208, 201, 300), (209, 748, 301, 400), (749, 1000, 401, 500)],
}


def sub_index(pollutant: str, concentration: float) -> float | None:
    bps = CPCB_BREAKPOINTS.get(pollutant)
    if not bps or concentration is None or np.isnan(concentration) or concentration < 0:
        return None
    for c_low, c_high, i_low, i_high in bps:
        if c_low <= concentration <= c_high:
            return round(((i_high - i_low) / (c_high - c_low)) * (concentration - c_low) + i_low)
    return bps[-1][3]


def calculate_aqi(pollutants: dict) -> float:
    indices = []
    for key in ["pm25", "pm10", "no2", "so2", "co", "o3"]:
        val = pollutants.get(key)
        if val is not None and not (isinstance(val, float) and np.isnan(val)):
            si = sub_index(key, val)
            if si is not None:
                indices.append(si)
    return max(indices) if indices else 0.0


def aqi_category(aqi: float) -> str:
    if aqi <= 50: return "Good"
    if aqi <= 100: return "Satisfactory"
    if aqi <= 200: return "Moderate"
    if aqi <= 300: return "Poor"
    if aqi <= 400: return "Very Poor"
    return "Severe"
