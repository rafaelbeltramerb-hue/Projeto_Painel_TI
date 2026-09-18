-- Portal TI — Xanxerê
-- FASE 2 — Experiência do usuário do painel interno
-- Execute no Supabase SQL Editor depois dos scripts das Fases 0 e 1.
-- (Se você ainda não rodou o supabase-content-schema.sql atualizado,
-- rode-o de novo primeiro: ele agora também cria a tabela quick_links,
-- usada pelo menu lateral dinâmico do dashboard.)

-- ================================================================
-- 1) RECENTES SINCRONIZADOS POR CONTA
-- ================================================================
-- Hoje "Recentes" usa só o localStorage do navegador — troque de
-- computador e a lista some. Esta tabela guarda o último acesso de
-- cada pessoa a cada atalho, para o app.js sincronizar entre
-- dispositivos quando a pessoa estiver logada.

create table if not exists public.recent_access (
  user_id uuid references auth.users(id) on delete cascade,
  link_id uuid references public.links(id) on delete cascade,
  accessed_at timestamptz not null default now(),
  primary key (user_id, link_id)
);

alter table public.recent_access enable row level security;

drop policy if exists "users manage own recent_access" on public.recent_access;
create policy "users manage own recent_access" on public.recent_access
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ================================================================
-- 2) REPORTAR LINK QUEBRADO
-- ================================================================
-- Não dá para testar de verdade um caminho file://, UNC ou de rede
-- interna a partir do navegador (é uma limitação de segurança do
-- próprio browser, não do portal). Em vez disso: qualquer pessoa
-- logada pode marcar um atalho como "com problema", e isso aparece
-- como aviso visual tanto no painel de atalhos quanto no admin, para
-- alguém da TI verificar e corrigir.

alter table public.links add column if not exists reported_broken_at timestamptz;
alter table public.links add column if not exists reported_broken_by uuid references auth.users(id);

-- Função com SECURITY DEFINER: como a política de escrita em "links"
-- é restrita a role='admin' (Fase 1), qualquer pessoa comum não
-- conseguiria marcar o alerta sozinha. Esta função roda com
-- privilégio elevado só para esse UPDATE específico, exigindo apenas
-- que a pessoa esteja autenticada (não precisa ser admin).
create or replace function public.report_broken_link(p_link_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária para reportar um link.';
  end if;

  update public.links
  set reported_broken_at = now(), reported_broken_by = auth.uid()
  where id = p_link_id;
end;
$$;

grant execute on function public.report_broken_link(uuid) to authenticated;

-- Limpar o alerta já é possível para admins através da política
-- "admins manage links" da Fase 0 (basta um UPDATE normal setando os
-- dois campos para null pelo admin.html), então não precisa de uma
-- função separada para isso.
