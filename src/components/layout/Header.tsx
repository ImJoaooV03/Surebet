import { Bell, User, Menu, Search } from 'lucide-react';

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 fixed top-0 right-0 left-0 z-20 flex items-center justify-between px-4 md:px-6 transition-all duration-300">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="md:hidden text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/20">
            <span className="font-bold text-white">S</span>
          </div>
          <span className="text-lg font-bold text-white hidden sm:block tracking-tight">Surebet<span className="text-indigo-400">Pro</span></span>
        </div>
      </div>

      <div className="hidden md:flex items-center relative w-96 ml-10">
        <Search className="w-4 h-4 absolute left-3 text-slate-500" />
        <input 
          type="text" 
          placeholder="Buscar eventos, times ou ligas..." 
          className="w-full bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950"></span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white leading-none">Admin User</p>
            <p className="text-xs text-slate-500 mt-0.5">Pro Plan</p>
          </div>
          <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 shadow-inner">
            <User size={18} className="text-slate-300" />
          </div>
        </div>
      </div>
    </header>
  );
}
