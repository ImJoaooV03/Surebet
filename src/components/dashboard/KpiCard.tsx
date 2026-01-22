import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'indigo' | 'emerald' | 'blue' | 'amber' | 'rose';
}

export default function KpiCard({ title, value, icon: Icon, trend, trendUp = true, color = 'indigo' }: KpiCardProps) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-slate-700 transition-all duration-300 group relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${colors[color].split(' ')[0]} blur-3xl opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`}></div>

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg border ${colors[color]} transition-colors`}>
          <Icon size={20} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-2 text-xs font-medium relative z-10">
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${
            trendUp 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </span>
          <span className="text-slate-500">vs período anterior</span>
        </div>
      )}
    </div>
  );
}
