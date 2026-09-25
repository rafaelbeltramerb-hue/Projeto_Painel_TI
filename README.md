# Portal TI — Xanxerê

Portal para substituir a planilha de atalhos utilizada diariamente pela TI.

## Publicação
**Uso interno apenas, via rede local (`file://`), não GitHub Pages/https.** Copie a estrutura inteira para uma pasta compartilhada na rede (ex.: a mesma pasta `G_Xanxere_TI` onde já ficam os documentos, ou uma subpasta dedicada), e acesse abrindo o `index.html` direto por ali — seja por um atalho no desktop, pela barra de endereços do Explorador de Arquivos, ou por um link `file://\\arquivos\...\index.html`.

Isso importa porque o navegador **bloqueia por segurança** abrir arquivos locais/de rede (`file://`) quando o site está hospedado em `http://`/`https://` — mas essa regra não existe quando a própria página também é `file://`. Rodando assim, os atalhos de PDF, TXT e pastas abrem direto, sem precisar copiar caminho nem instalar nada.

Se um dia for necessário acesso via `https://` (ex.: GitHub Pages, para acesso fora da rede interna), esses tipos de atalho (PDF/TXT/pastas) voltam a ficar bloqueados pelo navegador — é uma limitação do próprio Chrome/Edge, não do código.

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

## Correção importante — caminhos de arquivo quebrados
Se algum atalho abrir com erro "Não foi possível encontrar...", rode `supabase-fix-link-paths.sql`. Esse era um bug **pré-existente** do `supabase-migration-links.sql` original do projeto (não introduzido pelas fases acima): 22 dos 30 atalhos foram migrados com o nome do arquivo sem a subpasta real (ex.: `NoBreak - Levantamento.xlsx` em vez de `Documentacao/TI-Administrativo/NoBreak - Levantamento.xlsx`), então só abriam certo enquanto o portal usava o `js/data.js` local — quebraram ao migrar para o Supabase. O script também já foi corrigido na fonte (`supabase-migration-links.sql`), então uma migração nova a partir de agora não reintroduz o problema.

## Correção importante — acentos quebrando links do Office, e arquivos que não abrem
Testado na rede da instituição (Fase 5), apareceram **dois bugs novos e distintos**, ambos pré-existentes no projeto original (não relacionados às fases anteriores).

**1) Excel/Word/PowerPoint/Visio abre mas mostra "não foi possível encontrar" o arquivo (acentos).**
Duas tentativas de correção por código (codificar o caminho em UTF-8, depois em Windows-1252/ANSI) **não resolveram** — confirmado em teste real nos dois casos. Isso indica que o protocolo do Office (`ms-word:`/`ms-excel:`/...) usado pra abrir o arquivo direto no programa **não decodifica nenhum tipo de codificação de acento** — trata o texto depois de "ofe|u|" como caminho literal, sempre. Não é um bug de código que dê pra resolver só com JavaScript: o atalho "Levantamento Equipamentos Xanxerê" sempre funcionou não porque usa uma técnica diferente, mas porque o nome do arquivo (`Levantamento equipamento XXE.xlsx`) simplesmente não tem nenhum acento.

**A solução, sem instalar nada:** renomear os arquivos/pastas no servidor pra tirar os acentos (ex.: "Instalação" → "Instalacao"), e atualizar a URL salva no Portal TI pra bater com o novo nome — exatamente o mesmo caminho que já funciona pros atalhos sem acento, sem nenhuma técnica especial. Rode `supabase-atalhos-com-acento.sql` pra ver a lista completa de atalhos afetados (nome do link + caminho salvo). Depois de renomear os arquivos, atualize a `url` de cada um em `admin.html` (aba Atalhos → editar).

**2) Atalho simplesmente não abre (PDF, TXT, pastas).**
Isso só acontecia por causa do bloqueio de segurança do navegador quando o site está em `https://` — como o uso é só na rede interna via `file://` (ver "Publicação" acima), esse bloqueio não existe, e esses atalhos voltaram a abrir direto, igual antes de migrar. Se algum dia o portal for acessado via `https://`, essa parte volta a depender de copiar o caminho manualmente.

## Modo Local
Se `js/supabase-config.js` não estiver configurado, o admin opera em "Modo Local": tudo é salvo no `localStorage` do navegador, útil para testar antes de configurar o Supabase.

## Fase 2 — o que mudou
- **Menu lateral do dashboard** agora é editável em `admin.html` → aba "Menu Lateral (Painel)" (tabela `quick_links`). Sem Supabase configurado, mantém os 3 itens padrão do HTML.
- **Tema claro/escuro** consistente em todas as páginas (`index.html`, `dashboard.html`, `login.html`, `index_antigo.html`, `admin.html`), com a mesma preferência salva (`localStorage: pti_theme`).
- **Favoritos** funcionam mesmo sem login (ficam só no navegador) e sincronizam entre dispositivos quando a pessoa está autenticada.
- **Recentes** também sincronizam por conta quando logado (tabela `recent_access`), com fallback local.
- **Reportar link quebrado**: qualquer pessoa logada pode marcar um atalho com o ícone ⚑ no card. Isso aparece como aviso (⚠ Reportado) na lista de atalhos do `admin.html`, com um botão para marcar como resolvido.

## Fase 4.1 — Avisos no site público
- Nova tabela `announcements` (rode `supabase-fase4-1-avisos.sql`).
- Banner no topo do `index.html` e do `index_antigo.html` (painel interno) — some ao clicar em "×" (fica lembrado por navegador em `localStorage`), volta a aparecer se for um aviso novo.
- Gerenciado pela nova aba "Avisos" no `admin.html`: título, mensagem, nível (informativo azul / atenção amarelo / crítico vermelho), período de início/fim opcional, ativo/inativo.

## Fase 4.1.1 — Ajustes de navegação e layout do painel
- **Administração** deixou de ser um item separado no menu lateral e no topo do `index_antigo.html` — agora é um subitem de "Painel da TI" na sidebar (`dashboard.html`), um único caminho de acesso.
- A checagem de sessão (`admin.html` e `dashboard.html`) agora tenta primeiro `getSession()` (leitura local, rápida) antes de `getUser()` (que revalida com o servidor) — reduz qualquer chance de pedir login de novo por causa de rede lenta, já que a sessão é a mesma criada em `login.html`.
- O painel "Acesso aos arquivos e pastas mais utilizados" foi removido do `index_antigo.html`; os botões Favoritos/Recentes/Todos foram para a seção "Filtros", ao lado de "Todos os atalhos".
- No topo do `admin.html`, a setinha "←" e o botão "Sair" eram redundantes — ficou só a setinha, e agora ela leva para "Painel da TI" (`index_antigo.html`) em vez do site público.
- Card dos atalhos: o botão "Abrir" (que só aparecia no hover) foi removido — o card inteiro (inclusive o ícone) já abria o atalho, então o botão era redundante. O ícone agora reage visualmente ao passar o mouse/clicar, reforçando que ali é onde se clica.
- Favoritar (☆) e reportar (⚑) foram de "empilhados no canto superior direito, por cima do ícone" para "um em cada canto superior do card" — não disputam mais espaço visual com o ícone.

## Fase 3 — o que mudou
- **Ícones dos atalhos estilo iOS**: os ícones de categoria no painel (`index_antigo.html`) agora têm visual de ícone de app (squircle, gradiente por categoria, brilho sutil), em vez do ícone de linha simples de antes. **Depois refinado**: cada atalho ganhou ícone e cor **próprios** com base em palavras-chave do nome (não só da categoria) — assim itens diferentes de uma mesma categoria ampla como "Administrativo" não ficam mais idênticos entre si. Glifos preenchidos com detalhe em dois tons (via `--ico-shade`), squircle real via `clip-path`, e uma repaginação geral de todo o layout (paleta iOS, cards viraram tiles de home screen, chips e o seletor Favoritos/Recentes/Todos viraram segmented control, abas do admin também).
- **Otimização de imagens**: qualquer imagem enviada pelos formulários de Conteúdo do Site (História, Locais, Wi-Fi, Contato) é redimensionada e comprimida no navegador antes do envio (máx. 1280px, JPEG ~82% de qualidade), para não inflar o Storage com fotos de celular em resolução cheia.
- **Backup/exportação**: botão "⬇ Exportar backup (JSON)" no topo do `admin.html` baixa categorias, atalhos, conteúdo do site e menu lateral num único arquivo `.json` — útil como salvaguarda antes de mexer no Supabase.
- **Página 404 amigável**: `404.html` na raiz, reconhecida automaticamente pelo GitHub Pages.
- **Dependência externa documentada**: o link "Reservas Agenda" do menu lateral aponta para outro repositório GitHub Pages do mesmo autor (`Projeto_Reserva_Agenda`) — se esse repositório for renomeado/removido, o link quebra e precisa ser atualizado na aba "Menu Lateral (Painel)" do admin.

### Checklist de teste de RLS (Fase 3, item 1)
Não dá para simular um usuário "comum" direto no SQL Editor do Supabase (ele roda com privilégio de service role, que ignora RLS). Para testar de verdade:
1. Crie um usuário de teste em **Authentication > Users** e **não** rode o `insert into profiles (role='admin')` para ele.
2. Abra o `login.html` do site publicado (ou local) numa aba anônima e entre com esse usuário de teste.
3. Confirme que consegue **ler** os atalhos normalmente, mas que `admin.html` mostra o aviso de "sem permissão de gravação" e nenhuma edição é salva.
4. Confirme que a categoria **SENHAS** só aparece depois de logado (teste também deslogado, direto no `index_antigo.html`, se ele for aberto fora do fluxo de login).
5. Depois do teste, pode excluir esse usuário em Authentication > Users.
