import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Sun, Moon, Globe, BrainCircuit, Send, ChevronRight, Mic, MicOff, Camera } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LangProvider, useLang, LANGS } from "./context/LangContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import ChefFeedback from "./pages/ChefFeedback";
import AIAdvisor from "./pages/AIAdvisor";
import FreshnessTracker from "./pages/FreshnessTracker";
import StockMarket from "./pages/StockMarket";
import WastePredictor from "./pages/WastePredictor";
import SimpleView from "./pages/SimpleView";
import PhotoInspect from "./pages/PhotoInspect";
import API from "./api";

/* ── Global top-right controls: language · theme · notifications ── */
function GlobalControls() {
  const { lang, setLang } = useLang();
  const { dark, toggle } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen,  setLangOpen]  = useState(false);
  const [alerts,    setAlerts]    = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [marketRes, alertsRes] = await Promise.all([
          API.get("/market/"),
          API.post("/ai/demand-alerts", { live_data: {} }),
        ]);
        const tickers = marketRes.data?.tickers || [];
        if (tickers.length) {
          const livePrices = Object.fromEntries(tickers.map(h => [h.herb, h.price]));
          const res2 = await API.post("/ai/demand-alerts", { live_data: { prices: livePrices } });
          setAlerts(res2.data?.alerts || alertsRes.data?.alerts || []);
        } else {
          setAlerts(alertsRes.data?.alerts || []);
        }
      } catch {
        API.post("/ai/demand-alerts", { live_data: {} })
          .then(r => setAlerts(r.data?.alerts || []))
          .catch(() => {});
      }
    };
    fetchAlerts();
    const iv = setInterval(fetchAlerts, 5 * 60 * 1000);
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        setNotifOpen(false);
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => { clearInterval(iv); document.removeEventListener("mousedown", handler); };
  }, []);

  const urgent = alerts.filter(a => a.urgency === "Critical" || a.urgency === "High").length;
  const cur = LANGS.find(l => l.code === lang) || LANGS[0];

  return (
    <div ref={ref} className="fixed top-3 right-4 z-50 flex items-center gap-1.5">

      {/* Language dropdown */}
      <div className="relative">
        <button onClick={() => { setLangOpen(p => !p); setNotifOpen(false); }}
          className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-semibold transition-all shadow-lg">
          <Globe size={12} className="text-zinc-500"/>
          <span className="text-sm leading-none">{cur.flag}</span>
        </button>
        {langOpen && (
          <div className="absolute top-11 right-0 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden w-44">
            <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider px-3 pt-2.5 pb-1">Language</p>
            <div className="p-1.5 space-y-0.5 max-h-72 overflow-y-auto">
              {LANGS.map(l => (
                <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); }}
                  className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left text-xs transition-all ${
                    lang === l.code ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/20" : "text-zinc-300 hover:bg-zinc-800"
                  }`}>
                  <span className="w-5 text-center text-sm">{l.flag}</span>
                  <span className="font-medium">{l.label}</span>
                  {lang === l.code && <span className="ml-auto text-emerald-400 text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <button onClick={toggle}
        className="w-9 h-9 rounded-xl bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 hover:border-zinc-500 flex items-center justify-center transition-all shadow-lg"
        title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
        {dark ? <Sun size={14} className="text-amber-400"/> : <Moon size={14} className="text-sky-400"/>}
      </button>

      {/* Notification bell */}
      <div className="relative">
        <button onClick={() => { setNotifOpen(p => !p); setLangOpen(false); }}
          className="relative w-9 h-9 rounded-xl bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 hover:border-zinc-500 flex items-center justify-center transition-all shadow-lg">
          <Bell size={14} className={urgent ? "text-amber-400" : "text-zinc-400"}/>
          {urgent > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg">{urgent}</span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute top-11 right-0 w-72 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div>
                <p className="text-zinc-200 text-xs font-bold uppercase tracking-wide">Live Demand Alerts</p>
                <p className="text-zinc-600 text-[10px]">{alerts.length} alerts · current market prices</p>
              </div>
              <button onClick={() => setNotifOpen(false)}>
                <X size={12} className="text-zinc-500 hover:text-zinc-300 transition-colors"/>
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800">
              {alerts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-zinc-500 text-xs">Fetching live alerts...</p>
                  <p className="text-zinc-600 text-[10px] mt-1">AI analysing market data</p>
                </div>
              ) : alerts.map((a, i) => (
                <div key={i} className={`px-4 py-3 ${
                  a.urgency === "Critical" ? "bg-red-500/5" : a.urgency === "High" ? "bg-amber-500/5" : ""
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-zinc-200 text-xs font-bold">{a.crop}</p>
                    <span className={`text-xs font-black tabular-nums ${a.demand_change?.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>
                      {a.demand_change}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-[11px] leading-snug mb-1">{a.reason}</p>
                  {a.action && <p className="text-zinc-600 text-[10px] mb-1.5">→ <span className="text-zinc-400">{a.action}</span></p>}
                  {(a.current_stock_kg != null && a.required_kg != null) && (
                    <p className="text-zinc-600 text-[10px] mb-1.5">Stock: <span className="text-zinc-300">{a.current_stock_kg}kg</span> · Need: <span className="text-amber-400">{a.required_kg}kg</span></p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      a.urgency === "Critical" ? "bg-red-500/15 text-red-400" :
                      a.urgency === "High"     ? "bg-amber-500/15 text-amber-400" :
                                                 "bg-zinc-800 text-zinc-400"
                    }`}>{a.urgency}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-600 text-[10px]">{a.period}</span>
                      {(a.urgency === "Critical" || a.urgency === "High") && (
                        <button
                          onClick={() => {
                            const msg = encodeURIComponent(
                              `🚨 *${a.urgency} Alert — AgriIntel*\n\n` +
                              `📦 *${a.crop}* ${a.demand_change}\n` +
                              `📋 ${a.reason}\n` +
                              `✅ Action: ${a.action || "Review immediately"}\n` +
                              `⏰ Period: ${a.period}\n\n` +
                              `🌐 pulseboard-gamma-cyan.vercel.app`
                            );
                            window.open(`https://wa.me/?text=${msg}`, "_blank");
                          }}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all border border-[#25D366]/20">
                          📱 Alert
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-zinc-800">
              <p className="text-zinc-700 text-[10px] text-center">AgriIntel AI · live market prices · refreshes every 5 min</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Floating AI chat popup + FAB ── */
function AIFab() {
  const location = useLocation();
  const navigate  = useNavigate();
  const [open,       setOpen]       = useState(false);
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [liveMarket, setLiveMarket] = useState([]);
  const inputRef     = useRef(null);
  const bottomRef    = useRef(null);

  const [liveFresh,   setLiveFresh]   = useState([]);
  const [liveSensors, setLiveSensors] = useState(null);

  useEffect(() => {
    if (open) {
      Promise.all([
        API.get("/market/"),
        API.get("/freshness/"),
        API.get("/sensors/"),
      ]).then(([m, f, s]) => {
        setLiveMarket(m.data?.tickers || []);
        setLiveFresh(f.data || []);
        setLiveSensors(s.data || null);
      }).catch(() => {});
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput("");
    setMessages(p => [...p, { role:"user", text:q }]);
    setLoading(true);
    try {
      const live_data = {};
      if (liveMarket.length) {
        live_data.prices  = Object.fromEntries(liveMarket.map(h => [h.herb, h.price]));
        live_data.changes = Object.fromEntries(liveMarket.map(h => [h.herb, h.change ?? 0]));
      }
      if (liveFresh.length) {
        live_data.freshness = Object.fromEntries(liveFresh.map(h => [h.herb, h.freshness_days]));
      }
      if (liveSensors) {
        live_data.sensors = {
          temperature: liveSensors.temperature?.value,
          humidity:    liveSensors.humidity?.value,
          co2:         liveSensors.co2?.value,
          light:       liveSensors.light?.value,
          ph:          liveSensors.ph?.value,
        };
      }
      const { data } = await API.post("/ai/chat", {
        message: q,
        history: messages.slice(-4).map(m => ({ role:m.role, content:m.text })),
        live_data,
      }, { timeout: 40000 });
      setMessages(p => [...p, { role:"assistant", text:data.reply }]);
    } catch {
      setMessages(p => [...p, { role:"assistant", text:"Couldn't reach AI. Please try again." }]);
    }
    setLoading(false);
  };

  if (location.pathname === "/advisor") return null;

  return (
    <>
      {/* Mini chat popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, scale:0.92, y:12 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.92, y:12 }}
            transition={{ type:"spring", stiffness:400, damping:28 }}
            className="fixed bottom-24 right-6 z-50 w-80 flex flex-col bg-zinc-900/97 backdrop-blur-xl border border-zinc-700 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
            style={{ maxHeight:"420px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-600/15 border border-emerald-500/25 flex items-center justify-center">
                  <BrainCircuit size={14} className="text-emerald-400"/>
                </div>
                <div>
                  <p className="text-zinc-100 text-xs font-black leading-none">Farm AI</p>
                  <p className="text-zinc-600 text-[9px]">Groq Llama 70B · live data</p>
                </div>
                {liveMarket.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 ml-1">LIVE</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setOpen(false); navigate("/advisor"); }}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-0.5 font-semibold">
                  Full <ChevronRight size={9}/>
                </button>
                <button onClick={() => setOpen(false)}>
                  <X size={13} className="text-zinc-500 hover:text-zinc-300 transition-colors"/>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
              {messages.length === 0 && (
                <div className="text-center py-5">
                  <BrainCircuit size={22} className="text-emerald-600 mx-auto mb-2.5"/>
                  <p className="text-zinc-400 text-xs font-semibold mb-1">Ask about your farm</p>
                  <p className="text-zinc-600 text-[10px] mb-4">prices · yield · freshness · demand</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {["Basil price today?","Top demand herb?","Flash sale now?","Zone B status?"].map(q => (
                      <button key={q} onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                        className="text-[10px] px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg transition-all border border-zinc-700">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-emerald-600/20 text-emerald-200 border border-emerald-500/20 rounded-br-sm"
                      : "bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-bl-sm"
                  }`}>{m.text}</div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-sm px-3 py-2.5 flex items-center gap-1.5">
                    {[0,150,300].map(d => (
                      <span key={d} className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay:`${d}ms` }}/>
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div className="p-2.5 border-t border-zinc-800 flex gap-2 flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Ask the farm AI..."
                className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500/50 transition-all"
              />
              <button onClick={send} disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 flex items-center justify-center transition-all flex-shrink-0">
                <Send size={13} className="text-white"/>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setOpen(p => !p)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full backdrop-blur-sm border shadow-2xl flex items-center justify-center transition-colors ${
          open
            ? "bg-zinc-800/95 border-zinc-600 shadow-black/30"
            : "bg-emerald-600/85 hover:bg-emerald-500/95 border-emerald-400/30 shadow-emerald-500/30"
        }`}
        title={open ? "Close AI" : "Ask AI Advisor"}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{rotate:-80,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:80,opacity:0}} transition={{duration:0.15}}>
                <X size={20} className="text-zinc-300"/>
              </motion.div>
            : <motion.div key="ai" initial={{rotate:80,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:-80,opacity:0}} transition={{duration:0.15}}>
                <BrainCircuit size={22} className="text-white"/>
              </motion.div>
          }
        </AnimatePresence>
      </motion.button>
    </>
  );
}

/* ── Farmer Voice Input FAB — AI-powered (bottom-left, farmers only) ── */
const HERB_NAMES = ["basil","mint","rosemary","thyme","coriander","lettuce","chives","spinach","parsley"];
const VOICE_LOCALE = { en:"en-IN", ta:"ta-IN", hi:"hi-IN", te:"te-IN", kn:"kn-IN", ml:"ml-IN", bn:"bn-IN", mr:"mr-IN", gu:"gu-IN" };

function FarmerVoiceFab() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [listening,  setListening]  = useState(false);
  const [transcript, setTranscript] = useState("");
  const [open,       setOpen]       = useState(false);
  const [parsed,     setParsed]     = useState(null);
  const [aiReply,    setAiReply]    = useState("");
  const [aiLoading,  setAiLoading]  = useState(false);
  const recRef = useRef(null);

  if (user?.role === "chef") return null;

  const speakText = (text) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = VOICE_LOCALE[lang] || "en-IN";
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };

  const parseLocal = (text) => {
    const t = text.toLowerCase();
    const herb     = HERB_NAMES.find(h => t.includes(h)) || "";
    const qtyMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilogram)/);
    const zoneMatch = t.match(/zone\s*([a-e])/i);
    return { herb, qty: qtyMatch?.[1] || "", zone: zoneMatch?.[1]?.toUpperCase() || "" };
  };

  const processWithAI = async (text) => {
    setAiLoading(true);
    setAiReply("");
    try {
      let liveData = {};
      try {
        const m = await API.get("/market/");
        if (m.data?.tickers?.length) {
          liveData.prices = Object.fromEntries(m.data.tickers.map(h => [h.herb, h.price]));
        }
      } catch {}
      const { data } = await API.post("/ai/chat", {
        message: `Farmer voice input: "${text}". Extract herb name, quantity (kg), zone if mentioned. Confirm in ONE short sentence what you understood. Then ask exactly ONE follow-up question about quality, freshness stage, or storage. Under 35 words total.`,
        live_data: liveData,
      }, { timeout: 40000 });
      const reply = data.reply || "Understood! What zone was this harvested from?";
      setAiReply(reply);
      speakText(reply);
    } catch {
      const fallback = "Got it! Tap Log Harvest to save, or speak again to clarify.";
      setAiReply(fallback);
      speakText(fallback);
    }
    setAiLoading(false);
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error("Voice input not supported in this browser"); return; }
    setTranscript(""); setParsed(null); setAiReply(""); setOpen(true);
    const r = new SpeechRecognition();
    r.lang = VOICE_LOCALE[lang] || "en-IN";
    r.continuous = false;
    r.interimResults = true;
    r.onstart  = () => setListening(true);
    r.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setTranscript(t);
      if (e.results[0].isFinal) {
        const p = parseLocal(t);
        if (p.herb || p.qty) setParsed(p);
        processWithAI(t);
      }
    };
    r.onend   = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
    recRef.current = r;
  };

  const stopVoice = () => { recRef.current?.stop(); setListening(false); };

  const logHarvest = () => {
    if (!transcript && !parsed) return;
    const label = `${parsed?.herb || "herb"} ${parsed?.qty ? parsed.qty + "kg" : ""} ${parsed?.zone ? "Zone " + parsed.zone : ""}`.trim();
    toast.success(`✓ Logged: ${label || transcript.slice(0,40)}`);
    window.speechSynthesis.cancel();
    setOpen(false); setTranscript(""); setParsed(null); setAiReply("");
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, scale:0.92, y:12 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.92, y:12 }}
            transition={{ type:"spring", stiffness:400, damping:28 }}
            className="fixed bottom-24 left-6 z-50 w-72 bg-zinc-900/97 backdrop-blur-xl border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center border ${aiLoading ? "bg-amber-500/15 border-amber-500/25" : "bg-emerald-600/15 border-emerald-500/25"}`}>
                  <Mic size={14} className={aiLoading ? "text-amber-400" : "text-emerald-400"}/>
                </div>
                <div>
                  <p className="text-zinc-100 text-xs font-black leading-none">Voice Harvest Log</p>
                  <p className="text-zinc-600 text-[9px]">{aiLoading ? "AI processing…" : "Groq AI · speaks back in your language"}</p>
                </div>
              </div>
              <button onClick={() => { stopVoice(); window.speechSynthesis.cancel(); setOpen(false); }}>
                <X size={13} className="text-zinc-500 hover:text-zinc-300"/>
              </button>
            </div>

            <div className="p-3 space-y-2.5">
              {/* Transcript box */}
              <div className={`min-h-[52px] bg-zinc-800 border rounded-xl px-3 py-2.5 transition-all ${listening ? "border-emerald-500/50 shadow-sm shadow-emerald-500/10" : "border-zinc-700"}`}>
                {transcript
                  ? <p className="text-zinc-200 text-xs leading-relaxed">{transcript}</p>
                  : <p className="text-zinc-600 text-xs italic">{listening ? "Listening…" : 'Say: "30kg Basil, Zone A, excellent quality"'}</p>
                }
                {listening && (
                  <div className="flex gap-0.5 mt-1.5">
                    {[0,1,2,3,4].map(i=>(
                      <div key={i} className="w-0.5 bg-emerald-500 rounded-full animate-bounce" style={{ height:`${6+i*3}px`, animationDelay:`${i*100}ms` }}/>
                    ))}
                  </div>
                )}
              </div>

              {/* AI loading dots */}
              {aiLoading && (
                <div className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700 rounded-xl px-3 py-2">
                  <div className="flex gap-0.5">
                    {[0,120,240].map(d=>(
                      <span key={d} className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay:`${d}ms` }}/>
                    ))}
                  </div>
                  <span className="text-zinc-500 text-[10px]">Groq AI analysing harvest…</span>
                </div>
              )}

              {/* AI reply bubble */}
              {aiReply && !aiLoading && (
                <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                  className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                  <p className="text-emerald-500 text-[9px] font-black uppercase tracking-wider mb-1">AI RESPONSE · spoken aloud</p>
                  <p className="text-emerald-200 text-xs leading-relaxed">{aiReply}</p>
                </motion.div>
              )}

              {/* Parsed chips */}
              {parsed && (parsed.herb || parsed.qty || parsed.zone) && (
                <div className="flex flex-wrap gap-1.5">
                  {parsed.herb && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">🌿 {parsed.herb}</span>}
                  {parsed.qty  && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/20">⚖️ {parsed.qty} kg</span>}
                  {parsed.zone && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">📍 Zone {parsed.zone}</span>}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={listening ? stopVoice : startVoice}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                    listening ? "bg-red-500/10 border border-red-500/30 text-red-400" : "bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20"
                  }`}>
                  {listening ? <><MicOff size={12}/> Stop</> : <><Mic size={12}/> {aiReply ? "Speak Again" : "Speak"}</>}
                </button>
                <button onClick={logHarvest} disabled={!transcript && !parsed}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white transition-all">
                  Log Harvest
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => open ? (window.speechSynthesis.cancel(), setOpen(false)) : startVoice()}
        whileHover={{ scale:1.08 }} whileTap={{ scale:0.94 }}
        className={`fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full backdrop-blur-sm border shadow-2xl flex items-center justify-center transition-colors ${
          listening ? "bg-red-500/85 border-red-400/30 shadow-red-500/30 animate-pulse"
          : open     ? "bg-zinc-800/95 border-zinc-600"
                     : "bg-emerald-600/85 hover:bg-emerald-500/95 border-emerald-400/30 shadow-emerald-500/30"
        }`}
        title="Voice Harvest Input · Groq AI">
        <AnimatePresence mode="wait">
          {listening
            ? <motion.div key="l" initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}><MicOff size={20} className="text-white"/></motion.div>
            : open
              ? <motion.div key="x" initial={{rotate:-80,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:80,opacity:0}} transition={{duration:0.15}}><X size={20} className="text-zinc-300"/></motion.div>
              : <motion.div key="m" initial={{rotate:80,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:-80,opacity:0}} transition={{duration:0.15}}><Mic size={22} className="text-white"/></motion.div>
          }
        </AnimatePresence>
      </motion.button>
    </>
  );
}

function Layout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/"          element={<Dashboard />}        />
          <Route path="/analytics" element={<Analytics />}        />
          <Route path="/pulse"     element={<ChefFeedback />}     />
          <Route path="/advisor"   element={<AIAdvisor />}        />
          <Route path="/freshness" element={<FreshnessTracker />} />
          <Route path="/market"    element={<StockMarket />}      />
          <Route path="/waste"     element={<WastePredictor />}   />
          <Route path="/simple"        element={<SimpleView />}     />
          <Route path="/photo-inspect" element={<PhotoInspect />}  />
          <Route path="*"          element={<Navigate to="/" />}  />
        </Routes>
      </main>
      <GlobalControls />
      <AIFab />
      <FarmerVoiceFab />
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/*"     element={<Layout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <LangProvider>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" containerStyle={{ top: 56 }} toastOptions={{
          style: { background:"#18181b", color:"#e4e4e7", border:"1px solid #3f3f46", fontSize:"13px", borderRadius:"10px" },
          success: { iconTheme: { primary:"#10b981", secondary:"#18181b" } },
        }} />
      </BrowserRouter>
    </AuthProvider>
    </LangProvider>
    </ThemeProvider>
  );
}
