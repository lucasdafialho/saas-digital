-- Corrigir políticas RLS para a tabela generations
-- O problema é que o service role (backend) precisa poder inserir gerações

-- Remover políticas antigas
drop policy if exists "Usuários podem ver suas próprias gerações" on public.generations;
drop policy if exists "Usuários podem inserir suas próprias gerações" on public.generations;

-- Criar novas políticas que funcionam tanto para usuários quanto para service role

-- Política de SELECT: usuários podem ver suas próprias gerações
create policy "Usuários podem ver suas próprias gerações"
  on public.generations for select
  using (
    auth.uid() = user_id
  );

-- Política de INSERT: permite inserção tanto por usuários quanto por service role
create policy "Permitir inserção de gerações"
  on public.generations for insert
  with check (
    -- Permite se for o próprio usuário OU se não houver auth.uid() (service role)
    auth.uid() = user_id OR auth.uid() IS NULL
  );

-- Política de UPDATE: usuários podem atualizar suas próprias gerações
create policy "Usuários podem atualizar suas próprias gerações"
  on public.generations for update
  using (auth.uid() = user_id);

-- Política de DELETE: usuários podem deletar suas próprias gerações
create policy "Usuários podem deletar suas próprias gerações"
  on public.generations for delete
  using (auth.uid() = user_id);

-- Verificar se as políticas foram criadas
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where tablename = 'generations';
