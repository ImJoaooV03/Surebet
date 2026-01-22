-- Adiciona colunas para controle de ciclo e auditoria de uso
ALTER TABLE activation_codes 
ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS redeemed_by_email text,
ADD COLUMN IF NOT EXISTS redeemed_by_name text;

-- Atualiza a função de resgate para salvar o snapshot do usuário (Email/Nome)
-- Isso evita ter que fazer joins complexos com a tabela auth.users que é protegida
CREATE OR REPLACE FUNCTION redeem_activation_code(code_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code_record record;
  v_user_email text;
  v_user_name text;
BEGIN
  -- Buscar o código
  SELECT * INTO v_code_record FROM activation_codes WHERE code = code_input AND is_used = false;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Código inválido ou já utilizado.');
  END IF;

  -- Buscar dados do usuário atual
  SELECT email, raw_user_meta_data->>'full_name' INTO v_user_email, v_user_name
  FROM auth.users WHERE id = auth.uid();

  -- Atualizar o plano do usuário
  UPDATE user_settings
  SET 
    plan = v_code_record.plan_type::text, -- Cast explícito para text para evitar erro de tipo
    is_premium = true
  WHERE user_id = auth.uid();

  -- Marcar código como usado e salvar auditoria
  UPDATE activation_codes
  SET 
    is_used = true,
    used_by = auth.uid(),
    used_at = now(),
    redeemed_by_email = v_user_email,
    redeemed_by_name = COALESCE(v_user_name, 'Usuário')
  WHERE id = v_code_record.id;

  RETURN json_build_object('success', true, 'message', 'Plano ativado com sucesso!');
END;
$$;
