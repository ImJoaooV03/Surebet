import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Opportunities from './pages/Opportunities';
import Events from './pages/Events';
import AdminLayout from './pages/Admin';
import { SystemConfig } from './components/admin/SystemConfig';
import { AdminIntegrations } from './components/admin/AdminIntegrations';
import { AdminScanner } from './components/admin/AdminScanner';
import { AdminCodes } from './components/admin/AdminCodes';
import { AdminUsers } from './components/admin/AdminUsers';
import { AdminMetrics } from './components/admin/AdminMetrics';
import Login from './pages/Login';
import Register from './pages/Register';
import Plans from './pages/Plans';
import Settings from './pages/Settings';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotFound } from './pages/NotFound';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { SubscriptionRoute } from './components/auth/SubscriptionRoute';
import { Calculator } from './pages/Calculator';
import { OpportunityDetail } from './pages/OpportunityDetail';
import Bankroll from './pages/Bankroll';
import History from './pages/History'; 
import OpportunityHistory from './pages/OpportunityHistory'; 
import Reports from './pages/Reports'; 
import HelpCenter from './pages/HelpCenter'; // Novo Import

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Rotas Públicas (Login/Registro) */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Rotas Protegidas (Requer Login) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<AppShell />}>
                
                {/* Área Comum */}
                <Route path="plans" element={<Plans />} />
                <Route path="settings" element={<Settings />} />
                <Route path="help" element={<HelpCenter />} /> {/* Nova Rota */}

                {/* Área Restrita (Assinantes) */}
                <Route element={<SubscriptionRoute />}>
                  <Route index element={<Dashboard />} />
                  <Route path="opportunities" element={<Opportunities />} />
                  <Route path="opportunities/:id" element={<OpportunityDetail />} />
                  <Route path="opportunity-history" element={<OpportunityHistory />} />
                  <Route path="events" element={<Events />} />
                  <Route path="calculator" element={<Calculator />} />
                  <Route path="bankroll" element={<Bankroll />} />
                  <Route path="history" element={<History />} />
                  <Route path="reports" element={<Reports />} />
                </Route>
                
                {/* Área Admin */}
                <Route element={<AdminRoute />}>
                  <Route path="admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="system" replace />} />
                    <Route path="system" element={<SystemConfig />} />
                    <Route path="metrics" element={<AdminMetrics />} />
                    <Route path="integrations" element={<AdminIntegrations />} />
                    <Route path="scanner" element={<AdminScanner />} />
                    <Route path="codes" element={<AdminCodes />} />
                    <Route path="users" element={<AdminUsers />} />
                  </Route>
                </Route>

              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
