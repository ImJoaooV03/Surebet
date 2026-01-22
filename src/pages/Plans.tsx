import { useState } from "react";
import { Check, Crown, Zap, Ticket, Star, Calendar, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useToast } from "../contexts/ToastContext";
import { Badge } from "../components/ui/Badge";
import { Loader2 } from "lucide-react";

// Definição dos Tipos
type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

interface PlanPrice {
  monthly: number;
  quarterly: number;
  yearly: number;
}

interface PlanFeature {
  text: string;
  highlight?: boolean;
}

interface PlanConfig {
  id: string;
  type: 'basic' | 'pro' | 'premium';
  title: string;
  description: string;
  prices: PlanPrice;
  features: PlanFeature[];
  recommended?: boolean;
}

// Dados dos Planos
const PLANS_DATA: PlanConfig[] = [
  {
    id: 'basic',
    type: 'basic',
    title: 'Basic',
    description: 'Para iniciantes conhecerem o sistema.',
    prices: { monthly: 0, quarterly: 0, yearly: 0 },
    features: [
      { text: "Acesso limitado a Oportunidades" },
      { text: "Scanner com delay de 15 min" },
      { text: "Calculadora Básica" },
      { text: "Suporte via Comunidade" }
    ]
  },
  {
    id: 'pro',
    type: 'pro',
    title: 'Pro',
    description: 'Para quem leva arbitragem a sério.',
    recommended: true,
    prices: { monthly: 97, quarterly: 261, yearly: 924 }, // 97/mês, 87/mês, 77/mês (equiv)
    features: [
      { text: "Oportunidades em Tempo Real", highlight: true },
      { text: "Scanner sem delay (Instantâneo)" },
      { text: "Calculadora Avançada de Stakes" },
      { text: "Alertas no Telegram" },
      { text: "Suporte Prioritário" }
    ]
  },
  {
    id: 'premium',
    type: 'premium',
    title: 'Premium',
    description: 'Poder total e dados brutos.',
    prices: { monthly: 197, quarterly: 531, yearly: 1884 }, // 197/mês, 177/mês, 157/mês (equiv)
    features: [
      { text: "Tudo do plano Pro", highlight: true },
      { text: "Acesso a API de Dados Brutos" },
      { text: "Consultoria Mensal de 1h" },
      { text: "Acesso Antecipado a Features" },
      { text: "Gerente de Conta Dedicado" }
    ]
  }
];

export default function Plans() {
  const { plan, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Lógica de Ativação Manual (Mantida)
  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('redeem_activation_code', {
        code_input: code
      });

      if (error) throw error;

      if (data.success) {
        toast(data.message, "success");
        setCode("");
        await refreshProfile();
      } else {
        toast(data.message, "error");
      }
    } catch (err: any) {
      console.error(err);
      toast("Erro ao processar código. Verifique se ele é válido.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper para calcular preço mensal equivalente
  const getMonthlyEquivalent = (prices: PlanPrice, cycle: BillingCycle) => {
    if (cycle === 'monthly') return prices.monthly;
    if (cycle === 'quarterly') return Math.floor(prices.quarterly / 3);
    if (cycle === 'yearly') return Math.floor(prices.yearly / 12);
    return 0;
  };

  return (
    <div className="space-y-12 pb-10 animate-in fade-in duration-500">
      
      {/* Header e Seletor */}
      <div className="text-center max-w-3xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white tracking-tight">Escolha o plano ideal</h1>
          <p className="text-slate-400 text-lg">
            Desbloqueie todo o potencial da arbitragem esportiva com nossos planos premium.
          </p>
        </div>

        {/* Seletor de Ciclo Responsivo */}
        <div className="inline-flex flex-wrap justify-center p-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-inner relative z-10">
          {[
            { id: 'monthly', label: 'Mensal', discount: null },
            { id: 'quarterly', label: 'Trimestral', discount: '-10%' },
            { id: 'yearly', label: 'Anual', discount: '-20%' },
          ].map((cycle) => (
            <button
              key={cycle.id}
              onClick={() => setBillingCycle(cycle.id as BillingCycle)}
              className={`relative px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                billingCycle === cycle.id
                  ? 'bg-slate-800 text-white shadow-md shadow-black/20 ring-1 ring-slate-700'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              {cycle.label}
              {cycle.discount && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  billingCycle === cycle.id 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  {cycle.discount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Planos */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        {PLANS_DATA.map((planConfig) => {
          const isCurrent = plan === planConfig.type;
          const monthlyPrice = getMonthlyEquivalent(planConfig.prices, billingCycle);
          const totalPrice = planConfig.prices[billingCycle];

          return (
            <div 
              key={planConfig.id}
              className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 group ${
                planConfig.recommended 
                  ? 'bg-slate-900/80 border-emerald-500/50 shadow-xl shadow-emerald-900/20 hover:shadow-emerald-900/40 hover:-translate-y-1 z-10' 
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:-translate-y-1'
              } ${isCurrent ? 'ring-2 ring-indigo-500 border-transparent' : ''}`}
            >
              
              {planConfig.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-slate-950 text-xs font-bold rounded-full shadow-lg shadow-emerald-500/50 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-slate-950" /> MAIS POPULAR
                </div>
              )}

              {isCurrent && (
                <div className="absolute top-4 right-4">
                  <Badge variant="default" className="bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">PLANO ATUAL</Badge>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-bold ${planConfig.recommended ? 'text-white' : 'text-slate-200'}`}>
                  {planConfig.title}
                </h3>
                <p className="text-sm text-slate-500 mt-2 min-h-[40px]">{planConfig.description}</p>
                
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white tracking-tight transition-all duration-300">
                    R$ {monthlyPrice}
                  </span>
                  <span className="text-sm text-slate-500 font-medium">/mês</span>
                </div>
                
                {billingCycle !== 'monthly' && totalPrice > 0 && (
                  <p className="text-xs text-emerald-400 mt-1 font-medium">
                    Cobrado R$ {totalPrice} a cada {billingCycle === 'quarterly' ? '3 meses' : 'ano'}
                  </p>
                )}
              </div>

              <div className="w-full h-px bg-slate-800/50 mb-6"></div>

              <ul className="flex-1 space-y-4 mb-8">
                {planConfig.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <div className={`mt-0.5 p-0.5 rounded-full shrink-0 ${
                      feat.highlight 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : planConfig.recommended ? 'bg-emerald-500/10 text-emerald-500/70' : 'bg-slate-800 text-slate-500'
                    }`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className={feat.highlight ? "text-white font-medium" : ""}>{feat.text}</span>
                  </li>
                ))}
              </ul>

              <button 
                disabled={isCurrent}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  isCurrent 
                    ? 'bg-slate-800 text-slate-500 cursor-default border border-slate-700'
                    : planConfig.recommended
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-900/20 active:scale-95'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 active:scale-95'
                }`}
              >
                {isCurrent ? (
                  <>Plano Ativo <Check className="w-4 h-4" /></>
                ) : (
                  <>Assinar {planConfig.title} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Área de Ativação Manual */}
      <div className="max-w-xl mx-auto mt-16 px-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
          {/* Efeito de fundo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-500"></div>
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20 shadow-inner">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ativação Manual</h3>
              <p className="text-sm text-slate-400">Tem um código promocional ou voucher? Ative aqui.</p>
            </div>
          </div>

          <form onSubmit={handleRedeemCode} className="flex flex-col sm:flex-row gap-3 relative z-10">
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EX: PRO-2025-XYZ"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono uppercase tracking-wider transition-all"
            />
            <button 
              type="submit"
              disabled={loading || !code}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 active:scale-95 whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              Ativar Código
            </button>
          </form>
        </div>
      </div>

      {/* FAQ ou Informações Adicionais */}
      <div className="text-center text-sm text-slate-500 mt-8">
        <p className="flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4" />
          Cancelamento gratuito a qualquer momento. Sem fidelidade.
        </p>
      </div>
    </div>
  );
}
