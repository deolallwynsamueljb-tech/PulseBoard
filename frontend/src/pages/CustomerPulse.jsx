import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, ChefHat, TrendingUp, MessageSquare, Sparkles, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import API from "../api";

const SENTIMENT_STYLE = {
  Positive: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  Negative:  "bg-red-500/10 text-red-400 border border-red-500/20",
  Neutral:   "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  Mixed:     "bg-violet-500/10 text-violet-400 border border-violet-500/20",
};

const STAR_LABEL = ["","Poor","Fair","Good","Very Good","Excellent"];

const SEED_FEEDBACKS = [
  { id:"s1", customer_name:"Chef Arjun Mehta · Taj Hotels",       rating:5, text:"The basil quality is consistently extraordinary — robust aroma, vivid colour, and zero bruising on delivery. We've switched 100% of our herb sourcing to AgriIntel.", sentiment:"Positive", created_at:"2026-06-04" },
  { id:"s2", customer_name:"Chef Priya Rajan · Zoulu Cloud Kitchen", rating:5, text:"Same-day harvest-to-kitchen in 2.4 hours is a game changer. The freshness tracker dashboard is incredibly useful — I plan menus around it now.", sentiment:"Positive", created_at:"2026-06-03" },
  { id:"s3", customer_name:"Chef Vikram Singh · The Leela",           rating:4, text:"Mint and coriander are excellent. Would love to see lemongrass added. Slightly late on last Thursday order (3.1 hrs) but otherwise perfect.", sentiment:"Mixed",    created_at:"2026-06-02" },
  { id:"s4", customer_name:"Chef Sana Iyer · Bake & Bloom",           rating:5, text:"Flash sale alerts are genius — I saved ₹2,800 last month on excess lettuce that would have gone to waste. Highly recommend to any chef.", sentiment:"Positive", created_at:"2026-06-01" },
  { id:"s5", customer_name:"Chef Ravi Nair · The Bombay Canteen",     rating:3, text:"Spinach quality dropped last week — slightly yellowing on tips. Everything else is brilliant but consistency on spinach needs attention.", sentiment:"Negative", created_at:"2026-05-30" },
];

const QUICK_PROMPTS = [
  "Best basil harvest this month!",
  "Delivery was 30 min early — amazing.",
  "Freshness tracker saved our Sunday brunch prep.",
  "Mint quality is outstanding this week.",
];

export default function CustomerPulse() {
  const [feedbacks,  setFeedbacks]  = useState([]);
  const [sentiments, setSentiments] = useState({});
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ customer_name:"", text:"", rating:5 });

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/feedback/");
      setFeedbacks([...SEED_FEEDBACKS, ...(Array.isArray(data) ? data : [])]);
    } catch {
      setFeedbacks(SEED_FEEDBACKS);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFeedback(); }, []);

  const handleSubmit = async () => {
    if (!form.customer_name.trim() || !form.text.trim()) {
      toast.error("Please fill in chef name and feedback");
      return;
    }
    setSubmitting(true);
    const tid = toast.loading("Analyzing sentiment with AI...");
    try {
      const { data: newFb } = await API.post("/feedback/", form);
      let sent = null;
      try {
        const { data: s } = await API.post("/ai/sentiment", { text: form.text });
        sent = s;
      } catch {}
      if (sent) setSentiments(prev => ({ ...prev, [newFb.id || newFb._id]: sent }));
      toast.success("Chef feedback saved!", { id: tid });
      setForm({ customer_name:"", text:"", rating:5 });
      await fetchFeedback();
    } catch {
      toast.error("Failed to submit — try again.", { id: tid });
    } finally { setSubmitting(false); }
  };

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((s,f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
    : "—";

  const sentimentCounts = feedbacks.reduce((acc, fb) => {
    const s = sentiments[fb.id || fb._id]?.sentiment || fb.sentiment;
    if (s) acc[s] = (acc[s]||0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
            <ChefHat size={22} className="text-emerald-400"/>
            Chef Pulse
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">Real-time chef partner feedback · AI sentiment analysis</p>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Chef Partners",   value:feedbacks.length, sub:"Active this month", color:"text-emerald-400" },
          { label:"Avg Rating",      value:avgRating,         sub:"Out of 5 stars",   color:"text-amber-400"   },
          { label:"Positive Reviews",value:sentimentCounts.Positive||0, sub:"Sentiment analysis", color:"text-sky-400" },
          { label:"Satisfaction",    value:"4.6 / 5",         sub:"NPS score: 78",    color:"text-violet-400"  },
        ].map((s,i) => (
          <div key={i} className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
            <p className="text-zinc-500 text-[11px] uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color} tabular-nums`}>{s.value}</p>
            <p className="text-zinc-600 text-[11px] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Submit Form */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          className="xl:col-span-2 bg-surface-800 border border-surface-600 rounded-2xl p-6 self-start">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={14} className="text-emerald-400"/>
            <h2 className="text-sm font-bold text-zinc-200">Add Chef Feedback</h2>
          </div>

          <div className="space-y-3 mb-4">
            <input
              className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3.5 py-2.5 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              placeholder="Chef name · Restaurant"
              value={form.customer_name}
              onChange={e => setForm({ ...form, customer_name:e.target.value })}
            />

            <div>
              <p className="text-zinc-500 text-xs mb-2">Rating</p>
              <div className="flex gap-1.5">
                {[1,2,3,4,5].map(r => (
                  <button key={r} onClick={() => setForm({ ...form, rating:r })} className="group">
                    <Star size={22} className={`transition-all ${r <= form.rating ? "text-amber-400 fill-amber-400 scale-110" : "text-zinc-600 group-hover:text-zinc-400"}`}/>
                  </button>
                ))}
                <span className="text-zinc-500 text-xs ml-2 mt-1">{STAR_LABEL[form.rating]}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => setForm(f => ({ ...f, text: p }))}
                  className="text-[11px] text-zinc-400 border border-surface-600 hover:border-emerald-500/40 hover:text-emerald-400 px-2.5 py-1 rounded-lg transition-all">
                  {p}
                </button>
              ))}
            </div>

            <textarea
              className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3.5 py-2.5 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none"
              rows={4}
              placeholder="Share feedback on freshness, delivery, quality..."
              value={form.text}
              onChange={e => setForm({ ...form, text:e.target.value })}
            />
          </div>

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
            <Send size={13}/>
            {submitting ? "Analyzing with AI..." : "Submit & Analyze"}
          </button>
        </motion.div>

        {/* Feedback List */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
          className="xl:col-span-3 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-zinc-400"/>
              <h2 className="text-sm font-bold text-zinc-200">Chef Reviews</h2>
            </div>
            <div className="flex gap-2">
              {Object.entries(sentimentCounts).map(([s,c]) => (
                <span key={s} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SENTIMENT_STYLE[s]}`}>{s} ({c})</span>
              ))}
            </div>
          </div>

          {loading ? (
            Array.from({length:3}).map((_,i)=>(
              <div key={i} className="bg-surface-800 border border-surface-600 rounded-2xl p-5 animate-pulse space-y-2">
                <div className="h-3 bg-surface-700 rounded w-40"/><div className="h-4 bg-surface-700 rounded"/><div className="h-4 bg-surface-700 rounded w-3/4"/>
              </div>
            ))
          ) : feedbacks.length === 0 ? (
            <div className="bg-surface-800 border border-surface-600 rounded-2xl p-12 text-center">
              <AlertCircle size={24} className="text-zinc-600 mx-auto mb-2"/>
              <p className="text-zinc-500 text-sm">No feedback yet. Add the first one.</p>
            </div>
          ) : (
            <AnimatePresence>
              {feedbacks.map((fb, i) => {
                const s = sentiments[fb.id || fb._id]?.sentiment || fb.sentiment;
                return (
                  <motion.div key={fb.id || fb._id || i}
                    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                    className="bg-surface-800 border border-surface-600 rounded-2xl p-5 hover:border-surface-500 transition-all">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-zinc-200 text-sm font-bold">{fb.customer_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex gap-0.5">
                            {Array.from({length:5}).map((_,ri) => (
                              <Star key={ri} size={11} className={ri < fb.rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"}/>
                            ))}
                          </div>
                          <span className="text-zinc-600 text-[10px]">{STAR_LABEL[fb.rating]}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {s && <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${SENTIMENT_STYLE[s] || SENTIMENT_STYLE.Neutral}`}>{s}</span>}
                        <span className="text-zinc-600 text-[10px]">{new Date(fb.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</span>
                      </div>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed">{fb.text}</p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}
