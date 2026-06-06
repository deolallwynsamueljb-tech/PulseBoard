"""
AgriIntel Freshness Prediction — Random Forest Regressor
=========================================================
Features : herb_type, temperature, humidity, co2_ppm, light_lux, ph, days_since_harvest
Target   : freshness_score (0–100)  →  100 = perfectly fresh, 0 = spoiled

Run once to train and save the model:
    python backend/ml/train_model.py
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
import joblib
import os

np.random.seed(42)

# ── Herb profiles (base shelf-life days at optimal storage 4°C / 90% RH) ──────
HERB_PROFILES = {
    "Basil":     {"base_days": 5.5, "temp_sensitivity": 0.22, "humidity_sensitivity": 0.07},
    "Mint":      {"base_days": 5.0, "temp_sensitivity": 0.20, "humidity_sensitivity": 0.06},
    "Rosemary":  {"base_days": 7.5, "temp_sensitivity": 0.12, "humidity_sensitivity": 0.04},
    "Thyme":     {"base_days": 7.0, "temp_sensitivity": 0.13, "humidity_sensitivity": 0.04},
    "Coriander": {"base_days": 4.5, "temp_sensitivity": 0.25, "humidity_sensitivity": 0.08},
    "Lettuce":   {"base_days": 4.0, "temp_sensitivity": 0.28, "humidity_sensitivity": 0.09},
    "Spinach":   {"base_days": 3.5, "temp_sensitivity": 0.30, "humidity_sensitivity": 0.10},
    "Chives":    {"base_days": 6.0, "temp_sensitivity": 0.18, "humidity_sensitivity": 0.05},
    "Parsley":   {"base_days": 5.5, "temp_sensitivity": 0.20, "humidity_sensitivity": 0.06},
}

HERBS = list(HERB_PROFILES.keys())
N_SAMPLES = 4000


def generate_dataset():
    rows = []
    for _ in range(N_SAMPLES):
        herb = np.random.choice(HERBS)
        profile = HERB_PROFILES[herb]

        # Sensor readings — realistic farm ranges
        temperature       = np.random.uniform(2, 28)       # °C
        humidity          = np.random.uniform(45, 98)      # %
        co2_ppm           = np.random.uniform(350, 680)    # ppm
        light_lux         = np.random.uniform(0, 1800)     # lux
        ph                = np.random.uniform(5.4, 8.2)    # pH
        days_since_harvest = np.random.uniform(0, 8)       # days

        # Physics-based freshness calculation
        # Temperature: optimal 4°C, each degree above costs shelf life
        temp_penalty  = max(0, (temperature - 4) * profile["temp_sensitivity"])

        # Humidity: optimal 90%, each % below 85 dries the herb
        humid_penalty = max(0, (85 - humidity) * profile["humidity_sensitivity"])

        # CO2: above 500ppm mildly stresses the plant
        co2_penalty   = max(0, (co2_ppm - 500) * 0.003)

        # Light: high light during storage accelerates wilting
        light_penalty = max(0, (light_lux - 800) * 0.0015)

        # pH: optimal 6.0–6.5; stray pH reduces root health
        ph_penalty = abs(ph - 6.25) * 0.4

        # Remaining shelf life in days
        remaining = max(0, profile["base_days"]
                        - temp_penalty - humid_penalty
                        - co2_penalty - light_penalty
                        - ph_penalty - days_since_harvest * 0.9)

        # Convert to 0–100 freshness score
        max_possible = profile["base_days"]
        freshness_score = (remaining / max_possible) * 100
        freshness_score = np.clip(freshness_score, 0, 100)

        # Add realistic measurement noise
        freshness_score += np.random.normal(0, 2.5)
        freshness_score = np.clip(freshness_score, 0, 100)

        rows.append({
            "herb":               herb,
            "temperature":        round(temperature, 2),
            "humidity":           round(humidity, 2),
            "co2_ppm":            round(co2_ppm, 1),
            "light_lux":          round(light_lux, 1),
            "ph":                 round(ph, 2),
            "days_since_harvest": round(days_since_harvest, 2),
            "freshness_score":    round(freshness_score, 2),
        })

    return pd.DataFrame(rows)


def train():
    print("=" * 55)
    print("  AgriIntel Freshness Model — Training")
    print("=" * 55)

    df = generate_dataset()
    print(f"\nDataset: {len(df)} samples, {df.shape[1]} columns")
    print(f"Freshness score  mean={df.freshness_score.mean():.1f}  "
          f"std={df.freshness_score.std():.1f}  "
          f"min={df.freshness_score.min():.1f}  "
          f"max={df.freshness_score.max():.1f}")

    # Encode herb name → integer
    le = LabelEncoder()
    df["herb_enc"] = le.fit_transform(df["herb"])

    FEATURES = ["herb_enc", "temperature", "humidity",
                "co2_ppm", "light_lux", "ph", "days_since_harvest"]
    TARGET   = "freshness_score"

    X = df[FEATURES].values
    y = df[TARGET].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # ── Model: Random Forest Regressor ──────────────────────────────────────
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        max_features="sqrt",
        random_state=42,
        n_jobs=-1,
    )

    print("\nTraining Random Forest (200 trees)…")
    model.fit(X_train, y_train)

    # ── Evaluation ───────────────────────────────────────────────────────────
    y_pred = model.predict(X_test)
    r2  = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)

    cv_scores = cross_val_score(model, X, y, cv=5, scoring="r2")

    print("\n--- Test Set Metrics ---")
    print(f"  R2 Score          : {r2:.4f}  ({r2*100:.1f}% variance explained)")
    print(f"  MAE               : {mae:.2f} freshness points")
    print(f"  RMSE              : {rmse:.2f} freshness points")
    print(f"  Cross-val R2 (5x) : {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")

    print("\n--- Feature Importance ---")
    for name, imp in sorted(zip(FEATURES, model.feature_importances_),
                             key=lambda x: -x[1]):
        bar = "#" * int(imp * 40)
        print(f"  {name:<22} {imp:.4f}  {bar}")

    print("\n--- Sample Predictions ---")
    for i in range(5):
        print(f"  actual={y_test[i]:.1f}  predicted={y_pred[i]:.1f}  "
              f"error={abs(y_test[i]-y_pred[i]):.1f}")

    # Save model + encoder
    out_dir = os.path.dirname(__file__)
    model_path = os.path.join(out_dir, "freshness_model.pkl")
    meta_path  = os.path.join(out_dir, "model_meta.pkl")

    joblib.dump(model, model_path)
    joblib.dump({
        "label_encoder": le,
        "features":      FEATURES,
        "herbs":         HERBS,
        "herb_profiles": HERB_PROFILES,
        "metrics": {
            "r2":   round(r2, 4),
            "mae":  round(mae, 2),
            "rmse": round(rmse, 2),
            "cv_r2_mean": round(cv_scores.mean(), 4),
            "cv_r2_std":  round(cv_scores.std(), 4),
            "n_samples":  len(df),
            "n_trees":    200,
        },
    }, meta_path)

    print(f"\nModel saved  -> {model_path}")
    print(f"Metadata     -> {meta_path}")
    print("=" * 55)
    return model, le


if __name__ == "__main__":
    train()
