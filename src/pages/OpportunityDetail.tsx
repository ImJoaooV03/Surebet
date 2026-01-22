import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { transformArbData, formatCurrency, formatPercent } from "../lib/utils";
import { calculateArb } from "../lib/calculator";
import { Loader2, ArrowLeft, ExternalLink, Calculator, Copy, Check } from "lucide-react";
import { Badge } from "../components/ui/Badge";

export function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [arb, setArb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bankroll, setBankroll] = useState(1000);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchArb() {
      const { data } = await supabase
        .from('opportunities')
        .select(`*, events (home_name, away_name, start_time_utc, league_id)`)
        .eq('id', id)
        .single();
      
      if (data) {
        setArb(transformArbData(data));
      }
      setLoading(false);
    }
    fetchArb();
  }, [id]);

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;
  if (!arb) return <div className="p-10 text-center text-slate-500">Oportunidade não encontrada ou expirada.</div>;

  const calculation = calculateArb(arb.legs, bankroll);

  const handleCopy = () => {
    const text = calculation.legs.map((l: any) => 
      `${l.bookmaker}: Apostar ${formatCurrency(l.suggestedStake)} em "${l.outcome}" (@${l.odd})`
    ).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant={arb.isLive ? 'danger' : 'success'}>{arb.isLive ? 'AO VIVO' : 'PRÉ-JOGO'}</Badge>
              <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">{arb.sport} • {arb.league}</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">{arb.homeTeam} <span className="text-slate-600">vs</span> {arb.awayTeam}</h1>
            <p className="text-slate-400">{arb.market}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-emerald-400 tracking-tight">{formatPercent(arb.roi)}</div>
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Lucro Garantido</div>
          </div>
        </div>
      </div>

      {/* Calculator & Legs */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Calculator Input */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 text-slate-200 font-bold mb-4">
              <Calculator className="w-5 h-5 text-emerald-500" />
              Calculadora
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 font-bold uppercase">Investimento Total</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                <input 
                  type="number" 
                  value={bankroll}
                  onChange={e => setBankroll(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-8 pr-4 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Lucro Estimado:</span>
                <span className="text-emerald-400 font-bold">+{formatCurrency(calculation.profit)}</span>
              </div>
              <button 
                onClick={handleCopy}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors border border-slate-700"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copiado!" : "Copiar Stakes"}
              </button>
            </div>
          </div>
        </div>

        {/* Legs List */}
        <div className="md:col-span-2 space-y-3">
          {calculation.legs.map((leg: any, idx: number) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between group hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-1 h-12 rounded-full ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-purple-500' : 'bg-orange-500'}`}></div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase mb-1">{leg.bookmaker}</div>
                  <div className="text-lg font-bold text-white">{leg.outcome}</div>
                </div>
              </div>
              
              <div className="text-right flex items-center gap-6">
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase mb-1">Odd</div>
                  <div className="text-xl font-mono font-bold text-amber-400">{leg.odd.toFixed(2)}</div>
                </div>
                <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 min-w-[120px]">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Apostar</div>
                  <div className="text-lg font-mono font-bold text-emerald-400">{formatCurrency(leg.suggestedStake)}</div>
                </div>
                <a 
                  href="#" 
                  onClick={e => e.preventDefault()} 
                  className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Ir para a casa (Link direto em breve)"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
