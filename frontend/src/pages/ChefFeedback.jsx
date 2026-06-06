import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import toast from "react-hot-toast";
import {
  ChefHat, Star, Send, MessageSquare, Award, TrendingUp,
  Leaf, Clock, CheckCircle2, Building2, Mail,
  ThumbsUp, Package, Truck, Video, Phone, Camera, ExternalLink
} from "lucide-react";

const WA_FARM = "919994521399";

const HERB_LIST = ["Basil","Mint","Rosemary","Thyme","Coriander","Lettuce","Spinach","Chives","Parsley"];


const RATING_ASPECTS = [
  { key:"freshness",  label:"Herb Freshness",    Icon: Leaf   },
  { key:"delivery",   label:"Delivery Speed",    Icon: Truck  },
  { key:"packaging",  label:"Packaging Quality", Icon: Package},
  { key:"value",      label:"Value for Money",   Icon: TrendingUp },
];

function StarRating({ value, onChange, size = 18 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110">
          <Star size={size} className={`transition-colors ${
            s <= (hover || value) ? "text-amber-400 fill-amber-400" : "text-zinc-700"
          }`}/>
        </button>
      ))}
    </div>
  );
}

export default function ChefFeedback() {
  const { user } = useAuth();
  const { t } = useLang();

  const isChef   = user?.role === "chef";
  const isFarmer = user?.role === "farmer" || !user?.role;

  const [form, setForm] = useState({
    name:       user?.name       || "",
    restaurant: user?.restaurant || "",
    email:      user?.email      || "",
    herb:       "Basil",
    message:    "",
    overall:    0,
    ratings:    { freshness:0, delivery:0, packaging:0, value:0 },
    recommend:  null,
  });
  const [submitted, setSubmitted] = useState(false);

  const setRating = (key, v) => setForm(p => ({ ...p, ratings: { ...p.ratings, [key]: v } }));

  const handleSend = e => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error("Name and email are required."); return; }
    if (form.overall === 0)        { toast.error("Please give an overall rating."); return; }

    const aspectLines = RATING_ASPECTS.map(a =>
      `${a.label}: ${"★".repeat(form.ratings[a.key] || 0)}${"☆".repeat(5 - (form.ratings[a.key] || 0))} (${form.ratings[a.key] || "—"}/5)`
    ).join("\n");

    const body = encodeURIComponent(
`AgriIntel PulseBoard — Chef Feedback
═══════════════════════════════════

From: ${form.name}
Restaurant: ${form.restaurant || "Not provided"}
Email: ${form.email}
Preferred Herb: ${form.herb}

OVERALL RATING: ${"★".repeat(form.overall)}${"☆".repeat(5 - form.overall)} (${form.overall}/5)

QUALITY RATINGS:
${aspectLines}

Would Recommend: ${form.recommend === true ? "Yes ✓" : form.recommend === false ? "No ✗" : "Not answered"}

MESSAGE:
${form.message || "(No message provided)"}

───────────────────────────────────
Sent via AgriIntel PulseBoard Chef Connect
`
    );
    const subject = encodeURIComponent(`Chef Feedback — ${form.name} · ${form.overall}★ · ${form.herb}`);
    window.open(`mailto:helensoffiajp@gmail.com?subject=${subject}&body=${body}`);
    setSubmitted(true);
    toast.success("Feedback email opened! Thank you, Chef.");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <ChefHat size={20} className="text-amber-400"/>
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-100 tracking-tight">Chef Connect</h1>
            <p className="text-zinc-500 text-xs">Your feedback reaches the farm directly · shapes every harvest</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Chef Partners",   value:"18",   icon: ChefHat,    color:"amber"   },
            { label:"Avg Rating",      value:"4.7★",  icon: Star,       color:"yellow"  },
            { label:"Herbs Supplied",  value:"9",    icon: Leaf,       color:"emerald" },
            { label:"Avg Delivery",    value:"2.4h", icon: Clock,      color:"sky"     },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`p-3 bg-${color}-500/5 border border-${color}-500/15 rounded-2xl`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={12} className={`text-${color}-400`}/>
                <p className={`text-${color}-400 text-[10px] font-semibold uppercase tracking-wide`}>{label}</p>
              </div>
              <p className="text-zinc-100 font-black text-lg">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl">
        <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div key="done" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                className="flex flex-col items-center justify-center gap-5 py-16 bg-zinc-900 border border-zinc-800 rounded-3xl text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 size={36} className="text-emerald-400"/>
                </div>
                <div>
                  <p className="text-zinc-100 font-black text-xl mb-2">Thank you, Chef {form.name.split(" ")[0]}!</p>
                  <p className="text-zinc-500 text-sm max-w-xs">Your feedback has been sent to the farm team. We'll action your suggestions in the next harvest cycle.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <Award size={14} className="text-amber-400"/>
                  <p className="text-amber-300 text-xs font-bold">Feedback Hero badge earned!</p>
                </div>
                <button onClick={() => setSubmitted(false)}
                  className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Submit another response</button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSend} className="space-y-4">

                {/* Identity */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
                  <p className="text-zinc-300 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ChefHat size={12} className="text-amber-400"/> {t.lbl_your_identity}
                  </p>
                  <div className={`grid gap-3 ${isFarmer ? "grid-cols-2" : "grid-cols-1"}`}>
                    <div className="relative">
                      <ChefHat size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"/>
                      <input type="text" placeholder="Your name" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))}
                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm rounded-xl pl-8 pr-3 py-2.5 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/15 transition-all"/>
                    </div>
                    {/* Farmer: show email field so they can confirm/change reply address */}
                    {isFarmer && (
                      <div className="relative">
                        <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"/>
                        <input type="email" placeholder="Your email address" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))}
                          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm rounded-xl pl-8 pr-3 py-2.5 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/15 transition-all"/>
                      </div>
                    )}
                    {/* Chef: email used silently from login, no field shown */}
                  </div>
                  <div className="relative">
                    <Building2 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"/>
                    <input type="text" placeholder="Restaurant / Hotel / Cloud Kitchen" value={form.restaurant} onChange={e => setForm(p=>({...p,restaurant:e.target.value}))}
                      className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm rounded-xl pl-8 pr-3 py-2.5 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/15 transition-all"/>
                  </div>
                </div>

                {/* Overall + herb */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
                  <p className="text-zinc-300 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Star size={12} className="text-amber-400"/> {t.lbl_overall_rating_lbl}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-zinc-400 text-xs mb-2">How would you rate your overall experience?</p>
                      <StarRating value={form.overall} onChange={v => setForm(p=>({...p,overall:v}))} size={22}/>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-400 text-xs mb-2">Primary herb this order</p>
                      <select value={form.herb} onChange={e => setForm(p=>({...p,herb:e.target.value}))}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-500/50">
                        {HERB_LIST.map(h => <option key={h} value={h}>{t.herbs[h] || h}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {RATING_ASPECTS.map(({ key, label, Icon }) => (
                      <div key={key} className="flex items-center justify-between bg-zinc-800/60 border border-zinc-700 rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Icon size={12} className="text-zinc-500"/>
                          <p className="text-zinc-400 text-xs">{label}</p>
                        </div>
                        <StarRating value={form.ratings[key]} onChange={v => setRating(key, v)} size={13}/>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Would recommend */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
                  <p className="text-zinc-300 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ThumbsUp size={12} className="text-emerald-400"/> Would you recommend AgriIntel to other chefs?
                  </p>
                  <div className="flex gap-3">
                    {[{v:true, label:"Yes, absolutely!", color:"emerald"}, {v:false, label:"Not yet", color:"red"}].map(({v, label, color}) => (
                      <button key={String(v)} type="button" onClick={() => setForm(p=>({...p,recommend:v}))}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                          form.recommend === v
                            ? color === "emerald" ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300" : "bg-red-600/20 border-red-500/40 text-red-300"
                            : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300"
                        }`}>{label}</button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
                  <p className="text-zinc-300 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MessageSquare size={12} className="text-sky-400"/> Your Message
                  </p>
                  <textarea rows={4} placeholder="Share anything — quality, delivery, suggestions, special requests..."
                    value={form.message} onChange={e => setForm(p=>({...p,message:e.target.value}))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm rounded-xl px-4 py-3 outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/15 transition-all resize-none"/>
                </div>

                {/* Connect with Farm - Direct channels */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
                  <p className="text-zinc-300 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Video size={12} className="text-violet-400"/> Connect with Farm Team
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      {
                        label:"WhatsApp",
                        icon: Phone,
                        color:"text-[#25D366]",
                        bg:"bg-[#25D366]/10 border-[#25D366]/20 hover:bg-[#25D366]/20",
                        action: () => window.open(`https://wa.me/${WA_FARM}?text=${encodeURIComponent(`Hi AgriIntel! I'm ${form.name} from ${form.restaurant||"a restaurant"}. Looking to discuss herb supply.`)}`, "_blank")
                      },
                      {
                        label:"Video Call",
                        icon: Video,
                        color:"text-violet-400",
                        bg:"bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20",
                        action: () => window.open("https://meet.google.com/new", "_blank")
                      },
                      {
                        label:"Photo Inspect",
                        icon: Camera,
                        color:"text-sky-400",
                        bg:"bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20",
                        action: () => window.location.href = "/photo-inspect"
                      },
                    ].map(({ label, icon: Icon, color, bg, action }) => (
                      <button key={label} type="button" onClick={action}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 border rounded-2xl text-xs font-semibold transition-all ${bg}`}>
                        <Icon size={16} className={color}/>
                        <span className="text-zinc-300">{label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-zinc-700 text-[10px] text-center">Farm team responds within 2 hrs · WhatsApp preferred</p>
                </div>

                <motion.button type="submit" whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-black rounded-2xl shadow-lg shadow-amber-500/15 transition-all">
                  <Send size={15}/> Send Feedback to Farm Team
                </motion.button>

                <p className="text-zinc-700 text-[11px] text-center flex items-center justify-center gap-1.5">
                  <Mail size={10}/> Sends directly to helensoffiajp@gmail.com · read within 24 hrs
                </p>
              </motion.form>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
