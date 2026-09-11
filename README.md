# Portal TI — Xanxerê

Versão preparada para substituir a planilha `Controle Geral.xlsx`. A migração foi conferida diretamente no desenho do Excel: **42 textos/objetos**, sendo 1 título, 11 categorias e 30 atalhos. Os **nomes e destinos dos hyperlinks foram preservados**.

## O que já funciona
- Portal responsivo em HTML/CSS/JavaScript puro.
- 11 categorias e 30 atalhos migrados.
- Busca por nome, categoria, descrição e destino.
- Filtros por categoria.
- Favoritos persistidos no navegador.
- Acessos recentes persistidos no navegador.
- Tema claro/escuro.
- Área inicial de administração.
- Estrutura SQL para futura migração ao Supabase.

## Publicar no GitHub Pages
1. Crie um repositório no GitHub.
2. Copie **todo o conteúdo desta pasta** para a raiz do repositório.
3. Vá em Settings → Pages.
4. Em Build and deployment selecione `Deploy from a branch`.
5. Branch `main` e pasta `/ (root)`.
6. Salve.

O arquivo `index.html` é a entrada do site. Não envie somente o index: mantenha `css/`, `js/` e `assets/`.

## Supabase — próxima etapa
1. Crie um projeto no Supabase.
2. Execute `supabase-schema.sql`.
3. Copie `js/supabase-config.example.js` para `js/supabase-config.js`.
4. Informe a URL do projeto e a chave pública `anon`.
5. Nunca coloque `service_role` no código ou no GitHub.
6. A administração poderá então ser evoluída para autenticação, inclusão, edição, exclusão, ordenação e ativação/desativação de atalhos.

## Atenção aos caminhos de rede
A planilha original utiliza destinos como `file://\\arquivos\ti\...`, `K:\TI\...` e links relativos. O projeto preserva esses destinos, mas o GitHub Pages não hospeda os arquivos da rede e navegadores modernos podem bloquear/limitar `file://`, UNC e caminhos relativos quando a página está hospedada na internet.

Para uso institucional, recomendo na próxima fase criar uma camada HTTP/HTTPS interna para os documentos (servidor web, SharePoint, Nextcloud ou serviço equivalente). O portal poderá então apontar para URLs HTTPS confiáveis.
