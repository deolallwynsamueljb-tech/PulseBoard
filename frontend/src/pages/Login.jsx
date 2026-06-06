import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Sprout, BarChart3, BrainCircuit, Thermometer } from "lucide-react";

const FEATURES = [
  { Icon: Sprout,       text: "Real-time crop yield & resource tracking" },
  { Icon: BarChart3,    text: "Revenue analytics by crop and season"     },
  { Icon: BrainCircuit, text: "Gemini + Groq AI demand forecasting"      },
  { Icon: Thermometer,  text: "Live environmental sensor monitoring"     },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }
    setLoading(true);
    const uid = btoa(email.toLowerCase()).replace(/=/g, "").slice(0, 20);
    login({ uid, name: name.trim(), email: email.trim() });
    toast.success(`Welcome, ${name.trim()}!`);
    navigate("/");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-surface-900 border-r border-surface-600 p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Sprout size={16} className="text-white" />
          </div>
          <div>
            <span className="text-zinc-100 font-bold text-sm">PulseBoard</span>
            <span className="text-zinc-500 text-xs ml-2">Farm Intelligence</span>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-zinc-100 mb-3 leading-tight">
            Farm intelligence that<br />drives real results.
          </h1>
          <p className="text-zinc-400 text-sm mb-10 leading-relaxed max-w-sm">
            Monitor yield, track resources, forecast demand, and get AI-powered crop recommendations — all in one platform.
          </p>
          <div className="space-y-4">
            {FEATURES.map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-700 border border-surface-600 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-emerald-400" />
                </div>
                <p className="text-zinc-300 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Sprout size={16} className="text-white" />
            </div>
            <span className="text-zinc-100 font-bold">PulseBoard</span>
          </div>

          <h2 className="text-xl font-bold text-zinc-100 mb-1">Sign in to your dashboard</h2>
          <p className="text-zinc-500 text-sm mb-8">Enter your details to continue</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-800 border border-surface-600 text-zinc-100 placeholder-zinc-500 text-sm rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"
            />
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-800 border border-surface-600 text-zinc-100 placeholder-zinc-500 text-sm rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all"
            >
              {loading ? "Entering..." : "Enter Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
