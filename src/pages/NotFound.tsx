import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-4">
      <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
      </div>
      <h1 className="text-4xl font-bold text-white mb-2">404</h1>
      <p className="text-slate-400 mb-8">Página não encontrada.</p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition-colors"
      >
        Voltar ao Dashboard
      </Link>
    </div>
  );
}
