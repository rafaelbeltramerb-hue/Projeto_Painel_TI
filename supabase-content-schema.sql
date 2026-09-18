-- Portal TI — Xanxerê
-- Conteúdo editável do site público (História, Locais Atendidos, Wi-Fi, Contato)
-- Execute no Supabase SQL Editor DEPOIS do supabase-schema.sql.
-- Não apaga nada existente; usa "if not exists" e "on conflict".

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- site_content: blocos de texto/imagem únicos por seção
-- slugs usados hoje: 'historia', 'wifi_intro', 'contato'
-- ------------------------------------------------------------
create table if not exists public.site_content (
  slug text primary key,
  title text not null default '',
  body text not null default '',
  image_url text,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- site_cards: listas de cartões reaproveitadas por 2 seções
-- section = 'locais'      -> cartões de "Locais Atendidos"
-- section = 'wifi_steps'  -> passos numerados de "Configurar Wi-Fi"
-- ------------------------------------------------------------
create table if not exists public.site_cards (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('locais', 'wifi_steps')),
  title text not null,
  description text default '',
  image_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Remove duplicatas que podem ter sido inseridas em execuções
-- anteriores deste script (antes de existir a constraint única
-- abaixo). Mantém apenas uma linha por (section, title).
delete from public.site_cards a
using public.site_cards b
where a.section = b.section
  and a.title = b.title
  and a.id > b.id;

-- Sem isso, "on conflict do nothing" nos inserts abaixo não teria
-- nenhuma constraint para comparar e cada nova execução do script
-- duplicaria as linhas.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'site_cards_section_title_key'
  ) then
    alter table public.site_cards add constraint site_cards_section_title_key unique (section, title);
  end if;
end $$;

-- Linhas iniciais = o texto/cartões que já existem hoje na página estática,
-- para que a migração não "apague" nada visualmente assim que for ativada.
insert into public.site_content (slug, title, body) values
  ('historia', 'Nossa História no Campus', 'Desde a consolidação do Campus Xanxerê, a equipe de TI tem atuado na expansão da infraestrutura de rede, modernização de laboratórios e suporte a alunos e servidores. Nosso compromisso é manter os serviços acadêmicos e administrativos sempre ativos e seguros.'),
  ('wifi_intro', 'Como Configurar o Wi-Fi (Eduroam)', ''),
  ('contato', 'Contato', E'WhatsApp: (49) 3441-7020\nE-mail: ti.xanxere@unoesc.edu.br\nHorário: Segunda a sexta, das 7h30 às 21h30.')
on conflict (slug) do nothing;

insert into public.site_cards (section, title, description, sort_order) values
  ('locais', 'Bloco Administrativo', 'Suporte presencial e de rede às secretarias, direções e gabinetes.', 1),
  ('locais', 'Laboratórios de Informática', 'Manutenção de hardware, software acadêmico e redes dos Labs 01 a 05.', 2),
  ('locais', 'Salas de Aula e Auditório', 'Infraestrutura de projetores, sonorização e pontos de acesso sem fio.', 3),
  ('locais', 'Biblioteca', 'Terminais de consulta e cobertura Wi-Fi para estudo individual e em grupo.', 4),
  ('wifi_steps', 'Conecte-se à rede', 'Selecione a rede eduroam nas configurações de Wi-Fi do seu dispositivo.', 1),
  ('wifi_steps', 'Insira as Credenciais', 'Usuário: seu_cpf@instituicao.edu.br — Senha: sua senha institucional.', 2),
  ('wifi_steps', 'Certificado', 'No Android/iOS, marque "Não validar certificado" ou selecione o certificado do sistema se solicitado.', 3)
on conflict (section, title) do nothing;

-- ------------------------------------------------------------
-- quick_links: atalhos externos exibidos na sidebar do dashboard
-- (ex.: Reservas Agenda, Monitoramento Rede). Diferente de
-- site_cards porque tem "url" e um ícone pré-definido, sem imagem.
-- ------------------------------------------------------------
create table if not exists public.quick_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  icon_key text not null default 'link',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

delete from public.quick_links a
using public.quick_links b
where a.title = b.title
  and a.id > b.id;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'quick_links_title_key'
  ) then
    alter table public.quick_links add constraint quick_links_title_key unique (title);
  end if;
end $$;

insert into public.quick_links (title, url, icon_key, sort_order) values
  ('Reservas Agenda', 'https://rafaelbeltramerb-hue.github.io/Projeto_Reserva_Agenda/', 'calendar', 1),
  ('Monitoramento Rede', 'https://172.18.0.13/', 'network', 2),
  ('Suporte WhatsApp', 'https://wa.me/554934417020', 'whatsapp', 3)
on conflict (title) do nothing;

alter table public.quick_links enable row level security;

drop policy if exists "public read active quick_links" on public.quick_links;
create policy "public read active quick_links" on public.quick_links
  for select using (active = true);

drop policy if exists "admins manage quick_links" on public.quick_links;
create policy "admins manage quick_links" on public.quick_links
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ------------------------------------------------------------
-- site-images: bucket público para imagens de conteúdo do site
-- (locais, passos do wi-fi, imagem da seção história, etc.)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.site_content enable row level security;
alter table public.site_cards enable row level security;

drop policy if exists "public read site_content" on public.site_content;
create policy "public read site_content" on public.site_content
  for select using (true);

drop policy if exists "public read active site_cards" on public.site_cards;
create policy "public read active site_cards" on public.site_cards
  for select using (active = true);

-- Apenas usuários com profiles.role = 'admin' podem escrever.
drop policy if exists "admins manage site_content" on public.site_content;
create policy "admins manage site_content" on public.site_content
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "admins manage site_cards" on public.site_cards;
create policy "admins manage site_cards" on public.site_cards
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Storage: leitura pública do bucket, escrita restrita a admins.
drop policy if exists "public read site-images" on storage.objects;
create policy "public read site-images" on storage.objects
  for select using (bucket_id = 'site-images');

drop policy if exists "admins upload site-images" on storage.objects;
create policy "admins upload site-images" on storage.objects
  for insert with check (
    bucket_id = 'site-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "admins update site-images" on storage.objects;
create policy "admins update site-images" on storage.objects
  for update using (
    bucket_id = 'site-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "admins delete site-images" on storage.objects;
create policy "admins delete site-images" on storage.objects
  for delete using (
    bucket_id = 'site-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
