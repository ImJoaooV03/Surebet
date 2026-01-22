import { LucideIcon, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  onAction?: () => void; // Adicionado suporte para função de callback
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionLink, onAction }: EmptyStateProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onAction) {
      onAction();
    } else if (actionLink) {
      navigate(actionLink);
    }
  };

  return (
    <div className="col-span-full py-16 px-6 text-center bg-slate-950/50 rounded-xl border border-slate-800 border-dashed flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center shadow-inner border border-slate-800">
        <Icon className="w-10 h-10 text-slate-600" />
      </div>
      
      <div className="max-w-md space-y-2">
        <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && (
        <button 
          onClick={handleClick}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
        >
          {actionLink === '/settings' && <Settings className="w-4 h-4" />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
