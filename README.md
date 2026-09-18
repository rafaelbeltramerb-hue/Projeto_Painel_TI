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
4. `supabase-fase1-seguranca.sql` — Fase 1 do roteiro: consulta para localizar os `id` dos usuários e cadastrá-los como admin, restringe a categoria **SENHAS** a usuários autenticados (antes era pública), e traz um script opcional (com preview) para padronizar o formato de URL dos atalhos.
5. `supabase-fase2-melhorias.sql` — Fase 2: cria `recent_access` (histórico de "Recentes" sincronizado por conta) e a função `report_broken_link()` (permite qualquer pessoa logada reportar um atalho com problema, sem precisar de permissão de admin).
6. `supabase-migration-links.sql` — opcional, migra/atualiza os 30 atalhos originais da planilha.

> Se você já rodou o `supabase-content-schema.sql` antes (na versão sem a tabela `quick_links`), rode-o de novo — agora é seguro (idempotente) e vai só adicionar o que faltava.

Configure `js/supabase-config.js` com a Project URL e a chave pública (anon).

## Administração
`admin.html` usa Supabase Auth. Para que alguém tenha acesso de fato (com as políticas acima ativas), crie o usuário em **Authentication > Users** e depois rode:
```sql
insert into public.profiles (id, role) values ('<uuid-do-usuario>', 'admin')
on conflict (id) do update set role = 'admin';
```
Sem isso, o login funciona mas as gravações são bloqueadas pelo RLS (comportamento esperado). A partir da Fase 1, o próprio `admin.html` avisa na tela (com o comando pronto, incluindo o `id`) quando o usuário logado ainda não está cadastrado como admin.

## Modo Local
Se `js/supabase-config.js` não estiver configurado, o admin opera em "Modo Local": tudo é salvo no `localStorage` do navegador, útil para testar antes de configurar o Supabase.

## Fase 2 — o que mudou
- **Menu lateral do dashboard** agora é editável em `admin.html` → aba "Menu Lateral (Painel)" (tabela `quick_links`). Sem Supabase configurado, mantém os 3 itens padrão do HTML.
- **Tema claro/escuro** consistente em todas as páginas (`index.html`, `dashboard.html`, `login.html`, `index_antigo.html`, `admin.html`), com a mesma preferência salva (`localStorage: pti_theme`).
- **Favoritos** funcionam mesmo sem login (ficam só no navegador) e sincronizam entre dispositivos quando a pessoa está autenticada.
- **Recentes** também sincronizam por conta quando logado (tabela `recent_access`), com fallback local.
- **Reportar link quebrado**: qualquer pessoa logada pode marcar um atalho com o ícone ⚑ no card. Isso aparece como aviso (⚠ Reportado) na lista de atalhos do `admin.html`, com um botão para marcar como resolvido.
