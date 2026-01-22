import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Zap, Calendar, Shield, Calculator } from "lucide-react";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 flex flex-col fixed h-full bg-slate-950 z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-emerald-500 tracking-tight">Surebet<span className="text-white">V2</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/opportunities" icon={Zap} label="Oportunidades" />
          <NavItem to="/events" icon={Calendar} label="Eventos" />
          <NavItem to="/calculator" icon={Calculator} label="Calculadora" />
          <NavItem to="/admin" icon={Shield} label="Admin / Cron" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon: Icon, label }: any) {
  return (
    <NavLink to={to} className={({ isActive }) => 
      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
      }`
    }>
      <Icon className="w-5 h-5" />
      {label}
    </NavLink>
  );
}
