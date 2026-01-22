import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} close={() => setSidebarOpen(false)} />
      
      {/* 
        Ajuste de Espaçamento:
        - Header: h-16 (64px)
        - Padding Top: pt-24 (96px)
        - Resultante: 32px de respiro visual entre Header e Conteúdo.
      */}
      <main className="md:pl-64 pt-24 px-4 pb-8 md:px-8 transition-all duration-300 min-h-screen flex flex-col">
        <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
