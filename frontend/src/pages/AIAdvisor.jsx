import { useEffect, useRef, useState } from "react";
import { useLang } from "../context/LangContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, BrainCircuit, Sparkles, TrendingUp, AlertTriangle, Leaf,
  RefreshCw, ChevronRight, Zap, Copy, Check, Thermometer, Droplets,
  Package, Activity
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../api";

const QUICK = [
  { label:"Basil price",    q:"What is the current price of basil and how do I maximise revenue?" },
  { label:"Freshness",      q:"Which herbs have the lowest freshness right now and what should I do?" },
  { label:"Waste alert",    q:"What herbs have the most excess stock? Recommend a flash sale strategy." },
  { label:"Sensors",        q:"What do the current sensor readings tell us about farm conditions?" },
  { label:"Chef partners",  q:"We have 18 active chef partners. What's the fastest way to reach the target of 25?" },
  { label:"Yield boost",    q:"How do I push monthly yield past 1,500 kg given current conditions?" },
];

const PRIORITY_STYLE = {
  High:   "bg-red-500/10 text-red-400 border-red-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Low:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function TypingDots() {
  return (
    <div className="flex gap-1.5 px-4 py-3.5">
      {[0,1,2].map(i=>(
        <motion.div key={i} className="w-2 h-2 bg-emerald-400/60 rounded-full"
          animate={{ scale:[1,1.4,1], opacity:[0.5,1,0.5] }}
          transition={{ duration:0.9, delay:i*0.2, repeat:Infinity }}/>
      ))}
    </div>
  );
}

function ChatBubble({ role, text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied");
  };
  return (
    <motion.div initial={{ opacity:0, y:8, scale:0.98 }} animate={{ opacity:1, y:0, scale:1 }}
      className={`flex gap-2.5 ${role==="user"?"justify-end":"justify-start"} group`}>
      {role==="ai" && (
        <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
          <BrainCircuit size={13} className="text-emerald-400"/>
        </div>
      )}
      <div className={`relative max-w-[82%] ${role==="user"?"items-end":"items-start"} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          role==="user"
            ? "bg-emerald-600 text-white rounded-tr-sm"
            : "bg-surface-700 border border-surface-600 text-zinc-200 rounded-tl-sm"
        }`}>
          {text}
        </div>
        {role==="ai" && (
          <button onClick={copy}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-all">
            {copied ? <Check size={9}/> : <Copy size={9}/>}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* Build comprehensive live_data object from all fetched data */
function buildLiveData(market, freshness, wasteData, sensors, kpis, demand) {
  const out = {};
  if (market?.length) {
    out.prices  = Object.fromEntries(market.map(h => [h.herb, h.price]));
    out.changes = Object.fromEntries(market.map(h => [h.herb, h.change ?? 0]));
  }
  if (freshness?.length) {
    out.freshness = Object.fromEntries(freshness.map(h => [h.herb, h.freshness_days]));
  }
  if (wasteData?.length) {
    const excess = {};
    wasteData.forEach(w => { if (w.excess_kg > 0) excess[w.herb] = w.excess_kg; });
    if (Object.keys(excess).length) out.waste = excess;
  }
  if (sensors) {
    out.sensors = {
      temperature: sensors.temperature?.value,
      humidity:    sensors.humidity?.value,
      co2:         sensors.co2?.value,
      light:       sensors.light?.value,
      ph:          sensors.ph?.value,
    };
  }
  if (kpis) {
    out.kpis = {
      yield:    kpis.yield?.value,
      water:    kpis.water?.value,
      power:    kpis.power?.value,
      delivery: kpis.delivery?.value,
    };
  }
  if (demand?.alerts?.length) {
    out.demand = demand.alerts.slice(0, 5);
  }
  return out;
}

export default function AIAdvisor() {
  const { t } = useLang();
  const [messages, setMessages] = useState([{
    role:"ai",
    text:"Hello! I'm AgriIntel AI — powered by Groq Llama 70B.\n\nI receive your complete live dashboard as context with every question: herb prices, freshness days, excess stock, sensor readings (temperature, humidity, CO₂), KPIs, and demand alerts.\n\nEvery answer I give uses your EXACT current data — not approximations. Ask me anything about your farm."
  }]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [recs,        setRecs]        = useState([]);
  const [demand,      setDemand]      = useState(null);
  const [seasonal,    setSeasonal]    = useState(null);
  const [activeTab,   setActiveTab]   = useState("recs");
  const [recsLoad,    setRecsLoad]    = useState(false);
  const [liveMarket,  setLiveMarket]  = useState([]);
  const [liveFresh,   setLiveFresh]   = useState([]);
  const [liveWaste,   setLiveWaste]   = useState([]);
  const [liveSensors, setLiveSensors] = useState(null);
  const [liveKpis,    setLiveKpis]    = useState(null);
  const [contextTab,  setContextTab]  = useState("prices");
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  const loadPanels = async () => {
    setRecsLoad(true);
    try {
      const [r, d, s, m, f, w, sens, k] = await Promise.all([
        API.get("/ai/recommendations"),
        API.post("/ai/demand-alerts", { live_data: {} }),
        API.get("/ai/seasonal"),
        API.get("/market/"),
        API.get("/freshness/"),
        API.get("/waste/"),
        API.get("/sensors/"),
        API.get("/kpis/"),
      ]);
      setRecs(r.data.recommendations || []);
      setDemand(d.data);
      setSeasonal(s.data);
      setLiveMarket(m.data?.tickers || []);
      setLiveFresh(f.data || []);
      setLiveWaste(w.data?.alerts || []);
      setLiveSensors(sens.data);
      setLiveKpis(k.data);
    } catch {}
    finally { setRecsLoad(false); }
  };

  useEffect(() => { loadPanels(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  const ask = async (q = input.trim()) => {
    if (!q || loading) return;
    setMessages(p => [...p, { role:"user", text:q }]);
    setInput("");
    setLoading(true);
    try {
      const live_data = buildLiveData(liveMarket, liveFresh, liveWaste, liveSensors, liveKpis, demand);
      const { data } = await API.post("/ai/chat", {
        message: q,
        history: messages.slice(-6).map(m => ({ role:m.role, content:m.text })),
        live_data,
      }, { timeout: 40000 });
      setMessages(p => [...p, { role:"ai", text:data.reply }]);
    } catch (err) {
      const isTimeout = err?.code === "ECONNABORTED" || err?.message?.includes("timeout");
      const msg = isTimeout
        ? "AI is taking longer than usual — please try again. (Tip: ask shorter questions for faster responses.)"
        : "AI is temporarily unavailable. Check that the backend server is running on port 8001.";
      setMessages(p => [...p, { role:"ai", text:msg }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => setMessages([{ role:"ai", text:"Chat cleared. How can I help you with your farm today?" }]);

  const hasLive = liveMarket.length > 0;
  const urgentFresh = liveFresh.filter(h => h.freshness_days < 2).length;
  const excessHerbs = liveWaste.filter(w => w.excess_kg > 0).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
            <BrainCircuit size={22} className="text-emerald-400"/> {t.pg_advisor_title}
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">{t.pg_advisor_sub}</p>
        </div>
        <button onClick={clearChat}
          className="text-xs text-zinc-500 hover:text-zinc-300 border border-surface-600 hover:border-surface-500 bg-surface-800 px-3 py-1.5 rounded-xl transition-all">
          {t.lbl_clear_chat}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Chat Panel */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          className="xl:col-span-3 flex flex-col gap-3">

          <div className="bg-surface-800 border border-surface-600 rounded-2xl h-[460px] overflow-y-auto p-5 space-y-4 scroll-smooth">
            <AnimatePresence initial={false}>
              {messages.map((m,i) => <ChatBubble key={i} role={m.role} text={m.text}/>)}
              {loading && (
                <motion.div key="loading" initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BrainCircuit size={13} className="text-emerald-400"/>
                  </div>
                  <div className="bg-surface-700 border border-surface-600 rounded-2xl rounded-tl-sm">
                    <TypingDots/>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={endRef}/>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {QUICK.map(({label,q},i)=>(
              <button key={i} onClick={() => ask(q)} disabled={loading}
                className="text-[11px] text-zinc-400 hover:text-emerald-400 border border-surface-600 hover:border-emerald-500/30 hover:bg-emerald-500/5 bg-surface-800 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-40">
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input ref={inputRef}
                className="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 pr-10 transition-all"
                placeholder="Ask about yield, pricing, freshness, waste, sensors..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key==="Enter" && !e.shiftKey && ask()}
              />
              {input.length > 0 && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600">↵</span>}
            </div>
            <button onClick={() => ask()} disabled={loading || !input.trim()}
              className="flex items-center justify-center w-11 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={15}/>}
            </button>
          </div>
        </motion.div>

        {/* Right Intelligence Panel */}
        <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }}
          className="xl:col-span-2 flex flex-col gap-4">

          {/* Live Context panel */}
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-violet-300 text-xs font-bold uppercase tracking-wide">Live Context</p>
                {hasLive && <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">LIVE</span>}
              </div>
              <button onClick={loadPanels} disabled={recsLoad} className="text-[10px] text-zinc-600 hover:text-zinc-400 flex items-center gap-1 transition-colors">
                <RefreshCw size={9} className={recsLoad?"animate-spin":""}/>Refresh
              </button>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {urgentFresh > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full flex items-center gap-1">
                  <Leaf size={7}/>{urgentFresh} urgent freshness
                </span>
              )}
              {excessHerbs > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center gap-1">
                  <Package size={7}/>{excessHerbs} excess herbs
                </span>
              )}
              {liveSensors && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full flex items-center gap-1">
                  <Activity size={7}/>sensors live
                </span>
              )}
            </div>

            {/* Mini tabs */}
            <div className="flex gap-1 mb-3">
              {[["prices","Prices"],["fresh","Fresh"],["waste","Waste"],["env","Sensors"]].map(([k,l])=>(
                <button key={k} onClick={()=>setContextTab(k)}
                  className={`flex-1 text-[9px] font-bold py-1 rounded-lg transition-all ${
                    contextTab===k ? "bg-violet-600/30 text-violet-300 border border-violet-500/30" : "text-zinc-600 hover:text-zinc-400"
                  }`}>{l}</button>
              ))}
            </div>

            {/* Prices tab */}
            {contextTab === "prices" && (
              <div className="grid grid-cols-2 gap-1.5">
                {(hasLive ? liveMarket : []).slice(0,6).map(h => (
                  <div key={h.herb} className="bg-surface-800 rounded-lg px-2 py-1.5 flex justify-between gap-1 items-center">
                    <span className="text-zinc-500 text-[10px]">{h.herb}</span>
                    <div className="text-right">
                      <span className="text-violet-300 font-bold text-[10px]">₹{h.price}</span>
                      <span className={`text-[9px] ml-1 font-semibold ${(h.change??0) > 0 ? "text-emerald-400" : (h.change??0) < 0 ? "text-red-400" : "text-zinc-500"}`}>
                        {(h.change??0) > 0 ? "▲" : (h.change??0) < 0 ? "▼" : "—"}{Math.abs(h.change??0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                {!hasLive && <p className="text-zinc-600 text-[10px] col-span-2 py-2 text-center">Loading live prices...</p>}
              </div>
            )}

            {/* Freshness tab */}
            {contextTab === "fresh" && (
              <div className="grid grid-cols-2 gap-1.5">
                {liveFresh.slice(0,6).map(h => (
                  <div key={h.herb} className={`rounded-lg px-2 py-1.5 flex justify-between items-center ${
                    h.freshness_days < 2 ? "bg-red-500/10 border border-red-500/20" :
                    h.freshness_days < 3 ? "bg-amber-500/10 border border-amber-500/20" :
                    "bg-surface-800"
                  }`}>
                    <span className="text-zinc-400 text-[10px]">{h.herb}</span>
                    <span className={`font-bold text-[10px] tabular-nums ${
                      h.freshness_days < 2 ? "text-red-400" :
                      h.freshness_days < 3 ? "text-amber-400" : "text-emerald-400"
                    }`}>{h.freshness_days}d</span>
                  </div>
                ))}
                {!liveFresh.length && <p className="text-zinc-600 text-[10px] col-span-2 py-2 text-center">Loading freshness...</p>}
              </div>
            )}

            {/* Waste tab */}
            {contextTab === "waste" && (
              <div className="space-y-1.5">
                {liveWaste.filter(w => w.excess_kg > 0).slice(0,5).map(w => (
                  <div key={w.herb} className="flex items-center justify-between bg-surface-800 rounded-lg px-2.5 py-2">
                    <span className="text-zinc-400 text-[10px]">{w.herb}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        w.urgency==="Critical" ? "bg-red-500/15 text-red-400" :
                        w.urgency==="High"     ? "bg-amber-500/15 text-amber-400" :
                                                 "bg-zinc-800 text-zinc-400"
                      }`}>{w.urgency}</span>
                      <span className="text-amber-400 font-bold text-[10px]">{w.excess_kg}kg</span>
                    </div>
                  </div>
                ))}
                {!liveWaste.filter(w=>w.excess_kg>0).length && (
                  <p className="text-zinc-600 text-[10px] py-2 text-center">No excess stock</p>
                )}
              </div>
            )}

            {/* Sensors tab */}
            {contextTab === "env" && liveSensors && (
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { k:"temperature", label:"Temp", unit:"°C", color:"amber" },
                  { k:"humidity",    label:"Humid", unit:"%", color:"sky" },
                  { k:"co2",         label:"CO₂", unit:"ppm", color:"violet" },
                  { k:"light",       label:"Light", unit:"lux", color:"yellow" },
                  { k:"ph",          label:"pH", unit:"", color:"emerald" },
                ].map(({ k, label, unit, color }) => {
                  const s = liveSensors[k];
                  if (!s) return null;
                  return (
                    <div key={k} className="bg-surface-800 rounded-lg px-2 py-1.5">
                      <p className={`text-[9px] text-${color}-500/70 font-semibold`}>{label}</p>
                      <p className={`text-${color}-300 font-black text-sm tabular-nums`}>{s.value}{unit}</p>
                      <p className={`text-[9px] ${s.status==="Optimal"?"text-emerald-500":s.status==="High"?"text-red-400":"text-amber-400"}`}>{s.status}</p>
                    </div>
                  );
                })}
              </div>
            )}
            {contextTab === "env" && !liveSensors && (
              <p className="text-zinc-600 text-[10px] py-2 text-center">Loading sensor data...</p>
            )}

            <p className="text-zinc-700 text-[10px] mt-2 text-center">All data injected into every AI response</p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-surface-800 border border-surface-600 rounded-xl p-1 gap-1">
            {[["recs","Recommendations"],["demand","Demand Alerts"],["seasonal","Seasonal"]].map(([k,l])=>(
              <button key={k} onClick={()=>setActiveTab(k)}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${activeTab===k ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto max-h-[540px] space-y-3">

            {/* Recommendations */}
            {activeTab === "recs" && (
              <>
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs text-zinc-500">{recs.length} prioritised actions</p>
                  <button onClick={loadPanels} disabled={recsLoad}
                    className="text-xs text-zinc-500 hover:text-emerald-400 flex items-center gap-1 transition-colors">
                    <RefreshCw size={10} className={recsLoad?"animate-spin":""}/>Refresh
                  </button>
                </div>
                {recsLoad ? Array.from({length:4}).map((_,i)=>(
                  <div key={i} className="bg-surface-800 border border-surface-600 rounded-2xl p-4 animate-pulse space-y-2">
                    <div className="h-3.5 bg-surface-700 rounded w-3/4"/><div className="h-3 bg-surface-700 rounded"/><div className="h-3 bg-surface-700 rounded w-2/3"/>
                  </div>
                )) : recs.map((r,i)=>(
                  <motion.div key={i} initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.08 }}
                    className="bg-surface-800 border border-surface-600 rounded-2xl p-4 hover:border-surface-500 transition-all cursor-pointer group"
                    onClick={() => ask(`Tell me more about: ${r.title}`)}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-zinc-200 text-sm font-semibold leading-snug">{r.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex-shrink-0 ${PRIORITY_STYLE[r.priority]}`}>{r.priority}</span>
                    </div>
                    <p className="text-zinc-500 text-xs leading-relaxed mb-3">{r.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 text-[10px] bg-surface-700 px-2 py-0.5 rounded-md">{r.timeline}</span>
                      <span className="text-emerald-400 text-xs font-bold">{r.expected_impact}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-600 group-hover:text-emerald-500 transition-colors">
                      <ChevronRight size={10}/>Ask AI for details
                    </div>
                  </motion.div>
                ))}
              </>
            )}

            {/* Demand Alerts */}
            {activeTab === "demand" && demand && (
              <div className="space-y-3">
                {demand.alerts?.map((a,i)=>(
                  <motion.div key={i} initial={{ opacity:0,x:12 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.08 }}
                    className={`rounded-2xl p-4 border cursor-pointer hover:opacity-90 transition-all ${
                      a.urgency==="Critical" ? "bg-red-500/10 border-red-500/30" :
                      a.urgency==="High"     ? "bg-amber-500/10 border-amber-500/30" :
                                               "bg-surface-800 border-surface-600"
                    }`}
                    onClick={() => ask(`Demand alert: ${a.crop} demand is ${a.demand_change} in ${a.period}. What should I do?`)}>
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-zinc-200 font-bold text-sm">{a.crop}</p>
                      <span className={`text-xs font-black tabular-nums ${a.demand_change?.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>{a.demand_change}</span>
                    </div>
                    <p className="text-zinc-400 text-xs mb-1">{a.reason}</p>
                    <p className="text-zinc-500 text-xs">Action: <span className="text-zinc-300">{a.action}</span></p>
                    <p className="text-zinc-600 text-[10px] mt-1">{a.period}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Seasonal */}
            {activeTab === "seasonal" && seasonal && (
              <div className="space-y-3">
                {seasonal.predictions?.map((p,i)=>{
                  const demandPct = parseInt((p.demand_forecast||"0").replace(/[^0-9]/g,"")) || 0;
                  const conf = p.confidence || "Medium";
                  return (
                  <motion.div key={i} initial={{ opacity:0,x:12 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.1 }}
                    className="bg-surface-800 border border-surface-600 rounded-2xl p-4 cursor-pointer hover:border-surface-500 transition-all"
                    onClick={() => ask(`Seasonal: ${p.herb} demand ${p.demand_forecast} — how do I capitalise?`)}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-zinc-200 font-bold text-sm">{p.herb}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                          conf==="High" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                         "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>{conf}</span>
                        <span className="text-zinc-200 font-black text-sm tabular-nums">{p.demand_forecast}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden mb-2">
                      <motion.div initial={{width:0}} animate={{width:`${Math.min(demandPct,100)}%`}}
                        transition={{delay:0.3+i*0.1,duration:0.7,ease:"easeOut"}}
                        className="h-full rounded-full bg-emerald-500"/>
                    </div>
                    <p className="text-zinc-500 text-xs">{p.reason}</p>
                  </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
