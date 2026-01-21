import { useState, useEffect } from "react";
import { Surebet } from "../../types";
import { formatCurrency, formatPercent } from "../../lib/utils";
import { calculateArb } from "../../lib/calculator";
import { Calculator, ExternalLink, Clock, Copy, CheckCircle2, Calendar, TrendingUp } from "lucide-react";
import { Badge } from "../ui/Badge";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SurebetCardProps {
  surebet: Surebet;
  bankroll: number;
}

export function SurebetCard({ surebet, bankroll }: SurebetCardProps) {
  // Estado local para a calculadora integrada
  const [investment, setInvestment] = useState(bankroll * 0.1); // Default 10% stake
  const [copied, setCopied] = useState(false);

  // Recalcula sempre que o investimento mudar
  const calculation = calculateArb(surebet.legs, investment);

  // Efeito para atualizar o investimento padrão se a banca mudar nas props
  useEffect(() => {
    setInvestment(bankroll * 0.1);
  }, [bankroll]);

  const handleCopy = () => {
    const text = `Surebet: ${surebet.homeTeam} vs ${surebet.awayTeam}\n` +
      `ROI: ${formatPercent(surebet.roi)}\n` +
      calculation.legs.map(l => `${l.outcome} @ ${l.odd} (${l.bookmaker}): ${formatCurrency(l.suggestedStake)}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-all duration-300 shadow-lg shadow-black/20 group flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900/80 to-slate-900/40 flex items-start justify-between relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="flex flex-col items-center justify-center w-16 h-16 bg-slate-900 rounded-xl border border-slate-800 shadow-inner">
            <span className="text-emerald-400 font-bold text-xl tracking-tight">{formatPercent(surebet.roi)}</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Lucro</span>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant={surebet.isLive ? "danger" : "success"} className="shadow-sm">
                {surebet.isLive ? "AO VIVO" : "PRÉ-JOGO"}
              </Badge>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-l border-slate-700 pl-2">
                {surebet.sport} • {surebet.league}
              </span>
            </div>
            
            <h3 className="text-slate-100 font-bold text-lg leading-tight group-hover:text-emerald-400 transition-colors">
              {surebet.homeTeam} <span className="text-slate-600 font-normal mx-1">vs</span> {surebet.awayTeam}
            </h3>

            <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
               <div className="flex items-center gap-1.5">
                 <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                 <span className="font-medium text-slate-300">
                   {format(surebet.startTime, "dd/MM • HH:mm", { locale: ptBR })}
                 </span>
               </div>
               <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
                 <Clock className="w-3.5 h-3.5 text-slate-500" />
                 <span className="text-xs">{surebet.market}</span>
               </div>
            </div>
          </div>
        </div>
        
        <div className="text-right hidden sm:block">
           <div className="text-emerald-400 font-mono font-bold text-xl flex items-center justify-end gap-1">
             <TrendingUp className="w-4 h-4 opacity-50" />
             +{formatCurrency(calculation.profit)}
           </div>
           <p className="text-[10px] text-slate-500 uppercase font-medium tracking-wide">Lucro Garantido</p>
        </div>
      </div>

      {/* Legs Table (Calculadora Visual) */}
      <div className="p-4 grid gap-3 flex-1 bg-slate-900/20">
        {calculation.legs.map((leg, idx) => (
          <div key={idx} className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors group/leg">
            <div className="flex items-center gap-3 w-[40%]">
              <div className={`w-1.5 h-8 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)] ${
                idx === 0 ? 'bg-blue-500 shadow-blue-500/20' : 
                idx === 1 ? 'bg-purple-500 shadow-purple-500/20' : 
                'bg-orange-500 shadow-orange-500/20'
              }`}></div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-200 truncate" title={leg.outcome}>{leg.outcome}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  {leg.bookmaker}
                </p>
              </div>
            </div>
            
            <div className="text-center w-[20%]">
              <span className="text-slate-300 font-bold font-mono text-lg group-hover/leg:text-white transition-colors">
                {leg.odd.toFixed(2)}
              </span>
            </div>

            <div className="w-[35%] flex justify-end">
              <div className="flex flex-col items-end">
                <span className="text-sm font-mono text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                  {formatCurrency(leg.suggestedStake)}
                </span>
                <span className="text-[10px] text-slate-600 mt-0.5">Apostar</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Calculator Footer */}
      <div className="bg-slate-950 p-4 border-t border-slate-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
            <div className="px-2 text-slate-500">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap hidden sm:inline">Investimento:</span>
              <div className="relative flex-1">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">R$</span>
                <input 
                  type="number" 
                  value={investment}
                  onChange={(e) => setInvestment(Number(e.target.value))}
                  className="w-full bg-transparent border-none p-0 pl-5 text-sm font-bold text-slate-200 focus:ring-0 placeholder:text-slate-700"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 rounded-lg text-xs font-bold transition-all border border-slate-700 active:scale-95"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>
    </div>
  );
}
