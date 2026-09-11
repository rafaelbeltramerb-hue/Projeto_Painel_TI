# Portal TI — Xanxerê

Portal para substituir a planilha de atalhos utilizada diariamente pela TI.

## Publicação
Envie a estrutura inteira para a raiz do repositório GitHub e publique pelo GitHub Pages (`main` / `/ (root)`).

## Arquivos internos
Os destinos dos atalhos são preservados. O portal aceita `file://`, UNC, caminhos Windows, HTTP/HTTPS e caminhos relativos. A raiz atual é `file://arquivos/ti/G_Xanxere_TI/`.

## Supabase
Se o schema inicial já foi executado, não execute `supabase-schema.sql` novamente. Configure `js/supabase-config.js` com a Project URL e a chave pública.

## Administração
`admin.html` usa Supabase Auth e `profiles.role = 'admin'`.
