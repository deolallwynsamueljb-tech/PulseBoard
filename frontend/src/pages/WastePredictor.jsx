import { useEffect, useState, useCallback, useMemo } from "react";
import { useLang } from "../context/LangContext";
import { motion } from "framer-motion";
import { Trash2, RefreshCw, Tag, Calculator } from "lucide-react";
import API from "../api";
import toast from "react-hot-toast";

const URGENCY_COLOR = {
  Critical: { bg:"bg-red-500/10",    text:"text-red-400",    border:"border-red-500/20"    },
  High:     { bg:"bg-amber-500/10",  text:"text-amber-400",  border:"border-amber-500/20"  },
  Medium:   { bg:"bg-sky-500/10",    text:"text-sky-400",    border:"border-sky-500/20"    },
  Restock:  { bg:"bg-violet-500/10", text:"text-violet-400", border:"border-violet-500/20" },
};

const WA_NUMBER = "919994521399";

function WasteCard({ herb, excess_kg, urgency, flash_sale, normal_price, action_by, discount, onDiscountChange }) {
  const isShortage = excess_kg <= 0;
  const uc = URGENCY_COLOR[urgency] || URGENCY_COLOR.Medium;
  const adjPrice   = isShortage ? 0 : Math.round(normal_price * (1 - discount / 100));
  const recovered  = isShortage ? 0 : Math.abs(excess_kg) * adjPrice;

  const sendWhatsApp = () => {
    const by = new Date(Date.now() + 2 * 86400000).toLocaleDateString("en-IN", { weekday:"short", month:"short", day:"numeric" });
    const msg = encodeURIComponent(
      `🌿 *Flash Sale — AgriIntel Farm*\n\n` +
      `🔥 *${herb}* — ${excess_kg}kg excess\n` +
      `💰 *${discount}% OFF* — ₹${adjPrice}/kg\n` +
      `⏰ Fresh until ${by}\n\n` +
      `✅ Farm-fresh, same-day delivery (2.4 hrs)\n` +
      `📲 pulseboard-gamma-cyan.vercel.app`
    );
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
  };

  return (
    <motion.div layout initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      className={`bg-surface-800 border rounded-2xl p-5 transition-all ${urgency==="Critical" ? "border-red-500/30 shadow-lg shadow-red-500/5" : "border-surface-600"}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-zinc-100 font-bold text-base">{herb}</h3>
          <p className="text-zinc-500 text-xs mt-0.5">Action by: <span className="text-zinc-300">{action_by}</span></p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${uc.bg} ${uc.text} ${uc.border}`}>
          {urgency}
        </span>
      </div>

      {!isShortage ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-surface-700 rounded-xl p-2.5 text-center">
              <p className="text-zinc-600 text-[10px]">Excess</p>
              <p className="text-amber-400 font-bold text-sm">{excess_kg} kg</p>
            </div>
            <div className="bg-surface-700 rounded-xl p-2.5 text-center">
              <p className="text-zinc-600 text-[10px]">Flash Price</p>
              <p className="text-emerald-400 font-bold text-sm">₹{adjPrice}/kg</p>
            </div>
            <div className="bg-surface-700 rounded-xl p-2.5 text-center">
              <p className="text-zinc-600 text-[10px]">Recovered</p>
              <p className="text-emerald-400 font-bold text-sm">₹{recovered.toLocaleString()}</p>
            </div>
          </div>

          {/* Discount slider */}
          <div className="bg-surface-700 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-[11px] font-medium">Flash Sale Discount</span>
              <span className="text-amber-400 font-black text-sm tabular-nums">{discount}% OFF</span>
            </div>
            <input type="range" min={5} max={60} step={5} value={discount}
              onChange={e => onDiscountChange(herb, +e.target.value)}
              className="w-full h-2 bg-surface-600 rounded-full appearance-none cursor-pointer accent-amber-400"/>
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
              <span>5%</span><span className="text-amber-400">30% sweet spot</span><span>60%</span>
            </div>
          </div>

          {/* Summary tag */}
          <div className="flex items-center gap-2 bg-surface-700 rounded-xl px-3 py-2 mb-3">
            <Tag size={11} className="text-amber-400 flex-shrink-0"/>
            <p className="text-zinc-300 text-xs font-medium">{excess_kg}kg {herb} @ ₹{adjPrice}/kg ({discount}% OFF)</p>
          </div>

          {/* WhatsApp CTA */}
          <button onClick={sendWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1db855] text-white text-sm font-bold transition-all active:scale-95">
            📱 Send Flash Sale via WhatsApp
          </button>
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
  const { t } = useLang();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [discounts, setDiscounts] = useState({});

  const getDiscount = h => discounts[h] ?? 30;

  const refresh = useCallback(async (silent=false) => {
    if (!silent) setLoading(true);
    try { const { data: d } = await API.get("/waste/"); setData(d); }
    catch { if (!silent) toast.error("Using cached waste data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const id = setInterval(() => refresh(true), 90000);
    return () => clearInterval(id);
  }, [refresh]);

  const calcRevenue = useMemo(() => {
    if (!data?.alerts) return 0;
    return data.alerts.filter(a => a.excess_kg > 0).reduce((sum, a) => {
      return sum + a.excess_kg * Math.round(a.normal_price * (1 - getDiscount(a.herb) / 100));
    }, 0);
  }, [data, discounts]);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
            <Trash2 size={20} className="text-amber-400"/> {t.pg_waste_title}
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">{t.pg_waste_sub}</p>
        </div>
        <button onClick={() => refresh()} disabled={loading}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-100 bg-surface-800 border border-surface-600 px-3 py-1.5 rounded-xl transition-all">
          <RefreshCw size={11} className={loading?"animate-spin":""}/>{t.lbl_refresh}
        </button>
      </motion.div>

      {/* Revenue calculator bar */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="bg-gradient-to-r from-emerald-500/10 to-surface-800 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <Calculator size={15} className="text-emerald-400"/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-zinc-300 text-sm font-semibold">Flash Sale Revenue Calculator</p>
          <p className="text-zinc-500 text-xs">Adjust discount sliders to see live recovery changes</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-zinc-500 text-xs">Optimised</p>
          <p className="text-2xl font-black text-emerald-400 tabular-nums">₹{calcRevenue.toLocaleString()}</p>
        </div>
      </motion.div>

      {/* Waste Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-zinc-200">{t.lbl_active_alerts}</h2>
          <span className="text-zinc-500 text-xs">{data?.alerts?.length||0} items</span>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({length:3}).map((_,i)=><div key={i} className="h-56 bg-surface-800 border border-surface-600 rounded-2xl animate-pulse"/>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data?.alerts?.map(a => (
              <WasteCard key={a.herb} {...a}
                discount={getDiscount(a.herb)}
                onDiscountChange={(h,d) => setDiscounts(p=>({...p,[h]:d}))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
