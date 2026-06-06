import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Sprout, BarChart3, BrainCircuit, Thermometer,
  ChefHat, ArrowLeft, Mail, User, Building2,
  TrendingUp, Leaf, Clock, Star, Shield, CheckCircle2
} from "lucide-react";

const FARMER_FEATURES = [
  { Icon: Sprout,       text: "Real-time crop yield & resource tracking"  },
  { Icon: BarChart3,    text: "Revenue analytics by crop and season"       },
  { Icon: BrainCircuit, text: "Groq AI demand forecasting & insights"      },
  { Icon: Thermometer,  text: "Live environmental sensor monitoring"       },
];

const CHEF_FEATURES = [
  { Icon: Leaf,       text: "Live freshness — batch quality & expiry"   },
  { Icon: Clock,      text: "Same-day delivery tracking (avg 2.4 hrs)"  },
  { Icon: Star,       text: "Direct WhatsApp orders to the farm"        },
  { Icon: TrendingUp, text: "Live herb prices & seasonal availability"  },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step,       setStep]       = useState("role");
  const [role,       setRole]       = useState(null);
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [loading,    setLoading]    = useState(false);
  const [showAccess, setShowAccess] = useState(false);

  const selectRole = r => { setRole(r); setStep("form"); };

  const handleLogin = async e => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { toast.error("Please enter your name and email."); return; }
    if (role === "chef" && !restaurant.trim()) { toast.error("Please enter your restaurant name."); return; }
    setLoading(true);
    const uid = btoa(email.toLowerCase()).replace(/=/g, "").slice(0, 20);
    login({ uid, name: name.trim(), email: email.trim(), role, restaurant: role === "chef" ? restaurant.trim() : undefined });
    toast.success(role === "chef" ? `Welcome Chef ${name.trim()}! Fresh herbs await.` : `Welcome, ${name.trim()}! Dashboard ready.`);
    navigate("/");
    setLoading(false);
  };

  const requestAccess = () => {
    const subject = encodeURIComponent("PulseBoard — Access Request");
    const body = encodeURIComponent(
      `Hello AgriIntel Team,\n\nI need access to PulseBoard.\n\nName: ${name || "—"}\nEmail: ${email || "—"}\nRole: ${role || "—"}\n${restaurant ? `Restaurant: ${restaurant}\n` : ""}\nPlease assist.\n\nThank you.`
    );
    window.open(`mailto:helensoffiajp@gmail.com?subject=${subject}&body=${body}`);
    toast.success("Access request email opened — we respond within 24 hrs");
    setShowAccess(false);
  };

  const features = role === "chef" ? CHEF_FEATURES : FARMER_FEATURES;

  return (
    <div className="min-h-screen bg-[#09090b] flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-[#0d0d10] border-r border-zinc-800 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-violet-500/5 pointer-events-none"/>

        {/* Brand */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sprout size={18} className="text-white"/>
          </div>
          <div>
            <p className="text-zinc-100 font-black text-sm tracking-tight">AgriIntel</p>
            <p className="text-zinc-500 text-[11px]">PulseBoard · Farm Intelligence</p>
          </div>
        </div>

        {/* Dynamic content */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div key={role || "default"} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={{ duration:0.3 }}>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 ${
                role === "chef"   ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                role === "farmer" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                    "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}>
                {role === "chef" ? <ChefHat size={11}/> : <Sprout size={11}/>}
                {role === "chef" ? "Chef Portal" : role === "farmer" ? "Farmer Dashboard" : "Farm Intelligence Platform"}
              </div>
              <h1 className="text-[2.2rem] font-black text-zinc-100 mb-4 leading-[1.15] tracking-tight">
                {role === "chef"
                  ? "Freshest herbs,\ndirect to your\nkitchen."
                  : role === "farmer"
                  ? "Your farm,\nfully intelligent."
                  : "Farm intelligence\nthat drives\nreal results."}
              </h1>
              <p className="text-zinc-400 text-sm mb-10 leading-relaxed max-w-xs">
                {role === "chef"
                  ? "Real-time freshness tracking, same-day harvest delivery, and direct WhatsApp ordering from AgriIntel urban farm in Chennai."
                  : role === "farmer"
                  ? "Monitor yield, track resources, forecast demand, and get Groq AI-powered crop recommendations — all in one dashboard."
                  : "Monitor your entire urban herb farm from a single intelligent dashboard. Real-time data, AI-powered insights, chef-connected."}
              </p>
              <div className="space-y-3">
                {features.map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      role === "chef" ? "bg-amber-500/10 border border-amber-500/20" : "bg-emerald-500/10 border border-emerald-500/20"
                    }`}>
                      <Icon size={14} className={role === "chef" ? "text-amber-400" : "text-emerald-400"}/>
                    </div>
                    <p className="text-zinc-300 text-sm">{text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Social proof */}
        <div className="relative">
          <div className="flex items-center gap-3 p-4 bg-zinc-800/60 border border-zinc-700 rounded-2xl">
            <div className="flex -space-x-2">
              {["#10b981","#38bdf8","#f59e0b","#a78bfa"].map(c => (
                <div key={c} className="w-8 h-8 rounded-full border-2 border-zinc-900 flex items-center justify-center" style={{ background: c + "18" }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: c }}/>
                </div>
              ))}
            </div>
            <div>
              <p className="text-zinc-200 text-xs font-bold">18 chef partners · 9 premium herbs</p>
              <p className="text-zinc-500 text-[11px]">4.7★ satisfaction · Chennai urban farm</p>
            </div>
            <div className="ml-auto">
              <Shield size={14} className="text-emerald-500"/>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Sprout size={16} className="text-white"/>
            </div>
            <div>
              <p className="text-zinc-100 font-black text-sm">AgriIntel PulseBoard</p>
              <p className="text-zinc-500 text-[11px]">Farm Intelligence</p>
            </div>
          </div>

          <AnimatePresence mode="wait">

            {/* Step 1: Role selection */}
            {step === "role" && (
              <motion.div key="role" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                <h2 className="text-2xl font-black text-zinc-100 mb-1 tracking-tight">Welcome to PulseBoard</h2>
                <p className="text-zinc-500 text-sm mb-8">Select your role to personalise your experience</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <motion.button onClick={() => selectRole("farmer")} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                    className="group flex flex-col items-center gap-4 p-7 bg-zinc-900 border-2 border-zinc-800 hover:border-emerald-500/60 rounded-2xl transition-all hover:bg-emerald-500/5 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all">
                      <Sprout size={28} className="text-emerald-400"/>
                    </div>
                    <div>
                      <p className="text-zinc-100 font-black text-sm mb-1">Farmer</p>
                      <p className="text-zinc-500 text-[11px] leading-snug">Full dashboard · AI advisor · analytics · sensors</p>
                    </div>
                    <div className="flex gap-1">
                      {["Yield","AI","Market"].map(t => (
                        <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded">{t}</span>
                      ))}
                    </div>
                  </motion.button>

                  <motion.button onClick={() => selectRole("chef")} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                    className="group flex flex-col items-center gap-4 p-7 bg-zinc-900 border-2 border-zinc-800 hover:border-amber-500/60 rounded-2xl transition-all hover:bg-amber-500/5 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 group-hover:border-amber-500/40 transition-all">
                      <ChefHat size={28} className="text-amber-400"/>
                    </div>
                    <div>
                      <p className="text-zinc-100 font-black text-sm mb-1">Chef / Buyer</p>
                      <p className="text-zinc-500 text-[11px] leading-snug">Freshness · ordering · feedback · delivery</p>
                    </div>
                    <div className="flex gap-1">
                      {["Fresh","Order","Direct"].map(t => (
                        <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded">{t}</span>
                      ))}
                    </div>
                  </motion.button>
                </div>

                <p className="text-zinc-700 text-[11px] text-center">
                  Your role determines which features and views are available to you
                </p>
              </motion.div>
            )}

            {/* Step 2: Login form */}
            {step === "form" && (
              <motion.div key="form" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                <button onClick={() => { setStep("role"); setRole(null); }}
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs mb-7 transition-colors group">
                  <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform"/> Change role
                </button>

                <div className="flex items-center gap-2.5 mb-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${role === "chef" ? "bg-amber-500/15" : "bg-emerald-500/15"}`}>
                    {role === "chef" ? <ChefHat size={15} className="text-amber-400"/> : <Sprout size={15} className="text-emerald-400"/>}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${role === "chef" ? "text-amber-400 bg-amber-500/10 border border-amber-500/20" : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"}`}>
                    {role === "chef" ? "Chef Portal" : "Farmer Dashboard"}
                  </span>
                </div>

                <h2 className="text-2xl font-black text-zinc-100 mt-3 mb-1 tracking-tight">
                  {role === "chef" ? "Hello, Chef" : "Welcome back"}
                </h2>
                <p className="text-zinc-500 text-sm mb-7">
                  {role === "chef" ? "Connect to AgriIntel urban farm" : "Enter your farm intelligence dashboard"}
                </p>

                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div className="relative">
                    <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"/>
                    <input type="text" placeholder={role === "chef" ? "Your chef name" : "Your name"}
                      value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm rounded-xl pl-9 pr-4 py-3 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/15 transition-all"/>
                  </div>

                  <div className="relative">
                    <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"/>
                    <input type="email" placeholder="Your email address"
                      value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm rounded-xl pl-9 pr-4 py-3 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/15 transition-all"/>
                  </div>

                  {role === "chef" && (
                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}>
                      <div className="relative">
                        <Building2 size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"/>
                        <input type="text" placeholder="Restaurant / Hotel / Cloud Kitchen"
                          value={restaurant} onChange={e => setRestaurant(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm rounded-xl pl-9 pr-4 py-3 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/15 transition-all"/>
                      </div>
                    </motion.div>
                  )}

                  <motion.button type="submit" disabled={loading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                    className={`w-full disabled:opacity-60 text-white text-sm font-black py-3.5 px-4 rounded-xl transition-all shadow-lg mt-1 ${
                      role === "chef"
                        ? "bg-amber-600 hover:bg-amber-500 shadow-amber-500/20"
                        : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                    }`}>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        Entering...
                      </span>
                    ) : role === "chef" ? "Access Chef Portal" : "Enter Farm Dashboard"}
                  </motion.button>
                </form>

                <div className="mt-5 flex items-center justify-center">
                  <button onClick={() => setShowAccess(p => !p)}
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1">
                    Need access or forgot password?
                  </button>
                </div>

                <AnimatePresence>
                  {showAccess && (
                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                      className="mt-4 overflow-hidden">
                      <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-2xl">
                        <p className="text-zinc-300 text-xs font-bold mb-2 flex items-center gap-1.5"><Mail size={11} className="text-emerald-400"/> Request Access / Password Help</p>
                        <p className="text-zinc-500 text-[11px] leading-relaxed mb-3">
                          Fill in your name and email above, then click below to email the farm admin. They'll respond within 24 hours.
                        </p>
                        <button onClick={requestAccess}
                          className="w-full text-xs font-bold py-2.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-xl transition-all">
                          Send Request via Email
                        </button>
                        <button onClick={() => setShowAccess(false)}
                          className="w-full text-xs text-zinc-600 hover:text-zinc-400 mt-2 py-1 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {role === "chef" && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
                    className="mt-5 p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
                    <p className="text-amber-400 text-[11px] font-bold mb-2">Chef Portal access includes:</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        "✓ Live freshness tracker",
                        "✓ Batch QR scanning",
                        "✓ Direct WhatsApp orders",
                        "✓ Flash sale alerts",
                        "✓ Herb availability view",
                        "✓ Delivery tracking",
                      ].map(f => (
                        <span key={f} className="text-[10px] text-zinc-400">{f}</span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {role === "farmer" && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
                    className="mt-5 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
                    <p className="text-emerald-400 text-[11px] font-bold mb-2 flex items-center gap-1.5"><CheckCircle2 size={11}/> Full dashboard access:</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        "✓ AI demand forecasting",
                        "✓ Revenue analytics",
                        "✓ Waste predictor",
                        "✓ Chef partnership hub",
                        "✓ Live sensor data",
                        "✓ Market intelligence",
                      ].map(f => (
                        <span key={f} className="text-[10px] text-zinc-400">{f}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
