import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Header Fixo (z-index alto para ficar sobre tudo) */}
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* 
        Container Principal (Flex Row)
        - pt-16: Compensa a altura do Header fixo (4rem/64px)
        - h-screen: Garante que o container ocupe a altura total
        - overflow-hidden: Impede scroll duplo na janela inteira
      */}
      <div className="flex flex-1 pt-16 overflow-hidden">
        
        {/* Sidebar (Agora participa do fluxo Flex no Desktop) */}
        <Sidebar isOpen={sidebarOpen} close={() => setSidebarOpen(false)} />
        
        {/* 
          Área de Conteúdo (Flex-1)
          - flex-1: Ocupa todo o espaço restante à direita da Sidebar
          - overflow-y-auto: Permite scroll apenas nesta área (Dashboard scrollável)
          - relative: Para posicionamento de elementos internos
        */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8 relative scroll-smooth">
          <div className="max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
