import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLang, LANGS } from "../context/LangContext";
import { FALLBACK } from "../lib/fallback";

const HERB_EMOJI = {
  Basil:"🌿", Mint:"🍃", Rosemary:"🌸", Thyme:"🌱",
  Coriander:"🌾", Lettuce:"🥬", Spinach:"🥦", Chives:"🧅", Parsley:"🪴",
};
const PRICES = {
  Basil:294, Rosemary:338, Thyme:308, Mint:171,
  Coriander:152, Lettuce:122, Chives:204, Spinach:90, Parsley:108,
};

/* ──── Sensor status logic ──── */
const SENSOR_RANGES = {
  temperature:[21,26], humidity:[60,75], co2:[380,600], light:[700,1000], ph:[5.8,6.8],
};
function sensorStatus(key, val) {
  const [lo, hi] = SENSOR_RANGES[key] || [0,9999];
  const pad = (hi-lo)*0.15;
  if (val < lo-pad || val > hi+pad) return "bad";
  if (val < lo || val > hi)         return "warn";
  return "good";
}

/* ──── Countdown hook ──── */
function useCountdown(freshness_days) {
  const expiryMs = Date.now() + freshness_days * 86400000;
  const [left, setLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = expiryMs - Date.now();
      if (diff <= 0) { setLeft("Expired"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setLeft(`${d}d ${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [expiryMs]);
  const expiryDate = new Date(expiryMs).toLocaleDateString("en-IN",
    { weekday:"short", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
  return { left, expiryDate };
}

/* ──── Language pill strip ──── */
function LangStrip({ lang, setLang }) {
  return (
    <div className="flex flex-wrap gap-1">
      {LANGS.map(l => (
        <button key={l.code} onClick={() => setLang(l.code)}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            lang===l.code ? "bg-emerald-600 text-white shadow-md" : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
          }`}
        >{l.flag}</button>
      ))}
    </div>
  );
}

/* ──── FARMER: sensor card ──── */
function SensorCard({ icon, label, value, unit, statusKey, iconOnly }) {
  const status = sensorStatus(statusKey, Number(value));
  const ring = { good:"border-emerald-500 bg-emerald-950/60", warn:"border-yellow-500 bg-yellow-950/60", bad:"border-red-500 bg-red-950/60 animate-pulse" };
  const badge = { good:"bg-emerald-600", warn:"bg-yellow-600", bad:"bg-red-600" };
  const emoji = { good:"✅", warn:"⚠️", bad:"🚨" };
  return (
    <div className={`rounded-2xl border-2 p-4 flex flex-col items-center gap-1 text-center transition-all ${ring[status]}`}>
      <span className="text-4xl leading-none">{icon}</span>
      {!iconOnly && <span className="text-xs text-zinc-400 font-medium mt-1">{label}</span>}
      <span className="text-3xl font-black text-white tabular-nums mt-1">
        {value}<span className="text-sm font-normal text-zinc-400 ml-0.5">{unit}</span>
      </span>
      <span className={`mt-1 w-8 h-8 rounded-full ${badge[status]} flex items-center justify-center text-base`}>
        {emoji[status]}
      </span>
    </div>
  );
}

/* ──── FARMER: harvest row ──── */
function HarvestRow({ herb, days, stock, iconOnly, t }) {
  const { left, expiryDate } = useCountdown(days);
  const status = days < 2 ? "bad" : days < 4 ? "warn" : "good";
  const bg = {
    good:"border-emerald-700 bg-emerald-950/40",
    warn:"border-yellow-600 bg-yellow-950/40",
    bad:"border-red-600 bg-red-950/50",
  };
  const statusLabel = { good:t.fresh, warn:t.pickSoon, bad:t.pickNow };
  const statusColor = { good:"text-emerald-300", warn:"text-yellow-300", bad:"text-red-300 font-black" };
  const emoji = HERB_EMOJI[herb] || "🌿";

  return (
    <motion.div layout initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
      className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${bg[status]} ${status==="bad"?"ring-2 ring-red-500/30":""}`}>
      <span className="text-5xl flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xl font-black text-white">{t.herbs?.[herb] || herb}</p>
        {!iconOnly && (
          <>
            <p className={`text-sm font-semibold ${statusColor[status]}`}>{statusLabel[status]}</p>
            <p className="text-xs text-zinc-500 mt-0.5">⏰ {expiryDate} · {left} {t.expiresIn}</p>
          </>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-4xl font-black tabular-nums ${status==="bad"?"text-red-400":status==="warn"?"text-yellow-400":"text-emerald-400"}`}>
          {days}
        </p>
        {!iconOnly && <p className="text-xs text-zinc-500">{t.daysLeft}</p>}
        <p className="text-sm text-zinc-400 font-medium">{stock}<span className="text-xs ml-0.5">kg</span></p>
      </div>
    </motion.div>
  );
}

/* ──── CHEF: herb card ──── */
function ChefHerbCard({ herb, days, stock, t }) {
  const { left, expiryDate } = useCountdown(days);
  const price    = PRICES[herb] || 0;
  const pct      = Math.min((days / 8) * 100, 100);
  const freshSt  = days < 2 ? "bad" : days < 4 ? "warn" : "good";
  const stockSt  = stock < 15 ? "low" : stock < 30 ? "med" : "ok";
  const emoji    = HERB_EMOJI[herb] || "🌿";

  const freshBg  = freshSt==="bad" ? "border-red-600 bg-red-950/50" :
                   freshSt==="warn"? "border-yellow-600 bg-yellow-950/40" :
                                     "border-emerald-700 bg-zinc-900";
  const barColor = freshSt==="bad"?"#ef4444":freshSt==="warn"?"#f59e0b":"#10b981";
  const stockCls = stockSt==="low"?"bg-red-700 text-white":stockSt==="med"?"bg-yellow-700 text-white":"bg-emerald-700 text-white";
  const stockTxt = stockSt==="low"?t.lowStock:stockSt==="med"?t.orderSoon:t.plenty;

  const sendWhatsApp = () => {
    const msg = encodeURIComponent(
      `🌿 *Order Request — AgriIntel Farm*\n\n` +
      `${emoji} *${herb}* ${stock < 15 ? `— Only ${stock}kg left!` : `— ${stock}kg available`}\n` +
      `💰 ₹${price}/kg · Fresh for ${days} more days\n` +
      `⏰ Expires: ${expiryDate}\n\n` +
      `✅ Farm-fresh · Same-day delivery (2.4 hrs)\n📊 pulseboard-gamma-cyan.vercel.app`
    );
    window.open(`https://wa.me/919994521399?text=${msg}`, "_blank");
  };

  return (
    <motion.div layout initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      className={`rounded-2xl border-2 p-4 flex flex-col gap-3 ${freshBg}`}>
      {/* Herb info */}
      <div className="flex items-center gap-2">
        <span className="text-4xl">{emoji}</span>
        <div className="flex-1">
          <p className="text-lg font-black text-white">{t.herbs?.[herb] || herb}</p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${stockCls}`}>{stockTxt}</span>
        </div>
      </div>

      {/* Price + stock */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-3xl font-black text-white">₹{price}</p>
          <p className="text-xs text-zinc-400">{t.priceKg}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-zinc-200">{stock} kg</p>
          <p className="text-xs text-zinc-400">{t.kgAvail}</p>
        </div>
      </div>

      {/* Freshness bar */}
      <div>
        <div className="flex justify-between text-xs text-zinc-400 mb-1">
          <span>⏰ {left} {t.daysLeft}</span>
          <span style={{ color: barColor }}>{days}d</span>
        </div>
        <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div animate={{ width:`${pct}%` }} transition={{ duration:0.6 }}
            className="h-full rounded-full" style={{ background: barColor }}/>
        </div>
        <p className="text-[10px] text-zinc-500 mt-1">{expiryDate}</p>
      </div>

      {/* WhatsApp button */}
      <button onClick={sendWhatsApp}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1db855] text-white text-sm font-bold transition-all active:scale-95">
        {t.whatsapp}
      </button>
    </motion.div>
  );
}

/* ──── CHEF: Order Form ──── */
const HERB_LIST = ["Basil","Mint","Rosemary","Thyme","Coriander","Lettuce","Chives","Spinach","Parsley"];
const WA_NUMBER = "919994521399";

function ChefOrderForm({ freshness, t }) {
  const [items, setItems]       = useState([{ herb:"Basil", qty:"" }]);
  const [chefName, setChefName] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [sent, setSent]         = useState(false);

  const addRow = () => setItems(p => [...p, { herb:"Basil", qty:"" }]);
  const removeRow = i => setItems(p => p.filter((_,idx) => idx!==i));
  const updateRow = (i, field, val) => setItems(p => p.map((r,idx) => idx===i ? {...r,[field]:val} : r));

  const valid = items.some(r => r.qty > 0) && chefName.trim();

  const sendOrder = () => {
    if (!valid) return;
    const lines = items
      .filter(r => r.qty > 0)
      .map(r => {
        const price = PRICES[r.herb] || 0;
        const total = price * r.qty;
        const stock = freshness.find(h=>h.herb===r.herb);
        const freshLine = stock ? ` (${stock.freshness_days}d fresh)` : "";
        return `• ${HERB_EMOJI[r.herb]||"🌿"} ${r.herb}${freshLine} — ${r.qty}kg @ ₹${price}/kg = ₹${total.toLocaleString()}`;
      });
    const msg = encodeURIComponent(
      `🛒 *Order Request — AgriIntel Farm*\n\n` +
      `👨‍🍳 Chef: ${chefName}${restaurant ? ` · ${restaurant}` : ""}\n` +
      `📅 ${new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}\n\n` +
      lines.join("\n") + `\n\n` +
      `✅ Please confirm availability & delivery time.\n📊 pulseboard-gamma-cyan.vercel.app`
    );
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="bg-zinc-900 border-2 border-emerald-700 rounded-2xl p-5 mt-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">📦</span>
        <div>
          <h3 className="text-lg font-black text-white">{t.lbl_place_order}</h3>
          <p className="text-xs text-zinc-500">{t.chef_sends_direct}</p>
        </div>
      </div>

      {/* Chef name + restaurant */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <input
          className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
          placeholder={t.chef_name_ph}
          value={chefName}
          onChange={e => setChefName(e.target.value)}
        />
        <input
          className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
          placeholder={t.chef_restaurant_ph}
          value={restaurant}
          onChange={e => setRestaurant(e.target.value)}
        />
      </div>

      {/* Order rows */}
      <div className="space-y-2 mb-4">
        {items.map((row, i) => {
          const price = PRICES[row.herb] || 0;
          const stock = freshness.find(h=>h.herb===row.herb);
          return (
            <div key={i} className="flex items-center gap-2">
              <select
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
                value={row.herb}
                onChange={e => updateRow(i,"herb",e.target.value)}>
                {HERB_LIST.map(h => {
                  const s = freshness.find(f=>f.herb===h);
                  const emoji = HERB_EMOJI[h]||"🌿";
                  return <option key={h} value={h}>{emoji} {t.herbs?.[h]||h} {s?`(${s.freshness_days}d)`:""}</option>;
                })}
              </select>
              <input
                type="number"
                min="0.5" step="0.5"
                className="w-20 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm text-center focus:outline-none focus:border-emerald-500 transition-all"
                placeholder="kg"
                value={row.qty}
                onChange={e => updateRow(i,"qty",e.target.value)}
              />
              <div className="w-16 text-center">
                <p className="text-emerald-400 font-bold text-xs">₹{row.qty > 0 ? (price * row.qty).toLocaleString() : price}</p>
                <p className="text-zinc-600 text-[10px]">/kg</p>
              </div>
              {items.length > 1 && (
                <button onClick={() => removeRow(i)} className="text-zinc-600 hover:text-red-400 text-xl leading-none transition-colors">×</button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button onClick={addRow}
          className="flex-shrink-0 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-300 text-sm font-semibold transition-all">
          {t.lbl_add_herb}
        </button>
        <button onClick={sendOrder} disabled={!valid}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-black transition-all ${
            sent ? "bg-emerald-700" : valid ? "bg-[#25D366] hover:bg-[#1db855]" : "bg-zinc-700 opacity-50 cursor-not-allowed"
          }`}>
          {sent ? "✓ WhatsApp opened!" : `📱 ${t.lbl_send_order}`}
        </button>
      </div>

      <p className="text-zinc-600 text-[11px] text-center mt-3">
        {t.chef_order_footer}
      </p>
    </div>
  );
}

/* ──── Main Component ──── */
export default function SimpleView() {
  const { t, lang, setLang } = useLang();
  const [mode,    setMode]    = useState("farmer");
  const [iconOnly,setIconOnly]= useState(false);
  const [sensors, setSensors] = useState(FALLBACK.sensors);

  useEffect(() => {
    const BASE = import.meta.env.VITE_API_URL || "";
    fetch(`${BASE}/sensors/live`).then(r=>r.json())
      .then(d => { if (d?.temperature) setSensors(d); }).catch(()=>{});
  }, []);

  const freshness = [...FALLBACK.freshness].sort((a,b) => a.freshness_days - b.freshness_days);
  const urgent  = freshness.filter(h => h.freshness_days < 2);
  const soon    = freshness.filter(h => h.freshness_days >= 2 && h.freshness_days < 4);
  const fresh   = freshness.filter(h => h.freshness_days >= 4);

  const SENSOR_DISPLAY = [
    { key:"temperature", icon:"🌡️", unit:"°C",  label:t.temp     },
    { key:"humidity",    icon:"💧", unit:"%",   label:t.humidity  },
    { key:"co2",         icon:"🌬️", unit:"ppm", label:t.air       },
    { key:"light",       icon:"☀️", unit:"lux", label:t.light     },
    { key:"ph",          icon:"🧪", unit:"pH",  label:t.ph        },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo + title */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🌿</span>
            </div>
            <div>
              <p className="text-sm font-black text-white leading-none">AgriIntel</p>
              <p className="text-xs text-zinc-500">{t.simpleMode}</p>
            </div>
          </div>

          {/* Language strip */}
          <LangStrip lang={lang} setLang={setLang} />

          {/* Back link */}
          <Link to="/" className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 bg-zinc-800 rounded-lg transition-all">
            {t.backFull}
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* ── Mode Tabs ── */}
        <div className="flex rounded-2xl overflow-hidden border border-zinc-700 max-w-sm">
          {[["farmer", t.farmerTab], ["chef", t.chefTab]].map(([key, label]) => (
            <button key={key} onClick={() => setMode(key)}
              className={`flex-1 py-3.5 text-base font-black transition-all ${
                mode===key ? "bg-emerald-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >{label}</button>
          ))}
        </div>

        {/* ════════ FARMER MODE ════════ */}
        <AnimatePresence mode="wait">
        {mode === "farmer" && (
          <motion.div key="farmer" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            {/* Icon-only toggle */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-zinc-200">📡 {t.sensors}</h2>
              <button onClick={() => setIconOnly(p=>!p)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  iconOnly ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-zinc-700 bg-zinc-800 text-zinc-400"
                }`}>
                {iconOnly ? `🎯 ${t.iconMode}` : `🏷️ ${t.labelMode}`}
              </button>
            </div>

            {/* Sensor Grid */}
            <div className={`grid gap-3 mb-8 ${iconOnly ? "grid-cols-5" : "grid-cols-2 md:grid-cols-5"}`}>
              {SENSOR_DISPLAY.map(s => (
                <SensorCard key={s.key}
                  icon={s.icon} label={s.label} unit={s.unit}
                  value={sensors[s.key]?.value ?? "–"}
                  statusKey={s.key} iconOnly={iconOnly}
                />
              ))}
            </div>

            {/* Harvest Readiness */}
            <h2 className="text-lg font-black text-zinc-200 mb-4">🌾 {t.harvest}</h2>

            {urgent.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"/>
                  <span className="text-red-400 text-xs font-black uppercase tracking-widest">{t.bad}</span>
                </div>
                <div className="space-y-2">
                  {urgent.map(h => <HarvestRow key={h.herb} herb={h.herb} days={h.freshness_days} stock={h.stock_kg} iconOnly={iconOnly} t={t}/>)}
                </div>
              </div>
            )}
            {soon.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"/>
                  <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">{t.warn}</span>
                </div>
                <div className="space-y-2">
                  {soon.map(h => <HarvestRow key={h.herb} herb={h.herb} days={h.freshness_days} stock={h.stock_kg} iconOnly={iconOnly} t={t}/>)}
                </div>
              </div>
            )}
            {fresh.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"/>
                  <span className="text-emerald-400 text-xs font-black uppercase tracking-widest">{t.good}</span>
                </div>
                <div className="space-y-2">
                  {fresh.map(h => <HarvestRow key={h.herb} herb={h.herb} days={h.freshness_days} stock={h.stock_kg} iconOnly={iconOnly} t={t}/>)}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ════════ CHEF MODE ════════ */}
        {mode === "chef" && (
          <motion.div key="chef" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-zinc-200">🛒 {t.available}</h2>
                <p className="text-zinc-500 text-xs mt-0.5">{new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-emerald-400">{freshness.length}</p>
                <p className="text-xs text-zinc-500">{t.chef_herbs_live}</p>
              </div>
            </div>

            {/* Urgent notice */}
            {urgent.length > 0 && (
              <div className="bg-red-950/60 border border-red-600 rounded-2xl p-4 mb-5 flex items-center gap-3">
                <span className="text-3xl animate-pulse">🚨</span>
                <div>
                  <p className="text-red-300 font-black text-sm">
                    {urgent.map(h => t.herbs?.[h.herb] || h.herb).join(", ")} — {t.pickNow}
                  </p>
                  <p className="text-red-400 text-xs">{t.chef_discount}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {freshness.map(h => (
                <ChefHerbCard key={h.herb} herb={h.herb} days={h.freshness_days} stock={h.stock_kg} t={t}/>
              ))}
            </div>

            {/* Chef Order Section */}
            <ChefOrderForm freshness={freshness} t={t}/>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
