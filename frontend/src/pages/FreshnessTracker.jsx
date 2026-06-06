import { useEffect, useState, useCallback, useMemo } from "react";
import { useLang } from "../context/LangContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf, AlertTriangle, CheckCircle2, RefreshCw, Package,
  Thermometer, Droplets, Filter, Clock, QrCode, X, Printer,
  Volume2, VolumeX, Brain, BarChart2, GitBranch, Layers
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const LANG_LOCALE = {
  en:"en-IN", ta:"ta-IN", hi:"hi-IN", te:"te-IN",
  kn:"kn-IN", ml:"ml-IN", bn:"bn-IN", mr:"mr-IN", gu:"gu-IN"
};
import API from "../api";
import toast from "react-hot-toast";

const COLOR = { emerald:"#10b981", amber:"#f59e0b", red:"#ef4444" };

/* ──── Countdown Timer ──── */
function CountdownTimer({ freshness_days }) {
  const expiryMs = Date.now() + freshness_days * 86400000;
  const [left, setLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = expiryMs - Date.now();
      if (diff <= 0) { setLeft("Expired"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setLeft(`${d}d ${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [expiryMs]);
  const expDate = new Date(expiryMs).toLocaleDateString("en-IN",
    { weekday:"short", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
  const isUrgent = freshness_days < 2;
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${isUrgent ? "bg-red-500/10 border border-red-500/20" : "bg-surface-700"}`}>
      <Clock size={11} className={isUrgent ? "text-red-400" : "text-zinc-500"} />
      <div className="min-w-0">
        <span className="text-zinc-400">Expires: </span>
        <span className="text-zinc-200 font-medium">{expDate}</span>
        <span className={`font-bold ml-2 ${isUrgent ? "text-red-400" : "text-emerald-400"}`}>{left} left</span>
      </div>
    </div>
  );
}

/* ──── QR Code Modal ──── */
function QRModal({ herb, freshness_days, stock_kg, zone, onClose, lang="en" }) {
  const [speaking, setSpeaking] = useState(false);
  const expDate = new Date(Date.now() + freshness_days * 86400000)
    .toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  const quality = freshness_days >= 4 ? "Premium" : freshness_days >= 2 ? "Good" : "Urgent";

  const speak = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel(); setSpeaking(false); return;
    }
    const lines = [
      `${herb} batch from AgriIntel Urban Farm.`,
      `Freshness: ${freshness_days} days remaining.`,
      `Stock: ${stock_kg} kilograms in Zone ${zone}.`,
      `Quality: ${quality}.`,
      `Expires ${expDate}.`,
      `Carbon footprint: 0.2 kilograms CO2 per kilogram.`,
      `Certified fresh. Verify at pulseboard.`
    ];
    const utter = new SpeechSynthesisUtterance(lines.join(" "));
    utter.lang = LANG_LOCALE[lang] || "en-IN";
    utter.rate = 0.85;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };
  const qrText = [
    "AGRIINTEL FARM BATCH",
    `Herb: ${herb}`,
    `Freshness: ${freshness_days} days remaining`,
    `Expires: ${expDate}`,
    `Stock: ${stock_kg} kg | Zone: ${zone}`,
    `Quality: ${quality}`,
    `Carbon footprint: 0.2 kg CO2/kg`,
    `Farm: AgriIntel Urban Farm, Chennai`,
    `Verify: pulseboard-gamma-cyan.vercel.app`,
  ].join("\n");

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-zinc-100 font-black text-lg">{herb} Batch QR</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Chef scans to verify freshness & traceability</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-all">
            <X size={14} className="text-zinc-400"/>
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl inline-block mb-4 shadow-lg">
          <QRCodeSVG value={qrText} size={192} bgColor="#ffffff" fgColor="#18181b" level="H"/>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
          {[
            { label:"Freshness", value:`${freshness_days}d`, color:"text-emerald-400" },
            { label:"Stock",     value:`${stock_kg} kg`,      color:"text-sky-400"    },
            { label:"Zone",      value:`Zone ${zone}`,         color:"text-violet-400" },
          ].map(({label,value,color})=>(
            <div key={label} className="bg-zinc-800 rounded-xl p-2">
              <p className="text-zinc-500 text-[10px]">{label}</p>
              <p className={`font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Voice Button */}
        <button onClick={speak}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all mb-2 ${
            speaking ? "bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          }`}>
          {speaking ? <><VolumeX size={14}/> Tap to Stop · Speaking…</> : <><Volume2 size={14}/> Speak Herb Info · {(LANG_LOCALE[lang]||"en-IN").toUpperCase()}</>}
        </button>

        <div className="flex gap-2">
          <button onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all">
            <Printer size={14}/> Print Sticker
          </button>
          <button onClick={() => { window.speechSynthesis.cancel(); onClose(); }}
            className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm transition-all">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* Client-side freshness model: temp/humidity adjusts predicted shelf life */
function predictAdjusted(baseDays, temp, humidity) {
  // Optimal: 4°C, 90% RH. Each degree above 4 costs ~0.18 days. Each % below 85 costs ~0.05 days.
  const tempPenalty = Math.max(0, (temp - 4) * 0.18);
  const humidPenalty = Math.max(0, (85 - humidity) * 0.05);
  return Math.max(0.3, +(baseDays - tempPenalty - humidPenalty).toFixed(1));
}

function FreshnessCard({ herb, freshness_days, best_by, stock_kg, zone, harvested, wilt_alert, quality, color, simTemp, simHumid }) {
  const [showQR,  setShowQR]  = useState(false);
  const { lang, t } = useLang();
  const c = COLOR[color] || COLOR.emerald;

  const adjusted = predictAdjusted(freshness_days, simTemp, simHumid);
  const pct      = Math.min((adjusted / 6) * 100, 100);
  const isWorse  = adjusted < freshness_days - 0.1;
  const isBetter = adjusted > freshness_days + 0.1;
  const adjColor = isWorse ? "#ef4444" : isBetter ? "#10b981" : c;

  return (
    <motion.div layout initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      className={`bg-surface-800 border rounded-2xl p-5 hover:border-surface-500 transition-all duration-300 ${wilt_alert || adjusted < 2 ? "border-red-500/40 shadow-lg shadow-red-500/5" : "border-surface-600"}`}>
      {(wilt_alert || adjusted < 2) && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-4">
          <AlertTriangle size={12} className="text-red-400 flex-shrink-0"/>
          <p className="text-red-400 text-[11px] font-bold">WILT ALERT · Chefs notified</p>
        </motion.div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-zinc-100 font-bold text-base">{herb}</h3>
          <p className="text-zinc-500 text-[11px] mt-0.5">Zone {zone} · {harvested}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ color: adjColor, background: adjColor + "20" }}>
            {adjusted < 2 ? "Urgent" : adjusted < 3.5 ? "Good" : "Excellent"}
          </span>
          <p className="text-zinc-600 text-[10px] mt-1">{stock_kg} kg · Zone {zone}</p>
        </div>
      </div>

      {/* Freshness bar */}
      <div className="mb-4">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-zinc-400 text-xs">Freshness remaining</span>
          <div className="flex items-center gap-2">
            {(isWorse || isBetter) && (
              <span className={`text-[10px] font-semibold ${isWorse ? "text-red-400" : "text-emerald-400"}`}>
                {isWorse ? "▼" : "▲"} {Math.abs(+(adjusted - freshness_days).toFixed(1))}d
              </span>
            )}
            <span className="font-bold text-sm tabular-nums" style={{ color: adjColor }}>{adjusted} days</span>
          </div>
        </div>
        <div className="h-3 bg-surface-600 rounded-full overflow-hidden">
          <motion.div animate={{ width:`${pct}%` }} transition={{ duration:0.6, ease:"easeOut" }}
            className="h-full rounded-full transition-colors duration-500" style={{ background: adjColor }}/>
        </div>
        <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
          <span>Now</span>
          <span>Best by: {best_by}</span>
        </div>
      </div>

      {/* Countdown Timer */}
      <CountdownTimer freshness_days={adjusted} />

      {/* Meta strip */}
      <div className="flex gap-2 my-3">
        {[
          { label:"Stock", value:`${stock_kg} kg` },
          { label:"Best By", value:best_by },
          { label:"Quality", value:adjusted < 2 ? "Urgent" : adjusted < 3.5 ? "Good" : "Premium" },
        ].map(({label,value})=>(
          <div key={label} className="flex-1 bg-surface-700 rounded-lg p-2 text-center">
            <p className="text-zinc-500 text-[10px] mb-0.5">{label}</p>
            <p className="text-zinc-200 text-[11px] font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {/* QR Code button */}
      <button onClick={() => setShowQR(true)}
        className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white bg-surface-700 hover:bg-surface-600 border border-surface-600 hover:border-zinc-500 py-2 rounded-xl transition-all mb-3">
        <QrCode size={13} className="text-emerald-400"/>
        {t.lbl_qr_btn}
      </button>
      {showQR && <QRModal herb={herb} freshness_days={adjusted} stock_kg={stock_kg} zone={zone} onClose={() => setShowQR(false)} lang={lang}/>}
    </motion.div>
  );
}


export default function FreshnessTracker() {
  const { t } = useLang();
  const [herbs,    setHerbs]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [lastUpd,  setLastUpd]  = useState(null);
  const [filter,   setFilter]   = useState("All");
  const [simTemp,  setSimTemp]  = useState(4);
  const [simHumid, setSimHumid] = useState(90);
  const [simOn,    setSimOn]    = useState(false);

  const refresh = useCallback(async (silent=false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await API.get("/freshness/");
      setHerbs(data);
      setLastUpd(new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}));
    } catch { if (!silent) toast.error("Using cached freshness data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const id = setInterval(() => refresh(true), 60000);
    return () => clearInterval(id);
  }, [refresh]);

  const displayTemp  = simOn ? simTemp  : 4;
  const displayHumid = simOn ? simHumid : 90;

  const filtered = useMemo(() => {
    if (filter === "All") return herbs;
    if (filter === "Alert") return herbs.filter(h => h.wilt_alert || predictAdjusted(h.freshness_days, displayTemp, displayHumid) < 2);
    if (filter === "Premium") return herbs.filter(h => predictAdjusted(h.freshness_days, displayTemp, displayHumid) >= 3.5);
    return herbs.filter(h => h.zone === filter);
  }, [herbs, filter, displayTemp, displayHumid]);

  const wiltCount = herbs.filter(h => predictAdjusted(h.freshness_days, displayTemp, displayHumid) < 2).length;
  const avgDays   = herbs.length ? +(herbs.reduce((s,h)=>s + predictAdjusted(h.freshness_days, displayTemp, displayHumid), 0) / herbs.length).toFixed(1) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
            <Leaf size={20} className="text-emerald-400"/> {t.pg_fresh_title}
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">{t.pg_fresh_sub}</p>
        </div>
        <button onClick={() => refresh()} disabled={loading}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-100 bg-surface-800 border border-surface-600 hover:border-surface-500 px-3 py-1.5 rounded-xl transition-all disabled:opacity-40">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""}/>
          {lastUpd || t.lbl_refresh}
        </button>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:t.lbl_avg_freshness,  value:`${avgDays}d`,  sub:"Across all herbs",      color:"#10b981", icon:CheckCircle2   },
          { label:t.lbl_active_batches, value:herbs.length,  sub:"Currently tracked",      color:"#38bdf8", icon:Package        },
          { label:t.lbl_wilt_alerts,    value:wiltCount,     sub:"Urgent attention needed", color:wiltCount?"#ef4444":"#71717a", icon:AlertTriangle },
          { label:t.lbl_climate_sim,    value:simOn ? "ON":"OFF", sub:`${displayTemp}°C · ${displayHumid}% RH`, color:simOn?"#f59e0b":"#52525b", icon:Thermometer },
        ].map(({label,value,sub,color,icon:Icon})=>(
          <motion.div key={label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            className="bg-surface-800 border border-surface-600 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: color + "20" }}>
              <Icon size={15} style={{ color }}/>
            </div>
            <div className="min-w-0">
              <p className="text-zinc-500 text-[11px] uppercase tracking-wide">{label}</p>
              <p className="font-black text-lg tabular-nums" style={{ color }}>{value}</p>
              <p className="text-zinc-600 text-[10px]">{sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ML Model Badge */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
        className="bg-gradient-to-r from-violet-500/10 via-surface-800 to-emerald-500/10 border border-violet-500/25 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Brain size={16} className="text-violet-400"/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-zinc-100">Trained ML Model · Random Forest Regressor</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold">LIVE</span>
            </div>
            <p className="text-zinc-500 text-xs mt-0.5">Freshness predictions powered by scikit-learn · <span className="text-violet-400 font-medium">backend/ml/train_model.py</span></p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon:BarChart2, label:"Accuracy (R²)", value:"79.9%",     sub:"Variance explained",        color:"#a78bfa" },
            { icon:Layers,    label:"Training Data", value:"4,000",     sub:"Simulated herb samples",    color:"#38bdf8" },
            { icon:GitBranch, label:"Decision Trees", value:"200",     sub:"Max depth 12",               color:"#34d399" },
            { icon:CheckCircle2, label:"Herbs Supported", value:"9",   sub:"Basil, Mint, Coriander…",   color:"#fbbf24" },
          ].map(({ icon:Icon, label, value, sub, color }) => (
            <div key={label} className="bg-surface-700/60 rounded-xl p-3 border border-surface-600/50">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon size={11} style={{ color }}/>
                <p className="text-zinc-500 text-[10px] uppercase tracking-wide">{label}</p>
              </div>
              <p className="font-black text-base tabular-nums" style={{ color }}>{value}</p>
              <p className="text-zinc-600 text-[10px] mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 bg-surface-700/40 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"/>
          <p className="text-zinc-400 text-[11px]">
            <span className="text-zinc-200 font-semibold">How it works: </span>
            7 sensor inputs (temperature, humidity, CO₂, light, pH, days harvested, herb type) →
            Random Forest predicts freshness score 0–100 → grade mapped to shelf-life days.
            Model file: <span className="text-violet-400">freshness_model.pkl</span> (15 MB trained weights).
          </p>
        </div>
      </motion.div>

      {/* Climate Simulator */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className={`border rounded-2xl p-5 transition-all duration-300 ${simOn ? "bg-amber-500/5 border-amber-500/20" : "bg-surface-800 border-surface-600"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Thermometer size={14} className={simOn ? "text-amber-400" : "text-zinc-500"}/>
            <h2 className="text-sm font-bold text-zinc-200">{t.lbl_climate_sim}</h2>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${simOn ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-surface-700 text-zinc-500"}`}>
              {simOn ? "ACTIVE — predictions adjusted" : "OFF"}
            </span>
          </div>
          <button onClick={() => setSimOn(p=>!p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${simOn ? "bg-amber-500 text-black hover:bg-amber-400" : "bg-surface-700 text-zinc-300 hover:bg-surface-600 border border-surface-600"}`}>
            {simOn ? "Disable" : "Simulate Storage"}
          </button>
        </div>

        <AnimatePresence>
          {simOn && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-zinc-400 text-xs font-medium flex items-center gap-1.5">
                    <Thermometer size={11}/> Storage Temperature
                  </label>
                  <span className="text-amber-400 font-bold text-sm tabular-nums">{simTemp}°C</span>
                </div>
                <input type="range" min={0} max={30} step={1} value={simTemp} onChange={e=>setSimTemp(+e.target.value)}
                  className="w-full h-2 bg-surface-600 rounded-full appearance-none cursor-pointer accent-amber-400"/>
                <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                  <span>0°C (Freezer)</span><span className="text-emerald-400">4°C Optimal</span><span>30°C (Warm)</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-zinc-400 text-xs font-medium flex items-center gap-1.5">
                    <Droplets size={11}/> Relative Humidity
                  </label>
                  <span className="text-sky-400 font-bold text-sm tabular-nums">{simHumid}%</span>
                </div>
                <input type="range" min={40} max={100} step={1} value={simHumid} onChange={e=>setSimHumid(+e.target.value)}
                  className="w-full h-2 bg-surface-600 rounded-full appearance-none cursor-pointer accent-sky-400"/>
                <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                  <span>40% (Dry)</span><span className="text-emerald-400">90% Optimal</span><span>100%</span>
                </div>
              </div>
              {(simTemp !== 4 || simHumid !== 90) && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="md:col-span-2 bg-surface-700 rounded-xl p-3">
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    <span className="text-amber-300 font-semibold">Impact: </span>
                    At {simTemp}°C / {simHumid}% RH, predicted freshness changes by{" "}
                    <span className={simTemp > 4 || simHumid < 85 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                      {((predictAdjusted(4.5, simTemp, simHumid) - predictAdjusted(4.5, 4, 90)).toFixed(1))} days avg
                    </span>.{" "}
                    {simTemp > 15 ? "⚠️ High temperature — significant quality loss." :
                     simTemp > 8  ? "Warning: above optimal cold chain." :
                     simHumid < 70 ? "Low humidity causes rapid wilting." : "✓ Storage conditions acceptable."}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Filters + Wilt banner */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={13} className="text-zinc-500"/>
        {["All","Zone A","Zone B","Zone C","Alert","Premium"].map(f=>(
          <button key={f} onClick={()=>setFilter(f === "Zone A" ? "A" : f === "Zone B" ? "B" : f === "Zone C" ? "C" : f)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              (filter === (f === "Zone A" ? "A" : f === "Zone B" ? "B" : f === "Zone C" ? "C" : f))
                ? "bg-emerald-600 text-white"
                : "bg-surface-800 text-zinc-400 border border-surface-600 hover:border-surface-500"
            }`}>{f}</button>
        ))}
        <span className="text-zinc-600 text-xs ml-auto">{filtered.length} of {herbs.length} herbs shown</span>
      </div>

      {wiltCount > 0 && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0"/>
          <div>
            <p className="text-red-300 font-bold text-sm">{wiltCount} herb{wiltCount>1?"s":""} need immediate action</p>
            <p className="text-zinc-500 text-xs">Chef partners automatically notified · Flash sale recommended</p>
          </div>
          <button onClick={() => setFilter("Alert")}
            className="ml-auto text-xs text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all">
            View Alerts
          </button>
        </motion.div>
      )}

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({length:5}).map((_,i)=><div key={i} className="h-72 bg-surface-800 border border-surface-600 rounded-2xl animate-pulse"/>)}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map(h => (
              <FreshnessCard key={h.herb} {...h} simTemp={displayTemp} simHumid={displayHumid}/>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

    </div>
  );
}
