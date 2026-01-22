import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Zap, Calendar, ShieldCheck } from 'lucide-react';

export default function Layout() {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/opportunities', label: 'Oportunidades', icon: Zap },
    { path: '/events', label: 'Eventos', icon: Calendar },
    { path: '/admin', label: 'Admin', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
      <aside className="w-64 border-r border-slate-800 flex flex-col fixed h-full bg-slate-950 z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-emerald-500 tracking-tight">Surebet<span className="text-white">V2</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 ml-64 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
