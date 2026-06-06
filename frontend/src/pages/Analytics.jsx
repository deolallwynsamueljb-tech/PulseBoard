import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Target, Award, RefreshCw, Filter, Download } from "lucide-react";
import API from "../api";
import toast from "react-hot-toast";
import { useLang } from "../context/LangContext";

const TT = {
  contentStyle:{ background:"#18181b", border:"1px solid #3f3f46", borderRadius:"10px", color:"#e4e4e7", fontSize:"12px" },
  cursor:{ fill:"rgba(255,255,255,0.03)" }
};
const PIE_COLORS = ["#10b981","#38bdf8","#f59e0b","#f97316","#8b5cf6","#ec4899","#14b8a6","#a78bfa","#fb923c"];
const HERB_COLORS = {
  basil:"#10b981", mint:"#38bdf8",  lettuce:"#ec4899", spinach:"#a78bfa",
  coriander:"#8b5cf6", rosemary:"#f59e0b", thyme:"#f97316", parsley:"#14b8a6", chives:"#fb923c"
};

function downloadCSV(data, filename) {
  if (!data?.length) return;
  const keys = Object.keys(data[0]);
  const csv  = [keys.join(","), ...data.map(r => keys.map(k=>r[k]).join(","))].join("\n");
  const blob = new Blob([csv], { type:"text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
  toast.success(`${filename} downloaded`);
}

export default function Analytics() {
  const { t } = useLang();
  const [revenue,  setRevenue]  = useState([]);
  const [crops,    setCrops]    = useState([]);
  const [overview, setOverview] = useState(null);
  const [bench,    setBench]    = useState([]);
  const [goals,    setGoals]    = useState([]);
  const [forecast, setForecast] = useState(null);
  const [wow,      setWow]      = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Interactive filters
  const [activeHerbs, setActiveHerbs] = useState(["basil","mint","rosemary","thyme"]);
  const [weekRange,   setWeekRange]   = useState(8);
  const [chartType,   setChartType]   = useState("stacked"); // stacked | grouped | line

  const toggleHerb = (herb) =>
    setActiveHerbs(p => p.includes(herb) ? (p.length>1?p.filter(h=>h!==herb):p) : [...p, herb]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get("/analytics/revenue"),
      API.get("/analytics/crops"),
      API.get("/analytics/overview"),
      API.get("/analytics/benchmarks"),
      API.get("/analytics/goals"),
      API.get("/ai/forecast"),
      API.get("/kpis/wow"),
    ]).then(([r,c,o,b,g,f,w]) => {
      setRevenue(r.data);
      setCrops(c.data);
      setOverview(o.data);
      setBench(b.data);
      setGoals(g.data);
      setForecast(f.data);
      setWow(w.data);
    }).catch(() => toast.error("Using cached analytics"))
      .finally(() => setLoading(false));
  }, []);

  const filteredRevenue = useMemo(() => revenue.slice(-weekRange), [revenue, weekRange]);
  const filteredCrops   = useMemo(() => crops.filter(c => activeHerbs.includes(c.name.toLowerCase())), [crops, activeHerbs]);

  const totalRevenue = filteredRevenue.reduce((s,r)=>s+r.revenue,0);
  const trendIcon = {
    Upward:   <TrendingUp  size={13} className="text-emerald-400"/>,
    Declining:<TrendingDown size={13} className="text-red-400"/>,
    Stable:   <Minus size={13} className="text-amber-400"/>,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="xl:flex xl:gap-6 xl:items-start">
      {/* ── Main content column ── */}
      <div className="flex-1 min-w-0 space-y-5">

      {/* Header */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">{t.nav_analytics}</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{t.pg_analytics_sub}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadCSV(filteredRevenue, "agriintel-revenue.csv")}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 bg-surface-800 border border-surface-600 hover:border-emerald-500/30 px-3 py-1.5 rounded-xl transition-all">
            <Download size={11}/> Export CSV
          </button>
        </div>
      </motion.div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {loading ? Array.from({length:5}).map((_,i)=>(
          <div key={i} className="bg-surface-800 border border-surface-600 rounded-2xl p-4 animate-pulse h-16"/>
        )) : overview ? [
          { label:"Top Crop",       value:overview.top_category,           color:"text-emerald-400" },
          { label:"Peak Day",       value:overview.peak_day,               color:"text-sky-400"     },
          { label:"Avg Order",      value:`₹${overview.avg_order_value}`,  color:"text-violet-400"  },
          { label:"Return Rate",    value:`${overview.return_rate}%`,      color:"text-amber-400"   },
          { label:"Satisfaction",   value:`${overview.satisfaction} / 5`,  color:"text-emerald-400" },
        ].map((item,i)=>(
          <motion.div key={i} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.06 }}
            className="bg-surface-800 border border-surface-600 rounded-2xl p-4 hover:border-surface-500 transition-colors">
            <p className="text-zinc-500 text-[11px] uppercase tracking-wide mb-1">{item.label}</p>
            <p className={`font-black text-lg ${item.color}`}>{item.value}</p>
          </motion.div>
        )) : null}
      </div>

      {/* Interactive Revenue Chart */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
        className="bg-surface-800 border border-surface-600 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-200">Revenue by Crop</h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              ₹{totalRevenue.toLocaleString()} total · {weekRange} weeks
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Herb toggles */}
            <div className="flex flex-wrap items-center gap-1.5">
              {Object.entries(HERB_COLORS).map(([herb, color])=>(
                <button key={herb} onClick={()=>toggleHerb(herb)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all capitalize ${
                    activeHerbs.includes(herb)
                      ? "border-transparent text-zinc-900"
                      : "border-surface-600 text-zinc-500 hover:border-surface-500"
                  }`}
                  style={activeHerbs.includes(herb)?{background:color}:{}}>
                  {herb}
                </button>
              ))}
            </div>
            {/* Week range */}
            <select value={weekRange} onChange={e=>setWeekRange(+e.target.value)}
              className="bg-surface-700 border border-surface-600 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/40 cursor-pointer">
              <option value={4}>4 weeks</option>
              <option value={6}>6 weeks</option>
              <option value={8}>8 weeks</option>
            </select>
            {/* Chart type */}
            <div className="flex rounded-xl overflow-hidden border border-surface-600">
              {[["stacked","Stacked"],["grouped","Grouped"],["line","Line"]].map(([t,l])=>(
                <button key={t} onClick={()=>setChartType(t)}
                  className={`text-[11px] px-2.5 py-1.5 transition-all ${chartType===t ? "bg-emerald-600 text-white font-semibold" : "bg-surface-700 text-zinc-400 hover:text-zinc-200"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredRevenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            {chartType === "line" ? (
              <LineChart data={filteredRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false}/>
                <XAxis dataKey="week" stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false}/>
                <YAxis stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                <Tooltip {...TT}/>
                {activeHerbs.map(h=>(
                  <Line key={h} type="monotone" dataKey={h} stroke={HERB_COLORS[h]} strokeWidth={2} dot={{ r:3, fill:HERB_COLORS[h], strokeWidth:0 }}/>
                ))}
              </LineChart>
            ) : (
              <BarChart data={filteredRevenue} barSize={chartType==="grouped"?12:22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false}/>
                <XAxis dataKey="week" stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false}/>
                <YAxis stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                <Tooltip {...TT}/>
                {activeHerbs.map((h,i)=>(
                  <Bar key={h} dataKey={h} fill={HERB_COLORS[h]}
                    radius={chartType==="stacked"?(i===activeHerbs.length-1?[3,3,0,0]:[0,0,0,0]):[3,3,0,0]}
                    stackId={chartType==="stacked"?"a":undefined}/>
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : <div className="h-60 bg-surface-700 rounded-xl animate-pulse"/>}
      </motion.div>

      {/* Week-over-Week */}
      <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.28 }}
        className="bg-surface-800 border border-surface-600 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-zinc-200 mb-5">Week-over-Week</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {wow.map((w,i)=>{
            const isGood=(w.change>0&&w.good==="up")||(w.change<0&&w.good==="down");
            const pct = w.last_week > 0 ? Math.abs(((w.this_week-w.last_week)/w.last_week)*100).toFixed(1) : 0;
            return (
              <div key={i} className="bg-surface-700 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-zinc-400 text-xs font-medium">{w.metric}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${isGood?"bg-emerald-500/10 text-emerald-400":"bg-red-500/10 text-red-400"}`}>
                    {isGood?"+":"-"}{pct}%
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-zinc-100 font-black text-xl tabular-nums">{w.this_week.toLocaleString()}</span>
                    <span className="text-zinc-500 text-xs ml-1">{w.unit}</span>
                  </div>
                  <span className="text-zinc-600 text-xs">vs {w.last_week.toLocaleString()}{w.unit} last week</span>
                </div>
                <div className="mt-2 h-1.5 bg-surface-600 rounded-full overflow-hidden">
                  <motion.div initial={{width:0}}
                    animate={{width:`${Math.min((w.this_week/Math.max(w.this_week,w.last_week))*100,100)}%`}}
                    transition={{delay:0.5+i*0.1,duration:0.7,ease:"easeOut"}}
                    className={`h-full rounded-full ${isGood?"bg-emerald-500":"bg-red-500"}`}/>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Benchmarks + Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.35 }}
          className="bg-surface-800 border border-surface-600 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Award size={14} className="text-sky-400"/>
            <h2 className="text-sm font-bold text-zinc-200">Industry Benchmarks</h2>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full ml-auto font-semibold">
              {bench.filter(b=>b.better).length}/{bench.length} above avg
            </span>
          </div>
          {bench.map((b,i)=>(
            <div key={i} className="flex items-center justify-between py-3 border-b border-surface-700 last:border-0">
              <div>
                <p className="text-zinc-200 text-sm font-medium">{b.metric}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="h-1.5 w-24 bg-surface-600 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-zinc-500" style={{width:`${(b.industry/Math.max(b.yours,b.industry))*100}%`}}/>
                  </div>
                  <span className="text-zinc-600 text-[10px]">Industry: {b.industry} {b.unit}</span>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black ${b.better?"text-emerald-400":"text-red-400"}`}>{b.yours} {b.unit}</p>
                <p className={`text-[10px] font-semibold ${b.better?"text-emerald-500":"text-red-500"}`}>
                  {b.better ? `${(((b.industry-b.yours)/b.industry)*100).toFixed(0)}% better` : "Below avg"}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.42 }}
          className="bg-surface-800 border border-surface-600 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Target size={14} className="text-emerald-400"/>
            <h2 className="text-sm font-bold text-zinc-200">Goal Progress</h2>
          </div>
          {goals.map((g,i)=>{
            const pct = Math.min((g.current/g.target)*100,100);
            const color = pct>=90?"#10b981":pct>=60?"#38bdf8":"#f59e0b";
            return (
              <div key={i} className="mb-5 last:mb-0">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-zinc-300 font-medium">{g.goal}</span>
                  <span className="text-zinc-400 tabular-nums">
                    {typeof g.current==="number"?g.current.toLocaleString():g.current}{g.unit}
                    <span className="text-zinc-600"> / {g.target.toLocaleString()}{g.unit}</span>
                  </span>
                </div>
                <div className="h-2.5 bg-surface-600 rounded-full overflow-hidden">
                  <motion.div initial={{width:0}} animate={{width:`${pct}%`}}
                    transition={{delay:0.6+i*0.1,duration:0.9,ease:"easeOut"}}
                    className="h-full rounded-full" style={{background:color}}/>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-zinc-600 text-[10px]">{pct.toFixed(0)}% achieved</p>
                  <p className="text-zinc-600 text-[10px]">
                    {pct>=100 ? "✓ Target reached!" :
                     `${(g.target-g.current).toLocaleString()}${g.unit} remaining`}
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* AI Forecast */}
      <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.5 }}
        className="bg-surface-800 border border-surface-600 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-zinc-200">AI Yield Forecast (Weeks 9–12)</h2>
          {forecast && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-surface-700 px-2.5 py-1 rounded-lg">
                {trendIcon[forecast.trend]}
                {forecast.trend} · {forecast.growth_rate}
              </div>
            </div>
          )}
        </div>
        {forecast && <p className="text-zinc-500 text-xs mb-5 leading-relaxed">{forecast.reasoning}</p>}
        {forecast ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={forecast.forecast}>
                <defs>
                  <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false}/>
                <XAxis dataKey="week" stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false}/>
                <YAxis stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v=>`${v}kg`}/>
                <Tooltip {...TT}/>
                <Area type="monotone" dataKey="upper" fill="url(#fg)" stroke="none"/>
                <Area type="monotone" dataKey="lower" fill="#09090b" stroke="none"/>
                <Line type="monotone" dataKey="yield" stroke="#10b981" strokeWidth={2.5} dot={{ fill:"#10b981",r:5,strokeWidth:0 }}/>
              </ComposedChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-4 gap-3 mt-4">
              {forecast.forecast.map((f,i)=>(
                <div key={i} className="bg-surface-700 border border-surface-600 rounded-xl p-3.5 text-center">
                  <p className="text-zinc-500 text-xs mb-1 font-medium">{f.week}</p>
                  <p className="text-zinc-100 font-black text-lg tabular-nums">{f.yield}<span className="text-zinc-500 text-xs font-normal"> kg</span></p>
                  <p className="text-zinc-600 text-[10px] mt-0.5">±{((f.upper-f.lower)/2).toFixed(0)}kg range</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1.5 inline-block ${
                    f.confidence==="High" ? "bg-emerald-500/15 text-emerald-400" :
                    f.confidence==="Medium" ? "bg-amber-500/15 text-amber-400" : "bg-red-500/15 text-red-400"
                  }`}>{f.confidence}</span>
                </div>
              ))}
            </div>
          </>
        ) : <div className="h-48 bg-surface-700 rounded-xl animate-pulse"/>}
      </motion.div>

      </div>{/* end left column */}

      {/* ── Revenue Share by Crop — floating right sidebar ── */}
      <div className="hidden xl:block w-72 flex-shrink-0 sticky top-6 self-start" style={{marginRight:"-1.5rem"}}>
        <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3 }}
          className="bg-surface-800 border border-emerald-500/25 rounded-2xl p-5 shadow-2xl shadow-emerald-500/5 ring-1 ring-emerald-500/10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-400"/>
            <h2 className="text-sm font-bold text-zinc-200">Revenue Share</h2>
          </div>
          {filteredCrops.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={155}>
                <PieChart>
                  <Pie data={filteredCrops} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" paddingAngle={2}>
                    {filteredCrops.map((c,i)=>(
                      <Cell key={i} fill={HERB_COLORS[c.name.toLowerCase()]||PIE_COLORS[i]}/>
                    ))}
                  </Pie>
                  <Tooltip {...TT} formatter={(v)=>[`${v}%`, "Share"]}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {filteredCrops.slice(0,6).map((d,i)=>(
                  <div key={i}>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:HERB_COLORS[d.name.toLowerCase()]||PIE_COLORS[i]}}/>
                        <span className="text-zinc-300 font-medium">{d.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-200 font-bold">{d.value}%</span>
                        {d.revenue && <p className="text-zinc-600 text-[10px]">₹{d.revenue.toLocaleString()}</p>}
                      </div>
                    </div>
                    <div className="h-1 bg-surface-600 rounded-full overflow-hidden">
                      <motion.div initial={{width:0}} animate={{width:`${d.value}%`}} transition={{delay:0.4+i*0.1,duration:0.7,ease:"easeOut"}}
                        className="h-full rounded-full" style={{background:HERB_COLORS[d.name.toLowerCase()]||PIE_COLORS[i]}}/>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="h-40 bg-surface-700 rounded-xl animate-pulse"/>}
        </motion.div>
      </div>

      </div>{/* end flex wrapper */}
    </div>
  );
}
