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
import Login from './pages/Login';
import Register from './pages/Register';
import Plans from './pages/Plans';
import Settings from './pages/Settings';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotFound } from './pages/NotFound';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Rotas Públicas */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Rotas Protegidas (Usuários Logados) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="opportunities" element={<Opportunities />} />
                <Route path="events" element={<Events />} />
                <Route path="plans" element={<Plans />} />
                <Route path="settings" element={<Settings />} />
                
                {/* Rota Exclusiva de Admin (Com Rotas Aninhadas) */}
                <Route element={<AdminRoute />}>
                  <Route path="admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="system" replace />} />
                    <Route path="system" element={<SystemConfig />} />
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
