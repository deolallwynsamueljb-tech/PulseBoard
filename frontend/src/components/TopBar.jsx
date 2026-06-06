import { RefreshCw, Download, Sun, Moon, Bell, FileSpreadsheet, FileText } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";

export default function TopBar({ title, onRefresh, countdown, onExportPDF, onExportExcel, alerts = [] }) {
  const { dark, toggle } = useTheme();
  const [showExport, setShowExport] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-30">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Auto-refreshes in <span className="text-emerald-400 font-mono">{countdown}s</span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Alerts bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts(p => !p)}
            className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <Bell size={18} />
            {alerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          {showAlerts && alerts.length > 0 && (
            <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 p-3 space-y-2">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">Alerts</p>
              {alerts.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-zinc-800">
                  <span className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                    a.severity === "Critical" ? "bg-red-500" :
                    a.severity === "High" ? "bg-orange-400" : "bg-yellow-400"
                  }`} />
                  <div>
                    <p className="text-sm text-white font-medium">{a.metric || a.crop}</p>
                    <p className="text-xs text-zinc-400">{a.action || a.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition text-sm"
        >
          <RefreshCw size={15} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* Export dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExport(p => !p)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition text-sm font-medium"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Export</span>
          </button>
          {showExport && (
            <div className="absolute right-0 mt-2 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
              <button
                onClick={() => { onExportPDF?.(); setShowExport(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 transition"
              >
                <FileText size={15} className="text-red-400" />
                Export PDF
              </button>
              <button
                onClick={() => { onExportExcel?.(); setShowExport(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 transition"
              >
                <FileSpreadsheet size={15} className="text-green-400" />
                Export Excel
              </button>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </div>
  );
}
