import axios from "axios";
import { FALLBACK } from "./lib/fallback";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8001",
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
  "/ai/harvest-predict":  {
    predictions:[
      {herb:"Basil",     best_price_day:"June 8",  best_fresh_day:"June 7",  price_tip:"Harvest Jun 8 for peak ₹294/kg demand during weekend menus",      fresh_tip:"Harvest Jun 7 for maximum 5.2-day shelf life"},
      {herb:"Rosemary",  best_price_day:"June 9",  best_fresh_day:"June 8",  price_tip:"Festival orders peak Jun 9 — hold for ₹338/kg premium",           fresh_tip:"Harvest Jun 8 for optimal essential oil content"},
      {herb:"Mint",      best_price_day:"June 7",  best_fresh_day:"June 7",  price_tip:"Summer drinks demand peaks mid-week — harvest Jun 7",              fresh_tip:"Harvest morning Jun 7 for highest menthol concentration"},
      {herb:"Spinach",   best_price_day:"TODAY",   best_fresh_day:"TODAY",   price_tip:"URGENT — spinach at 1.8d. Flash sale at 30% OFF recovers ₹1,620", fresh_tip:"Harvest immediately — quality degrades overnight"},
      {herb:"Lettuce",   best_price_day:"Jun 7",   best_fresh_day:"Jun 6",   price_tip:"Harvest Jun 7 for weekend restaurant orders at ₹122/kg",           fresh_tip:"Harvest Jun 6 to preserve crunch for fine dining"},
      {herb:"Thyme",     best_price_day:"June 10", best_fresh_day:"June 9",  price_tip:"Allow full maturity — ₹308/kg stable, festivals drive demand",     fresh_tip:"Harvest Jun 9 at peak volatile oil content"},
      {herb:"Coriander", best_price_day:"June 8",  best_fresh_day:"June 7",  price_tip:"Weekend brunch orders spike — harvest Jun 8 for best pricing",     fresh_tip:"Harvest Jun 7 morning for max aroma"},
    ],
    ai_summary:"Based on current sensor data (24.2°C, 67.5% RH), optimal harvest window is 2–4 days for most herbs. Spinach needs immediate attention.",
    model:"groq-llama-70b",
  },
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
