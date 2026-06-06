import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Leaf, AlertTriangle, CheckCircle2, RefreshCw, ZoomIn, Award } from "lucide-react";
import API from "../api";
import toast from "react-hot-toast";
import { useLang } from "../context/LangContext";
import { HERBS } from "../context/LangContext";

const ENGLISH_HERBS = Object.keys(HERBS.en);

const GRADE_CONFIG = {
  Premium:  { color:"text-emerald-400", bg:"bg-emerald-500/10", border:"border-emerald-500/20", bar:"bg-emerald-400" },
  Good:     { color:"text-sky-400",     bg:"bg-sky-500/10",     border:"border-sky-500/20",     bar:"bg-sky-400"     },
  Fair:     { color:"text-amber-400",   bg:"bg-amber-500/10",   border:"border-amber-500/20",   bar:"bg-amber-400"   },
  Poor:     { color:"text-orange-400",  bg:"bg-orange-500/10",  border:"border-orange-500/20",  bar:"bg-orange-400"  },
  Spoiled:  { color:"text-red-400",     bg:"bg-red-500/10",     border:"border-red-500/20",     bar:"bg-red-400"     },
};

export default function PhotoInspect() {
  const { t } = useLang();
  const [imageFile,   setImageFile]   = useState(null);
  const [imageUrl,    setImageUrl]    = useState(null);
  const [herb,        setHerb]        = useState("Basil");
  const [result,      setResult]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [dragging,    setDragging]    = useState(false);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setResult(null);
  }, []);

  const onFilePick = (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); };

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const analyze = async () => {
    if (!imageFile) { toast.error("Please upload an herb photo first"); return; }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64  = e.target.result.split(",")[1];
        const mimeType = imageFile.type || "image/jpeg";
        const { data } = await API.post("/ai/photo-inspect", {
          image_base64: base64,
          herb_name: herb,
          image_type: mimeType,
        });
        setResult(data);
        if (data.refund_eligible) {
          toast.success(`${data.refund_percentage}% refund eligible — quality issue detected`, { duration: 5000 });
        } else {
          toast.success("Inspection complete");
        }
      } catch {
        toast.error("Inspection failed — check backend connection");
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => { toast.error("Failed to read image"); setLoading(false); };
    reader.readAsDataURL(imageFile);
  };

  const reset = () => {
    setImageFile(null); setImageUrl(null); setResult(null);
    if (fileRef.current)   fileRef.current.value   = "";
    if (cameraRef.current) cameraRef.current.value = "";
  };

  const gc = result ? (GRADE_CONFIG[result.grade] || GRADE_CONFIG.Good) : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Camera size={20} className="text-sky-400"/>
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-100">{t.pg_photo_title}</h1>
            <p className="text-zinc-500 text-xs">{t.pg_photo_sub}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label:"Accuracy",    value:"93%",      icon:"🎯" },
            { label:"Analysis",    value:"< 5 sec",  icon:"⚡" },
            { label:"Refund Auto", value:"If < Fair", icon:"💰" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="p-3 bg-sky-500/5 border border-sky-500/15 rounded-2xl text-center">
              <p className="text-xl mb-0.5">{icon}</p>
              <p className="text-zinc-100 font-black text-sm">{value}</p>
              <p className="text-sky-400 text-[10px] font-semibold uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Upload panel */}
        <div className="space-y-4">

          {/* Herb selector */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-2.5 flex items-center gap-2">
              <Leaf size={11} className="text-emerald-400"/> {t.lbl_which_herb}
            </p>
            <div className="flex flex-wrap gap-2">
              {ENGLISH_HERBS.map(h => (
                <button key={h} onClick={() => setHerb(h)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    herb === h ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200"
                  }`}>{t.herbs[h] || h}</button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          {!imageUrl ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                dragging ? "border-sky-400 bg-sky-500/5" : "border-zinc-700 hover:border-zinc-500 bg-zinc-900"
              }`}
              onClick={() => fileRef.current?.click()}>
              <Camera size={32} className="text-zinc-600 mx-auto mb-3"/>
              <p className="text-zinc-300 text-sm font-semibold mb-1">Drop herb photo here</p>
              <p className="text-zinc-600 text-xs mb-4">or click to browse · JPG, PNG, WEBP supported</p>
              <div className="flex gap-2 justify-center">
                <button type="button" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all">
                  <Upload size={12}/> Browse File
                </button>
                <button type="button" onClick={e => { e.stopPropagation(); cameraRef.current?.click(); }}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-700 transition-all">
                  <Camera size={12}/> Camera
                </button>
              </div>
              <input ref={fileRef}    type="file" accept="image/*"                    className="hidden" onChange={onFilePick}/>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFilePick}/>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900">
              <img src={imageUrl} alt="Herb to inspect" className="w-full h-56 object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                <span className="text-xs font-bold text-white bg-zinc-900/80 px-2.5 py-1 rounded-lg">{t.herbs[herb] || herb} · Ready to inspect</span>
              </div>
              <button onClick={reset}
                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 flex items-center justify-center hover:bg-zinc-800">
                <X size={13} className="text-zinc-300"/>
              </button>
            </div>
          )}

          <motion.button
            onClick={analyze}
            disabled={!imageUrl || loading}
            whileHover={{ scale: imageUrl && !loading ? 1.01 : 1 }}
            whileTap={{ scale: imageUrl && !loading ? 0.99 : 1 }}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-sm font-black rounded-2xl shadow-lg shadow-sky-500/15 transition-all">
            {loading
              ? <><RefreshCw size={15} className="animate-spin"/> Analysing with Groq Vision AI…</>
              : <><ZoomIn size={15}/> {t.lbl_inspect_btn}</>
            }
          </motion.button>
        </div>

        {/* Results panel */}
        <AnimatePresence mode="wait">
          {loading && !result && (
            <motion.div key="loading" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 min-h-[360px]">
              <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <Camera size={24} className="text-sky-400"/>
              </div>
              <div className="text-center">
                <p className="text-zinc-200 font-bold text-sm mb-1">AI Vision analysing…</p>
                <p className="text-zinc-600 text-xs">Groq vision model inspecting leaf colour, wilt, damage</p>
              </div>
              <div className="flex gap-1.5">
                {[0,150,300].map(d=>(
                  <span key={d} className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay:`${d}ms` }}/>
                ))}
              </div>
            </motion.div>
          )}

          {result && !loading && (
            <motion.div key="result" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">

              {/* Grade */}
              <div className={`flex items-center justify-between p-4 ${gc.bg} border ${gc.border} rounded-2xl`}>
                <div>
                  <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wide mb-1">Quality Grade</p>
                  <p className={`text-2xl font-black ${gc.color}`}>{result.grade}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{result.freshness_estimate} · {result.color_analysis}</p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-500 text-[10px]">AI Score</p>
                  <p className={`text-4xl font-black tabular-nums ${gc.color}`}>{result.quality_score}</p>
                  <p className="text-zinc-600 text-[10px]">{result.confidence}% confidence</p>
                </div>
              </div>

              {/* Quality bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400">Quality Score</span>
                  <span className={`font-bold ${gc.color}`}>{result.quality_score}/100</span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width:0 }} animate={{ width:`${result.quality_score}%` }} transition={{ duration:0.8, delay:0.2, ease:"easeOut" }}
                    className={`h-full rounded-full ${gc.bar}`}/>
                </div>
              </div>

              {/* Detection flags */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className={`flex items-center gap-2 p-3 rounded-xl border ${result.wilt_detected ? "bg-red-500/8 border-red-500/20" : "bg-emerald-500/8 border-emerald-500/20"}`}>
                  {result.wilt_detected ? <AlertTriangle size={13} className="text-red-400"/> : <CheckCircle2 size={13} className="text-emerald-400"/>}
                  <div>
                    <p className="text-zinc-300 text-xs font-semibold">Wilt</p>
                    <p className={`text-[10px] font-bold ${result.wilt_detected ? "text-red-400" : "text-emerald-400"}`}>{result.wilt_detected ? "Detected" : "None"}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 p-3 rounded-xl border ${result.pest_damage ? "bg-red-500/8 border-red-500/20" : "bg-emerald-500/8 border-emerald-500/20"}`}>
                  {result.pest_damage ? <AlertTriangle size={13} className="text-red-400"/> : <CheckCircle2 size={13} className="text-emerald-400"/>}
                  <div>
                    <p className="text-zinc-300 text-xs font-semibold">Pest</p>
                    <p className={`text-[10px] font-bold ${result.pest_damage ? "text-red-400" : "text-emerald-400"}`}>{result.pest_damage ? "Detected" : "None"}</p>
                  </div>
                </div>
              </div>

              {/* Issues */}
              {result.issues && result.issues.length > 0 && (
                <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3">
                  <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-wide mb-2">Issues Detected</p>
                  <ul className="space-y-1">
                    {result.issues.map((iss, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                        <span className="text-red-400 flex-shrink-0 mt-0.5">•</span> {iss}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendation */}
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3">
                <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-wide mb-1.5">AI Recommendation</p>
                <p className="text-zinc-300 text-xs leading-relaxed">{result.recommendation}</p>
              </div>

              {/* Refund badge */}
              {result.refund_eligible && (
                <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <Award size={18} className="text-amber-400 flex-shrink-0"/>
                  <div>
                    <p className="text-amber-300 text-xs font-black">Refund Eligible — {result.refund_percentage}%</p>
                    <p className="text-zinc-500 text-[10px]">Quality below standard · auto-credit applied</p>
                  </div>
                </div>
              )}

              <button onClick={reset}
                className="w-full py-2.5 text-xs font-bold text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-all">
                {t.lbl_inspect_another}
              </button>
            </motion.div>
          )}

          {!result && !loading && (
            <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[360px]">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <ZoomIn size={28} className="text-zinc-600"/>
              </div>
              <div className="text-center">
                <p className="text-zinc-400 font-semibold text-sm mb-1">Results appear here</p>
                <p className="text-zinc-700 text-xs">Upload a photo and tap Inspect</p>
              </div>
              <div className="space-y-1.5 w-full max-w-xs">
                {["Quality grade (Premium → Spoiled)", "Wilt & pest detection", "Freshness estimate", "Auto-refund eligibility"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-[11px] text-zinc-600">
                    <CheckCircle2 size={10} className="text-zinc-700 flex-shrink-0"/> {f}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
