import { NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import {
  LayoutDashboard, BarChart3, MessageSquare, BrainCircuit,
  Leaf, TrendingUp, Trash2, LogOut, ChevronRight, Sprout, Globe, ChefHat, X
} from "lucide-react";

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  // Close drawer on route change (mobile)
  useEffect(() => { onClose?.(); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const NAV = [
    { section: t.sec_overview },
    { path: "/",          label: t.nav_dashboard, Icon: LayoutDashboard },
    { path: "/analytics", label: t.nav_analytics, Icon: BarChart3       },
    { section: t.sec_ai },
    { path: "/freshness", label: t.nav_freshness, Icon: Leaf            },
    { path: "/market",    label: t.nav_market,    Icon: TrendingUp      },
    { path: "/waste",     label: t.nav_waste,     Icon: Trash2          },
    { section: t.sec_engage },
    { path: "/advisor",   label: t.nav_advisor,   Icon: BrainCircuit    },
    { path: "/pulse",     label: t.nav_pulse,     Icon: MessageSquare   },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 md:z-auto
        w-64 md:w-56 h-screen
        bg-surface-900 border-r border-surface-600
        flex flex-col flex-shrink-0
        transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>

        {/* Brand + mobile close */}
        <div className="px-4 py-4 border-b border-surface-600 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <Sprout size={14} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-zinc-100 font-semibold text-sm leading-none">AgriIntel</p>
            <p className="text-zinc-500 text-[11px] mt-0.5">Farm Intelligence</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden w-7 h-7 rounded-lg bg-surface-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100"
          >
            <X size={14} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item, i) =>
            item.section ? (
              <p key={i} className="px-2 pt-3 pb-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider first:pt-1">
                {item.section}
              </p>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `group flex items-center gap-2.5 px-2.5 py-2.5 md:py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-emerald-600/10 text-emerald-400 border border-emerald-600/20"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-surface-700"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.Icon size={15} className={isActive ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300"} />
                    <span className="flex-1 text-[13px]">{item.label}</span>
                    {isActive && <ChevronRight size={11} className="text-emerald-500" />}
                  </>
                )}
              </NavLink>
            )
          )}
        </nav>

        {/* Simple Mode */}
        <div className="px-2 py-3 border-t border-surface-600 space-y-2">
          <Link to="/simple"
            className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg bg-emerald-700/20 border border-emerald-700/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-700/30 transition-all"
          >
            <Globe size={13} /> {t.nav_simple} 🌱👨‍🍳
          </Link>
        </div>

        {/* User */}
        <div className="px-2 py-3 border-t border-surface-600">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
              user?.role === "chef" ? "bg-amber-600" : "bg-emerald-700"
            }`}>
              {user?.role === "chef" ? <ChefHat size={13}/> : (user?.name || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-200 text-xs font-medium truncate">{user?.name || "User"}</p>
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${
                user?.role === "chef"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}>
                {user?.role === "chef" ? <><ChefHat size={7}/>Chef</> : <><Sprout size={7}/>Farmer</>}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-surface-700 rounded-lg transition-all"
          >
            <LogOut size={13} /> {t.lbl_signout}
          </button>
        </div>
      </aside>
    </>
  );
}
