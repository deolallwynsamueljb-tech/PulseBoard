import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Leaf, Droplets, Zap, Clock, RefreshCw, Sparkles, ArrowRight,
  TrendingUp, TrendingDown, Thermometer, Wind, Sun, Layers,
  ArrowUpRight, AlertTriangle, CheckCircle2, Activity
} from "lucide-react";
import API from "../api";
import toast from "react-hot-toast";

const TT = {
  contentStyle:{ background:"#18181b",border:"1px solid #3f3f46",borderRadius:"8px",color:"#e4e4e7",fontSize:"12px" },
  cursor:{ fill:"rgba(255,255,255,0.03)" }
};

const KPI_CONFIG = {
  yield:    { icon:Leaf,     grad:"from-emerald-500/20 to-emerald-500/0",  ring:"ring-emerald-500/30", val:"#10b981", suffix:" kg"  },
  water:    { icon:Droplets, grad:"from-sky-500/20 to-sky-500/0",          ring:"ring-sky-500/30",     val:"#38bdf8", suffix:" L"   },
  power:    { icon:Zap,      grad:"from-amber-500/20 to-amber-500/0",      ring:"ring-amber-500/30",   val:"#f59e0b", suffix:" kWh" },
  delivery: { icon:Clock,    grad:"from-violet-500/20 to-violet-500/0",    ring:"ring-violet-500/30",  val:"#8b5cf6", suffix:" hrs" },
};

function KpiCard({ id, label, value, change, trend, good, delay }) {
  const cfg  = KPI_CONFIG[id] || KPI_CONFIG.yield;
  const Icon = cfg.icon;
  const isGood = trend === good;
  const TIcon  = isGood ? TrendingUp : TrendingDown;
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:0.4, ease:"easeOut" }}
      className="relative bg-surface-800 border border-surface-600 rounded-2xl p-5 overflow-hidden hover:border-surface-500 transition-all duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${cfg.grad} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}/>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <p className="text-zinc-400 text-xs font-medium tracking-wide uppercase">{label}</p>
          <div className={`w-8 h-8 rounded-xl bg-surface-700 ring-1 ${cfg.ring} flex items-center justify-center`}>
            <Icon size={14} style={{ color: cfg.val }} />
          </div>
        </div>
        <p className="text-3xl font-black text-zinc-100 mb-3 tabular-nums tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
          <span className="text-lg text-zinc-500 font-medium">{cfg.suffix}</span>
        </p>
        <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg ${isGood ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
          <TIcon size={11} />
          {Math.abs(change)}% vs last month
        </div>
      </div>
    </motion.div>
  );
}

function SensorTile({ label, value, unit, status, icon: Icon, color }) {
  const colors = { Optimal:"#10b981", Normal:"#38bdf8", Low:"#f59e0b", High:"#ef4444" };
  const c = colors[status] || "#10b981";
  return (
    <div className="bg-surface-700/60 border border-surface-600 rounded-xl p-4 flex items-center gap-3 hover:border-surface-500 transition-colors">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c + "20" }}>
        <Icon size={16} style={{ color: c }} />
      </div>
      <div className="min-w-0">
        <p className="text-zinc-500 text-[11px] font-medium uppercase tracking-wide">{label}</p>
        <p className="text-zinc-100 font-bold text-lg tabular-nums leading-tight">
          {value}<span className="text-zinc-500 text-sm font-normal ml-0.5">{unit === "degC" ? "°C" : unit}</span>
        </p>
        <p className="text-[10px] font-semibold mt-0.5" style={{ color: c }}>{status}</p>
      </div>
    </div>
  );
}

const SENSOR_NOISE = { temperature:0.25, humidity:0.8, co2:4, light:12, ph:0.03 };

export default function Dashboard() {
  const [kpis,       setKpis]       = useState(null);
  const [revenue,    setRevenue]    = useState([]);
  const [sensors,    setSensors]    = useState(null);
  const [liveOffset, setLiveOffset] = useState({});
  const [insight,    setInsight]    = useState(null);
  const [health,     setHealth]     = useState(null);
  const [alerts,     setAlerts]     = useState(null);
  const [lastUpd,    setLastUpd]    = useState(null);
  const [loading,    setLoading]    = useState(false);

  const refresh = useCallback(async (silent=false) => {
    if (!silent) setLoading(true);
    try {
      const [k, r, s, ins, h, al] = await Promise.all([
        API.get("/kpis/"),
        API.get("/analytics/revenue"),
        API.get("/sensors/"),
        API.get("/ai/insights"),
        API.get("/ai/health-score"),
        API.get("/ai/demand-alerts"),
      ]);
      setKpis(k.data);
      setRevenue(r.data);
      setSensors(s.data);
      setInsight(ins.data.insights?.[0] || null);
      setHealth(h.data);
      setAlerts(al.data?.alerts?.filter(a=>a.urgency==="Critical"||a.urgency==="High").slice(0,2) || []);
      setLastUpd(new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}));
    } catch { if (!silent) toast.error("Failed to load dashboard"); }
    finally { if (!silent) setLoading(false); }
  }, []);

  /* 3-second client-side sensor micro-jitter — no API call */
  useEffect(() => {
    const tick = setInterval(() => {
      setLiveOffset({
        temperature: +(( Math.random() - 0.5) * 2 * SENSOR_NOISE.temperature).toFixed(2),
        humidity:    +(( Math.random() - 0.5) * 2 * SENSOR_NOISE.humidity).toFixed(1),
        co2:         Math.round((Math.random() - 0.5) * 2 * SENSOR_NOISE.co2),
        light:       Math.round((Math.random() - 0.5) * 2 * SENSOR_NOISE.light),
        ph:          +(( Math.random() - 0.5) * 2 * SENSOR_NOISE.ph).toFixed(2),
      });
    }, 3000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const id = setInterval(() => refresh(true), 30000);
    return () => clearInterval(id);
  }, [refresh]);

  const verdictColor = { Excellent:"#10b981", Good:"#38bdf8", Fair:"#f59e0b", Poor:"#ef4444" };
  const SENSOR_ICONS = { temperature:Thermometer, humidity:Wind, co2:Activity, light:Sun, ph:Layers };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Farm Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-0.5">AgriIntel · Real-time farm intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            LIVE
          </div>
          <button onClick={() => refresh()} disabled={loading}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-100 bg-surface-800 border border-surface-600 hover:border-surface-500 px-3 py-1.5 rounded-xl transition-all disabled:opacity-40">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""}/>
            {lastUpd ? `${lastUpd}` : "Refresh"}
          </button>
        </div>
      </motion.div>

      {/* Demand Alerts Banner */}
      {alerts && alerts.length > 0 && (
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
          className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5"/>
            <div className="flex-1">
              <p className="text-amber-300 text-xs font-bold uppercase tracking-wide mb-2">Demand Alerts</p>
              <div className="flex flex-wrap gap-3">
                {alerts.map((a,i) => (
                  <div key={i} className="flex items-center gap-2 bg-surface-800 border border-surface-600 rounded-xl px-3 py-2">
                    <span className="text-zinc-200 text-xs font-semibold">{a.crop}</span>
                    <span className="text-emerald-400 text-xs font-bold">{a.demand_change}</span>
                    <span className="text-zinc-500 text-xs">{a.period}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link to="/advisor" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 whitespace-nowrap">
              Details <ArrowRight size={11}/>
            </Link>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis
          ? Object.entries(kpis).map(([id, d], i) => (
              <KpiCard key={id} id={id} label={d.label} value={d.value} change={d.change} trend={d.trend} good={d.good} delay={i * 0.08}/>
            ))
          : Array.from({length:4}).map((_,i) => (
              <motion.div key={i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.1 }}
                className="bg-surface-800 border border-surface-600 rounded-2xl p-5 space-y-3 animate-pulse">
                <div className="h-3 bg-surface-700 rounded w-24"/><div className="h-8 bg-surface-700 rounded w-32"/><div className="h-3 bg-surface-700 rounded w-20"/>
              </motion.div>
            ))
        }
      </div>

      {/* Revenue Chart + Health Score */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          className="xl:col-span-2 bg-surface-800 border border-surface-600 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-zinc-200">Weekly Revenue by Crop</h2>
              <p className="text-zinc-500 text-xs mt-0.5">₹{revenue.reduce((s,r)=>s+r.revenue,0).toLocaleString()} total · 6 weeks</p>
            </div>
            <span className="text-xs text-zinc-500 bg-surface-700 px-2.5 py-1 rounded-lg">Last 6 weeks</span>
          </div>
          {revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenue.slice(-6)}>
                <defs>
                  {[["da","#10b981"],["db","#38bdf8"],["dc","#f59e0b"],["dd","#f97316"],["de","#8b5cf6"],["df","#ec4899"]].map(([id,c])=>(
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={c} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false}/>
                <XAxis dataKey="week" stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false}/>
                <YAxis stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                <Tooltip {...TT}/>
                <Area type="monotone" dataKey="basil"     stroke="#10b981" strokeWidth={2} fill="url(#da)" dot={false}/>
                <Area type="monotone" dataKey="mint"      stroke="#38bdf8" strokeWidth={1.5} fill="url(#db)" dot={false}/>
                <Area type="monotone" dataKey="rosemary"  stroke="#f59e0b" strokeWidth={1.5} fill="url(#dc)" dot={false}/>
                <Area type="monotone" dataKey="thyme"     stroke="#f97316" strokeWidth={1.5} fill="url(#dd)" dot={false}/>
                <Area type="monotone" dataKey="coriander" stroke="#8b5cf6" strokeWidth={1.5} fill="url(#de)" dot={false}/>
                <Area type="monotone" dataKey="lettuce"   stroke="#ec4899" strokeWidth={1.5} fill="url(#df)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-56 bg-surface-700 rounded-xl animate-pulse"/>}
          <div className="flex flex-wrap gap-3 mt-4">
            {[["#10b981","Basil"],["#38bdf8","Mint"],["#f59e0b","Rosemary"],["#f97316","Thyme"],["#8b5cf6","Coriander"],["#ec4899","Lettuce"]].map(([c,l])=>(
              <div key={l} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <div className="w-3 h-0.5 rounded-full" style={{background:c}}/>
                {l}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Health Score */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          className="bg-surface-800 border border-surface-600 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={14} className="text-emerald-400"/>
            <h2 className="text-sm font-bold text-zinc-200">Farm Health Score</h2>
          </div>
          {health ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="30" fill="none" stroke="#27272a" strokeWidth="8"/>
                    <motion.circle cx="40" cy="40" r="30" fill="none"
                      stroke={verdictColor[health.verdict]||"#10b981"} strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${188.5}`}
                      initial={{ strokeDashoffset:188.5 }}
                      animate={{ strokeDashoffset: 188.5 - (health.overall/100)*188.5 }}
                      transition={{ duration:1.2, ease:"easeOut", delay:0.5 }}/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-xl font-black text-zinc-100">{health.overall}</span>
                    <span className="text-[9px] text-zinc-500">/{100}</span>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black" style={{color:verdictColor[health.verdict]||"#10b981"}}>{health.verdict}</p>
                  <p className="text-zinc-500 text-xs">Grade {health.grade}</p>
                </div>
              </div>
              <div className="space-y-2.5 flex-1">
                {Object.entries(health.breakdown).map(([k,v])=>(
                  <div key={k}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-400 capitalize">{k.replace(/_/g," ")}</span>
                      <span className="text-zinc-300 font-semibold">{v}</span>
                    </div>
                    <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
                      <motion.div initial={{width:0}} animate={{width:`${v}%`}} transition={{delay:0.7,duration:0.8,ease:"easeOut"}}
                        className="h-full rounded-full" style={{background:verdictColor[health.verdict]||"#10b981"}}/>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-zinc-500 text-[11px] mt-4 leading-relaxed border-t border-surface-600 pt-3">{health.summary}</p>
            </>
          ) : <div className="flex-1 space-y-3 animate-pulse"><div className="h-20 bg-surface-700 rounded-xl"/>{Array.from({length:5}).map((_,i)=><div key={i} className="h-5 bg-surface-700 rounded"/>)}</div>}
        </motion.div>
      </div>

      {/* Sensors */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.45 }}
        className="bg-surface-800 border border-surface-600 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Thermometer size={14} className="text-zinc-400"/>
            <h2 className="text-sm font-bold text-zinc-200">Live Environmental Sensors</h2>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            All zones nominal
          </div>
        </div>
        {sensors ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(sensors).map(([key, s]) => {
              const off = liveOffset[key] ?? 0;
              const liveVal = typeof s.value === "number"
                ? +(s.value + off).toFixed(key === "ph" ? 2 : key === "temperature" ? 1 : 0)
                : s.value;
              return (
                <SensorTile key={key}
                  label={key.charAt(0).toUpperCase()+key.slice(1)}
                  icon={SENSOR_ICONS[key] || Activity}
                  {...s} value={liveVal}/>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-3">
            {Array.from({length:5}).map((_,i)=><div key={i} className="h-20 bg-surface-700 rounded-xl animate-pulse"/>)}
          </div>
        )}
      </motion.div>

      {/* AI Insight + Quick links */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {insight && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
            className="xl:col-span-2 bg-gradient-to-br from-emerald-500/10 to-surface-800 border border-emerald-500/20 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                <Sparkles size={15} className="text-emerald-400"/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-emerald-300 text-xs font-bold">AI INSIGHT · {insight.impact} IMPACT</p>
                  <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Gemini</span>
                </div>
                <p className="text-zinc-200 text-sm leading-relaxed">{insight.description}</p>
                {insight.action && <p className="text-zinc-500 text-xs mt-2">→ <span className="text-zinc-300">{insight.action}</span></p>}
              </div>
              <Link to="/advisor" className="flex items-center gap-1 text-emerald-400 text-xs font-semibold whitespace-nowrap hover:text-emerald-300 transition-colors bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                Ask AI <ArrowRight size={11}/>
              </Link>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.55 }}
          className="bg-surface-800 border border-surface-600 rounded-2xl p-5">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-4">Quick Access</p>
          <div className="space-y-2">
            {[
              { to:"/freshness", label:"Freshness Tracker", sub:"Check herb expiry",    color:"text-emerald-400", bg:"bg-emerald-500/10" },
              { to:"/market",    label:"Herb Stock Market", sub:"Live price tickers",   color:"text-brand-400",   bg:"bg-brand-500/10"   },
              { to:"/waste",     label:"Waste Predictor",   sub:"Flash sale alerts",    color:"text-amber-400",   bg:"bg-amber-500/10"   },
              { to:"/advisor",   label:"AI Advisor",        sub:"Ask anything",         color:"text-violet-400",  bg:"bg-violet-500/10"  },
            ].map(({to,label,sub,color,bg})=>(
              <Link key={to} to={to}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-700 transition-colors group">
                <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center`}>
                  <ArrowUpRight size={12} className={color}/>
                </div>
                <div>
                  <p className="text-zinc-200 text-xs font-semibold">{label}</p>
                  <p className="text-zinc-500 text-[11px]">{sub}</p>
                </div>
                <ArrowRight size={11} className="text-zinc-600 group-hover:text-zinc-400 ml-auto transition-colors"/>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
