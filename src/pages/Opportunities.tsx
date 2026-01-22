import { useEffect, useState, useMemo } from 'react';
import { apiRequest } from '../lib/apiClient';
import { Loader2, RefreshCw, AlertTriangle, FilterX } from 'lucide-react';
import { BookmakerFilter } from '../components/opportunities/BookmakerFilter';
import { Badge } from '../components/ui/Badge';

export default function Opportunities() {
  const [opps, setOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bucket, setBucket] = useState('LIVE');
  
  // Estado para casas selecionadas
  const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Carrega preferências do LocalStorage APENAS na montagem inicial
  useEffect(() => {
    const saved = localStorage.getItem('dualite_filter_bookmakers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedBookmakers(parsed);
          setIsInitialized(true); // Marca como inicializado se já tinha dados salvos
        }
      } catch (e) {
        console.error("Erro ao ler filtros salvos", e);
      }
    }
  }, []);

  // Salva preferências sempre que mudar (mas apenas após inicialização para não salvar array vazio prematuramente)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('dualite_filter_bookmakers', JSON.stringify(selectedBookmakers));
    }
  }, [selectedBookmakers, isInitialized]);

  // Helper function para extrair casas únicas
  function extractUniqueBookmakers(data: any[]) {
    const books = new Set<string>();
    data.forEach(arb => {
      if (arb.legs_json) {
        arb.legs_json.forEach((leg: any) => books.add(leg.bookmaker));
      }
    });
    return Array.from(books).sort();
  }

  const fetchOpps = () => {
    setLoading(true);
    apiRequest(`/opportunities?bucket=${bucket}&limit=50`)
      .then((data: any) => {
        setOpps(data);
        
        // --- LÓGICA DE SELEÇÃO AUTOMÁTICA (TODOS MARCADOS) ---
        const allBooks = extractUniqueBookmakers(data);
        
        if (!isInitialized) {
          setSelectedBookmakers(allBooks);
          setIsInitialized(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOpps();
  }, [bucket]);

  // Extrai lista única de casas de todas as oportunidades carregadas
  const allAvailableBookmakers = useMemo(() => {
    return extractUniqueBookmakers(opps);
  }, [opps]);

  // Lógica de Filtragem Rigorosa
  const filteredOpps = useMemo(() => {
    if (selectedBookmakers.length === 0) return []; 

    return opps.filter(arb => {
      const involvedBookies = arb.legs_json.map((l: any) => l.bookmaker);
      return involvedBookies.every((b: string) => selectedBookmakers.includes(b));
    });
  }, [opps, selectedBookmakers]);

  const tabs = [
    { id: 'LIVE', label: 'AO VIVO 🔥' },
    { id: 'PRE_HOT', label: '0h - 2h' },
    { id: 'PRE_MID', label: '2h - 12h' },
    { id: 'PRE_LONG', label: '12h - 24h' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Oportunidades</h1>
          {/* Badge de Contagem */}
          {!loading && (
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-sm font-bold shadow-sm">
              {filteredOpps.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Componente de Filtro de Casas */}
          <BookmakerFilter 
            allBookmakers={allAvailableBookmakers}
            selectedBookmakers={selectedBookmakers}
            onChange={setSelectedBookmakers}
          />

          <button onClick={fetchOpps} className="p-2.5 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors shadow-sm">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-800 pb-1 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setBucket(tab.id)}
            className={`px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors ${
              bucket === tab.id 
                ? 'text-emerald-400 border-b-2 border-emerald-500' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div>
      ) : filteredOpps.length > 0 ? (
        <div className="grid gap-4">
          {filteredOpps.map((arb) => (
            <div key={arb.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-emerald-500/30 transition-colors animate-in fade-in slide-in-from-bottom-2 shadow-lg shadow-black/20">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {arb.events?.home_name} <span className="text-slate-500 text-sm">vs</span> {arb.events?.away_name}
                  </h3>
                  <p className="text-xs text-slate-500 uppercase font-bold mt-1">
                    {arb.sport_key} • {arb.market_key} {arb.line_value ? `(${arb.line_value})` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-emerald-400">{(arb.roi * 100).toFixed(2)}%</span>
                  <p className="text-[10px] text-slate-500 uppercase">Lucro</p>
                </div>
              </div>
              
              <div className="bg-slate-950 rounded p-3 grid gap-2">
                {arb.legs_json.map((leg: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex gap-2 items-center">
                      <span className={`w-1 h-4 rounded-full ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-purple-500' : 'bg-orange-500'}`}></span>
                      <span className="text-slate-300 font-medium">{leg.outcome}</span>
                      <span className="text-xs text-slate-500">({leg.bookmaker})</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400">{leg.odd.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-4 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
          {opps.length > 0 ? (
            <>
              <FilterX className="w-12 h-12 opacity-30" />
              <div>
                <p className="text-lg font-medium text-slate-400">Nenhuma oportunidade visível.</p>
                <p className="text-sm text-slate-600 mt-1 max-w-md">
                  Existem {opps.length} surebets neste período, mas elas envolvem casas de aposta que você desmarcou no filtro.
                </p>
              </div>
              <button 
                onClick={() => setSelectedBookmakers(allAvailableBookmakers)}
                className="px-4 py-2 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 rounded-lg text-sm font-bold transition-colors border border-indigo-500/20"
              >
                Limpar Filtros (Mostrar Tudo)
              </button>
            </>
          ) : (
            <>
              <AlertTriangle className="w-12 h-12 opacity-30" />
              <p>Nenhuma oportunidade encontrada neste bucket.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
