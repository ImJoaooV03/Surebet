import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Zap, History, Settings, LogOut, LineChart, CalendarDays, Calculator } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

export function Sidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/" },
    { icon: Zap, label: "Live Surebets", to: "/live" },
    { icon: CalendarDays, label: "Jogos do Dia", to: "/games" },
    { icon: Calculator, label: "Calculadora", to: "/calculator" }, // New Item
    { icon: History, label: "Histórico", to: "/history" },
    { icon: Settings, label: "Configurações", to: "/settings" },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
          <LineChart className="text-slate-950 w-5 h-5" />
        </div>
        <span className="font-bold text-lg text-slate-100 tracking-tight">Surebet<span className="text-emerald-500">Pro</span></span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
