import { useLocation, Outlet } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();
  
  // Extrai a última parte da URL para determinar o título
  const currentPath = location.pathname.split('/').pop() || 'system';

  // Títulos dinâmicos baseados na rota
  const titles: Record<string, { title: string; subtitle: string }> = {
    system: { title: 'Ativação do Sistema', subtitle: 'Configure a chave mestra e os robôs de execução.' },
    metrics: { title: 'Métricas da API', subtitle: 'Monitoramento de uso, cotas e filas de processamento.' },
    integrations: { title: 'Conexões de Dados', subtitle: 'Gerencie as chaves de API externas.' },
    scanner: { title: 'Scanner em Tempo Real', subtitle: 'Visualize as oportunidades cruas chegando no banco.' },
    codes: { title: 'Gerenciador de Códigos', subtitle: 'Crie e gerencie códigos de acesso para planos.' },
    users: { title: 'Gestão de Usuários', subtitle: 'Controle de acesso, planos e permissões.' }
  };

  const currentInfo = titles[currentPath] || titles['system'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-emerald-500" /> {currentInfo.title}
          </h1>
          <p className="text-slate-400 text-sm">{currentInfo.subtitle}</p>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Outlet />
      </div>
    </div>
  );
}
