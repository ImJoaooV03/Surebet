import { useState, useEffect } from "react";
import { 
  Search, Plus, Edit, Trash2, 
  CheckCircle2, XCircle, Shield, User as UserIcon, 
  Loader2, Mail, Calendar, Filter, AlertTriangle, X, Database, Info 
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { format } from "date-fns";
import { Badge } from "../ui/Badge";
import { apiRequest } from "../../lib/apiClient";

// --- Types ---
interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  plan: 'basic' | 'pro' | 'premium';
  status: 'active' | 'suspended';
  created_at: string;
  last_login?: string;
}

export function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "user",
    plan: "basic",
    status: "active",
    password: "" // Only for creation
  });

  // 1. Fetch Data on Mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<UserData[]>('/admin/users');
      // Ensure data is array before setting
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        throw new Error("Formato de dados inválido");
      }
    } catch (error) {
      console.error(error);
      toast("Erro ao carregar usuários.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.email?.toLowerCase() || '').includes(search.toLowerCase()) || 
      (user.full_name?.toLowerCase() || '').includes(search.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ email: "", full_name: "", role: "user", plan: "basic", status: "active", password: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      plan: user.plan,
      status: user.status,
      password: ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast("O e-mail é obrigatório.", "error");
      return;
    }

    setActionLoading(true);

    try {
      if (editingUser) {
        // UPDATE
        await apiRequest('/admin/users', {
          method: 'PUT',
          body: JSON.stringify({
            id: editingUser.id,
            ...formData
          })
        });
        toast("Usuário atualizado com sucesso!", "success");
      } else {
        // CREATE
        await apiRequest('/admin/users', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        toast("Usuário criado com sucesso!", "success");
      }
      
      // Refresh list and close modal
      await fetchUsers();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast(err.message || "Erro ao salvar usuário.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = (id: string) => {
    setUserToDelete(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    setActionLoading(true);
    try {
      await apiRequest(`/admin/users?id=${userToDelete}`, {
        method: 'DELETE'
      });
      toast("Usuário removido.", "success");
      await fetchUsers();
      setIsDeleteAlertOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      toast("Erro ao excluir usuário.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Aviso de Ambiente Local */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
        <Database className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-400">Modo de Desenvolvimento Local</h4>
          <p className="text-xs text-slate-400 mt-1">
            As alterações feitas aqui estão sendo salvas no <strong>armazenamento local do seu navegador</strong>. 
            Para gerenciar usuários reais do Supabase, faça o deploy da aplicação para a Vercel.
          </p>
        </div>
      </div>

      {/* --- Toolbar --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou email..." 
              value={search}
              onChange={handleSearch}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex bg-slate-950 rounded-lg border border-slate-800 p-1">
            {(['all', 'admin', 'user'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${
                  filterRole === role 
                    ? 'bg-slate-800 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {role === 'all' ? 'Todos' : role}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-indigo-900/20 active:scale-95 w-full md:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* --- Users Table --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Usuário</th>
                <th className="px-6 py-4 font-bold tracking-wider">Função & Plano</th>
                <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold tracking-wider hidden md:table-cell">Data Cadastro</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
                  <UserIcon className="w-8 h-8 opacity-20" />
                  Nenhum usuário encontrado.
                </td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700">
                          {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200">{user.full_name || 'Sem nome'}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Plan */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <Badge variant={user.role === 'admin' ? 'success' : 'outline'} className="flex items-center gap-1">
                          {user.role === 'admin' && <Shield className="w-3 h-3" />}
                          {user.role?.toUpperCase()}
                        </Badge>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                          user.plan === 'premium' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          user.plan === 'pro' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>
                          {user.plan}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {user.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                          <XCircle className="w-3.5 h-3.5" /> Suspenso
                        </span>
                      )}
                    </td>

                    {/* Date (Hidden Mobile) */}
                    <td className="px-6 py-4 hidden md:table-cell text-slate-500 text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy") : '-'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-2 bg-slate-950 hover:bg-indigo-600 hover:text-white rounded-lg text-slate-400 transition-all border border-slate-800 hover:border-indigo-500"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => confirmDelete(user.id)}
                          className="p-2 bg-slate-950 hover:bg-red-600 hover:text-white rounded-lg text-slate-400 transition-all border border-slate-800 hover:border-red-500"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Add/Edit Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Nome Completo</label>
                <input 
                  type="text" 
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500 outline-none"
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">E-mail</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500 outline-none disabled:opacity-50"
                  placeholder="Ex: joao@email.com"
                  disabled={!!editingUser} // Email geralmente não editável diretamente aqui
                />
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Senha Inicial</label>
                  <input 
                    type="password" 
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500 outline-none"
                    placeholder="Opcional (Padrão: Mudar123!)"
                  />
                  {!formData.password && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                      <Info className="w-3 h-3" />
                      Se vazio, a senha será: <strong>Mudar123!</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Função</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Plano</label>
                  <select 
                    value={formData.plan}
                    onChange={e => setFormData({...formData, plan: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={() => setFormData({...formData, status: 'active'})}
                      className="text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-300">Ativo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      value="suspended"
                      checked={formData.status === 'suspended'}
                      onChange={() => setFormData({...formData, status: 'suspended'})}
                      className="text-red-500 focus:ring-red-500"
                    />
                    <span className="text-sm text-slate-300">Suspenso</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-900/20 transition-all flex items-center gap-2"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Alert --- */}
      {isDeleteAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/30 rounded-xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Excluir Usuário?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Esta ação é irreversível. O usuário perderá acesso imediato à plataforma.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setIsDeleteAlertOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 font-bold shadow-lg shadow-red-900/20 transition-colors flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
