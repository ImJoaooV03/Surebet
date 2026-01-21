import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useEffect } from "react";
import { cn } from "../../lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const styles = {
  success: "bg-slate-900 border-emerald-500/20 text-emerald-400",
  error: "bg-slate-900 border-red-500/20 text-red-400",
  info: "bg-slate-900 border-blue-500/20 text-blue-400",
};

export function Toast({ id, type, message, duration = 3000, onClose }: ToastProps) {
  const Icon = icons[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg shadow-black/50 min-w-[300px] animate-in slide-in-from-right-full transition-all",
      styles[type]
    )}>
      <Icon className="w-5 h-5 shrink-0" />
      <p className="text-sm font-medium text-slate-200 flex-1">{message}</p>
      <button 
        onClick={() => onClose(id)}
        className="text-slate-500 hover:text-slate-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
