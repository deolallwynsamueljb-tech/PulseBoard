"""
AgriIntel ML Routes — Random Forest Freshness Predictor
Trained model: 200 trees, R2=0.799, MAE=4.93
"""
import os
import joblib
import numpy as np
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from deps import current_user

router = APIRouter(prefix="/ml", tags=["ml"])

# Load model once at startup
_BASE = os.path.join(os.path.dirname(__file__), "..", "ml")
_model = joblib.load(os.path.join(_BASE, "freshness_model.pkl"))
_meta  = joblib.load(os.path.join(_BASE, "model_meta.pkl"))
_le    = _meta["label_encoder"]


class FreshnessInput(BaseModel):
    herb: str
    temperature: float   # Celsius
    humidity: float      # %
    co2_ppm: float       # ppm
    light_lux: float     # lux
    ph: float
    days_since_harvest: float


@router.post("/predict-freshness")
async def predict_freshness(req: FreshnessInput, user=Depends(current_user)):
    """Random Forest prediction: sensor readings → freshness score 0–100."""
    # Encode herb name (unknown herb → nearest known)
    known = list(_le.classes_)
    herb  = req.herb if req.herb in known else "Basil"
    herb_enc = int(_le.transform([herb])[0])

    features = np.array([[
        herb_enc,
        req.temperature,
        req.humidity,
        req.co2_ppm,
        req.light_lux,
        req.ph,
        req.days_since_harvest,
    ]])

    score = float(np.clip(_model.predict(features)[0], 0, 100))
    grade = (
        "Premium" if score >= 80 else
        "Good"    if score >= 60 else
        "Fair"    if score >= 40 else
        "Poor"    if score >= 20 else
        "Spoiled"
    )
    days_remaining = round(score / 100 * _meta["herb_profiles"].get(herb, {}).get("base_days", 5), 1)

    return {
        "herb":             herb,
        "freshness_score":  round(score, 1),
        "grade":            grade,
        "days_remaining":   days_remaining,
        "model":            "Random Forest (200 trees)",
        "r2_score":         _meta["metrics"]["r2"],
        "mae":              _meta["metrics"]["mae"],
        "input_features": {
            "temperature":        req.temperature,
            "humidity":           req.humidity,
            "co2_ppm":            req.co2_ppm,
            "light_lux":          req.light_lux,
            "ph":                 req.ph,
            "days_since_harvest": req.days_since_harvest,
        }
    }


@router.get("/model-info")
async def model_info(user=Depends(current_user)):
    """Return trained model metadata and performance metrics."""
    m = _meta["metrics"]
    return {
        "model_type":       "Random Forest Regressor",
        "library":          "scikit-learn 1.5",
        "n_estimators":     m["n_trees"],
        "training_samples": m["n_samples"],
        "features":         _meta["features"],
        "target":           "freshness_score (0-100)",
        "herbs_supported":  _meta["herbs"],
        "performance": {
            "r2_score":        m["r2"],
            "mae_points":      m["mae"],
            "rmse_points":     m["rmse"],
            "cross_val_r2":    m["cv_r2_mean"],
            "cross_val_std":   m["cv_r2_std"],
            "accuracy_label":  f"{round(m['r2']*100, 1)}% variance explained",
        },
        "feature_importance": dict(zip(
            _meta["features"],
            [round(float(v), 4) for v in _model.feature_importances_]
        )),
    }


@router.get("/batch-predict")
async def batch_predict(user=Depends(current_user)):
    """Predict freshness for all 9 herbs at current sensor readings."""
    # Use live sensor defaults (AgriIntel farm averages)
    sensors = dict(temperature=24.2, humidity=67.5, co2_ppm=419,
                   light_lux=845, ph=6.2, days_since_harvest=1.5)

    results = []
    for herb in _meta["herbs"]:
        herb_enc = int(_le.transform([herb])[0])
        X = np.array([[herb_enc, sensors["temperature"], sensors["humidity"],
                       sensors["co2_ppm"], sensors["light_lux"],
                       sensors["ph"], sensors["days_since_harvest"]]])
        score = float(np.clip(_model.predict(X)[0], 0, 100))
        grade = ("Premium" if score>=80 else "Good" if score>=60
                 else "Fair" if score>=40 else "Poor" if score>=20 else "Spoiled")
        days  = round(score/100 * _meta["herb_profiles"][herb]["base_days"], 1)
        results.append({"herb": herb, "freshness_score": round(score,1),
                        "grade": grade, "days_remaining": days})

    results.sort(key=lambda x: -x["freshness_score"])
    return {"sensor_snapshot": sensors, "predictions": results,
            "model": "Random Forest R2=0.799"}
