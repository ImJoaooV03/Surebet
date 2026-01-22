import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Zap, Calendar, Settings, ShieldCheck, X, Ticket, 
  ChevronRight, Radio, Activity, Users, Calculator, Wallet, BarChart3,
  History as HistoryIcon, Archive, PieChart, HelpCircle
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../lib/apiClient';

interface SidebarProps {
  isOpen: boolean;
  close: () => void;
}

interface NavItemProps {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: number | string; // Adicionado suporte a badge
  badgeColor?: string;
  subItems?: { path: string; label: string; icon: React.ElementType }[];
}

export default function Sidebar({ isOpen, close }: SidebarProps) {
  const location = useLocation();
  const { isAdmin } = useAuth();
  
  // Estado para controlar quais menus estão abertos
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  
  // Estado para contadores
  const [oppCount, setOppCount] = useState(0);

  // Busca contagem de oportunidades para o badge
  useEffect(() => {
    const fetchStatus = () => {
      apiRequest('/status')
        .then((data: any) => {
          if (data && typeof data.totalOpportunities === 'number') {
            setOppCount(data.totalOpportunities);
          }
        })
        .catch(err => console.error("Erro ao buscar status sidebar:", err));
    };

    fetchStatus();
    // Atualiza a cada 30s
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleMenu = (path: string) => {
    setOpenMenus(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // Definição dos Itens de Navegação
  const navItems: NavItemProps[] = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { 
      path: '/opportunities', 
      label: 'Oportunidades', 
      icon: Zap,
      badge: oppCount > 0 ? oppCount : undefined, // Mostra badge se houver opps
      badgeColor: 'bg-emerald-500 text-slate-950'
    },
    { path: '/opportunity-history', label: 'Arquivo Scanner', icon: Archive },
    { path: '/events', label: 'Eventos', icon: Calendar },
    { path: '/calculator', label: 'Calculadora', icon: Calculator },
    
    // Grupo: Minha Gestão
    { 
      path: '/management', 
      label: 'Minha Gestão', 
      icon: PieChart,
      subItems: [
        { path: '/bankroll', label: 'Gestão de Banca', icon: Wallet },
        { path: '/history', label: 'Histórico Pessoal', icon: HistoryIcon },
        { path: '/reports', label: 'Relatórios', icon: Activity },
      ]
    },

    { path: '/plans', label: 'Planos & Upgrade', icon: Ticket },
    { path: '/help', label: 'Ajuda / Tutoriais', icon: HelpCircle },
    { path: '/settings', label: 'Configurações', icon: Settings },
  ];

  // Item Admin (Separado)
  const adminItem: NavItemProps = {
    path: '/admin',
    label: 'Painel Admin',
    icon: ShieldCheck,
    subItems: [
      { path: '/admin/system', label: 'Ativação', icon: Zap },
      { path: '/admin/metrics', label: 'Métricas API', icon: BarChart3 },
      { path: '/admin/integrations', label: 'Conexões', icon: Radio },
      { path: '/admin/scanner', label: 'Scanner', icon: Activity },
      { path: '/admin/users', label: 'Usuários', icon: Users },
      { path: '/admin/codes', label: 'Códigos', icon: Ticket },
    ]
  };

  // Efeito para abrir automaticamente o menu se estiver em uma rota filha
  useEffect(() => {
    const itemsToCheck = isAdmin ? [...navItems, adminItem] : navItems;

    itemsToCheck.forEach(item => {
      if (item.subItems) {
        const isChildActive = item.subItems.some(sub => location.pathname === sub.path);
        const isParentActive = location.pathname.startsWith(item.path) && item.path !== '/management'; 
        
        if (isChildActive || isParentActive) {
          setOpenMenus(prev => ({ ...prev, [item.path]: true }));
        }
      }
    });
  }, [location.pathname, isAdmin]);

  // Função auxiliar para renderizar um item de menu
  const renderNavItem = (item: NavItemProps) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isMenuOpen = openMenus[item.path];
    const isActive = !hasSubItems && location.pathname === item.path;
    const isChildActive = hasSubItems && item.subItems?.some(sub => location.pathname === sub.path);

    return (
      <div key={item.path}>
        {hasSubItems ? (
          // Item com Dropdown (Accordion)
          <button
            onClick={() => toggleMenu(item.path)}
            className={`
              w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
              ${isChildActive ? 'text-slate-200 bg-slate-900/50' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}
            `}
            aria-expanded={isMenuOpen}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} className={isChildActive ? "text-emerald-500" : "text-slate-500 group-hover:text-slate-300"} />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <ChevronRight 
              size={16} 
              className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-90 text-slate-200' : 'text-slate-600'}`} 
            />
          </button>
        ) : (
          // Item Simples
          <Link
            to={item.path}
            onClick={() => window.innerWidth < 768 && close()}
            className={`
              flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative
              ${isActive 
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-900/20 font-medium' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}
            `}
          >
            <div className="relative">
              <item.icon size={20} className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"} />
              {/* Indicador de notificação no ícone se colapsado (opcional) */}
            </div>
            <span className="text-sm flex-1">{item.label}</span>
            
            {/* BADGE NO SIDEBAR */}
            {item.badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${item.badgeColor || 'bg-slate-700 text-white'}`}>
                {item.badge}
              </span>
            )}

            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/20 rounded-r"></div>}
          </Link>
        )}

        {/* Sub Itens Renderizados */}
        {hasSubItems && (
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="mt-1 space-y-1 relative">
              <div className="absolute left-6 top-0 bottom-2 w-px bg-slate-800"></div>
              {item.subItems?.map((subItem) => {
                const isSubActive = location.pathname === subItem.path;
                return (
                  <Link
                    key={subItem.path}
                    to={subItem.path}
                    onClick={() => window.innerWidth < 768 && close()}
                    className={`
                      flex items-center gap-3 pl-10 pr-3 py-2.5 rounded-lg text-sm transition-all relative
                      ${isSubActive 
                        ? 'text-emerald-400 font-medium bg-emerald-500/5' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}
                    `}
                  >
                    <subItem.icon size={16} className={isSubActive ? "text-emerald-500" : "opacity-70"} />
                    <span>{subItem.label}</span>
                    {isSubActive && <div className="absolute left-6 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-emerald-500 -ml-[2.5px]"></div>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={close} 
      />

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
        md:static md:translate-x-0 md:z-auto md:inset-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        pt-16 md:pt-0
      `}>
        
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 md:hidden absolute top-0 left-0 right-0 bg-slate-950 z-10">
           <span className="text-lg font-bold text-white">Menu</span>
           <button onClick={close} className="text-slate-400 hover:text-white">
             <X size={24} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 mt-16 md:mt-0 scrollbar-hide">
          <div className="px-3 mb-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Menu Principal</div>
          
          {navItems.map(renderNavItem)}

          {isAdmin && (
            <>
              <div className="my-6 mx-3 border-t border-slate-800/80"></div>
              <div className="px-3 mb-3 text-[11px] font-bold text-emerald-500/90 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={12} />
                Área Administrativa
              </div>
              {renderNavItem(adminItem)}
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-inner">
            <h4 className="text-xs font-bold text-slate-300 mb-3">Status do Sistema</h4>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1.5 rounded-lg border border-emerald-500/10 w-fit">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              Operacional
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
