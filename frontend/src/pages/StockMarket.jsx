import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, Sparkles, Activity,
  Calculator, Bell, BellOff, ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, AreaChart, Area } from "recharts";
import API from "../api";
import toast from "react-hot-toast";

const HERB_EMOJI = {
  Basil:"🌿", Mint:"🍃", Lettuce:"🥬", Spinach:"🌱", Coriander:"🌾",
  Rosemary:"🪴", Thyme:"🌺", Parsley:"🌿", Chives:"🌱"
};

function MiniChart({ data, color, fill }) {
  const pts = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={pts}>
        <defs>
          <linearGradient id={`g-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="100%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#g-${color.replace("#","")})`} dot={false}/>
        <Tooltip content={({active,payload})=>{
          if(!active||!payload?.length) return null;
          return <div className="bg-surface-900 border border-surface-600 rounded-lg px-2 py-1 text-xs text-zinc-300">&#8377;{payload[0]?.value}</div>;
        }}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

function Ticker({ herb, price, change, trend, history, volume_kg, market_cap, sector, week_high, week_low, rsi, ohlc, beta, alertPrice, onSetAlert, qty, isSelected, onSelect }) {
  const isUp   = change > 0;
  const isFlat = Math.abs(change) < 0.5;
  const color  = isFlat ? "#71717a" : isUp ? "#10b981" : "#ef4444";
  const Icon   = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
  const totalVal = qty > 0 ? (qty * price).toLocaleString() : null;
  const alert  = alertPrice > 0 && price >= alertPrice;
  const rsiColor = rsi > 70 ? "#ef4444" : rsi < 30 ? "#10b981" : "#f59e0b";

  return (
    <motion.div layout initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      onClick={() => onSelect(herb)}
      className={`bg-surface-800 border rounded-2xl p-5 cursor-pointer transition-all duration-200 ${
        isSelected ? "border-emerald-500/50 shadow-lg shadow-emerald-500/5" :
        alert ? "border-amber-500/50" : "border-surface-600 hover:border-surface-500"
      }`}>
      {alert && (
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5 mb-3">
          <Bell size={11} className="text-amber-400"/>
          <p className="text-amber-300 text-[10px] font-bold">PRICE ALERT TRIGGERED · ₹{alertPrice} target reached</p>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{HERB_EMOJI[herb] || "🌿"}</span>
            <div>
              <h3 className="text-zinc-100 font-bold leading-none">{herb}</h3>
              <p className="text-zinc-600 text-[10px] mt-0.5">{sector}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
            isFlat ? "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20" :
            isUp   ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                     "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            <Icon size={10}/>
            {change > 0 ? "+" : ""}{change}%
          </div>
        </div>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-2xl font-black text-zinc-100 tabular-nums">₹{price}</span>
        <span className="text-zinc-500 text-sm mb-0.5">/kg</span>
        {isUp ? <ArrowUpRight size={14} className="text-emerald-400 mb-1"/> : isFlat ? null : <ArrowDownRight size={14} className="text-red-400 mb-1"/>}
      </div>

      <MiniChart data={history} color={color}/>

      {/* OHLC strip */}
      {ohlc && (
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          {[["O",ohlc.open],["H",ohlc.high],["L",ohlc.low],["C",ohlc.close]].map(([k,v])=>(
            <div key={k} className="bg-surface-700 rounded-lg p-1.5 text-center">
              <p className="text-zinc-600 text-[9px] font-semibold">{k}</p>
              <p className="text-zinc-300 text-[11px] font-bold tabular-nums">₹{v}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="bg-surface-700 rounded-xl p-2 text-center">
          <p className="text-zinc-600 text-[10px]">Vol</p>
          <p className="text-zinc-200 text-xs font-bold">{volume_kg} kg</p>
        </div>
        <div className="bg-surface-700 rounded-xl p-2 text-center">
          <p className="text-zinc-600 text-[10px]">RSI</p>
          <p className="text-xs font-black tabular-nums" style={{color:rsiColor}}>{rsi}</p>
        </div>
        <div className="bg-surface-700 rounded-xl p-2 text-center">
          <p className="text-zinc-600 text-[10px]">Beta</p>
          <p className="text-zinc-200 text-xs font-bold">{beta}</p>
        </div>
      </div>

      {/* Week range bar */}
      {week_high && week_low && (
        <div className="mt-2.5">
          <div className="flex justify-between text-[10px] text-zinc-600 mb-1">
            <span>52W Low ₹{week_low}</span><span>52W High ₹{week_high}</span>
          </div>
          <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden relative">
            <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 opacity-40" style={{width:"100%"}}/>
            <div className="absolute top-0 h-full w-0.5 bg-zinc-100 rounded-full"
              style={{left:`${Math.min(((price-week_low)/(week_high-week_low))*100,100)}%`}}/>
          </div>
        </div>
      )}

      {totalVal && (
        <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 flex items-center justify-between">
          <span className="text-zinc-400 text-xs">{qty} kg order value</span>
          <span className="text-emerald-400 font-bold text-sm">₹{totalVal}</span>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <button onClick={e=>{e.stopPropagation();onSetAlert(herb);}}
          className="flex-1 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 hover:text-amber-400 border border-surface-700 hover:border-amber-500/30 py-1.5 rounded-lg transition-all">
          {alertPrice > 0 ? <><BellOff size={11}/> Clear alert</> : <><Bell size={11}/> Set alert</>}
        </button>
        {isSelected && (
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5 rounded-lg font-semibold">Selected</span>
        )}
      </div>
    </motion.div>
  );
}

export default function StockMarket() {
  const [data,     setData]     = useState(null);
  const [insight,  setInsight]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [insLoad,  setInsLoad]  = useState(false);
  const [alerts,   setAlerts]   = useState({});
  const [alertInput, setAlertInput] = useState("");
  const [pendingAlert, setPendingAlert] = useState(null);
  const [selected, setSelected] = useState(null);
  const [qty,      setQty]      = useState("");
  const [sortBy,   setSortBy]   = useState("name");
  const [sortDir,  setSortDir]  = useState(1);
  const [countdown, setCountdown] = useState(60);

  const refresh = useCallback(async (silent=false) => {
    if (!silent) setLoading(true);
    try {
      const { data: d } = await API.get("/market/");
      setData(d);
      setCountdown(60);
    } catch { if (!silent) toast.error("Using cached market data"); }
    finally { setLoading(false); }
  }, []);

  const loadInsight = async () => {
    setInsLoad(true);
    try {
      const { data: d } = await API.get("/market/insight");
      setInsight(d);
    } catch {}
    finally { setInsLoad(false); }
  };

  useEffect(() => { refresh(); loadInsight(); }, [refresh]);
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { refresh(true); return 60; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [refresh]);

  const handleSetAlert = (herb) => {
    if (alerts[herb]) {
      setAlerts(a => { const n={...a}; delete n[herb]; return n; });
      toast.success(`Alert cleared for ${herb}`);
      return;
    }
    setPendingAlert(herb);
    setAlertInput("");
  };

  const confirmAlert = () => {
    const price = +alertInput;
    if (!price || price <= 0) { toast.error("Enter a valid price"); return; }
    setAlerts(a => ({ ...a, [pendingAlert]: price }));
    toast.success(`Alert set: ${pendingAlert} @ ₹${price}/kg`);
    setPendingAlert(null);
  };

  const selectedTicker = data?.tickers?.find(t => t.herb === selected);
  const qtyNum = +qty || 0;

  const sorted = useMemo(() => {
    if (!data?.tickers) return [];
    return [...data.tickers].sort((a,b) => {
      if (sortBy === "change") return (b.change - a.change) * sortDir;
      if (sortBy === "price")  return (b.price  - a.price)  * sortDir;
      return a.herb.localeCompare(b.herb) * sortDir;
    });
  }, [data, sortBy, sortDir]);

  const bullish = data?.tickers?.filter(t=>t.change>0).length||0;
  const bearish = data?.tickers?.filter(t=>t.change<0).length||0;
  const topGainer = data?.tickers?.reduce((a,b)=>a.change>b.change?a:b,data?.tickers[0]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
            <Activity size={20} className="text-sky-400"/> Herb Stock Market
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">Live herb prices · refreshes every 60s</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl font-semibold border bg-surface-800 border-surface-600">
            <span className="tabular-nums text-zinc-400">{countdown}s</span>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-xl font-bold border ${data?.market_status==="Open" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{background: data?.market_status==="Open"?"#10b981":"#71717a"}}/>
            {data?.market_status || "Loading"}
          </span>
          <button onClick={() => refresh()} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 bg-surface-800 border border-surface-600 px-3 py-1.5 rounded-xl transition-all disabled:opacity-40">
            <RefreshCw size={11} className={loading?"animate-spin":""}/>Refresh
          </button>
        </div>
      </motion.div>

      {/* Market summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label:"Gaining",    value:bullish,                                    color:"#10b981" },
          { label:"Declining",  value:bearish,                                    color:"#ef4444" },
          { label:"Top Gainer", value:topGainer?.herb || "—",                     color:"#38bdf8" },
          { label:"Best Price", value:topGainer ? `₹${topGainer.price}` : "—",   color:"#f59e0b" },
          { label:"Sentiment",  value:data?.market_sentiment || "Neutral",
            color: data?.market_sentiment==="Bullish" ? "#10b981" : data?.market_sentiment==="Bearish" ? "#ef4444" : "#f59e0b" },
        ].map(({label,value,color})=>(
          <motion.div key={label} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }}
            className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
            <p className="text-zinc-500 text-[11px] uppercase tracking-wide mb-1">{label}</p>
            <p className="font-black text-xl tabular-nums" style={{color}}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* AI Insight */}
      {(insight || insLoad) && (
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          className="bg-sky-500/5 border border-sky-500/20 rounded-2xl p-5">
          {insLoad ? (
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin"/>
              <span className="text-zinc-500 text-sm">Generating market intelligence...</span>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles size={13} className="text-sky-400"/>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sky-300 text-[11px] font-bold uppercase tracking-wide">Groq AI · Market Intelligence</p>
                </div>
                <p className="text-zinc-200 text-sm leading-relaxed mb-3">{insight?.insight}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                    <p className="text-zinc-500 text-[10px] mb-1">Buy Signal</p>
                    <p className="text-emerald-400 font-bold text-sm">{insight?.buy_signal}</p>
                    <p className="text-zinc-500 text-[10px] mt-1">{insight?.opportunity}</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <p className="text-zinc-500 text-[10px] mb-1">Risk Watch</p>
                    <p className="text-red-400 font-bold text-sm">{insight?.sell_signal}</p>
                    <p className="text-zinc-500 text-[10px] mt-1">{insight?.risk}</p>
                  </div>
                </div>
              </div>
              <button onClick={loadInsight} disabled={insLoad}
                className="text-xs text-zinc-500 hover:text-sky-400 border border-surface-600 hover:border-sky-500/30 px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0">
                <RefreshCw size={11}/>
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Order Calculator */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
        className="bg-surface-800 border border-surface-600 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator size={14} className="text-violet-400"/>
          <h2 className="text-sm font-bold text-zinc-200">Order Calculator</h2>
          <span className="text-[10px] text-zinc-500 bg-surface-700 px-2 py-0.5 rounded-md">Click any herb card to select</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-zinc-500 text-xs block mb-1.5">Selected Herb</label>
            <div className={`bg-surface-700 border rounded-xl px-3 py-2.5 text-sm font-semibold ${selected ? "text-zinc-100 border-emerald-500/40" : "text-zinc-600 border-surface-600"}`}>
              {selected ? `${HERB_EMOJI[selected]} ${selected}` : "Click a card →"}
            </div>
          </div>
          <div>
            <label className="text-zinc-500 text-xs block mb-1.5">Quantity (kg)</label>
            <input type="number" min={1} max={500} value={qty} onChange={e=>setQty(e.target.value)} placeholder="e.g. 50"
              className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder-zinc-600"/>
          </div>
          <div>
            <label className="text-zinc-500 text-xs block mb-1.5">Unit Price</label>
            <div className="bg-surface-700 border border-surface-600 rounded-xl px-3 py-2.5 text-sm text-zinc-300 tabular-nums">
              {selectedTicker ? `₹${selectedTicker.price}/kg` : "—"}
            </div>
          </div>
          <div className={`rounded-xl p-3 text-center transition-all ${qtyNum > 0 && selectedTicker ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-surface-700 border border-surface-600"}`}>
            <p className="text-zinc-500 text-[10px] mb-0.5">Total Order Value</p>
            <p className={`text-xl font-black tabular-nums ${qtyNum>0&&selectedTicker ? "text-emerald-400" : "text-zinc-600"}`}>
              {qtyNum > 0 && selectedTicker ? `₹${(qtyNum * selectedTicker.price).toLocaleString()}` : "—"}
            </p>
            {qtyNum>0&&selectedTicker&&(
              <p className="text-zinc-500 text-[10px] mt-0.5">{qtyNum} kg × ₹{selectedTicker.price}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Alert dialog */}
      <AnimatePresence>
        {pendingAlert && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
            onClick={()=>setPendingAlert(null)}>
            <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}
              onClick={e=>e.stopPropagation()}
              className="bg-surface-800 border border-surface-500 rounded-2xl p-6 w-80 shadow-2xl">
              <h3 className="text-zinc-100 font-bold mb-1">Set Price Alert</h3>
              <p className="text-zinc-500 text-sm mb-4">Get notified when <span className="text-emerald-400">{pendingAlert}</span> reaches your target price.</p>
              <div className="mb-4">
                <label className="text-zinc-500 text-xs block mb-1.5">Target price (₹/kg)</label>
                <input type="number" value={alertInput} onChange={e=>setAlertInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&confirmAlert()}
                  autoFocus placeholder="e.g. 300"
                  className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-amber-500/50 transition-all placeholder-zinc-600"/>
                <p className="text-zinc-600 text-[11px] mt-1.5">
                  Current: ₹{data?.tickers?.find(t=>t.herb===pendingAlert)?.price || "—"}/kg
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setPendingAlert(null)}
                  className="flex-1 py-2.5 text-sm text-zinc-400 border border-surface-600 rounded-xl hover:bg-surface-700 transition-all">Cancel</button>
                <button onClick={confirmAlert}
                  className="flex-1 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-xl transition-all">Set Alert</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-zinc-500 text-xs">Sort by:</span>
        {[["name","Name"],["price","Price"],["change","Change %"]].map(([k,l])=>(
          <button key={k} onClick={()=>{ if(sortBy===k){setSortDir(d=>-d)}else{setSortBy(k);setSortDir(-1)} }}
            className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${sortBy===k ? "bg-emerald-600 text-white font-semibold" : "bg-surface-800 text-zinc-400 border border-surface-600 hover:border-surface-500"}`}>
            {l}
            {sortBy===k&&(sortDir>0?<ChevronUp size={10}/>:<ChevronDown size={10}/>)}
          </button>
        ))}
        <span className="text-zinc-600 text-xs ml-auto">{Object.keys(alerts).length} active alerts</span>
      </div>

      {/* Tickers */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({length:5}).map((_,i)=><div key={i} className="h-64 bg-surface-800 border border-surface-600 rounded-2xl animate-pulse"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(t => (
            <Ticker key={t.herb} {...t}
              alertPrice={alerts[t.herb] || 0}
              onSetAlert={handleSetAlert}
              qty={selected === t.herb ? qtyNum : 0}
              isSelected={selected === t.herb}
              onSelect={h => setSelected(s => s===h?null:h)}
            />
          ))}
        </div>
      )}

      <p className="text-zinc-700 text-xs text-center">Prices are market estimates updated every 60 seconds · {data?.last_updated}</p>
    </div>
  );
}
