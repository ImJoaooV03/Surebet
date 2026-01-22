import { Bell, User, Menu, Search, LogOut, Crown, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { signOut, user, plan, isAdmin } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const displayRole = isAdmin 
    ? 'Administrador' 
    : `${(plan || 'Basic').charAt(0).toUpperCase() + (plan || 'basic').slice(1)} Plan`;

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 fixed top-0 right-0 left-0 z-30 flex items-center justify-between px-4 md:px-6 transition-all duration-300 shadow-sm shadow-black/40">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="md:hidden text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-900/20 shrink-0">
            <span className="font-bold text-white">S</span>
          </div>
          <span className="text-lg font-bold text-white hidden sm:block tracking-tight">
            Surebet<span className="text-primary-400">Pro</span>
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-4 hidden sm:block">
        <div className="relative group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar eventos, times ou ligas..." 
            className="w-full bg-slate-900/50 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all placeholder:text-slate-600 focus:bg-slate-900"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button className="sm:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
          <Search size={20} />
        </button>

        <button className="relative text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-3 md:pl-4 border-l border-slate-800">
          <div className="text-right hidden md:flex flex-col items-end justify-center">
            <p className="text-sm font-bold text-white leading-none max-w-[150px] truncate">
              {displayName}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {isAdmin && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
              <p className={`text-[10px] font-medium uppercase tracking-wide ${isAdmin ? 'text-emerald-400' : 'text-slate-500'}`}>
                {displayRole}
              </p>
            </div>
          </div>
          
          <div className={`w-9 h-9 rounded-full flex items-center justify-center border shadow-inner shrink-0 ${
            isAdmin 
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400' 
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}>
            {isAdmin ? <Crown size={16} /> : <User size={18} />}
          </div>
        </div>

        <button 
          onClick={() => signOut()}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all ml-1 hidden sm:block"
          title="Sair do Sistema"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
