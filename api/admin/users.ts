import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. GET: Listar Usuários (Join Auth + Settings)
  if (req.method === 'GET') {
    try {
      // Busca usuários do Auth (limite de 50 para MVP)
      const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 50
      });

      if (authError) throw authError;

      // Busca configurações (Planos/Roles)
      const { data: settings, error: dbError } = await supabaseAdmin
        .from('user_settings')
        .select('*');

      if (dbError) throw dbError;

      // Combina os dados
      const combinedUsers = users.map(u => {
        const setting = settings?.find(s => s.user_id === u.id);
        return {
          id: u.id,
          email: u.email,
          full_name: u.user_metadata?.full_name || '',
          role: setting?.role || 'user',
          plan: setting?.plan || 'basic',
          status: u.banned_until ? 'suspended' : 'active', // Mapeia banimento para status
          created_at: u.created_at,
          last_login: u.last_sign_in_at
        };
      });

      return res.json(combinedUsers);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // 2. POST: Criar Usuário
  if (req.method === 'POST') {
    const { email, password, full_name, role, plan } = req.body;
    
    try {
      // Cria no Auth (auto-confirmado)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password || 'Mudar123!', // Senha temporária se não fornecida
        email_confirm: true,
        user_metadata: { full_name }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário');

      // Atualiza user_settings com Role e Plan
      const { error: dbError } = await supabaseAdmin
        .from('user_settings')
        .update({ role, plan })
        .eq('user_id', authData.user.id);

      // Se não existir (trigger falhou?), insere
      if (dbError) {
        await supabaseAdmin.from('user_settings').upsert({
          user_id: authData.user.id,
          role,
          plan
        });
      }

      return res.json({ success: true, user: authData.user });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // 3. PUT: Atualizar Usuário
  if (req.method === 'PUT') {
    const { id, email, full_name, role, plan, status } = req.body;

    try {
      // Atualiza Auth (Email, Metadata, Banimento)
      const updates: any = {
        email,
        user_metadata: { full_name }
      };

      if (status === 'suspended') {
        updates.ban_duration = '876000h'; // ~100 anos
      } else if (status === 'active') {
        updates.ban_duration = 'none'; // Remove banimento
      }

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, updates);
      if (authError) throw authError;

      // Atualiza Settings (Role, Plan)
      const { error: dbError } = await supabaseAdmin
        .from('user_settings')
        .update({ role, plan })
        .eq('user_id', id);

      if (dbError) throw dbError;

      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // 4. DELETE: Remover Usuário
  if (req.method === 'DELETE') {
    const { id } = req.query;
    
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id as string);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
