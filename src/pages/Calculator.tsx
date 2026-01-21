import { useState, useEffect } from "react";
import { Calculator as CalcIcon, Plus, Trash2, RefreshCw, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { calculateArb } from "../lib/calculator";
import { formatCurrency, formatPercent } from "../lib/utils";
import { Badge } from "../components/ui/Badge";

interface ManualLeg {
  id: string;
  odd: string; // String to handle empty inputs better
  bookmaker: string;
}

export function Calculator() {
  const [totalStake, setTotalStake] = useState<number>(1000);
  const [legs, setLegs] = useState<ManualLeg[]>([
    { id: '1', odd: '2.10', bookmaker: 'Casa A' },
    { id: '2', odd: '2.05', bookmaker: 'Casa B' }
  ]);

  // Derived state for calculation results
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // Convert manual legs to format expected by calculator
    const validLegs = legs
      .map(l => ({
        outcome: l.id,
        bookmaker: l.bookmaker,
        odd: parseFloat(l.odd) || 0
      }))
      .filter(l => l.odd > 1); // Only calculate if odds are valid (> 1)

    if (validLegs.length >= 2) {
      const calc = calculateArb(validLegs, totalStake);
      setResult(calc);
    } else {
      setResult(null);
    }
  }, [totalStake, legs]);

  const updateLeg = (id: string, field: keyof ManualLeg, value: string) => {
    setLegs(prev => prev.map(leg => 
      leg.id === id ? { ...leg, [field]: value } : leg
    ));
  };

  const addLeg = () => {
    if (legs.length >= 3) return; // Limit to 3 for now (1x2)
    setLegs(prev => [...prev, { id: Math.random().toString(), odd: '', bookmaker: `Casa ${String.fromCharCode(67 + prev.length)}` }]);
  };

  const removeLeg = (id: string) => {
    if (legs.length <= 2) return; // Minimum 2 legs
    setLegs(prev => prev.filter(l => l.id !== id));
  };

  const reset = () => {
    setTotalStake(1000);
    setLegs([
      { id: '1', odd: '', bookmaker: 'Casa A' },
      { id: '2', odd: '', bookmaker: 'Casa B' }
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <CalcIcon className="w-6 h-6 text-emerald-500" />
          Calculadora Manual
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Simule oportunidades e calcule stakes rapidamente.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* INPUTS SECTION */}
        <div className="space-y-6">
          {/* Stake Input */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <label className="text-sm font-medium text-slate-400 mb-2 block">Investimento Total (R$)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="number" 
                value={totalStake}
                onChange={(e) => setTotalStake(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-lg font-bold text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Odds Inputs */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-300">Odds das Casas</h3>
              <button 
                onClick={reset}
                className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Limpar
              </button>
            </div>

            {legs.map((leg, index) => (
              <div key={leg.id} className="flex items-center gap-3 animate-in slide-in-from-left-2 duration-300">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-700">
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <input 
                    type="text" 
                    placeholder="Nome da Casa (Opcional)"
                    value={leg.bookmaker}
                    onChange={(e) => updateLeg(leg.id, 'bookmaker', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-slate-600 focus:outline-none mb-1"
                  />
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="Odd (ex: 2.10)"
                      value={leg.odd}
                      onChange={(e) => updateLeg(leg.id, 'odd', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-base font-mono font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {legs.length > 2 && (
                  <button 
                    onClick={() => removeLeg(leg.id)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {legs.length < 3 && (
              <button 
                onClick={addLeg}
                className="w-full py-3 border border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2 text-sm font-medium mt-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Resultado (Empate)
              </button>
            )}
          </div>
        </div>

        {/* RESULTS SECTION */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Summary Card */}
              <div className={`rounded-xl p-6 border ${
                result.isArb 
                  ? "bg-emerald-500/10 border-emerald-500/20" 
                  : "bg-amber-500/10 border-amber-500/20"
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {result.isArb ? (
                        <Badge variant="success">SUREBET ENCONTRADA</Badge>
                      ) : (
                        <Badge variant="warning">SEM LUCRO GARANTIDO</Badge>
                      )}
                    </div>
                    <p className={`text-sm ${result.isArb ? "text-emerald-400" : "text-amber-400"}`}>
                      {result.isArb 
                        ? "As odds informadas garantem lucro matemático." 
                        : "A soma das probabilidades é maior que 100%."}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${result.isArb ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {result.isArb ? <TrendingUp className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-bold opacity-70 mb-1">ROI (Retorno)</p>
                    <p className="text-3xl font-bold">{formatPercent(result.roiPercent)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider font-bold opacity-70 mb-1">Lucro / Prejuízo</p>
                    <p className={`text-3xl font-mono font-bold ${result.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {result.profit >= 0 ? "+" : ""}{formatCurrency(result.profit)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stakes Breakdown */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                  <h3 className="font-semibold text-slate-200">Distribuição de Apostas</h3>
                </div>
                <div className="divide-y divide-slate-800">
                  {result.legs.map((leg: any, idx: number) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-900/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{leg.bookmaker || `Casa ${idx + 1}`}</p>
                          <p className="text-xs text-slate-500">Odd: <span className="text-slate-300 font-bold">{leg.odd.toFixed(2)}</span></p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                          {formatCurrency(leg.suggestedStake)}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">Apostar Aqui</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Apostado:</span>
                  <span className="font-bold text-slate-200">{formatCurrency(totalStake)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-800 rounded-xl text-slate-600">
              <CalcIcon className="w-12 h-12 mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-slate-500">Aguardando Dados</h3>
              <p className="text-sm mt-2 max-w-xs">
                Preencha o valor do investimento e as odds de pelo menos 2 casas para ver o cálculo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
