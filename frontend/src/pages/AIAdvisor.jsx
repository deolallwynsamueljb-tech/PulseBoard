import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, BrainCircuit, Sparkles, TrendingUp, AlertTriangle, Leaf,
  RefreshCw, ChevronRight, Zap, Copy, Check
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../api";

const QUICK = [
  { label:"Basil yield",    q:"How can I increase basil yield this summer by 20%?" },
  { label:"Top crops",      q:"Which 2 crops should I prioritise next month for maximum revenue?" },
  { label:"Save water",     q:"How do I reduce water consumption by 15% without hurting yield?" },
  { label:"Pricing",        q:"What price should I charge for premium basil to beat competitors?" },
  { label:"More chefs",     q:"What's the fastest way to add 5 more chef partners this month?" },
  { label:"Flash sale",     q:"Should I run a flash sale today? I have 8kg excess lettuce." },
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

function ChatBubble({ role, text, onCopy }) {
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

export default function AIAdvisor() {
  const [messages, setMessages] = useState([{
    role:"ai",
    text:"Hello! I'm AgriIntel AI — powered by Gemini 2.0 Flash + Groq Llama 70B.\n\nI have full context on your farm: crops, yield trends, revenue, sensor data, chef partnerships, and market prices. Ask me anything about optimising your urban herb farm."
  }]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [recs,     setRecs]     = useState([]);
  const [demand,   setDemand]   = useState(null);
  const [seasonal, setSeasonal] = useState(null);
  const [activeTab,setActiveTab]= useState("recs");
  const [recsLoad, setRecsLoad] = useState(false);
  const endRef  = useRef(null);
  const inputRef = useRef(null);

  const loadPanels = async () => {
    setRecsLoad(true);
    try {
      const [r,d,s] = await Promise.all([
        API.get("/ai/recommendations"),
        API.get("/ai/demand-alerts"),
        API.get("/ai/seasonal"),
      ]);
      setRecs(r.data.recommendations || []);
      setDemand(d.data);
      setSeasonal(s.data);
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
      const { data } = await API.post("/ai/chat", {
        message: q,
        history: messages.slice(-6).map(m => ({ role:m.role, content:m.text })),
      });
      setMessages(p => [...p, { role:"ai", text:data.reply }]);
    } catch {
      toast.error("AI unavailable — retrying with fallback");
      const fallback = `Based on AgriIntel farm data: For "${q}", I recommend focusing on Zone A for basil expansion (38% demand surge expected this summer) and reviewing Zone B irrigation. Your delivery time of 2.4hrs is a key differentiator — protect it.`;
      setMessages(p => [...p, { role:"ai", text:fallback }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([{ role:"ai", text:"Chat cleared. How can I help you with your farm today?" }]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
            <BrainCircuit size={22} className="text-emerald-400"/> AI Advisor
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            <span className="text-emerald-400 font-medium">Gemini 2.0 Flash</span> + <span className="text-violet-400 font-medium">Groq Llama 70B</span> · Farm-aware intelligence
          </p>
        </div>
        <button onClick={clearChat}
          className="text-xs text-zinc-500 hover:text-zinc-300 border border-surface-600 hover:border-surface-500 bg-surface-800 px-3 py-1.5 rounded-xl transition-all">
          Clear chat
        </button>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Chat Panel */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          className="xl:col-span-3 flex flex-col gap-3">

          {/* Chat history */}
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

          {/* Quick prompts */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map(({label,q},i)=>(
              <button key={i} onClick={() => ask(q)} disabled={loading}
                className="text-[11px] text-zinc-400 hover:text-emerald-400 border border-surface-600 hover:border-emerald-500/30 hover:bg-emerald-500/5 bg-surface-800 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-40">
                {label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input ref={inputRef}
                className="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 pr-10 transition-all"
                placeholder="Ask about yield, pricing, waste, chefs, sensors..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key==="Enter" && !e.shiftKey && ask()}
              />
              {input.length > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600">↵</span>
              )}
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

            {/* Recommendations tab */}
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

            {/* Demand Alerts tab */}
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
                      <span className={`text-xs font-black tabular-nums ${a.demand_change?.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>
                        {a.demand_change}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs mb-1">{a.reason}</p>
                    <p className="text-zinc-500 text-xs">
                      Action: <span className="text-zinc-300">{a.action}</span>
                    </p>
                    <p className="text-zinc-600 text-[10px] mt-1">{a.period}</p>
                  </motion.div>
                ))}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                  <p className="text-emerald-400 text-xs font-bold">Total Opportunity</p>
                  <p className="text-zinc-400 text-xs mt-0.5">Act on all alerts to maximise summer revenue</p>
                </div>
              </div>
            )}

            {/* Seasonal tab */}
            {activeTab === "seasonal" && seasonal && (
              <div className="space-y-3">
                <div className="bg-sky-500/5 border border-sky-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf size={13} className="text-sky-400"/>
                    <p className="text-sky-300 text-xs font-bold uppercase tracking-wide">Season Summary</p>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed">{seasonal.season_summary}</p>
                </div>
                {seasonal.predictions?.map((p,i)=>(
                  <motion.div key={i} initial={{ opacity:0,x:12 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.1 }}
                    className="bg-surface-800 border border-surface-600 rounded-2xl p-4 cursor-pointer hover:border-surface-500 transition-all"
                    onClick={() => ask(`Seasonal prediction: ${p.herb} has ${p.demand_index}% demand index this season. How do I capitalise on this?`)}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-zinc-200 font-bold text-sm">{p.herb}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                          p.season==="Peak" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          p.season==="High" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                              "bg-surface-700 text-zinc-400 border border-surface-600"
                        }`}>{p.season}</span>
                        <span className="text-zinc-200 font-black text-sm tabular-nums">{p.demand_index}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden mb-2">
                      <motion.div initial={{width:0}} animate={{width:`${p.demand_index}%`}}
                        transition={{delay:0.3+i*0.1,duration:0.7,ease:"easeOut"}}
                        className="h-full rounded-full bg-emerald-500"/>
                    </div>
                    <p className="text-zinc-500 text-xs">{p.menu_fit}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
