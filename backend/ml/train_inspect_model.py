"""
AgriIntel PhotoInspect ML Model
Gradient Boosting Classifier for herb quality/defect grading
Target: >= 95% accuracy
Features: color_score, texture_score, wilt_pct, damage_pct,
          moisture_pct, overall_score, days_remaining_est
Labels:   Premium, Good, Fair, Poor, Spoiled
Run: python backend/ml/train_inspect_model.py
"""
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score, classification_report
import joblib, os, random

random.seed(42)
np.random.seed(42)

FEATURES = ["color_score", "texture_score", "wilt_pct", "damage_pct",
            "moisture_pct", "overall_score", "days_remaining_est"]
CLASSES = ["Premium", "Good", "Fair", "Poor", "Spoiled"]


def _gauss(mu, sigma, lo, hi):
    return float(np.clip(np.random.normal(mu, sigma), lo, hi))


def generate_dataset(n=3000):
    X, y = [], []

    # Premium: vibrant colour, firm, zero defects
    for _ in range(int(n * 0.28)):
        color    = _gauss(92, 4,  82, 100)
        texture  = _gauss(91, 4,  80, 100)
        wilt     = _gauss(3,  2,  0,  10)
        damage   = _gauss(2,  2,  0,   8)
        moisture = _gauss(91, 4,  82, 100)
        overall  = _gauss(91, 3,  85, 100)
        days     = _gauss(5.5, 0.8, 4,  8)
        X.append([color, texture, wilt, damage, moisture, overall, days])
        y.append("Premium")

    # Good: slight cosmetic marks
    for _ in range(int(n * 0.25)):
        color    = _gauss(73, 5,  63, 85)
        texture  = _gauss(72, 5,  63, 84)
        wilt     = _gauss(12, 5,   4, 24)
        damage   = _gauss(10, 5,   3, 22)
        moisture = _gauss(78, 5,  68, 90)
        overall  = _gauss(73, 4,  65, 84)
        days     = _gauss(3.2, 0.6, 2, 5)
        X.append([color, texture, wilt, damage, moisture, overall, days])
        y.append("Good")

    # Fair: noticeable wilt / yellowing
    for _ in range(int(n * 0.22)):
        color    = _gauss(54, 6,  43, 66)
        texture  = _gauss(53, 6,  43, 65)
        wilt     = _gauss(28, 7,  16, 42)
        damage   = _gauss(25, 7,  13, 38)
        moisture = _gauss(63, 6,  52, 76)
        overall  = _gauss(53, 5,  45, 64)
        days     = _gauss(1.6, 0.5, 0.8, 2.8)
        X.append([color, texture, wilt, damage, moisture, overall, days])
        y.append("Fair")

    # Poor: significant yellowing / pest marks
    for _ in range(int(n * 0.15)):
        color    = _gauss(34, 6,  23, 46)
        texture  = _gauss(33, 6,  23, 45)
        wilt     = _gauss(50, 8,  35, 66)
        damage   = _gauss(47, 8,  32, 63)
        moisture = _gauss(47, 7,  35, 62)
        overall  = _gauss(33, 5,  25, 44)
        days     = _gauss(0.7, 0.3, 0.2, 1.4)
        X.append([color, texture, wilt, damage, moisture, overall, days])
        y.append("Poor")

    # Spoiled: rot, mold, severe damage
    for _ in range(int(n * 0.10)):
        color    = _gauss(14, 5,   3, 25)
        texture  = _gauss(13, 5,   3, 25)
        wilt     = _gauss(78, 8,  60, 97)
        damage   = _gauss(76, 9,  58, 97)
        moisture = _gauss(25, 8,  10, 44)
        overall  = _gauss(12, 5,   0, 24)
        days     = _gauss(0.2, 0.1, 0, 0.5)
        X.append([color, texture, wilt, damage, moisture, overall, days])
        y.append("Spoiled")

    return np.array(X, dtype=np.float32), np.array(y)


X, y = generate_dataset(3000)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.15, random_state=42, stratify=y
)

model = GradientBoostingClassifier(
    n_estimators=300,
    max_depth=4,
    learning_rate=0.08,
    subsample=0.85,
    min_samples_split=4,
    min_samples_leaf=2,
    max_features="sqrt",
    random_state=42,
)
model.fit(X_train, y_train)

y_pred  = model.predict(X_test)
acc     = accuracy_score(y_test, y_pred)
cv      = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(model, X, y, cv=cv, scoring="accuracy")

print("=" * 52)
print("AgriIntel PhotoInspect ML Model")
print("=" * 52)
print(f"  Test Accuracy  : {acc*100:.2f}%")
print(f"  CV Accuracy    : {cv_scores.mean()*100:.2f}% +/- {cv_scores.std()*100:.2f}%")
print(f"  Samples        : {len(X)}")
print(f"  Estimators     : 300 gradient-boosted trees")
print(f"  Classes        : {list(model.classes_)}")
print()
print(classification_report(y_test, y_pred))
print("=" * 52)

meta = {
    "features":  FEATURES,
    "classes":   list(model.classes_),
    "metrics": {
        "accuracy":    round(float(acc), 4),
        "cv_mean":     round(float(cv_scores.mean()), 4),
        "cv_std":      round(float(cv_scores.std()), 4),
        "n_samples":   len(X),
        "n_estimators": 300,
    },
}

out_dir = os.path.dirname(os.path.abspath(__file__))
joblib.dump(model, os.path.join(out_dir, "inspect_model.pkl"))
joblib.dump(meta,  os.path.join(out_dir, "inspect_meta.pkl"))
print(f"Saved -> inspect_model.pkl")
print(f"Saved -> inspect_meta.pkl")
