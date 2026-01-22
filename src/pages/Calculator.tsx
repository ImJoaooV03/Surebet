import { useState, useEffect, useCallback } from "react";
import { 
  Calculator as CalcIcon, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertCircle,
  CheckCircle2,
  Copy,
  Settings2,
  History,
  Delete,
  Equal
} from "lucide-react";
import { formatCurrency, formatPercent } from "../lib/utils";
import { useToast } from "../contexts/ToastContext";

// --- Tipos & Interfaces ---
type CalculatorMode = 'arbitrage' | 'standard';
type MarketMode = '2' | '3';

interface OddInput {
  id: number;
  label: string;
  value: string;
  commission: string; // % de comissão da casa (ex: Betfair)
}

// --- Componente Principal ---
export function Calculator() {
  const [mode, setMode] = useState<CalculatorMode>('arbitrage');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header com Seletor de Modo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalcIcon className="w-6 h-6 text-emerald-500" />
            Central de Cálculos
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {mode === 'arbitrage' 
              ? 'Calcule stakes precisas para garantir seu lucro.' 
              : 'Realize operações matemáticas rápidas.'}
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setMode('arbitrage')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${
              mode === 'arbitrage' 
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <TrendingUp size={16} /> Arbitragem
          </button>
          <button
            onClick={() => setMode('standard')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${
              mode === 'standard' 
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <CalcIcon size={16} /> Padrão
          </button>
        </div>
      </div>

      {/* Renderização Condicional do Modo */}
      {mode === 'arbitrage' ? <ArbitrageCalculator /> : <StandardCalculator />}
    </div>
  );
}

// --- 1. CALCULADORA DE ARBITRAGEM (SUREBET) ---
function ArbitrageCalculator() {
  const { toast } = useToast();
  
  // Estados
  const [bankroll, setBankroll] = useState<string>("1000");
  const [marketMode, setMarketMode] = useState<MarketMode>('2');
  const [roundStakes, setRoundStakes] = useState(false); // Arredondar apostas?
  
  // Odds Iniciais
  const [odds, setOdds] = useState<OddInput[]>([
    { id: 1, label: "Casa / Over", value: "", commission: "0" },
    { id: 2, label: "Fora / Under", value: "", commission: "0" }
  ]);

  // Ajusta inputs ao mudar modo de mercado (2 ou 3 opções)
  useEffect(() => {
    if (marketMode === '2') {
      setOdds(prev => [
        { ...prev[0], label: "Casa / Over" },
        { ...prev[1] || { id: 2, value: "", commission: "0" }, label: "Fora / Under" }
      ].slice(0, 2));
    } else {
      setOdds(prev => [
        { ...prev[0], label: "Casa (1)" },
        { id: 2, label: "Empate (X)", value: prev.length > 2 ? prev[1].value : "", commission: "0" },
        { id: 3, label: "Fora (2)", value: prev.length === 2 ? prev[1].value : (prev[2]?.value || ""), commission: "0" }
      ]);
    }
  }, [marketMode]);

  const handleOddChange = (id: number, field: keyof OddInput, newValue: string) => {
    if (field === 'value' || field === 'commission') {
      if (!/^\d*\.?\d*$/.test(newValue)) return;
    }
    setOdds(prev => prev.map(o => o.id === id ? { ...o, [field]: newValue } : o));
  };

  const handleReset = () => {
    setBankroll("1000");
    setOdds(prev => prev.map(o => ({ ...o, value: "", commission: "0" })));
    toast("Calculadora resetada.", "info");
  };

  // --- Lógica de Cálculo ---
  const totalInvestment = parseFloat(bankroll) || 0;
  
  const validOdds = odds.map(o => ({
    ...o,
    numValue: parseFloat(o.value) || 0,
    numComm: parseFloat(o.commission) || 0
  }));

  const allOddsValid = validOdds.every(o => o.numValue > 1);

  // 1. Probabilidade Implícita Total (Soma dos Inversos)
  let sumInverse = 0;
  if (allOddsValid) {
    sumInverse = validOdds.reduce((acc, curr) => acc + (1 / curr.numValue), 0);
  }

  // 2. Métricas Gerais
  const isArb = sumInverse > 0 && sumInverse < 1;
  const roiPercent = sumInverse > 0 ? (1 / sumInverse) - 1 : 0;
  
  // 3. Cálculo de Stakes Individuais
  const results = validOdds.map(o => {
    if (!allOddsValid || sumInverse === 0) return { ...o, stake: 0, profit: 0, return: 0 };
    
    // Stake Teórica
    let stake = (totalInvestment * (1 / o.numValue)) / sumInverse;
    
    // Arredondamento (Opcional)
    if (roundStakes) {
      stake = Math.round(stake);
    }

    // Cálculo do Retorno Bruto
    const grossReturn = stake * o.numValue;
    
    // Cálculo do Lucro Líquido (descontando investimento e comissão sobre o lucro)
    const grossProfit = grossReturn - stake;
    const commissionCost = grossProfit > 0 ? grossProfit * (o.numComm / 100) : 0;
    const netReturn = grossReturn - commissionCost;

    return {
      ...o,
      stake,
      return: netReturn,
      netProfit: netReturn - totalInvestment // Lucro líquido real considerando o investimento total
    };
  });

  // Recalcula totais reais após arredondamento
  const totalStakedReal = results.reduce((acc, r) => acc + r.stake, 0);
  const minProfit = allOddsValid ? Math.min(...results.map(r => r.netProfit)) : 0;
  const maxProfit = allOddsValid ? Math.max(...results.map(r => r.netProfit)) : 0;

  const handleCopyResults = () => {
    if (!allOddsValid) return;
    const text = `Surebet Calc:\nInv: ${formatCurrency(totalInvestment)}\n` +
      results.map(r => `${r.label} (@${r.value}): ${formatCurrency(r.stake)}`).join('\n');
    navigator.clipboard.writeText(text);
    toast("Resultados copiados!", "success");
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      {/* Coluna de Inputs (4 colunas) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Configurações */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configuração</h3>
            <button onClick={handleReset} className="text-slate-500 hover:text-slate-300 transition-colors" title="Resetar">
              <RefreshCw size={14} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">Investimento Total</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                <input 
                  type="number" 
                  value={bankroll}
                  onChange={(e) => setBankroll(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-9 pr-4 text-white font-bold focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Mercado</label>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-700">
                  <button onClick={() => setMarketMode('2')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${marketMode === '2' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>2-Way</button>
                  <button onClick={() => setMarketMode('3')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${marketMode === '3' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>3-Way</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Arredondar</label>
                <button 
                  onClick={() => setRoundStakes(!roundStakes)}
                  className={`w-full py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    roundStakes 
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' 
                      : 'bg-slate-950 border-slate-700 text-slate-500'
                  }`}
                >
                  {roundStakes ? <CheckCircle2 size={14} /> : <Settings2 size={14} />}
                  {roundStakes ? 'Sim' : 'Não'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Inputs de Odds */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Odds & Comissões</h3>
          <div className="space-y-4">
            {odds.map((odd) => (
              <div key={odd.id} className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                <label className="text-xs font-bold text-emerald-500 mb-2 block">{odd.label}</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 mb-0.5 block">Odd</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={odd.value}
                      onChange={(e) => handleOddChange(odd.id, 'value', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white font-mono font-bold focus:border-indigo-500 outline-none"
                      placeholder="1.00"
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] text-slate-500 mb-0.5 block">Com. (%)</label>
                    <input 
                      type="number" 
                      value={odd.commission}
                      onChange={(e) => handleOddChange(odd.id, 'commission', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-2 text-slate-300 font-mono text-center focus:border-indigo-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coluna de Resultados (8 colunas) */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Card Principal de ROI */}
        <div className={`relative overflow-hidden rounded-xl p-8 border transition-all duration-500 ${
          allOddsValid 
            ? isArb 
              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)]' 
              : 'bg-red-950/20 border-red-500/30'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
            <div className="text-center md:text-left">
              <h2 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-2">Resultado Projetado</h2>
              <div className="flex items-baseline gap-3 justify-center md:justify-start">
                <span className={`text-5xl md:text-6xl font-black tracking-tighter ${
                  !allOddsValid ? 'text-slate-700' : isArb ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {allOddsValid ? formatPercent(roiPercent) : '0.00%'}
                </span>
                {allOddsValid && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                    isArb 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    ROI
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center md:text-right">
                <p className="text-slate-500 text-xs uppercase font-bold mb-1">Lucro Líquido</p>
                <p className={`text-3xl font-bold font-mono ${
                  !allOddsValid ? 'text-slate-700' : minProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {allOddsValid ? formatCurrency(minProfit) : 'R$ 0,00'}
                </p>
                {roundStakes && allOddsValid && minProfit !== maxProfit && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Var: {formatCurrency(minProfit)} a {formatCurrency(maxProfit)}
                  </p>
                )}
              </div>
              <div className={`hidden md:flex p-4 rounded-full border ${
                !allOddsValid ? 'bg-slate-800 border-slate-700 text-slate-600' :
                isArb ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {isArb ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Distribuição */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <DollarSign className="text-indigo-500" size={16} />
              Distribuição de Apostas
            </h3>
            {allOddsValid && (
              <button 
                onClick={handleCopyResults}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20"
              >
                <Copy size={14} /> Copiar
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-950/50">
                <tr>
                  <th className="px-6 py-3 font-bold">Resultado</th>
                  <th className="px-6 py-3 font-bold text-center">Odd</th>
                  <th className="px-6 py-3 font-bold text-right">Apostar (Stake)</th>
                  <th className="px-6 py-3 font-bold text-right">Retorno Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {results.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {res.label}
                      {res.numComm > 0 && <span className="ml-2 text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">-{res.numComm}%</span>}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-amber-400 font-bold">
                      {res.numValue > 0 ? res.numValue.toFixed(2) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-mono font-bold text-lg ${
                        allOddsValid ? 'text-emerald-400' : 'text-slate-600'
                      }`}>
                        {formatCurrency(res.stake)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-mono font-bold ${
                        !allOddsValid ? 'text-slate-600' : res.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {allOddsValid ? formatCurrency(res.return) : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {allOddsValid && (
                <tfoot className="bg-slate-950/50 border-t border-slate-800">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-right font-bold text-slate-400 uppercase text-xs">
                      Total Investido
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white font-mono text-lg">
                      {formatCurrency(totalStakedReal)}
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Feedback Visual */}
        {allOddsValid && !isArb && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertCircle size={20} />
            <p className="text-sm">
              <strong>Sem Arbitragem:</strong> A soma das probabilidades ({formatPercent(sumInverse)}) é maior que 100%. As casas têm vantagem matemática aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 2. CALCULADORA PADRÃO (MATEMÁTICA) ---
function StandardCalculator() {
  const [display, setDisplay] = useState("0");
  const [history, setHistory] = useState<string[]>([]);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [pendingOperator, setPendingOperator] = useState<string | null>(null);
  const [previousValue, setPreviousValue] = useState<string | null>(null);

  const clear = () => {
    setDisplay("0");
    setPendingOperator(null);
    setPreviousValue(null);
    setWaitingForOperand(false);
  };

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(display);
    } else if (pendingOperator) {
      const currentValue = previousValue ? parseFloat(previousValue) : 0;
      const newValue = calculate(currentValue, inputValue, pendingOperator);
      
      setDisplay(String(newValue));
      setPreviousValue(String(newValue));
      
      // Adiciona ao histórico
      if (nextOperator === "=") {
        setHistory(prev => [`${currentValue} ${pendingOperator} ${inputValue} = ${newValue}`, ...prev].slice(0, 10));
      }
    }

    setWaitingForOperand(true);
    setPendingOperator(nextOperator);
  };

  const calculate = (a: number, b: number, operator: string) => {
    switch (operator) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? 0 : a / b;
      default: return b;
    }
  };

  const handleBackspace = () => {
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
  };

  // Mapeamento de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;
      if (/\d/.test(key)) inputDigit(key);
      if (key === '.') inputDot();
      if (key === 'Enter' || key === '=') performOperation('=');
      if (key === 'Backspace') handleBackspace();
      if (key === 'Escape') clear();
      if (key === '+') performOperation('+');
      if (key === '-') performOperation('-');
      if (key === '*') performOperation('×');
      if (key === '/') performOperation('÷');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, pendingOperator, previousValue, waitingForOperand]);

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {/* Calculadora */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        {/* Display */}
        <div className="bg-slate-950 rounded-xl p-6 mb-6 text-right border border-slate-800 shadow-inner h-32 flex flex-col justify-end">
          <div className="text-slate-500 text-sm h-6">
            {previousValue} {pendingOperator}
          </div>
          <div className="text-4xl font-mono font-bold text-white tracking-widest overflow-x-auto scrollbar-hide">
            {display}
          </div>
        </div>

        {/* Grid de Botões */}
        <div className="grid grid-cols-4 gap-3">
          <CalcButton onClick={clear} variant="danger" className="col-span-2">AC</CalcButton>
          <CalcButton onClick={handleBackspace} variant="secondary"><Delete size={20} /></CalcButton>
          <CalcButton onClick={() => performOperation("÷")} variant="operator">÷</CalcButton>

          <CalcButton onClick={() => inputDigit("7")}>7</CalcButton>
          <CalcButton onClick={() => inputDigit("8")}>8</CalcButton>
          <CalcButton onClick={() => inputDigit("9")}>9</CalcButton>
          <CalcButton onClick={() => performOperation("×")} variant="operator">×</CalcButton>

          <CalcButton onClick={() => inputDigit("4")}>4</CalcButton>
          <CalcButton onClick={() => inputDigit("5")}>5</CalcButton>
          <CalcButton onClick={() => inputDigit("6")}>6</CalcButton>
          <CalcButton onClick={() => performOperation("-")} variant="operator">-</CalcButton>

          <CalcButton onClick={() => inputDigit("1")}>1</CalcButton>
          <CalcButton onClick={() => inputDigit("2")}>2</CalcButton>
          <CalcButton onClick={() => inputDigit("3")}>3</CalcButton>
          <CalcButton onClick={() => performOperation("+")} variant="operator">+</CalcButton>

          <CalcButton onClick={() => inputDigit("0")} className="col-span-2">0</CalcButton>
          <CalcButton onClick={inputDot}>.</CalcButton>
          <CalcButton onClick={() => performOperation("=")} variant="primary">=</CalcButton>
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-full max-h-[500px] flex flex-col">
        <div className="flex items-center gap-2 mb-4 text-slate-400 font-bold uppercase text-xs tracking-wider border-b border-slate-800 pb-2">
          <History size={14} /> Histórico Recente
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {history.length === 0 ? (
            <div className="text-center text-slate-600 mt-10 text-sm">
              Nenhuma operação realizada.
            </div>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className="text-right p-3 bg-slate-950 rounded-lg border border-slate-800/50 text-slate-300 font-mono text-sm hover:border-slate-700 transition-colors">
                {item}
              </div>
            ))
          )}
        </div>
        {history.length > 0 && (
          <button 
            onClick={() => setHistory([])}
            className="mt-4 w-full py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            Limpar Histórico
          </button>
        )}
      </div>
    </div>
  );
}

// Botão Reutilizável
function CalcButton({ children, onClick, variant = "default", className = "" }: any) {
  const styles = {
    default: "bg-slate-800 text-slate-200 hover:bg-slate-700 active:bg-slate-600",
    primary: "bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700",
    operator: "bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700",
    secondary: "bg-slate-700 text-slate-300 hover:bg-slate-600",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
  };

  return (
    <button
      onClick={onClick}
      className={`h-14 rounded-xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-black/20 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
