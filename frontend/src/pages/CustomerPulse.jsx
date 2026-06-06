import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, ChefHat, MessageSquare, AlertCircle, Mic, MicOff, Mail } from "lucide-react";
import toast from "react-hot-toast";
import API from "../api";
import { useLang } from "../context/LangContext";

const STAR_LABEL = ["","Poor","Fair","Good","Very Good","Excellent"];
const FARM_EMAIL = "helensoffiajp@gmail.com";

const SEED_FEEDBACKS = [
  { id:"s1", customer_name:"Chef Arjun Mehta · Taj Hotels",         rating:5, text:"The basil quality is consistently extraordinary — robust aroma, vivid colour, zero bruising. We've switched 100% of our herb sourcing to AgriIntel.", created_at:"2026-06-04" },
  { id:"s2", customer_name:"Chef Priya Rajan · Zoulu Cloud Kitchen", rating:5, text:"Same-day harvest-to-kitchen in 2.4 hours is a game changer. I plan menus around the freshness tracker.", created_at:"2026-06-03" },
  { id:"s3", customer_name:"Chef Vikram Singh · The Leela",          rating:4, text:"Mint and coriander are excellent. Slightly late on last Thursday order (3.1 hrs) but otherwise perfect.", created_at:"2026-06-02" },
  { id:"s4", customer_name:"Chef Sana Iyer · Bake & Bloom",          rating:5, text:"Flash sale alerts are genius — I saved ₹2,800 last month on excess lettuce. Highly recommend.", created_at:"2026-06-01" },
  { id:"s5", customer_name:"Chef Ravi Nair · The Bombay Canteen",    rating:3, text:"Spinach quality dropped last week — slightly yellowing. Everything else is brilliant.", created_at:"2026-05-30" },
];

const QUICK_PROMPTS = [
  "Best basil harvest this month!",
  "Delivery was 30 min early — amazing.",
  "Freshness tracker saved our Sunday brunch prep.",
  "Mint quality is outstanding this week.",
];

const LANG_MAP = { en:"en-IN", ta:"ta-IN", hi:"hi-IN", te:"te-IN", kn:"kn-IN", ml:"ml-IN", bn:"bn-IN", mr:"mr-IN", gu:"gu-IN" };

export default function CustomerPulse() {
  const { t } = useLang();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [listening, setListening] = useState(false);
  const [sent,      setSent]      = useState(false);
  const [form, setForm] = useState({ name:"", email:"", text:"", rating:5 });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get("/feedback/");
        setFeedbacks([...SEED_FEEDBACKS, ...(Array.isArray(data) ? data : [])]);
      } catch { setFeedbacks(SEED_FEEDBACKS); }
      setLoading(false);
    })();
  }, []);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error("Voice not supported. Try Chrome."); return; }
    const rec = new SR();
    rec.lang = LANG_MAP[lang] || "en-IN";
    rec.continuous = false;
    rec.interimResults = false;
    setListening(true);
    rec.start();
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setForm(f => ({ ...f, text: f.text ? f.text + " " + t : t }));
      setListening(false);
      toast.success("Voice captured!");
    };
    rec.onerror  = () => { setListening(false); toast.error("Voice failed — try again"); };
    rec.onend    = () => setListening(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) {
      toast.error("Please enter your name and feedback");
      return;
    }
    const stars = "★".repeat(form.rating) + "☆".repeat(5 - form.rating);
    const subject = encodeURIComponent(`AgriIntel Feedback — ${stars} from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\n` +
      (form.email ? `Email: ${form.email}\n` : "") +
      `Rating: ${stars} (${form.rating}/5)\n\n` +
      `Feedback:\n${form.text}\n\n` +
      `---\nSent via AgriIntel PulseBoard`
    );
    window.open(`mailto:${FARM_EMAIL}?subject=${subject}&body=${body}`);
    setSent(true);
    setForm({ name:"", email:"", text:"", rating:5 });
    toast.success("Opening your email client...");
    setTimeout(() => setSent(false), 4000);
  };

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((s,f)=>s+f.rating,0) / feedbacks.length).toFixed(1)
    : "—";

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
        <h1 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
          <ChefHat size={20} className="text-emerald-400"/> {t.pg_pulse_title}
        </h1>
        <p className="text-zinc-500 text-sm mt-0.5">{t.pg_pulse_sub}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Reviews",     value:feedbacks.length, color:"#10b981" },
          { label:"Avg Rating",  value:avgRating,         color:"#f59e0b" },
          { label:"Satisfaction",value:"4.6 / 5",         color:"#a78bfa" },
        ].map(({label,value,color}) => (
          <motion.div key={label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            className="bg-surface-800 border border-surface-600 rounded-2xl p-4 text-center">
            <p className="text-zinc-500 text-[11px] uppercase tracking-wide">{label}</p>
            <p className="font-black text-xl tabular-nums mt-1" style={{ color }}>{value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Feedback Form */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
          className="xl:col-span-2 self-start">
          <form onSubmit={handleSubmit}
            className="bg-surface-800 border border-surface-600 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail size={13} className="text-emerald-400"/>
              <h2 className="text-sm font-bold text-zinc-200">{t.lbl_send_email}</h2>
            </div>

            {/* Name */}
            <input
              className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3.5 py-2.5 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              placeholder={`${t.lbl_name} · Restaurant`}
              value={form.name}
              onChange={e => setForm({...form, name:e.target.value})}
            />

            {/* Email */}
            <input
              type="email"
              className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3.5 py-2.5 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              placeholder={`${t.lbl_email} (optional)`}
              value={form.email}
              onChange={e => setForm({...form, email:e.target.value})}
            />

            {/* Star rating */}
            <div>
              <p className="text-zinc-500 text-xs mb-2">{t.lbl_rating}</p>
              <div className="flex items-center gap-1.5">
                {[1,2,3,4,5].map(r => (
                  <button type="button" key={r} onClick={() => setForm({...form, rating:r})} className="group">
                    <Star size={24} className={`transition-all ${r<=form.rating ? "text-amber-400 fill-amber-400" : "text-zinc-600 group-hover:text-zinc-400"}`}/>
                  </button>
                ))}
                <span className="text-zinc-500 text-xs ml-1">{STAR_LABEL[form.rating]}</span>
              </div>
            </div>

            {/* Quick prompts */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map(p => (
                <button type="button" key={p}
                  onClick={() => setForm(f => ({...f, text:p}))}
                  className="text-[11px] text-zinc-400 border border-surface-600 hover:border-emerald-500/40 hover:text-emerald-400 px-2.5 py-1 rounded-lg transition-all">
                  {p}
                </button>
              ))}
            </div>

            {/* Text + Voice */}
            <div className="relative">
              <textarea
                className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3.5 py-2.5 pr-12 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none"
                rows={4}
                placeholder="Freshness, delivery, quality... or tap 🎤 to speak in any language"
                value={form.text}
                onChange={e => setForm({...form, text:e.target.value})}
              />
              <button type="button" onClick={startVoice} disabled={listening}
                className={`absolute bottom-2.5 right-2.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${listening ? "bg-red-500 animate-pulse" : "bg-surface-600 hover:bg-emerald-600"}`}
                title="Speak in Hindi, Tamil, or 7 more languages">
                {listening ? <MicOff size={13} className="text-white"/> : <Mic size={13} className="text-zinc-300"/>}
              </button>
            </div>
            {listening && (
              <p className="text-red-400 text-xs flex items-center gap-1.5 -mt-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
                Listening... speak now
              </p>
            )}

            {/* Submit */}
            <button type="submit"
              className={`w-full flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-xl transition-all ${sent ? "bg-emerald-700 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white"}`}>
              {sent ? "✓ Email client opened!" : <><Send size={13}/> Send via Email</>}
            </button>

            <p className="text-zinc-600 text-[10px] text-center">
              Opens your email app · sends to <span className="text-zinc-500">farmer's inbox</span>
            </p>
          </form>
        </motion.div>

        {/* Reviews */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          className="xl:col-span-3 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={14} className="text-zinc-400"/>
            <h2 className="text-sm font-bold text-zinc-200">{t.lbl_reviews}</h2>
            <span className="text-zinc-600 text-xs ml-auto">{feedbacks.length} reviews</span>
          </div>

          {loading ? (
            Array.from({length:3}).map((_,i)=>(
              <div key={i} className="bg-surface-800 border border-surface-600 rounded-2xl p-5 animate-pulse space-y-2">
                <div className="h-3 bg-surface-700 rounded w-40"/>
                <div className="h-4 bg-surface-700 rounded"/>
                <div className="h-4 bg-surface-700 rounded w-3/4"/>
              </div>
            ))
          ) : feedbacks.length === 0 ? (
            <div className="bg-surface-800 border border-surface-600 rounded-2xl p-12 text-center">
              <AlertCircle size={24} className="text-zinc-600 mx-auto mb-2"/>
              <p className="text-zinc-500 text-sm">No reviews yet — be the first!</p>
            </div>
          ) : (
            <AnimatePresence>
              {feedbacks.map((fb, i) => (
                <motion.div key={fb.id || i}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                  className="bg-surface-800 border border-surface-600 rounded-2xl p-5 hover:border-surface-500 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-zinc-200 text-sm font-bold">{fb.customer_name}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex gap-0.5">
                        {Array.from({length:5}).map((_,ri)=>(
                          <Star key={ri} size={11} className={ri<fb.rating?"text-amber-400 fill-amber-400":"text-zinc-700"}/>
                        ))}
                      </div>
                      <span className="text-zinc-600 text-[10px]">
                        {new Date(fb.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}
                      </span>
                    </div>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{fb.text}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}
