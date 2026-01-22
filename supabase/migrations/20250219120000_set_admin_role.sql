/*
  # Set Admin Role
  
  1. Updates the user_settings table for 'joaovicrengel@gmail.com'
  2. Sets role to 'admin' and is_premium to true
  3. Ensures the user has access to all system features
*/

DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Busca o ID do usuário pelo e-mail na tabela de autenticação
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'joaovicrengel@gmail.com';

  IF target_user_id IS NOT NULL THEN
    -- Atualiza ou Insere na tabela de configurações do usuário
    INSERT INTO public.user_settings (user_id, role, is_premium, bankroll_total, stake_mode, roi_min)
    VALUES (target_user_id, 'admin', true, 1000, 'percent', 0.01)
    ON CONFLICT (user_id) DO UPDATE
    SET 
      role = 'admin',
      is_premium = true;
      
    RAISE NOTICE 'Usuário joaovicrengel@gmail.com atualizado para ADMIN.';
  ELSE
    RAISE NOTICE 'Usuário joaovicrengel@gmail.com não encontrado. Certifique-se de que ele já fez o cadastro/login pelo menos uma vez.';
  END IF;
END $$;
