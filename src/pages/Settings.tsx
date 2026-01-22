import { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { supabase } from "../lib/supabase";
import { 
  User, Lock, Bell, Shield, Camera, Loader2, Save, 
  Mail, Smartphone, AlertTriangle, CreditCard, Crown 
} from "lucide-react";
import { Badge } from "../components/ui/Badge";

// --- Types ---
type SettingsTab = 'profile' | 'account' | 'notifications' | 'security';

interface TabItem {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
  description: string;
}

// --- Configuration ---
const TABS: TabItem[] = [
  { id: 'profile', label: 'Perfil Público', icon: User, description: 'Gerencie como os outros veem você.' },
  { id: 'account', label: 'Conta & Plano', icon: CreditCard, description: 'Detalhes da assinatura e dados de login.' },
  { id: 'notifications', label: 'Notificações', icon: Bell, description: 'Escolha o que e onde você recebe alertas.' },
  { id: 'security', label: 'Segurança', icon: Lock, description: 'Proteja sua conta e altere sua senha.' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const { loading: authLoading } = useAuth();

  if (authLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary-500 w-8 h-8" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-slate-400 text-sm">Gerencie suas preferências e dados da conta.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 shrink-0">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10">
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'account' && <AccountSettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'security' && <SecuritySettings />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Components ---

function ProfileSettings() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (error) throw error;
      
      await refreshProfile();
      toast("Perfil atualizado com sucesso!", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast("Upload de avatar requer configuração de Storage.", "info");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Perfil Público</h2>
        <p className="text-sm text-slate-400">Essas informações serão exibidas publicamente.</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
          <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden group-hover:border-primary-500 transition-colors">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-slate-500" />
            )}
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
        <div>
          <h3 className="font-bold text-white">Foto de Perfil</h3>
          <p className="text-xs text-slate-500 max-w-[200px] mt-1">
            Recomendado: JPG ou PNG. Max 2MB.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-md">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Nome Completo</label>
          <input 
            type="text" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all"
            placeholder="Seu nome"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-primary-900/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Alterações
        </button>
      </form>
    </div>
  );
}

function AccountSettings() {
  const { user, plan, isPremium, isAdmin } = useAuth();
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Conta & Plano</h2>
        <p className="text-sm text-slate-400">Gerencie os detalhes da sua assinatura e login.</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <div className={`p-5 rounded-lg border transition-all ${
          isAdmin 
            ? 'bg-slate-900/80 border-purple-500/30 shadow-lg shadow-purple-900/10' 
            : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Plano Atual</h3>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white capitalize">
                  {isAdmin ? "Enterprise" : `${plan} Plan`}
                </span>
                
                {isAdmin ? (
                   <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 flex items-center gap-1">
                     <Crown size={12} /> ADMIN
                   </Badge>
                ) : isPremium ? (
                   <Badge variant="success">ATIVO</Badge>
                ) : (
                   <Badge variant="default">GRÁTIS</Badge>
                )}
              </div>
            </div>
            {!isAdmin && (
              <button className="text-sm text-primary-400 hover:text-primary-300 font-bold">
                Gerenciar Assinatura
              </button>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 text-sm text-slate-500">
            {isAdmin 
              ? "Sua conta possui privilégios administrativos com acesso ilimitado a todos os recursos." 
              : isPremium 
                ? "Sua próxima cobrança será em 15/03/2025." 
                : "Faça upgrade para desbloquear recursos exclusivos."}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">E-mail</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-400 flex items-center gap-2 cursor-not-allowed">
                <Mail className="w-4 h-4" />
                {user?.email}
              </div>
              <Badge variant="outline" className="h-full">Verificado</Badge>
            </div>
            <p className="text-xs text-slate-500">O e-mail não pode ser alterado por motivos de segurança.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">ID do Usuário</label>
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-500 font-mono text-xs">
              {user?.id}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <h3 className="text-red-500 font-bold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Zona de Perigo
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Uma vez que você excluir sua conta, não há volta. Por favor, tenha certeza.
          </p>
          <button className="px-4 py-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-lg text-sm font-bold transition-colors">
            Excluir Conta
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    emailAlerts: true,
    pushBrowser: false,
    telegram: true,
    marketing: false
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => {
      const newState = { ...prev, [key]: !prev[key] };
      toast("Preferências atualizadas.", "info", 1000);
      return newState;
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Notificações</h2>
        <p className="text-sm text-slate-400">Escolha como você quer ser avisado sobre oportunidades.</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800">
          
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-900 rounded-lg text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-200">Alertas por E-mail</h3>
                <p className="text-xs text-slate-500">Receba um resumo diário das melhores oportunidades.</p>
              </div>
            </div>
            <Switch checked={settings.emailAlerts} onChange={() => toggle('emailAlerts')} />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-900 rounded-lg text-slate-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-200">Telegram Bot</h3>
                <p className="text-xs text-slate-500">Receba surebets em tempo real no seu Telegram.</p>
              </div>
            </div>
            <Switch checked={settings.telegram} onChange={() => toggle('telegram')} />
          </div>

        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast("A senha deve ter no mínimo 6 caracteres.", "error");
      return;
    }
    if (password !== confirmPassword) {
      toast("As senhas não coincidem.", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast("Senha atualizada com sucesso!", "success");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Segurança</h2>
        <p className="text-sm text-slate-400">Proteja sua conta e atualize suas credenciais.</p>
      </div>

      <div className="max-w-md space-y-6">
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Confirmar Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !password}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-primary-900/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Atualizar Senha
          </button>
        </form>

        <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold text-primary-300">Autenticação de Dois Fatores (2FA)</h4>
            <p className="text-slate-400 mt-1">
              Adicione uma camada extra de segurança à sua conta. Em breve disponível.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button 
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors relative ${
        checked ? 'bg-primary-500' : 'bg-slate-700'
      }`}
    >
      <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  );
}
