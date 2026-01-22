import { useState, useMemo, useRef, useEffect } from "react";
import { Filter, Search, Check, X, ChevronDown, ChevronUp, Circle } from "lucide-react";
import { cn } from "../../lib/utils";

interface BookmakerFilterProps {
  allBookmakers: string[];
  selectedBookmakers: string[];
  onChange: (selected: string[]) => void;
}

export function BookmakerFilter({ allBookmakers, selectedBookmakers, onChange }: BookmakerFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtra a lista de casas baseada na busca interna do dropdown
  const displayedBookmakers = useMemo(() => {
    return allBookmakers
      .filter(bookie => bookie.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort();
  }, [allBookmakers, searchTerm]);

  const handleToggle = (bookie: string) => {
    if (selectedBookmakers.includes(bookie)) {
      onChange(selectedBookmakers.filter(b => b !== bookie));
    } else {
      onChange([...selectedBookmakers, bookie]);
    }
  };

  const handleSelectAll = () => onChange(allBookmakers);
  const handleDeselectAll = () => onChange([]);

  const activeCount = selectedBookmakers.length;
  const totalCount = allBookmakers.length;

  return (
    <div className="relative z-20" ref={containerRef}>
      {/* Trigger Button (Estilo da Imagem) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all border min-w-[240px]",
          isOpen
            ? "bg-[#1e293b] border-indigo-500 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.5)]"
            : "bg-[#0f172a] border-slate-800 text-slate-300 hover:border-slate-700"
        )}
      >
        <div className="flex items-center gap-2">
          <Filter size={16} className={activeCount > 0 ? "text-indigo-400" : "text-slate-500"} />
          <span>Casas: <span className="text-indigo-400">{activeCount} Selecionadas</span></span>
        </div>
        {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>

      {/* Dropdown Menu (Estilo da Imagem) */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col overflow-hidden ring-1 ring-black/50">
          
          {/* Header */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">FILTRAR CASAS</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 font-mono font-bold">
                {activeCount} / {totalCount}
              </span>
            </div>
            
            {/* Search Input */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Buscar casa de aposta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                autoFocus
              />
            </div>
            
            {/* Action Buttons (Grid 2 colunas) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSelectAll}
                className="py-2 px-2 text-[10px] font-bold uppercase bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Check size={12} /> Marcar Todas
              </button>
              <button
                onClick={handleDeselectAll}
                className="py-2 px-2 text-[10px] font-bold uppercase bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <X size={12} /> Desmarcar
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-800 w-full"></div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto p-2 space-y-1 scrollbar-hide bg-[#0f172a]">
            {displayedBookmakers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <Search className="w-8 h-8 opacity-20" />
                Nenhuma casa encontrada.
              </div>
            ) : (
              displayedBookmakers.map((bookie) => {
                const isSelected = selectedBookmakers.includes(bookie);
                return (
                  <button
                    key={bookie}
                    onClick={() => handleToggle(bookie)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all group text-left hover:bg-[#1e293b]"
                  >
                    <span className={cn("text-sm font-medium transition-colors", isSelected ? "text-white" : "text-slate-400")}>
                      {bookie}
                    </span>
                    
                    {/* Circle Indicator (Right side like image) */}
                    <div className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0",
                      isSelected 
                        ? "border-indigo-500 bg-indigo-500/20 text-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.3)]" 
                        : "border-slate-700 bg-transparent group-hover:border-slate-600"
                    )}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3 border-t border-slate-800 bg-[#1e293b]/50 text-center">
            <p className="text-[10px] text-slate-500 leading-tight">
              Exibindo apenas oportunidades onde <strong>todas</strong> as casas envolvidas estão marcadas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
