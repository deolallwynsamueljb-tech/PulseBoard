import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2, Zap, Leaf, AlertTriangle, RefreshCw, Sparkles,
  Tag, Heart, Calculator, TrendingUp, Package2
} from "lucide-react";
import API from "../api";
import toast from "react-hot-toast";

const URGENCY_COLOR = {
  Critical: { bg:"bg-red-500/10",    text:"text-red-400",    border:"border-red-500/20"    },
  High:     { bg:"bg-amber-500/10",  text:"text-amber-400",  border:"border-amber-500/20"  },
  Medium:   { bg:"bg-sky-500/10",    text:"text-sky-400",    border:"border-sky-500/20"    },
  Restock:  { bg:"bg-violet-500/10", text:"text-violet-400", border:"border-violet-500/20" },
};

const ECO_COLOR = {
  "🟢 Green":   "text-emerald-400",
  "🟡 Moderate":"text-amber-400",
  "🔴 High":    "text-red-400",
};

function WasteCard({ herb, excess_kg, urgency, flash_sale, flash_price, normal_price, revenue_saved, donation, action_by, discount, onDiscountChange }) {
  const isShortage = excess_kg <= 0;
  const uc = URGENCY_COLOR[urgency] || URGENCY_COLOR.Medium;
  const adjFlashPrice = isShortage ? 0 : Math.round(normal_price * (1 - discount / 100));
  const adjRevenue    = isShortage ? 0 : Math.abs(excess_kg) * adjFlashPrice;
  const vsOriginal    = adjRevenue - revenue_saved;

  return (
    <motion.div layout initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      className={`bg-surface-800 border rounded-2xl p-5 transition-all ${urgency==="Critical" ? "border-red-500/30 shadow-lg shadow-red-500/5" : "border-surface-600"}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-zinc-100 font-bold text-base">{herb}</h3>
          <p className="text-zinc-500 text-xs">Action by: <span className="text-zinc-300">{action_by}</span></p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${uc.bg} ${uc.text} ${uc.border}`}>
          {urgency}
        </span>
      </div>

      {!isShortage ? (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-surface-700 rounded-xl p-2.5 text-center">
              <p className="text-zinc-600 text-[10px]">Excess</p>
              <p className="text-amber-400 font-bold text-sm">{excess_kg} kg</p>
            </div>
            <div className="bg-surface-700 rounded-xl p-2.5 text-center">
              <p className="text-zinc-600 text-[10px]">Flash Price</p>
              <p className="text-emerald-400 font-bold text-sm">₹{adjFlashPrice}/kg</p>
            </div>
            <div className="bg-surface-700 rounded-xl p-2.5 text-center">
              <p className="text-zinc-600 text-[10px]">Recovered</p>
              <p className="text-emerald-400 font-bold text-sm">₹{adjRevenue.toLocaleString()}</p>
            </div>
          </div>

          {/* Discount slider */}
          <div className="bg-surface-700 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-[11px] font-medium">Flash Sale Discount</span>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-black text-sm tabular-nums">{discount}% OFF</span>
                {vsOriginal !== 0 && (
                  <span className={`text-[10px] font-semibold ${vsOriginal > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {vsOriginal > 0 ? "+" : ""}₹{Math.abs(Math.round(vsOriginal))}
                  </span>
                )}
              </div>
            </div>
            <input type="range" min={5} max={60} step={5} value={discount}
              onChange={e => onDiscountChange(herb, +e.target.value)}
              className="w-full h-2 bg-surface-600 rounded-full appearance-none cursor-pointer accent-amber-400"/>
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
              <span>5%</span><span className="text-amber-400">30% sweet spot</span><span>60%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-surface-700 rounded-xl px-3 py-2">
            <Tag size={11} className="text-amber-400 flex-shrink-0"/>
            <p className="text-zinc-300 text-xs font-medium flex-1">{excess_kg}kg {herb} @ ₹{adjFlashPrice}/kg ({discount}% OFF)</p>
          </div>
          {donation && (
            <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
              <Heart size={11} className="text-pink-400 flex-shrink-0"/>
              <span>{donation}</span>
            </div>
          )}
        </>
      ) : (
        <div className={`${uc.bg} border ${uc.border} rounded-xl p-3`}>
          <p className={`${uc.text} text-sm font-semibold`}>{flash_sale}</p>
          <p className="text-zinc-500 text-xs mt-1">Restock at ₹{normal_price}/kg before demand peaks</p>
        </div>
      )}
    </motion.div>
  );
}

export default function WastePredictor() {
  const [data,      setData]      = useState(null);
  const [aiStrat,   setAiStrat]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [aiLoad,    setAiLoad]    = useState(false);
  const [discounts, setDiscounts] = useState({});
  const [donated,   setDonated]   = useState({});

  const getDiscount = (herb) => discounts[herb] ?? 30;

  const refresh = useCallback(async (silent=false) => {
    if (!silent) setLoading(true);
    try {
      const { data: d } = await API.get("/waste/");
      setData(d);
    } catch { if (!silent) toast.error("Using cached waste data"); }
    finally { setLoading(false); }
  }, []);

  const getAIStrategy = async () => {
    setAiLoad(true);
    try {
      const { data: d } = await API.get("/waste/ai");
      setAiStrat(d);
      toast.success("AI strategy generated");
    } catch { toast.error("AI strategy failed — showing example"); }
    finally { setAiLoad(false); }
  };

  useEffect(() => { refresh(); }, [refresh]);
  // Auto-load AI strategy on mount
  useEffect(() => { getAIStrategy(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = setInterval(() => refresh(true), 90000);
    return () => clearInterval(id);
  }, [refresh]);

  const calcRevenue = useMemo(() => {
    if (!data?.alerts) return 0;
    return data.alerts
      .filter(a => a.excess_kg > 0)
      .reduce((sum, a) => {
        const d = getDiscount(a.herb);
        return sum + a.excess_kg * Math.round(a.normal_price * (1 - d / 100));
      }, 0);
  }, [data, discounts]);

  const handleMarkDonated = (herb) => {
    setDonated(p => ({ ...p, [herb]: true }));
    toast.success(`${herb} marked as donated to NGO`);
  };

  const totalCarbon = data?.carbon_scores?.reduce((s,c)=>s+c.total_saved_kg_co2,0)||0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
            <Trash2 size={20} className="text-amber-400"/> Waste Predictor
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">Flash sale builder · donation tracker · carbon footprint</p>
        </div>
        <button onClick={() => refresh()} disabled={loading}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-100 bg-surface-800 border border-surface-600 px-3 py-1.5 rounded-xl transition-all">
          <RefreshCw size={11} className={loading?"animate-spin":""}/>Refresh
        </button>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"Total Excess",       value:data?`${data.total_waste_kg}kg`:"—",          color:"#f59e0b", icon:Package2  },
          { label:"Revenue Recoverable",value:`₹${calcRevenue.toLocaleString()}`,              color:"#10b981", icon:Zap      },
          { label:"Flash Sales Active", value:data?.flash_sale_count||0,                       color:"#38bdf8", icon:Tag      },
          { label:"CO₂ Saved",          value:`${totalCarbon.toFixed(0)} kg`,                  color:"#10b981", icon:Leaf     },
        ].map(({label,value,color,icon:Icon})=>(
          <motion.div key={label} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }}
            className="bg-surface-800 border border-surface-600 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: color+"20" }}>
              <Icon size={15} style={{ color }}/>
            </div>
            <div>
              <p className="text-zinc-500 text-[11px] uppercase tracking-wide">{label}</p>
              <p className="font-black text-lg tabular-nums" style={{ color }}>{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue tracker */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="bg-gradient-to-r from-emerald-500/10 to-surface-800 border border-emerald-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
            <Calculator size={15} className="text-emerald-400"/>
          </div>
          <div className="flex-1">
            <p className="text-zinc-400 text-xs font-medium mb-1">Real-time Flash Sale Revenue Calculator</p>
            <p className="text-zinc-500 text-xs">Adjust the discount sliders on each card to see live revenue recovery changes</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-xs">Optimised Recovery</p>
            <p className="text-3xl font-black text-emerald-400 tabular-nums">₹{calcRevenue.toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Waste Alert Cards */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-200">Active Alerts</h2>
            <span className="text-zinc-500 text-xs">{data?.alerts?.length||0} items</span>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({length:3}).map((_,i)=><div key={i} className="h-56 bg-surface-800 border border-surface-600 rounded-2xl animate-pulse"/>)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.alerts?.map(a => (
                <WasteCard key={a.herb} {...a}
                  discount={getDiscount(a.herb)}
                  onDiscountChange={(h,d) => setDiscounts(p=>({...p,[h]:d}))}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Carbon Footprint */}
          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Leaf size={14} className="text-emerald-400"/>
              <h2 className="text-sm font-bold text-zinc-200">Carbon Footprint</h2>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full ml-auto font-semibold">
                {totalCarbon.toFixed(0)} kg CO₂ saved
              </span>
            </div>
            {data?.carbon_scores ? data.carbon_scores.map(c=>(
              <div key={c.herb} className="flex items-center justify-between py-2.5 border-b border-surface-700 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.badge.includes("Green") ? "#10b981" : c.badge.includes("Moderate") ? "#f59e0b" : "#ef4444" }}/>
                  <p className="text-zinc-200 text-sm">{c.herb}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-zinc-500 text-[10px] tabular-nums">{c.score} CO₂/kg</p>
                  <span className={`text-xs font-semibold ${ECO_COLOR[c.badge]||"text-zinc-400"}`}>{c.badge.split(" ")[0]} {c.badge.split(" ")[1]}</span>
                </div>
              </div>
            )) : Array.from({length:5}).map((_,i)=><div key={i} className="h-8 bg-surface-700 rounded-xl animate-pulse mb-2"/>)}
            {data?.eco_summary && (
              <p className="text-emerald-400 text-[11px] mt-3 pt-3 border-t border-surface-700 leading-relaxed">
                🌱 {data.eco_summary}
              </p>
            )}
          </div>

          {/* Donation Tracker */}
          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={14} className="text-pink-400"/>
              <h2 className="text-sm font-bold text-zinc-200">NGO Donation Tracker</h2>
            </div>
            {data?.alerts?.filter(a=>a.excess_kg>0&&a.donation).map(a=>(
              <div key={a.herb} className="flex items-center justify-between py-2.5 border-b border-surface-700 last:border-0">
                <div>
                  <p className="text-zinc-300 text-sm">{a.herb}</p>
                  <p className="text-zinc-600 text-[10px]">{a.donation}</p>
                </div>
                {donated[a.herb] ? (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg font-bold">Donated ✓</span>
                ) : (
                  <button onClick={() => handleMarkDonated(a.herb)}
                    className="text-[10px] text-pink-400 border border-pink-500/20 hover:bg-pink-500/10 px-2.5 py-1.5 rounded-lg transition-all font-semibold">
                    Mark Donated
                  </button>
                )}
              </div>
            ))}
            <p className="text-zinc-600 text-[10px] mt-3">
              {Object.keys(donated).length} donations completed · Builds green brand credibility with chefs
            </p>
          </div>

          {/* AI Strategy */}
          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-amber-400"/>
              <h2 className="text-sm font-bold text-zinc-200">AI Waste Strategy</h2>
            </div>
            <AnimatePresence mode="wait">
              {aiStrat ? (
                <motion.div key="strat" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-3">{aiStrat.strategy}</p>
                  <div className="space-y-2 mb-3">
                    {aiStrat.priority_actions?.map((a,i)=>(
                      <div key={i} className="flex items-start gap-2 text-xs text-zinc-400 bg-surface-700 rounded-lg px-3 py-2">
                        <span className="text-amber-400 font-black mt-0.5 flex-shrink-0">{i+1}.</span>
                        <span className="leading-relaxed">{a}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                    <p className="text-emerald-400 text-xs font-bold">Opportunity: {aiStrat.revenue_opportunity}</p>
                    <p className="text-zinc-500 text-[11px] mt-1 leading-relaxed">{aiStrat.sustainability_tip}</p>
                  </div>
                  <button onClick={getAIStrategy} disabled={aiLoad}
                    className="w-full mt-3 text-xs text-zinc-500 hover:text-amber-400 border border-surface-600 hover:border-amber-500/30 py-2 rounded-xl transition-all">
                    Regenerate Strategy
                  </button>
                </motion.div>
              ) : (
                <motion.button key="btn" onClick={getAIStrategy} disabled={aiLoad}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-zinc-400 hover:text-amber-400 border border-surface-600 hover:border-amber-500/40 hover:bg-amber-500/5 py-3 rounded-xl transition-all disabled:opacity-50 group">
                  {aiLoad ? (
                    <>
                      <span className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"/>
                      Generating with Groq...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="group-hover:text-amber-400 transition-colors"/>
                      Generate AI Strategy
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
