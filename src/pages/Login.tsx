import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { LineChart, Loader2, Lock, Mail, UserPlus, LogIn, ArrowRight } from "lucide-react";
import { useToast } from "../contexts/ToastContext";

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Fluxo de Cadastro
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0], // Nome padrão baseado no email
            }
          }
        });

        if (error) throw error;

        if (data.session) {
          toast("Conta criada com sucesso!", "success");
          navigate("/");
        } else if (data.user) {
          toast("Conta criada! Verifique seu e-mail para confirmar.", "info");
          setIsSignUp(false); // Volta para login
        }
      } else {
        // Fluxo de Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        navigate("/");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      
      // Tratamento de erros comuns
      if (err.message.includes("Invalid login credentials")) {
        toast("E-mail ou senha incorretos.", "error");
      } else if (err.message.includes("Email not confirmed")) {
        toast("E-mail não confirmado. Verifique sua caixa de entrada.", "info");
      } else if (err.message.includes("User already registered")) {
        toast("Este e-mail já está cadastrado. Tente fazer login.", "error");
      } else {
        toast(err.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center mb-4 border border-slate-700 shadow-inner group transition-all hover:scale-110 hover:border-emerald-500/50">
            <LineChart className="text-emerald-500 w-7 h-7 transition-transform group-hover:-rotate-12" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Surebet<span className="text-emerald-500">Pro</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium text-center">
            {isSignUp ? "Crie sua conta para começar a lucrar" : "Acesse sua conta de trader"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email</label>
            <div className="relative group">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 pl-11 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-700"
                placeholder="seu@email.com"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Senha</label>
            <div className="relative group">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 pl-11 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-700"
                placeholder="••••••••"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            {isSignUp && (
              <p className="text-[10px] text-slate-500 ml-1">Mínimo de 6 caracteres</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isSignUp ? "Criar Conta Grátis" : "Entrar no Sistema"}
                {!loading && <ArrowRight className="w-4 h-4 opacity-60" />}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-400 mb-3">
            {isSignUp ? "Já tem uma conta?" : "Ainda não tem acesso?"}
          </p>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-all text-sm font-medium group"
          >
            {isSignUp ? (
              <>
                <LogIn className="w-4 h-4 text-slate-500 group-hover:text-slate-300" /> Fazer Login
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 text-slate-500 group-hover:text-slate-300" /> Criar Nova Conta
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-center w-full text-xs text-slate-600">
        &copy; 2025 SurebetPro. Todos os direitos reservados.
      </div>
    </div>
  );
}
