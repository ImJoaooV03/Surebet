import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "../../lib/utils";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder = "Selecione...", label }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const removeOption = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== value));
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>}
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full bg-slate-950 border rounded-lg min-h-[42px] px-3 py-2 cursor-pointer flex items-center justify-between transition-all",
            isOpen ? "border-emerald-500 ring-1 ring-emerald-500/20" : "border-slate-800 hover:border-slate-700"
          )}
        >
          <div className="flex flex-wrap gap-1.5">
            {selected.length === 0 ? (
              <span className="text-slate-500 text-sm">{placeholder}</span>
            ) : (
              selected.map(value => {
                const option = options.find(o => o.value === value);
                return (
                  <span key={value} className="bg-slate-800 text-slate-200 text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1 border border-slate-700">
                    {option?.label || value}
                    <X 
                      size={12} 
                      className="text-slate-500 hover:text-red-400 cursor-pointer" 
                      onClick={(e) => removeOption(e, value)}
                    />
                  </span>
                );
              })
            )}
          </div>
          <ChevronDown size={16} className={cn("text-slate-500 transition-transform", isOpen && "rotate-180")} />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            {options.map(option => {
              const isSelected = selected.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className={cn(
                    "px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between hover:bg-slate-800 transition-colors",
                    isSelected ? "text-emerald-400 font-medium bg-emerald-500/5" : "text-slate-300"
                  )}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check size={14} className="text-emerald-500" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
