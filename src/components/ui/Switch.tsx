import { cn } from "../../lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onChange, disabled, className }: SwitchProps) {
  return (
    <button 
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
        checked ? 'bg-emerald-500' : 'bg-slate-700',
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className={cn(
        "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm",
        checked ? 'translate-x-5' : 'translate-x-0'
      )} />
    </button>
  );
}
