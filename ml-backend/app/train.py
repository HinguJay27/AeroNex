"""
Train Ridge Regression and Random Forest models for AQI forecasting.
Features: AQI lags + weather lags + rolling stats + time features.
Target: AQI at t+horizon.
"""
import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

from app.aqi import calculate_aqi
from app.data_fetcher import fetch_training_data

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
WEATHER_COLS = ["temperature", "humidity", "wind_speed", "wind_direction", "precipitation", "pressure", "cloud_cover"]
LAG_HOURS = [1, 2, 3, 6, 12, 24]
FORECAST_HORIZONS = [1, 2, 4, 6, 8, 12, 24]


def create_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create lagged AQI + weather features for time-series forecasting."""
    df = df.sort_values(["station", "time"]).reset_index(drop=True)
    result = df.copy()

    # AQI lags — the core time-series signal
    for lag in LAG_HOURS:
        result[f"aqi_lag{lag}"] = df.groupby("station")["aqi"].shift(lag)

    # Weather lags — external drivers
    for lag in LAG_HOURS:
        for col in WEATHER_COLS:
            result[f"{col}_lag{lag}"] = df.groupby("station")[col].shift(lag)

    # Rolling AQI statistics
    result["aqi_roll_mean_6"] = df.groupby("station")["aqi"].rolling(6, min_periods=1).mean().reset_index(0, drop=True)
    result["aqi_roll_std_6"] = df.groupby("station")["aqi"].rolling(6, min_periods=1).std().reset_index(0, drop=True).fillna(0)
    result["aqi_roll_mean_12"] = df.groupby("station")["aqi"].rolling(12, min_periods=1).mean().reset_index(0, drop=True)
    result["aqi_roll_mean_24"] = df.groupby("station")["aqi"].rolling(24, min_periods=1).mean().reset_index(0, drop=True)

    # Time features
    result["hour"] = result["time"].dt.hour
    result["day_of_week"] = result["time"].dt.dayofweek
    result["month"] = result["time"].dt.month
    result["sin_hour"] = np.sin(2 * np.pi * result["hour"] / 24)
    result["cos_hour"] = np.cos(2 * np.pi * result["hour"] / 24)
    result["sin_dow"] = np.sin(2 * np.pi * result["day_of_week"] / 7)
    result["cos_dow"] = np.cos(2 * np.pi * result["day_of_week"] / 7)

    return result


def create_target(df: pd.DataFrame, horizon: int) -> pd.Series:
    return df.groupby("station")["aqi"].shift(-horizon)


def get_feature_columns() -> list:
    aqi_lag_cols = [f"aqi_lag{l}" for l in LAG_HOURS]
    weather_lag_cols = [f"{c}_lag{l}" for l in LAG_HOURS for c in WEATHER_COLS]
    roll_cols = ["aqi_roll_mean_6", "aqi_roll_std_6", "aqi_roll_mean_12", "aqi_roll_mean_24"]
    time_cols = ["hour", "day_of_week", "month", "sin_hour", "cos_hour", "sin_dow", "cos_dow"]
    return aqi_lag_cols + weather_lag_cols + roll_cols + time_cols


def get_feature_matrix(df: pd.DataFrame) -> pd.DataFrame:
    cols = get_feature_columns()
    return df[cols].fillna(0)


def train_models():
    os.makedirs(MODELS_DIR, exist_ok=True)
    print("=== AeroNex ML Model Training ===")
    print("Fetching historical data from Open-Meteo...")
    df = fetch_training_data(days=90)
    print(f"Training data: {len(df)} rows across {df['station'].nunique()} stations")

    df = create_features(df)
    feature_cols = get_feature_columns()

    results = {"ridge": {}, "rf": {}, "metadata": {}}

    for horizon in FORECAST_HORIZONS:
        print(f"\n--- Training models for {horizon}h horizon ---")
        target = create_target(df, horizon)
        valid = target.notna()
        X = get_feature_matrix(df[valid])
        y = target[valid]

        if len(X) < 100:
            print(f"  Skipping {horizon}h - not enough data ({len(X)} rows)")
            continue

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

        # Ridge Regression with scaling
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        ridge = Ridge(alpha=1.0)
        ridge.fit(X_train_scaled, y_train)
        ridge_pred = ridge.predict(X_test_scaled)
        ridge_rmse = np.sqrt(mean_squared_error(y_test, ridge_pred))
        ridge_mae = mean_absolute_error(y_test, ridge_pred)
        ridge_r2 = r2_score(y_test, ridge_pred)
        print(f"  Ridge  - RMSE: {ridge_rmse:.1f}, MAE: {ridge_mae:.1f}, R2: {ridge_r2:.3f}")

        # Random Forest
        rf = RandomForestRegressor(n_estimators=100, max_depth=15, min_samples_split=5, random_state=42, n_jobs=-1)
        rf.fit(X_train, y_train)
        rf_pred = rf.predict(X_test)
        rf_rmse = np.sqrt(mean_squared_error(y_test, rf_pred))
        rf_mae = mean_absolute_error(y_test, rf_pred)
        rf_r2 = r2_score(y_test, rf_pred)
        print(f"  RF     - RMSE: {rf_rmse:.1f}, MAE: {rf_mae:.1f}, R2: {rf_r2:.3f}")

        joblib.dump(ridge, os.path.join(MODELS_DIR, f"ridge_{horizon}h.joblib"))
        joblib.dump(rf, os.path.join(MODELS_DIR, f"rf_{horizon}h.joblib"))
        joblib.dump(scaler, os.path.join(MODELS_DIR, f"scaler_{horizon}h.joblib"))

        results["ridge"][horizon] = {"rmse": ridge_rmse, "mae": ridge_mae, "r2": ridge_r2}
        results["rf"][horizon] = {"rmse": rf_rmse, "mae": rf_mae, "r2": rf_r2}

    results["metadata"]["trained_at"] = datetime.now().isoformat()
    results["metadata"]["feature_cols"] = feature_cols
    results["metadata"]["lag_hours"] = LAG_HOURS
    results["metadata"]["horizons"] = FORECAST_HORIZONS
    results["metadata"]["n_samples"] = len(df)
    results["metadata"]["stations"] = df["station"].unique().tolist()

    joblib.dump(results, os.path.join(MODELS_DIR, "metadata.joblib"))
    print("\n=== Training Complete ===")
    print(f"Models saved to {MODELS_DIR}")
    print(f"Trained {len(results['ridge'])} horizon models")
    return results


if __name__ == "__main__":
    train_models()
