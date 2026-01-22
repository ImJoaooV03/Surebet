import { LayoutDashboard, Zap, Calendar, Settings, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  close: () => void;
}

export default function Sidebar({ isOpen, close }: SidebarProps) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/opportunities', label: 'Oportunidades', icon: Zap },
    { path: '/events', label: 'Eventos', icon: Calendar },
    { path: '/admin', label: 'Admin / Cron', icon: ShieldCheck },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200" onClick={close} />
      )}

      <aside className={`
        fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="p-4 space-y-2">
          <div className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Menu Principal</div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 768 && close()}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}
                `}
              >
                <item.icon size={20} className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 shadow-inner">
            <h4 className="text-xs font-bold text-slate-300 mb-2">Status do Sistema</h4>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              Operacional
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
