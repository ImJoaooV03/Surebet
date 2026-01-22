import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/20 mb-4">
            <span className="font-bold text-white text-xl">S</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Surebet<span className="text-indigo-400">Pro</span></h1>
          <p className="text-slate-400 mt-2">{subtitle}</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-xl shadow-black/20">
          <h2 className="text-xl font-bold text-white mb-6">{title}</h2>
          {children}
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} SurebetPro. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}
