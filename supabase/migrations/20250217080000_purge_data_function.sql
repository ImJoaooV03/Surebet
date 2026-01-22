-- Função segura para limpar dados operacionais sem deletar usuários ou configurações
CREATE OR REPLACE FUNCTION purge_operational_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Limpa tabelas em ordem de dependência
  TRUNCATE TABLE arb_legs, arbs, odds, markets, events CASCADE;
  
  -- Opcional: Limpar times/ligas se quiser um reset completo de metadados
  -- TRUNCATE TABLE teams, leagues CASCADE;
END;
$$;

-- Executa a limpeza imediatamente para resolver o problema atual do usuário
SELECT purge_operational_data();
