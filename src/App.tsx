import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Dashboard } from "./pages/Dashboard";
import { LiveArbs } from "./pages/LiveArbs";
import { Settings } from "./pages/Settings";
import { History } from "./pages/History";
import { Games } from "./pages/Games";
import { Calculator } from "./pages/Calculator"; // Import Calculator
import { Login } from "./pages/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { Loader2 } from "lucide-react";
import { ArbSimulator } from "./components/debug/ArbSimulator";
import { MockWorkerService } from "./workers/MockWorkerService";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout />
          <ArbSimulator />
          <MockWorkerService />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="live" element={<LiveArbs />} />
        <Route path="games" element={<Games />} />
        <Route path="calculator" element={<Calculator />} /> {/* New Route */}
        <Route path="settings" element={<Settings />} />
        <Route path="history" element={<History />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
