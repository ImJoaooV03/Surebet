-- HARD RESET DO SISTEMA
-- 1. Limpar todas as chaves de API e desativar integrações
UPDATE user_settings
SET 
  external_api_key = NULL,
  api_enabled = false,
  secondary_api_key = NULL,
  secondary_api_enabled = false,
  tertiary_api_key = NULL,
  tertiary_api_enabled = false,
  quaternary_api_key = NULL,
  quaternary_api_enabled = false;

-- 2. Limpar tabelas de integrações administrativas
TRUNCATE TABLE admin_integrations CASCADE;

-- 3. Limpar TODOS os dados operacionais (Histórico, Jogos, Odds)
-- A ordem é importante devido às chaves estrangeiras (Foreign Keys)
TRUNCATE TABLE arb_legs CASCADE;
TRUNCATE TABLE arbs CASCADE;
TRUNCATE TABLE odds CASCADE;
TRUNCATE TABLE markets CASCADE;
TRUNCATE TABLE events CASCADE;

-- 4. Opcional: Limpar times e ligas para garantir zero resquícios
-- (Pode manter se quiser reaproveitar os IDs depois, mas para limpar 100% removemos)
TRUNCATE TABLE teams CASCADE;
TRUNCATE TABLE leagues CASCADE;
TRUNCATE TABLE sports CASCADE;
TRUNCATE TABLE books CASCADE;
