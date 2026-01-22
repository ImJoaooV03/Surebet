import { useState, useMemo } from "react";
import { 
  Search, HelpCircle, BookOpen, AlertTriangle, Settings, 
  ChevronDown, ChevronUp, MessageCircle, Mail, ExternalLink 
} from "lucide-react";
import { Badge } from "../components/ui/Badge";

// --- Types ---
type Category = 'basics' | 'strategy' | 'troubleshooting' | 'config';

interface HelpArticle {
  id: string;
  title: string;
  content: React.ReactNode;
  category: Category;
}

// --- Content Data ---
const ARTICLES: HelpArticle[] = [
  // Categoria: Primeiros Passos (Como usar)
  {
    id: 'basics-1',
    title: 'O que é o SurebetPro?',
    category: 'basics',
    content: (
      <div className="space-y-2 text-slate-400 text-sm">
        <p>
          O SurebetPro é uma ferramenta de scanner que monitora dezenas de casas de aposta em tempo real para encontrar discrepâncias nas odds.
        </p>
        <p>
          Quando uma oportunidade (Surebet) é detectada, significa que você pode apostar em todos os resultados possíveis de um evento e garantir lucro matemático, independentemente do placar final.
        </p>
      </div>
    )
  },
  {
    id: 'basics-2',
    title: 'Entendendo o Dashboard',
    category: 'basics',
    content: (
      <div className="space-y-2 text-slate-400 text-sm">
        <p>O Dashboard é sua central de comando. Nele você encontra:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>KPIs:</strong> Resumo do seu lucro diário e oportunidades ativas.</li>
          <li><strong>Tabela de Oportunidades:</strong> As melhores surebets do momento.</li>
          <li><strong>Status do Sistema:</strong> Monitoramento da saúde da API e dos robôs.</li>
        </ul>
      </div>
    )
  },

  // Categoria: Estratégia (Como apostar)
  {
    id: 'strat-1',
    title: 'Como realizar uma aposta segura (Passo a Passo)',
    category: 'strategy',
    content: (
      <div className="space-y-3 text-slate-400 text-sm">
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>Identifique:</strong> Clique em uma oportunidade na lista para ver os detalhes.</li>
          <li><strong>Verifique:</strong> Abra as casas de aposta envolvidas (ex: Bet365 e Pinnacle) e confirme se as odds ainda estão iguais ou superiores às mostradas no sistema.</li>
          <li><strong>Calcule:</strong> Use a calculadora integrada para definir quanto apostar em cada casa com base na sua banca total.</li>
          <li><strong>Aposte:</strong> Realize as apostas o mais rápido possível, começando pela casa onde a odd tem maior chance de cair (geralmente a "Soft Book" como Bet365).</li>
        </ol>
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-amber-400 text-xs mt-2">
          <strong>Dica Pro:</strong> Nunca arredonde os valores das apostas para números muito quebrados (ex: R$ 53,47) em casas recreativas para evitar limitação. Use a opção "Arredondar" na calculadora.
        </div>
      </div>
    )
  },
  {
    id: 'strat-2',
    title: 'Mercados de 2 Vias vs 3 Vias',
    category: 'strategy',
    content: (
      <div className="space-y-2 text-slate-400 text-sm">
        <p><strong>2 Vias (2-Way):</strong> Apenas dois resultados possíveis. Ex: Tênis (Jogador A ou B), Over/Under, Handicap Asiático. São mais fáceis de executar.</p>
        <p><strong>3 Vias (3-Way):</strong> Três resultados possíveis. Ex: Futebol 1x2 (Casa, Empate, Fora). Exigem contas em mais casas e são mais complexas de gerenciar.</p>
      </div>
    )
  },

  // Categoria: Resolução de Problemas (Erros comuns)
  {
    id: 'trouble-1',
    title: 'A odd mudou antes de eu apostar',
    category: 'troubleshooting',
    content: (
      <div className="space-y-2 text-slate-400 text-sm">
        <p>Isso é comum, especialmente em jogos Ao Vivo. Se a odd cair e a surebet deixar de ser lucrativa:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Não faça a segunda aposta se ela gerar prejuízo garantido.</li>
          <li>Tente fazer "Cashout" da primeira aposta se o prejuízo for menor.</li>
          <li>Ou assuma o risco da primeira aposta (transformando em uma aposta de valor) se você tiver confiança na análise.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'trouble-2',
    title: 'Minha conta foi limitada',
    category: 'troubleshooting',
    content: (
      <div className="space-y-2 text-slate-400 text-sm">
        <p>Casas recreativas (Bet365, Betano) não gostam de vencedores constantes. Para prolongar a vida da conta:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Arredonde suas apostas (R$ 50,00 em vez de R$ 51,23).</li>
          <li>Misture algumas apostas "normais" ou múltiplas recreativas.</li>
          <li>Evite sacar todo o lucro imediatamente.</li>
        </ul>
      </div>
    )
  },

  // Categoria: Configurações (Alertas)
  {
    id: 'config-1',
    title: 'Configurando o Bot do Telegram',
    category: 'config',
    content: (
      <div className="space-y-2 text-slate-400 text-sm">
        <p>Para receber alertas no celular:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Vá em <strong>Configurações {'>'} Alertas & Filtros</strong>.</li>
          <li>Ative o switch do Telegram.</li>
          <li>Inicie uma conversa com nosso bot <code>@SurebetProBot</code>.</li>
          <li>Envie <code>/start</code> para pegar seu Chat ID.</li>
          <li>Cole o ID no campo indicado e clique em "Testar".</li>
        </ol>
      </div>
    )
  },
  {
    id: 'config-2',
    title: 'Filtrando Casas de Aposta',
    category: 'config',
    content: (
      <div className="space-y-2 text-slate-400 text-sm">
        <p>
          Se você não tem conta em determinada casa (ex: 1xBet), você deve desativá-la para que o sistema não mostre oportunidades que você não pode aproveitar.
        </p>
        <p>
          Vá em <strong>Configurações {'>'} Casas & Mercados</strong> e desmarque as casas indesejadas. Isso limpa seu feed de oportunidades.
        </p>
      </div>
    )
  }
];

const CATEGORIES = [
  { id: 'basics', label: 'Primeiros Passos', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'strategy', label: 'Como Apostar', icon: HelpCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'troubleshooting', label: 'Erros Comuns', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'config', label: 'Configurações', icon: Settings, color: 'text-purple-400', bg: 'bg-purple-500/10' },
];

export default function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredArticles = useMemo(() => {
    return ARTICLES.filter(article => {
      const matchesSearch = 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Basic content search (checking if content is string or trying to render to string would be complex, simplified to title for now or simple text content if extended)
        false; 
      
      const matchesCategory = activeCategory === 'all' || article.category === activeCategory;

      // If searching, ignore category filter unless explicitly set? 
      // Let's keep strict filtering: Category AND Search
      if (searchTerm) {
        return article.title.toLowerCase().includes(searchTerm.toLowerCase());
      }

      return matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Header Hero */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-8 overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500"></div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Como podemos ajudar?</h1>
          <p className="text-slate-400 text-lg">
            Explore nossos tutoriais e aprenda a dominar o mercado de arbitragem.
          </p>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Busque por um tópico (ex: Telegram, Calculadora...)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 shadow-xl transition-all"
            />
          </div>
        </div>
      </div>

      {/* Category Grid */}
      {!searchTerm && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(isActive ? 'all' : cat.id as Category)}
                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 text-center group ${
                  isActive 
                    ? 'bg-slate-800 border-slate-600 shadow-lg scale-[1.02]' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div className={`p-3 rounded-full ${cat.bg} ${cat.color} group-hover:scale-110 transition-transform`}>
                  <Icon size={24} />
                </div>
                <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Articles List (Accordion) */}
      <div className="space-y-4">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => {
            const isOpen = openItems.includes(article.id);
            const categoryConfig = CATEGORIES.find(c => c.id === article.category);
            
            return (
              <div 
                key={article.id} 
                className={`bg-slate-900 border rounded-xl overflow-hidden transition-all duration-300 ${
                  isOpen ? 'border-indigo-500/30 shadow-lg shadow-indigo-900/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => toggleItem(article.id)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${categoryConfig?.bg || 'bg-slate-800'}`}>
                      {categoryConfig?.icon && <categoryConfig.icon size={20} className={categoryConfig.color} />}
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg transition-colors ${isOpen ? 'text-indigo-400' : 'text-slate-200'}`}>
                        {article.title}
                      </h3>
                      {searchTerm && (
                        <Badge variant="outline" className="mt-1 text-[10px] opacity-70">
                          {categoryConfig?.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="text-slate-500" />
                  </div>
                </button>
                
                {isOpen && (
                  <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2">
                    <div className="h-px w-full bg-slate-800 mb-4"></div>
                    <div className="pl-14">
                      {article.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-slate-500">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum artigo encontrado para sua busca.</p>
            <button 
              onClick={() => { setSearchTerm(""); setActiveCategory('all'); }}
              className="mt-2 text-indigo-400 hover:underline text-sm"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Support CTA Section */}
      <div className="mt-12 bg-gradient-to-r from-indigo-900/50 to-slate-900 border border-indigo-500/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Decor */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10 text-center md:text-left">
          <h2 className="text-2xl font-bold text-white mb-2">Ainda precisa de ajuda?</h2>
          <p className="text-slate-400 max-w-lg">
            Nossa equipe de suporte especializado está pronta para resolver qualquer problema técnico ou dúvida sobre sua conta.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto">
          <a 
            href="mailto:suporte@surebetpro.com"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all border border-slate-700"
          >
            <Mail size={18} />
            Email
          </a>
          <a 
            href="#" // Link para WhatsApp ou Chat
            onClick={(e) => { e.preventDefault(); alert("O chat ao vivo estará disponível em breve!"); }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-indigo-900/20"
          >
            <MessageCircle size={18} />
            Fale com Suporte
          </a>
        </div>
      </div>

    </div>
  );
}
