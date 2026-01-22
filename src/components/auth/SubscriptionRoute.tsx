import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2, Lock } from "lucide-react";

export function SubscriptionRoute() {
  const { user, isPremium, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // Se não estiver logado, manda pro login (redundância, pois ProtectedRoute já cuida disso)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se não for Premium E não for Admin, bloqueia e manda para Planos
  if (!isPremium && !isAdmin) {
    return <Navigate to="/plans" replace />;
  }

  // Se tiver acesso, renderiza o conteúdo
  return <Outlet />;
}
