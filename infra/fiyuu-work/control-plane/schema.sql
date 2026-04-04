-- Production schema for fiyuu.work multi-tenant control plane (PostgreSQL).

create table if not exists accounts (
  id uuid primary key,
  email text not null unique,
  name text not null,
  plan text not null check (plan in ('free', 'pro', 'enterprise')),
  password_hash text null,
  created_at timestamptz not null default now(),
  disabled_at timestamptz null
);

create table if not exists account_sessions (
  id uuid primary key,
  account_id uuid not null references accounts(id) on delete cascade,
  session_hash text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz null,
  expires_at timestamptz not null,
  revoked_at timestamptz null
);
create index if not exists idx_account_sessions_account_id on account_sessions(account_id);
create index if not exists idx_account_sessions_session_hash on account_sessions(session_hash);

create table if not exists api_tokens (
  id uuid primary key,
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  token_hash text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz null,
  revoked_at timestamptz null
);
create index if not exists idx_api_tokens_account_id on api_tokens(account_id);

create table if not exists projects (
  id uuid primary key,
  account_id uuid not null references accounts(id) on delete cascade,
  slug text not null,
  name text not null,
  subdomain text not null,
  created_at timestamptz not null default now(),
  archived_at timestamptz null,
  unique(account_id, slug),
  unique(subdomain)
);
create index if not exists idx_projects_account_id on projects(account_id);

create table if not exists deployments (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  status text not null check (status in ('queued', 'running', 'failed', 'ready')),
  source_size_bytes bigint not null,
  created_at timestamptz not null default now(),
  started_at timestamptz null,
  finished_at timestamptz null,
  log text not null default ''
);
create index if not exists idx_deployments_project_id on deployments(project_id);

create or replace function enforce_free_plan_project_limit()
returns trigger as $$
declare
  current_plan text;
  project_count integer;
begin
  select plan into current_plan from accounts where id = new.account_id;

  if current_plan = 'free' then
    select count(*) into project_count from projects where account_id = new.account_id;
    if project_count >= 3 then
      raise exception 'free plan project limit reached (max 3)' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_free_limit on projects;
create trigger trg_projects_free_limit
before insert on projects
for each row execute function enforce_free_plan_project_limit();
