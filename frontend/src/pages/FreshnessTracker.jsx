import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf, AlertTriangle, CheckCircle2, RefreshCw, Sparkles, Package,
  Thermometer, Droplets, Filter, ChevronDown, Clock, TrendingDown
} from "lucide-react";
import API from "../api";
import toast from "react-hot-toast";

const COLOR = { emerald:"#10b981", amber:"#f59e0b", red:"#ef4444" };

/* Client-side freshness model: temp/humidity adjusts predicted shelf life */
function predictAdjusted(baseDays, temp, humidity) {
  // Optimal: 4°C, 90% RH. Each degree above 4 costs ~0.18 days. Each % below 85 costs ~0.05 days.
  const tempPenalty = Math.max(0, (temp - 4) * 0.18);
  const humidPenalty = Math.max(0, (85 - humidity) * 0.05);
  return Math.max(0.3, +(baseDays - tempPenalty - humidPenalty).toFixed(1));
}

function FreshnessCard({ herb, freshness_days, best_by, stock_kg, zone, harvested, wilt_alert, quality, color, simTemp, simHumid }) {
  const [aiData, setAiData] = useState(null);
  const [aiLoad, setAiLoad] = useState(false);
  const c = COLOR[color] || COLOR.emerald;

  const adjusted = predictAdjusted(freshness_days, simTemp, simHumid);
  const pct      = Math.min((adjusted / 6) * 100, 100);
  const isWorse  = adjusted < freshness_days - 0.1;
  const isBetter = adjusted > freshness_days + 0.1;
  const adjColor = isWorse ? "#ef4444" : isBetter ? "#10b981" : c;

  const getAI = async () => {
    setAiLoad(true);
    try {
      const { data } = await API.get(`/freshness/ai/${herb.toLowerCase()}`);
      setAiData(data);
      toast.success(`AI analysis ready for ${herb}`);
    } catch { toast.error("AI analysis failed — showing cached result"); }
    finally { setAiLoad(false); }
  };

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

      {/* Meta strip */}
      <div className="flex gap-2 mb-4">
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

      {/* AI Panel */}
      <AnimatePresence mode="wait">
        {aiData ? (
          <motion.div key="ai" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
            className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={11} className="text-emerald-400"/>
              <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-wide">Gemini Analysis</p>
              <span className="text-zinc-600 text-[10px] ml-auto">Confidence: {aiData.confidence}</span>
            </div>
            <p className="text-zinc-300 text-xs leading-relaxed mb-2">{aiData.storage_tip}</p>
            <div className="flex flex-wrap gap-1.5">
              {aiData.wilt_signs?.map((s,i)=>(
                <span key={i} className="text-[10px] text-zinc-500 bg-surface-700 px-2 py-0.5 rounded-md">{s}</span>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.button key="btn" onClick={getAI} disabled={aiLoad}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-zinc-400 hover:text-emerald-400 border border-surface-600 hover:border-emerald-500/40 hover:bg-emerald-500/5 py-2.5 rounded-xl transition-all disabled:opacity-50 group">
            <Sparkles size={12} className="group-hover:text-emerald-400 transition-colors"/>
            {aiLoad ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"/>
                Analyzing with Gemini...
              </span>
            ) : "Get AI Freshness Analysis"}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FreshnessTracker() {
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
            <Leaf size={20} className="text-emerald-400"/> Freshness Tracker
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">AI-powered shelf-life prediction · live batch monitoring</p>
        </div>
        <button onClick={() => refresh()} disabled={loading}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-100 bg-surface-800 border border-surface-600 hover:border-surface-500 px-3 py-1.5 rounded-xl transition-all disabled:opacity-40">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""}/>
          {lastUpd || "Refresh"}
        </button>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"Avg Freshness",  value:`${avgDays}d`,  sub:"Across all herbs",      color:"#10b981", icon:CheckCircle2   },
          { label:"Active Batches", value:herbs.length,  sub:"Currently tracked",      color:"#38bdf8", icon:Package        },
          { label:"Wilt Alerts",    value:wiltCount,     sub:"Urgent attention needed", color:wiltCount?"#ef4444":"#71717a", icon:AlertTriangle },
          { label:"Simulator",      value:simOn ? "ON":"OFF", sub:`${displayTemp}°C · ${displayHumid}% RH`, color:simOn?"#f59e0b":"#52525b", icon:Thermometer },
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

      {/* Climate Simulator */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className={`border rounded-2xl p-5 transition-all duration-300 ${simOn ? "bg-amber-500/5 border-amber-500/20" : "bg-surface-800 border-surface-600"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Thermometer size={14} className={simOn ? "text-amber-400" : "text-zinc-500"}/>
            <h2 className="text-sm font-bold text-zinc-200">Climate Simulator</h2>
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
