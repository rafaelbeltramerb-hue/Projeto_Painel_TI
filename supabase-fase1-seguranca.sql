-- Portal TI — Xanxerê
-- FASE 1 — Segurança e consistência de dados
-- Execute no Supabase SQL Editor, depois de já ter rodado:
--   supabase-schema.sql -> supabase-admin-policies-fix.sql -> supabase-content-schema.sql

-- ================================================================
-- 1) CADASTRAR ADMINS
-- ================================================================
-- Esta consulta só LÊ dados (segura de rodar quantas vezes quiser).
-- Mostra todo mundo que já fez login pelo menos uma vez (auth.users)
-- ao lado do papel (role) que a pessoa tem hoje em profiles, se tiver.
-- Use o "id" da linha da pessoa certa no INSERT logo abaixo.

select
  u.id,
  u.email,
  coalesce(p.role, '(sem cadastro em profiles ainda)') as role_atual
from auth.users u
left join public.profiles p on p.id = u.id
order by u.email;

-- Depois de identificar o id de cada pessoa da equipe de TI, rode uma
-- linha destas para cada uma (troque o uuid e o e-mail é só referência):
-- insert into public.profiles (id, role) values ('<uuid-da-pessoa>', 'admin')
--   on conflict (id) do update set role = 'admin';


-- ================================================================
-- 2) AUDITORIA DE RLS — favorites e profiles
-- ================================================================
-- Conferido: as políticas originais já estavam corretas.
--   profiles:  "users read own profile"    -> using (auth.uid() = id)
--   favorites: "users manage own favorites" -> using (auth.uid() = user_id)
--                                               with check (auth.uid() = user_id)
-- Ou seja, cada pessoa só enxerga o próprio perfil e só gerencia os
-- próprios favoritos. Nenhuma alteração necessária aqui.
-- (Se algum dia for criada uma tela de "gerenciar usuários" dentro do
-- admin, será preciso acrescentar uma política extra permitindo que
-- role='admin' liste todos os profiles — não existe ainda porque essa
-- tela também não existe ainda.)


-- ================================================================
-- 3) RESTRINGIR A CATEGORIA "SENHAS" A USUÁRIOS AUTENTICADOS
-- ================================================================
-- Hoje a política "public read active links" libera TODOS os atalhos
-- ativos, inclusive os da categoria SENHAS, para qualquer pessoa que
-- tenha a anon key (ou seja, qualquer visitante do site, sem precisar
-- fazer login). Os nomes/descrições desses documentos já são metadado
-- sensível o suficiente para restringir.
--
-- A partir daqui: a categoria SENHAS só aparece para quem estiver
-- autenticado (qualquer conta cadastrada, não precisa ser admin).
-- As demais categorias continuam públicas como antes.

drop policy if exists "public read active links" on public.links;

create policy "public read active links (exceto senhas)" on public.links
  for select
  using (
    active = true
    and category_id not in (select id from public.categories where name = 'SENHAS')
  );

create policy "authenticated read senhas links" on public.links
  for select
  using (
    active = true
    and auth.uid() is not null
    and category_id in (select id from public.categories where name = 'SENHAS')
  );


-- ================================================================
-- 4) PADRONIZAR O FORMATO DE URL DOS ATALHOS (opcional)
-- ================================================================
-- app.js já resolve qualquer um dos formatos abaixo na hora do clique
-- (então nada quebra hoje), mas ter tudo salvo do mesmo jeito facilita
-- a manutenção. Formato recomendado: caminho RELATIVO à raiz definida
-- em js/supabase-config.js (PORTAL_CONFIG.networkRoot).
--
-- Passo 1 — PREVIEW (só leitura): veja o que seria alterado antes de
-- decidir se quer rodar o UPDATE.

select
  id,
  name,
  url as url_atual,
  regexp_replace(
    url,
    '^file:/+(\\\\+)?arquivos[\\/]ti[\\/]G_Xanxere_TI[\\/]?',
    '',
    'i'
  ) as url_proposta
from public.links
where url ~* '^file:/+(\\\\+)?arquivos[\\/]ti[\\/]G_Xanxere_TI'
order by name;

-- Passo 2 — Se a lista acima estiver correta, descomente e rode o
-- UPDATE abaixo (ele só afeta linhas que batem com o padrão acima;
-- caminhos relativos e http(s) que já existirem ficam intactos).

-- update public.links
-- set url = regexp_replace(
--   url,
--   '^file:/+(\\\\+)?arquivos[\\/]ti[\\/]G_Xanxere_TI[\\/]?',
--   '',
--   'i'
-- ),
-- updated_at = now()
-- where url ~* '^file:/+(\\\\+)?arquivos[\\/]ti[\\/]G_Xanxere_TI';
