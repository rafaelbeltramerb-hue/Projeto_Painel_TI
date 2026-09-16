# Portal TI — Xanxerê

Portal para substituir a planilha de atalhos utilizada diariamente pela TI.

## Publicação
Envie a estrutura inteira para a raiz do repositório GitHub e publique pelo GitHub Pages (`main` / `/ (root)`).

## Fluxo de páginas
- `index.html` — página pública (História, Locais Atendidos, Wi-Fi, Contato).
- `login.html` — login da "Área Restrita" (Supabase Auth). Redireciona para `dashboard.html`.
- `dashboard.html` — shell com menu lateral (colapsável/redimensionável) + `index_antigo.html` carregado em iframe.
- `index_antigo.html` — o painel de atalhos em si (busca, favoritos, categorias), alimentado por `js/data.js` ou pelas tabelas do Supabase.
- `admin.html` — administração: aba **Atalhos** (categorias/links) e aba **Conteúdo do Site** (História, Locais, Wi-Fi, Contato, com upload de imagem).

## Arquivos internos
Os destinos dos atalhos são preservados. O portal aceita `file://`, UNC, caminhos Windows, HTTP/HTTPS e caminhos relativos. A raiz atual é `file://arquivos/ti/G_Xanxere_TI/`.

## Supabase — ordem de execução dos scripts SQL
1. `supabase-schema.sql` — schema base (categories/links/profiles/favorites). **Se já foi executado antes, não rode de novo.**
2. `supabase-admin-policies-fix.sql` — corrige uma lacuna do schema original: não existiam políticas de INSERT/UPDATE/DELETE para `categories`/`links`, então a administração só gravava em "Modo Local". Seguro rodar mesmo se o schema já estiver em produção.
3. `supabase-content-schema.sql` — cria `site_content` e `site_cards` (usados pela aba "Conteúdo do Site" do admin) e o bucket de imagens `site-images`.
4. `supabase-migration-links.sql` — opcional, migra/atualiza os 30 atalhos originais da planilha.

Configure `js/supabase-config.js` com a Project URL e a chave pública (anon).

## Administração
`admin.html` usa Supabase Auth. Para que alguém tenha acesso de fato (com as políticas acima ativas), crie o usuário em **Authentication > Users** e depois rode:
```sql
insert into public.profiles (id, role) values ('<uuid-do-usuario>', 'admin')
on conflict (id) do update set role = 'admin';
```
Sem isso, o login funciona mas as gravações são bloqueadas pelo RLS (comportamento esperado).

## Modo Local
Se `js/supabase-config.js` não estiver configurado, o admin opera em "Modo Local": tudo é salvo no `localStorage` do navegador, útil para testar antes de configurar o Supabase.
