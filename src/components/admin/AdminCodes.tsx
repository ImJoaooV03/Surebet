import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Copy, Plus, Loader2, Ticket, Check, Filter, XCircle, Calendar, User, Mail, Clock } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { format } from "date-fns";
import { Database } from "../../types/supabase";

type BillingCycle = 'monthly' | 'quarterly' | 'yearly';
type ActivationCode = Database['public']['Tables']['activation_codes']['Row'];

export function AdminCodes() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Form States
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'premium'>('pro');
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly');
  
  const [filter, setFilter] = useState<'all' | 'available' | 'used'>('all');

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('activation_codes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
      toast("Erro ao carregar códigos.", "error");
    } else if (data) {
      setCodes(data);
    }
    setLoading(false);
  };

  const generateCode = async () => {
    setGenerating(true);
    // Formato: PLANO-CICLO-RANDOM (ex: PRO-M-X7Z9)
    const cyclePrefix = selectedCycle === 'monthly' ? 'M' : selectedCycle === 'quarterly' ? 'Q' : 'Y';
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newCode = `${selectedPlan.toUpperCase()}-${cyclePrefix}-${randomPart}`;
    
    try {
      const { error } = await supabase.from('activation_codes').insert({
        code: newCode,
        plan_type: selectedPlan,
        billing_cycle: selectedCycle,
        is_used: false
      });

      if (error) throw error;
      
      toast("Código gerado com sucesso!", "success");
      fetchCodes();
    } catch (err) {
      console.error(err);
      toast("Erro ao gerar código.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast("Copiado para a área de transferência!", "info");
  };

  const filteredCodes = codes.filter(code => {
    if (filter === 'available') return !code.is_used;
    if (filter === 'used') return code.is_used;
    return true;
  });

  const getCycleLabel = (cycle: string) => {
    switch(cycle) {
      case 'quarterly': return 'Trimestral';
      case 'yearly': return 'Anual';
      default: return 'Mensal';
    }
  };

  const getCycleColor = (cycle: string) => {
    switch(cycle) {
      case 'quarterly': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'yearly': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* --- Gerador de Códigos --- */}
      <div className="bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Ticket className="text-indigo-500" /> Gerador de Códigos
            </h2>
            <p className="text-sm text-slate-400 mt-1">Crie chaves de acesso para planos VIP ou promoções.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Seletor de Plano */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nível do Plano</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPlan('pro')}
                className={`flex-1 py-3 px-4 rounded-lg border text-sm font-bold transition-all ${
                  selectedPlan === 'pro'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                PRO
              </button>
              <button
                onClick={() => setSelectedPlan('premium')}
                className={`flex-1 py-3 px-4 rounded-lg border text-sm font-bold transition-all ${
                  selectedPlan === 'premium'
                    ? 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                PREMIUM
              </button>
            </div>
          </div>

          {/* Seletor de Periodicidade */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ciclo de Cobrança</label>
            <div className="relative">
              <select 
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value as BillingCycle)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white appearance-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all cursor-pointer"
              >
                <option value="monthly">Mensal (30 dias)</option>
                <option value="quarterly">Trimestral (90 dias)</option>
                <option value="yearly">Anual (365 dias)</option>
              </select>
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Botão de Ação */}
          <button 
            onClick={generateCode}
            disabled={generating}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-indigo-900/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Gerar Código
          </button>
        </div>
      </div>

      {/* --- Tabela de Controle --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
              <Filter size={16} />
            </div>
            <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'available', label: 'Disponíveis' },
                { id: 'used', label: 'Utilizados' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilter(opt.id as any)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    filter === opt.id 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs font-mono text-slate-500 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
            Total: <span className="text-white font-bold">{filteredCodes.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Código</th>
                <th className="px-6 py-4 font-bold tracking-wider">Detalhes do Plano</th>
                <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold tracking-wider">Utilizado Por</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></td></tr>
              ) : filteredCodes.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
                  <Ticket className="w-8 h-8 opacity-20" />
                  Nenhum código encontrado com este filtro.
                </td></tr>
              ) : (
                filteredCodes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                    {/* Coluna Código */}
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-slate-200 text-base tracking-wider flex items-center gap-2">
                        {item.code}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Criado em {format(new Date(item.created_at), "dd/MM/yy HH:mm")}
                      </div>
                    </td>

                    {/* Coluna Plano */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                          item.plan_type === 'premium' 
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {item.plan_type}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getCycleColor(item.billing_cycle)}`}>
                          {getCycleLabel(item.billing_cycle)}
                        </span>
                      </div>
                    </td>

                    {/* Coluna Status */}
                    <td className="px-6 py-4">
                      {item.is_used ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          <XCircle className="w-3.5 h-3.5" /> Utilizado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                          <Check className="w-3.5 h-3.5" /> Disponível
                        </span>
                      )}
                    </td>

                    {/* Coluna Utilizado Por (Detalhes do Usuário) */}
                    <td className="px-6 py-4">
                      {item.is_used ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-slate-200 font-medium">
                            <User className="w-3.5 h-3.5 text-indigo-400" />
                            {item.redeemed_by_name || 'Usuário'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Mail className="w-3 h-3" />
                            {item.redeemed_by_email || 'Email oculto'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 pt-1 border-t border-slate-800/50">
                            <Clock className="w-3 h-3" />
                            Ativado em {item.used_at ? format(new Date(item.used_at), "dd/MM/yy 'às' HH:mm") : '-'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs italic">--</span>
                      )}
                    </td>

                    {/* Coluna Ação */}
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => copyCode(item.code)}
                        className="p-2 bg-slate-950 hover:bg-indigo-600 hover:text-white rounded-lg text-slate-400 transition-all border border-slate-800 hover:border-indigo-500 group-hover:shadow-lg"
                        title="Copiar Código"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
