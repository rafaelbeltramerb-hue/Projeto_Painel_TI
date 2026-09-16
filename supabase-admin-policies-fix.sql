-- Portal TI — Xanxerê
-- CORREÇÕES no schema original (supabase-schema.sql).
-- Execute no Supabase SQL Editor. Seguro para rodar mesmo se já
-- executado antes (usa "if not exists" / trata policy duplicada).
--
-- Problemas corrigidos:
-- 1) categories/links tinham apenas política de leitura (select).
--    Não existia política de INSERT/UPDATE/DELETE, então o CRUD do
--    admin.html só funcionava em "Modo Local" (localStorage), nunca
--    de fato gravando no Supabase quando configurado.
-- 2) Nenhum lugar do admin.js verifica profiles.role = 'admin'.
--    Qualquer usuário autenticado (mesmo sem cadastro em profiles)
--    conseguia abrir o painel de administração.
--    Este script cria as políticas de escrita já condicionadas ao
--    role = 'admin', que é o requisito mínimo para fechar essa
--    brecha no nível do banco (defesa em profundidade).

-- Categorias: apenas admin pode inserir/editar/excluir.
drop policy if exists "admins manage categories" on public.categories;
create policy "admins manage categories" on public.categories
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Atalhos (links): apenas admin pode inserir/editar/excluir.
drop policy if exists "admins manage links" on public.links;
create policy "admins manage links" on public.links
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Lembrete: para cada pessoa da equipe que deve acessar o admin.html,
-- crie o usuário em Authentication > Users e depois rode:
--   insert into public.profiles (id, role) values ('<uuid-do-usuario>', 'admin')
--   on conflict (id) do update set role = 'admin';
-- Sem essa linha em profiles, o login funciona mas as gravações acima
-- serão bloqueadas pelo RLS (comportamento esperado/seguro).
