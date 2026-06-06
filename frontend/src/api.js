import axios from "axios";
import { FALLBACK } from "./lib/fallback";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 8000,
});

API.interceptors.request.use((config) => {
  const raw = localStorage.getItem("pb_user");
  if (raw) {
    const user = JSON.parse(raw);
    config.headers["x-user-id"]    = user.uid   || "";
    config.headers["x-user-email"] = user.email || "";
    config.headers["x-user-name"]  = user.name  || "";
  }
  return config;
});

/* Map endpoint paths to fallback keys so pages always have data */
const FALLBACK_MAP = {
  "/kpis/":               FALLBACK.kpis,
  "/kpis":                FALLBACK.kpis,
  "/analytics/revenue":   FALLBACK.revenue,
  "/analytics/sales":     FALLBACK.revenue,
  "/analytics/overview":  FALLBACK.overview,
  "/analytics/crops":     FALLBACK.crops,
  "/analytics/benchmarks":FALLBACK.benchmarks,
  "/analytics/goals":     FALLBACK.goals,
  "/sensors/":            FALLBACK.sensors,
  "/freshness/":          FALLBACK.freshness,
  "/market/":             FALLBACK.market,
  "/waste/":              FALLBACK.waste,
  "/kpis/wow":            FALLBACK.wow,
  "/ai/insights":         FALLBACK.insights,
  "/ai/health-score":     FALLBACK.health,
  "/ai/forecast":         FALLBACK.forecast,
  "/ai/recommendations":  FALLBACK.recommendations,
  "/ai/demand-alerts":    FALLBACK.demandAlerts,
  "/ai/price-optimize":   FALLBACK.priceOptimize,
  "/ai/seasonal":         FALLBACK.seasonal,
  "/ai/anomaly":          FALLBACK.anomaly,
  "/waste/ai":            FALLBACK.wasteAI,
  "/feedback/":           [],
  "/feedback":            [],
};

API.interceptors.response.use(
  res => res,
  err => {
    const path = err.config?.url || "";
    const fb   = FALLBACK_MAP[path];
    if (fb !== undefined) {
      return Promise.resolve({ data: fb, _fallback: true });
    }
    return Promise.reject(err);
  }
);

export default API;
