-- Habilitar extensões necessárias
create extension if not exists "uuid-ossp";

-- Tabela de perfis de usuários
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text not null,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro')),
  generations_used integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de assinaturas
create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan_type text not null check (plan_type in ('starter', 'pro')),
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired')),
  mercadopago_subscription_id text,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de gerações
create table if not exists public.generations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('ads', 'copy', 'funnel', 'canvas')),
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para melhor performance
create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists generations_user_id_idx on public.generations(user_id);
create index if not exists generations_created_at_idx on public.generations(created_at desc);

-- Habilitar RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.generations enable row level security;

-- Políticas de segurança para profiles
create policy "Usuários podem ver seu próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários podem atualizar seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Políticas de segurança para subscriptions
create policy "Usuários podem ver suas próprias assinaturas"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Usuários podem inserir suas próprias assinaturas"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

-- Políticas de segurança para generations
create policy "Usuários podem ver suas próprias gerações"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Usuários podem inserir suas próprias gerações"
  on public.generations for insert
  with check (auth.uid() = user_id);

-- Função para criar perfil automaticamente após signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, plan, generations_used)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'free',
    0
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para criar perfil automaticamente
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Função para atualizar updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers para updated_at
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();
