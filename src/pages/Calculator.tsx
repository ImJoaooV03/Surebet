import { useState } from "react";

export function Calculator() {
  const [stake, setStake] = useState(1000);
  const [odd1, setOdd1] = useState(2.10);
  const [odd2, setOdd2] = useState(2.05);

  const inv1 = 1/odd1;
  const inv2 = 1/odd2;
  const sumInv = inv1 + inv2;
  const isArb = sumInv < 1;
  const roi = (1/sumInv) - 1;
  
  const stake1 = (stake * inv1) / sumInv;
  const stake2 = (stake * inv2) / sumInv;
  const profit = (stake * roi);

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Calculadora Rápida</h1>
      
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
        <div>
          <label className="text-slate-400 text-sm">Investimento Total</label>
          <input type="number" value={stake} onChange={e => setStake(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-sm">Odd Casa A</label>
            <input type="number" step="0.01" value={odd1} onChange={e => setOdd1(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
          </div>
          <div>
            <label className="text-slate-400 text-sm">Odd Casa B</label>
            <input type="number" step="0.01" value={odd2} onChange={e => setOdd2(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
          </div>
        </div>

        <div className={`p-4 rounded border ${isArb ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
          <div className="flex justify-between mb-2">
            <span className="text-slate-300">ROI:</span>
            <span className={`font-bold ${isArb ? 'text-emerald-400' : 'text-red-400'}`}>{(roi * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between mb-4">
            <span className="text-slate-300">Lucro:</span>
            <span className={`font-bold ${isArb ? 'text-emerald-400' : 'text-red-400'}`}>R$ {profit.toFixed(2)}</span>
          </div>
          
          <div className="space-y-2 pt-2 border-t border-slate-700/50">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Apostar na Casa A:</span>
              <span className="text-white font-mono">R$ {stake1.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Apostar na Casa B:</span>
              <span className="text-white font-mono">R$ {stake2.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
