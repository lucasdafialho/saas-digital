-- Verificar planos dos usuários
SELECT id, email, name, plan FROM profiles;

-- Se encontrar usuários com plano incorreto, corrigir para 'free'
-- UPDATE profiles SET plan = 'free' WHERE plan NOT IN ('free', 'starter', 'pro');

-- Ou se quiser corrigir um usuário específico:
-- UPDATE profiles SET plan = 'free' WHERE email = 'seu-email@exemplo.com';
