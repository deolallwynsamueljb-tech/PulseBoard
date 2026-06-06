import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import CustomerPulse from "./pages/CustomerPulse";
import AIAdvisor from "./pages/AIAdvisor";
import FreshnessTracker from "./pages/FreshnessTracker";
import StockMarket from "./pages/StockMarket";
import WastePredictor from "./pages/WastePredictor";

function Layout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/"          element={<Dashboard />}        />
          <Route path="/analytics" element={<Analytics />}        />
          <Route path="/pulse"     element={<CustomerPulse />}    />
          <Route path="/advisor"   element={<AIAdvisor />}        />
          <Route path="/freshness" element={<FreshnessTracker />} />
          <Route path="/market"    element={<StockMarket />}      />
          <Route path="/waste"     element={<WastePredictor />}   />
          <Route path="*"          element={<Navigate to="/" />}  />
        </Routes>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/*"     element={<Layout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style: { background:"#18181b", color:"#e4e4e7", border:"1px solid #3f3f46", fontSize:"13px", borderRadius:"10px" },
          success: { iconTheme: { primary:"#10b981", secondary:"#18181b" } },
        }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
