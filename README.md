# Portal TI — Xanxerê

Projeto para substituir a planilha **Controle Geral.xlsx** por um portal web publicado no GitHub Pages.

## O que já está implementado

- 11 categorias e 30 atalhos migrados da planilha.
- Busca por múltiplos termos.
- Filtros por categoria.
- Acesso rápido com favoritos e recentes.
- Modo claro/escuro.
- Fallback local: funciona mesmo antes de configurar o Supabase.
- Integração opcional com Supabase.
- Administração com login.
- Cadastro, edição e exclusão de atalhos.
- Cadastro de categorias.
- Row Level Security (RLS) para proteger o banco.

## Estrutura

```text
portal-ti-xanxere/
├── index.html
├── admin.html
├── README.md
├── supabase-schema.sql
├── assets/
│   └── favicon.svg
├── css/
│   └── style.css
└── js/
    ├── data.js
    ├── app.js
    ├── admin.js
    ├── supabase-config.js
    ├── supabase-config.example.js
    └── supabase-client.js
```

# ETAPA 1 — GitHub Pages

A primeira publicação já foi feita pelo usuário e o site está funcionando.

# ETAPA 2 — Links da rede interna

O GitHub Pages é HTTPS. O navegador não deve depender de `file://`, `K:\` ou `\\servidor\pasta` para abrir os documentos.

A solução recomendada é disponibilizar as pastas/documentos por uma URL HTTP/HTTPS interna, por exemplo:

```text
https://arquivos.interno.unoesc.edu.br/
```

Depois edite `js/supabase-config.js`:

```javascript
window.PORTAL_CONFIG = {
  internalFilesBaseUrl: '',
  networkShareMappings: {
    '\\\\arquivos\\ti': 'https://arquivos.interno.unoesc.edu.br/G_Xanxere_TI',
    'K:\\TI': 'https://arquivos.interno.unoesc.edu.br/TI'
  }
};
```

Para caminhos relativos da planilha (ex.: `../Manuais/...`), prefira editar o atalho pela tela administrativa e informar a URL HTTPS final do documento/pasta.

## Por que isso é necessário?

Uma página publicada em `https://...github.io` não deve depender de acesso local `file://` ou de caminhos SMB/Windows. O navegador também pode bloquear navegação de uma página HTTPS para recursos locais.

Se o servidor de arquivos já tiver uma interface web/HTTPS, use a URL dessa interface. Caso não tenha, a TI pode disponibilizar um pequeno serviço web interno/reverse proxy para leitura dos documentos.

# ETAPA 3 — Criar o projeto Supabase

1. Entre no Supabase.
2. Crie um novo projeto.
3. Abra o projeto.
4. Abra o **SQL Editor**.
5. Crie uma nova consulta.
6. Copie TODO o conteúdo de `supabase-schema.sql`.
7. Execute.
8. Confira no **Table Editor** se foram criadas:
   - `categories`
   - `links`
   - `profiles`
   - `favorites`

O script já cria as categorias e migra os 30 atalhos.

## Segurança

O banco utiliza Row Level Security. Visitantes podem consultar somente categorias/atalhos ativos. Alterações são permitidas somente para usuários autenticados cujo perfil tenha `role = 'admin'`.

**Nunca coloque uma chave `service_role` no JavaScript do GitHub Pages.** No navegador use somente a chave pública/publishable/anon.

# ETAPA 4 — Criar o usuário administrador

No Supabase:

1. Vá para **Authentication → Users**.
2. Crie o usuário administrador com e-mail e senha.
3. Copie o UUID desse usuário.
4. No SQL Editor execute:

```sql
update public.profiles
set role = 'admin'
where id = 'UUID-DO-USUARIO';
```

O trigger do banco cria automaticamente o registro em `profiles` como `user` quando o usuário é criado.

# ETAPA 5 — Configurar o JavaScript

Abra:

```text
js/supabase-config.js
```

Preencha:

```javascript
window.SUPABASE_CONFIG = {
  url: 'https://SEU-PROJETO.supabase.co',
  anonKey: 'SUA_PUBLISHABLE_KEY'
};
```

A URL e a chave pública ficam disponíveis no painel do projeto Supabase.

A chave pública/publishable pode ser usada no navegador quando o banco está corretamente protegido por RLS. **Não use `service_role`.**

# ETAPA 6 — Atualizar o GitHub

Envie para o mesmo repositório:

- `index.html`
- `admin.html`
- `supabase-schema.sql`
- `css/`
- `js/`
- `assets/`
- `README.md`

O GitHub Pages publicará automaticamente a nova versão.

# ETAPA 7 — Testar o portal

1. Abra o portal.
2. Confira se aparecem os 30 atalhos.
3. Confirme se as categorias estão corretas.
4. Clique em um atalho que já tenha URL HTTPS.
5. Teste favoritos.
6. Acesse `admin.html`.
7. Faça login com o usuário administrador.
8. Cadastre um atalho de teste.
9. Volte ao portal e confirme que ele apareceu.
10. Edite o atalho.
11. Exclua o atalho de teste.

# ETAPA 8 — Migração dos links internos

Os 30 registros foram preservados com os destinos originais da planilha. Alguns ainda são caminhos Windows/SMB ou relativos. Isso é intencional: não inventamos URLs que não existem.

Na administração, substitua gradualmente esses destinos por URLs HTTPS internas reais.

Exemplos:

```text
ANTES:
file:///\\arquivos\ti\G_Xanxere_TI\...

DEPOIS:
https://arquivos.interno.unoesc.edu.br/G_Xanxere_TI/...
```

ou:

```text
ANTES:
K:\TI\Manual.txt

DEPOIS:
https://arquivos.interno.unoesc.edu.br/TI/Manual.txt
```

# Observação sobre arquivos sensíveis

A categoria `SENHAS` contém documentos de acesso. Mesmo que o portal esteja publicado no GitHub Pages, o documento real deve permanecer protegido na rede institucional. Não coloque senhas ou arquivos confidenciais dentro do repositório GitHub.


## Correção da migração do Excel

O arquivo `supabase-migration-links.sql` deve ser executado depois do schema inicial. Ele preserva os 30 hyperlinks originais encontrados no arquivo Controle Geral.xlsx e corrige a categoria de cada atalho conforme a posição do quadro na planilha.

Os caminhos como `file:///\\arquivos...` e `file:///K:\TI...` são os destinos originais do Excel. Eles não devem ser convertidos em URLs fictícias.
