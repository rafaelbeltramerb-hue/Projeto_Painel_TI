const S = {
  cat: '',
  q: '',
  mode: 'all',
  data: {
    categories: [],
    links: []
  },
  recent: JSON.parse(localStorage.getItem('pti_recent') || '[]'),
  favorites: JSON.parse(localStorage.getItem('pti_fav') || '[]'),
  dbFavorites: new Set(),
  usingDb: false,
  user: null
};

const $ = s => document.querySelector(s);

const esc = x =>
  String(x ?? '').replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[c])
  );


/* ============================================================
   ÍCONES SVG
   ============================================================ */

const categoryIconMap = new Map();

const ICONS = {

  'Manuais': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17H7.5A2.5 2.5 0 0 0 5 21.5V4.5Z"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linejoin="round"
      />
      <path
        d="M5 4.5V19a2.5 2.5 0 0 1 2.5-2.5H19"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
      />
    </svg>
  `,

  'Telefonia': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.2 3.8 4.8 5.2c-.9.5-1.3 1.6-.9 2.6
        2.2 5.6 6.7 10.1 12.3 12.3 1 .4 2.1 0 2.6-.9l1.4-2.4
        c.4-.7.2-1.6-.4-2l-3.1-2.1c-.6-.4-1.4-.3-1.9.2l-1.3 1.3
        a15.7 15.7 0 0 1-4.2-4.2l1.3-1.3c.5-.5.6-1.3.2-1.9
        L9.2 4.2c-.4-.6-1.3-.8-2-.4Z"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
    </svg>
  `,

  'Rede': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        stroke-width="1.7"
      />
      <path
        d="M3.8 12h16.4
        M12 3.5c2.1 2.3 3.2 5.1 3.2 8.5S14.1 18.2 12 20.5
        C9.9 18.2 8.8 15.4 8.8 12S9.9 5.8 12 3.5Z"
        stroke="currentColor"
        stroke-width="1.5"
      />
    </svg>
  `,

  'Softwares': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3.5"
        y="4"
        width="17"
        height="13"
        rx="2"
        stroke="currentColor"
        stroke-width="1.7"
      />
      <path
        d="M8 20h8M12 17v3
        M7.5 8h3M13.5 8h3M7.5 11.5h9"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>
  `,

  'Administrativo': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7.5h14v12H5z"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linejoin="round"
      />
      <path
        d="M8 7.5V5.8A1.8 1.8 0 0 1 9.8 4h4.4
        A1.8 1.8 0 0 1 16 5.8v1.7
        M8.5 12h7M8.5 15.5H13"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>
  `,

  'Termos': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 3.5h9l4 4v13H6z"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linejoin="round"
      />
      <path
        d="M15 3.5v4h4M9 12h6M9 15.5h6"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>
  `,

  'Reconhecimento de curso': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m12 3 2.2 4.5 5 .7-3.6 3.5.9 5
        -4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L12 3Z"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
    </svg>
  `,

  'Planejamento': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="5.5"
        width="16"
        height="15"
        rx="2"
        stroke="currentColor"
        stroke-width="1.7"
      />
      <path
        d="M8 3.5v4M16 3.5v4M4 9.5h16
        M8 13h3M13 13h3M8 16.5h3"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>
  `,

  'SENHAS': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="8.5"
        cy="14.5"
        r="3.5"
        stroke="currentColor"
        stroke-width="1.7"
      />
      <path
        d="m11.5 12 7.5-7.5M16 5l3 3
        M14.5 9.5l2 2"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,

  'Datashow': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="5"
        width="16"
        height="12"
        rx="2"
        stroke="currentColor"
        stroke-width="1.7"
      />
      <path
        d="M9 20h6M12 17v3"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
      />
    </svg>
  `,

  'Contratos OBC': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 5.5h9l5 5v8H5z"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linejoin="round"
      />
      <path
        d="M14 5.5v5h5M8 14h8M8 17h5"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>
  `,

  'default': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 7.5h7l1.8 2h8.2v9a2 2 0 0 1-2 2h-13
        a2 2 0 0 1-2-2v-11Z"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linejoin="round"
      />
      <path
        d="M3.5 9.5h17"
        stroke="currentColor"
        stroke-width="1.5"
      />
    </svg>
  `
};


function getCategoryIcon(c) {

  const custom = categoryIconMap.get(c);

  if (
    custom &&
    String(custom).trim().startsWith('<svg')
  ) {
    return custom;
  }

  return ICONS[c] || ICONS.default;
}


/* ============================================================
   DADOS
   ============================================================ */

function processData(cats, links) {

  const catNames = [];

  (cats || []).forEach(c => {

    if (typeof c === 'string') {

      catNames.push(c);

    } else if (c && typeof c === 'object') {

      if (c.name) {

        catNames.push(c.name);

        if (c.icon) {
          categoryIconMap.set(c.name, c.icon);
        }

      }

    }

  });


  return {

    categories: [...new Set(catNames)],

    links: (links || [])
      .filter(l => l.active !== false)
      .map(l => {

        const catName =
          typeof l.category === 'string'
            ? l.category
            : (
              l.category_name ||
              l.categories?.name ||
              'Sem categoria'
            );

        return {
          ...l,
          category: catName,
          url_original: l.url_original || l.url || ''
        };

      })

  };

}


/* ============================================================
   LOCAL STORAGE
   ============================================================ */

function saveLocal() {

  localStorage.setItem(
    'pti_recent',
    JSON.stringify(S.recent)
  );

  localStorage.setItem(
    'pti_fav',
    JSON.stringify(S.favorites)
  );

}


/* ============================================================
   TOAST
   ============================================================ */

function toast(msg) {

  const t = $('#toast');

  if (!t) return;

  t.textContent = msg;

  t.hidden = false;
  t.style.display = 'block';

  clearTimeout(window.__toast);

  window.__toast = setTimeout(() => {

    t.hidden = true;
    t.style.display = 'none';

  }, 3500);

}


/* ============================================================
   FAVORITOS
   ============================================================ */

function isFav(x) {

  const idStr = String(x.id);

  return (S.usingDb && S.user)
    ? S.dbFavorites.has(idStr)
    : S.favorites.includes(idStr);

}


/* ============================================================
   RESOLUÇÃO DE URL
   ============================================================ */

function resolveUrl(x) {

  let u = String(
    x.url_original ||
    x.url ||
    ''
  ).trim();

  if (!u) return null;


  if (/^https?:\/\//i.test(u)) {
    return u;
  }


  if (/^[A-Za-z]:[\\/]/.test(u)) {

    return 'file:///' +
      u.replace(/\\/g, '/');

  }


  if (/^\\\\/.test(u)) {

    return 'file://' +
      u
        .replace(/^\\\\+/, '')
        .replace(/\\/g, '/');

  }


  if (/^file:\/\//i.test(u)) {

    let rest =
      u.replace(/^file:\/+/i, '');

    rest =
      rest
        .replace(/^\\\\+/, '')
        .replace(/\\/g, '/');

    if (/^[A-Za-z]:/.test(rest)) {

      return 'file:///' + rest;

    }

    return 'file://' +
      rest.replace(/^\/+/, '');

  }


  const cfg =
    window.PORTAL_CONFIG || {};

  let root =
    String(cfg.networkRoot || '').trim();


  if (root) {

    root =
      root.replace(/\\/g, '/');

    if (!root.endsWith('/')) {
      root += '/';
    }

    let cleanRel =
      u
        .replace(/\\/g, '/')
        .replace(/^\.\//, '');

    try {

      return new URL(
        cleanRel,
        root
      ).href;

    } catch (e) {

      return root + cleanRel;

    }

  }


  return u;

}


/* ============================================================
   OFFICE PROTOCOL
   ============================================================ */

function officeProtocolUrl(url) {

  let path =
    String(url || '').trim();

  if (!path) return null;


  const lower =
    path.toLocaleLowerCase('pt-BR');


  let protocol = null;


  if (
    /\.(xlsx|xls|xlsm|xlsb|csv)$/i.test(lower)
  ) {

    protocol =
      'ms-excel:ofe|u|';

  } else if (
    /\.(docx|doc|docm|rtf)$/i.test(lower)
  ) {

    protocol =
      'ms-word:ofe|u|';

  } else if (
    /\.(pptx|ppt|pptm|ppsx|pps)$/i.test(lower)
  ) {

    protocol =
      'ms-powerpoint:ofe|u|';

  }


  if (!protocol) {
    return null;
  }


  if (/^file:\/\//i.test(path)) {

    path =
      path.replace(
        /^file:\/+/i,
        ''
      );

    path =
      path.replace(/^\\+/, '');


    if (/^[A-Za-z]:[\\/]/.test(path)) {

      path =
        path.replace(/\//g, '\\');

    } else {

      path =
        '\\\\' +
        path.replace(/\//g, '\\');

    }

  }


  if (/^\\\\/.test(path)) {

    const fileUrl =
      'file://' +
      path
        .replace(/^\\\\+/, '')
        .replace(/\\/g, '/');

    return protocol + fileUrl;

  }


  if (/^[A-Za-z]:[\\/]/.test(path)) {

    const fileUrl =
      'file:///' +
      path.replace(/\\/g, '/');

    return protocol + fileUrl;

  }


  const cfg =
    window.PORTAL_CONFIG || {};

  let root =
    String(cfg.networkRoot || '').trim();


  if (root) {

    root =
      root.replace(/\\/g, '/');

    if (!root.endsWith('/')) {
      root += '/';
    }

    const relative =
      path
        .replace(/\\/g, '/')
        .replace(/^\.\//, '');

    return (
      protocol +
      'file://' +
      (
        root + relative
      )
        .replace(/^file:\/+/i, '')
        .replace(/^\/+/, '')
    );

  }


  return null;

}


/* ============================================================
   ABRIR ATALHO
   ============================================================ */

function openItem(x) {

  const raw =
    String(
      x.url_original ||
      x.url ||
      ''
    ).trim();


  if (!raw) {

    toast(
      'Este atalho ainda precisa de uma URL HTTP/HTTPS ou caminho válido.'
    );

    return;

  }


  const idStr =
    String(x.id);


  S.recent = [
    idStr,
    ...S.recent.filter(
      v => String(v) !== idStr
    )
  ].slice(0, 8);


  saveLocal();

  renderQuick();


  if (S.usingDb && S.user && window.portalSupabase) {

    portalSupabase
      .from('recent_access')
      .upsert(
        { user_id: S.user.id, link_id: x.id, accessed_at: new Date().toISOString() },
        { onConflict: 'user_id,link_id' }
      )
      .then(({ error }) => {
        if (error) console.warn('Não foi possível sincronizar recentes.', error);
      });

  }


  const url =
    resolveUrl(x);


  if (!url) {

    toast(
      'Não foi possível resolver o caminho deste atalho.'
    );

    return;

  }


  if (
    /^https?:\/\//i.test(url)
  ) {

    window.open(
      url,
      '_blank',
      'noopener'
    );

    return;

  }


  const officeUrl =
    officeProtocolUrl(url);


  if (officeUrl) {

    const a =
      document.createElement('a');

    a.href = officeUrl;
    a.target = '_self';
    a.rel = 'noopener';

    a.style.display = 'none';

    document.body.appendChild(a);

    a.click();

    setTimeout(
      () => a.remove(),
      1000
    );

    return;

  }


  window.open(
    url,
    '_blank',
    'noopener'
  );

}


/* ============================================================
   FILTRO
   ============================================================ */

function filtered() {

  let a = [
    ...S.data.links
  ];


  if (S.cat) {

    a =
      a.filter(
        x => x.category === S.cat
      );

  }


  if (S.mode === 'fav') {

    a =
      a.filter(isFav);

  }


  if (S.mode === 'recent') {

    a =
      a
        .filter(
          x =>
            S.recent.includes(
              String(x.id)
            )
        )
        .sort(
          (x, y) =>
            S.recent.indexOf(
              String(x.id)
            ) -
            S.recent.indexOf(
              String(y.id)
            )
        );

  }


  if (S.q) {

    const q =
      S.q.toLocaleLowerCase(
        'pt-BR'
      );

    const terms =
      q
        .split(/\s+/)
        .filter(Boolean);


    a =
      a.filter(x => {

        const searchBlob =
          `${x.name} ${x.category} ${x.description || ''} ${x.url_original || x.url || ''}`
            .toLocaleLowerCase(
              'pt-BR'
            );


        return terms.every(
          term =>
            searchBlob.includes(term)
        );

      });

  }


  return a;

}


/* ============================================================
   CARD
   ============================================================ */

function card(x) {

  const f =
    isFav(x);


  const raw =
    String(
      x.url_original ||
      x.url ||
      ''
    );


  const type =
    /^https?:\/\//i.test(raw)

      ? 'WEB'

      : (
        /^file:\/\//i.test(raw) ||
        /^[A-Za-z]:[\\/]/.test(raw) ||
        /^\\\\/.test(raw)
      )

        ? 'ARQUIVO / REDE'

        : 'INTERNO';


  const broken =
    !!x.reported_broken_at;


  return `
    <article
      class="card ${broken ? 'card-broken' : ''}"
      data-o="${esc(x.id)}"
    >

      <div class="ct">

        <span
          class="ico"
          aria-hidden="true"
        >
          ${getCategoryIcon(x.category)}
        </span>


        <div class="ct-actions">

          <button
            class="report-btn ${broken ? 'on' : ''}"
            data-r="${esc(x.id)}"
            title="${broken ? 'Já reportado com problema — clique para reportar de novo' : 'Reportar link quebrado'}"
            aria-label="Reportar link quebrado"
            type="button"
          >
            ⚑
          </button>

          <button
            class="star ${f ? 'on' : ''}"
            data-f="${esc(x.id)}"
            title="${f ? 'Remover favorito' : 'Adicionar favorito'}"
            aria-label="${f ? 'Remover favorito' : 'Adicionar favorito'}"
            type="button"
          >
            ${f ? '★' : '☆'}
          </button>

        </div>

      </div>


      <h3>
        ${esc(x.name)}
      </h3>

      ${broken ? '<p class="broken-badge">⚠ Reportado com problema recentemente</p>' : ''}

      <div class="cf">

        <small>
          ${type}
        </small>


        <button
          class="open-btn"
          data-o="${esc(x.id)}"
          type="button"
        >
          Abrir
          <span aria-hidden="true">↗</span>
        </button>

      </div>

    </article>
  `;

}


/* ============================================================
   ACESSO RÁPIDO
   ============================================================ */

function renderQuick() {

  const favList =
    (S.usingDb && S.user)
      ? Array.from(S.dbFavorites)
      : S.favorites;


  const ids =
    [
      ...favList,
      ...S.recent.filter(
        id =>
          !favList.includes(
            String(id)
          )
      )
    ].slice(0, 8);


  const a =
    ids
      .map(
        id =>
          S.data.links.find(
            x =>
              String(x.id) ===
              String(id)
          )
      )
      .filter(Boolean);


  const qg =
    $('#quickGrid');


  if (!qg) return;


  qg.innerHTML =
    a.length
      ? a.map(card).join('')
      : '';

}


/* ============================================================
   RENDER
   ============================================================ */

function render() {

  const a =
    filtered();


  const grid =
    $('#grid');

  const empty =
    $('#empty');

  const count =
    $('#count');

  const title =
    $('#sectionTitle');

  const chips =
    $('#chips');


  if (grid) {

    grid.innerHTML =
      a.map(card).join('');

  }


  if (empty) {

    empty.hidden =
      a.length > 0;

  }


  if (count) {

    count.textContent =
      `${a.length} ${
        a.length === 1
          ? 'atalho'
          : 'atalhos'
      }`;

  }


  if (title) {

    title.textContent =
      S.mode === 'fav'
        ? 'Favoritos'
        : S.mode === 'recent'
          ? 'Recentes'
          : S.cat ||
            'Todos os atalhos';

  }


  if (chips) {

    chips.innerHTML =
      S.data.categories
        .map(c => `
          <button
            class="chip ${S.cat === c ? 'sel' : ''}"
            data-c="${esc(c)}"
            type="button"
          >
            <span
              class="chip-icon"
              aria-hidden="true"
            >
              ${getCategoryIcon(c)}
            </span>

            ${esc(c)}
          </button>
        `)
        .join('');

  }


  renderQuick();

}


/* ============================================================
   FAVORITO
   ============================================================ */

async function toggleFavorite(x) {

  const idStr =
    String(x.id);


  if (!S.usingDb || !S.user) {

    // Sem Supabase configurado, ou sem login: favoritos ficam
    // salvos localmente neste navegador (mesmo comportamento de
    // antes, só que agora também se aplica a quem está usando o
    // portal sem estar logado, em vez de simplesmente bloquear).
    S.favorites =
      S.favorites.includes(idStr)

        ? S.favorites.filter(
            v => v !== idStr
          )

        : [
            ...S.favorites,
            idStr
          ];


    saveLocal();

    render();

    return;

  }


  if (!window.portalSupabase) {

    toast(
      'Supabase não inicializado.'
    );

    return;

  }


  const user = S.user;


  if (S.dbFavorites.has(idStr)) {

    const {
      error
    } =
      await portalSupabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('link_id', x.id);


    if (error) {

      toast(error.message);

    } else {

      S.dbFavorites.delete(
        idStr
      );

    }

  } else {

    const {
      error
    } =
      await portalSupabase
        .from('favorites')
        .insert({
          user_id: user.id,
          link_id: x.id
        });


    if (error) {

      toast(error.message);

    } else {

      S.dbFavorites.add(
        idStr
      );

    }

  }


  render();

}


/* ============================================================
   REPORTAR LINK QUEBRADO
   ============================================================ */

async function reportBroken(x) {

  if (!S.usingDb || !window.portalSupabase) {

    toast(
      'Disponível apenas com o Supabase configurado.'
    );

    return;

  }


  if (!S.user) {

    toast(
      'Entre com sua conta para reportar um link com problema.'
    );

    return;

  }


  if (
    !confirm(
      `Reportar "${x.name}" como link com problema? A equipe de TI será avisada no painel de administração.`
    )
  ) {
    return;
  }


  const { error } =
    await portalSupabase.rpc(
      'report_broken_link',
      { p_link_id: x.id }
    );


  if (error) {

    toast(
      'Não foi possível reportar (a função pode ainda não estar configurada no banco).'
    );

    console.error(error);

    return;

  }


  x.reported_broken_at =
    new Date().toISOString();


  toast('Obrigado! Reportado para a equipe de TI.');

  render();

}


/* ============================================================
   SUPABASE
   ============================================================ */

async function loadDb() {

  if (
    !window.supabaseReady ||
    !window.portalSupabase
  ) {
    return false;
  }


  try {

    const [
      {
        data: cats,
        error: e1
      },
      {
        data: links,
        error: e2
      }
    ] =
      await Promise.all([

        portalSupabase
          .from('categories')
          .select('*')
          .eq('active', true)
          .order('sort_order'),

        portalSupabase
          .from('links')
          .select(
            '*, categories(name)'
          )
          .eq('active', true)
          .order('sort_order')

      ]);


    if (
      e1 ||
      e2 ||
      !cats ||
      !links
    ) {
      return false;
    }


    S.data =
      processData(
        cats,
        links
      );


    S.usingDb =
      true;


    const {
      data: {
        user
      }
    } =
      await portalSupabase.auth.getUser();


    S.user = user || null;


    if (user) {

      const {
        data: f
      } =
        await portalSupabase
          .from('favorites')
          .select('link_id')
          .eq(
            'user_id',
            user.id
          );


      S.dbFavorites =
        new Set(
          (f || []).map(
            v =>
              String(v.link_id)
          )
        );


      try {

        const { data: r } =
          await portalSupabase
            .from('recent_access')
            .select('link_id')
            .eq('user_id', user.id)
            .order('accessed_at', { ascending: false })
            .limit(8);

        if (r && r.length) {
          S.recent = r.map(v => String(v.link_id));
        }

      } catch (err) {

        // Tabela recent_access pode ainda não existir (Fase 2 não aplicada) — ignora e mantém o histórico local.
        console.warn('recent_access indisponível, mantendo histórico local.', err);

      }

    }


    return true;

  } catch (err) {

    console.error(
      'Erro ao carregar Supabase:',
      err
    );

    return false;

  }

}


/* ============================================================
   MODO LOCAL
   ============================================================ */

function loadLocal() {

  const savedCats =
    JSON.parse(
      localStorage.getItem(
        'pti_local_cats'
      ) || 'null'
    );


  const savedLinks =
    JSON.parse(
      localStorage.getItem(
        'pti_local_links'
      ) || 'null'
    );


  const baseData =
    window.portalData ||
    (
      typeof portalData !== 'undefined'
        ? portalData
        : {
            categories: [],
            links: []
          }
    );


  let cats =
    savedCats ||
    baseData.categories ||
    [];


  let links =
    savedLinks ||
    baseData.links ||
    [];


  if (
    savedCats &&
    savedLinks
  ) {

    links =
      links.map(l => {

        if (
          !l.category &&
          l.category_id
        ) {

          const foundCat =
            cats.find(
              c =>
                String(c.id) ===
                String(l.category_id)
            );


          if (foundCat) {

            l.category =
              foundCat.name;

          }

        }


        return l;

      });

  }


  S.data =
    processData(
      cats,
      links
    );

}


/* ============================================================
   EVENTOS
   ============================================================ */

document.addEventListener(
  'click',
  e => {

    const r =
      e.target.closest(
        '[data-r]'
      );


    if (r) {

      e.stopPropagation();


      const x =
        S.data.links.find(
          v =>
            String(v.id) ===
            String(r.dataset.r)
        );


      if (x) {
        reportBroken(x);
      }


      return;

    }


    const f =
      e.target.closest(
        '[data-f]'
      );


    if (f) {

      e.stopPropagation();


      const x =
        S.data.links.find(
          v =>
            String(v.id) ===
            String(f.dataset.f)
        );


      if (x) {
        toggleFavorite(x);
      }


      return;

    }


    const o =
      e.target.closest(
        '[data-o]'
      );


    if (o) {

      const x =
        S.data.links.find(
          v =>
            String(v.id) ===
            String(o.dataset.o)
        );


      if (x) {
        openItem(x);
      }


      return;

    }


    const c =
      e.target.closest(
        '[data-c]'
      );


    if (c) {

      S.cat =
        S.cat === c.dataset.c
          ? ''
          : c.dataset.c;


      S.mode =
        'all';


      render();

    }

  }
);


/* ============================================================
   PESQUISA
   ============================================================ */

$('#q')?.addEventListener(
  'input',
  e => {

    S.q =
      e.target.value;

    S.cat =
      '';

    S.mode =
      'all';

    render();

  }
);


$('#clear')?.addEventListener(
  'click',
  () => {

    if ($('#q')) {
      $('#q').value = '';
    }

    S.q = '';

    render();

    $('#q')?.focus();

  }
);


/* ============================================================
   MODOS
   ============================================================ */

$('#favoritesBtn')?.addEventListener(
  'click',
  () => {

    S.mode = 'fav';
    S.cat = '';

    render();

  }
);


$('#recentBtn')?.addEventListener(
  'click',
  () => {

    S.mode = 'recent';
    S.cat = '';

    render();

  }
);


$('#allBtn')?.addEventListener(
  'click',
  () => {

    S.mode = 'all';
    S.cat = '';

    if ($('#q')) {
      $('#q').value = '';
    }

    S.q = '';

    render();

  }
);


/* ============================================================
   TEMA
   ============================================================ */

$('#theme')?.addEventListener(
  'click',
  () => {

    const isDark =
      document.documentElement
        .dataset.theme === 'dark';


    const newTheme =
      isDark
        ? 'light'
        : 'dark';


    document.documentElement
      .dataset.theme =
      newTheme;


    localStorage.setItem(
      'pti_theme',
      newTheme
    );

  }
);


/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */

(async () => {

  const savedTheme =
    localStorage.getItem(
      'pti_theme'
    );


  if (savedTheme) {

    document.documentElement
      .dataset.theme =
      savedTheme;

  }


  loadLocal();

  await loadDb();


  const footerInfo =
    $('#footerInfo');


  if (footerInfo) {

    footerInfo.textContent =
      `${S.data.links.length} atalhos · ` +
      `${S.data.categories.length} categorias` +
      (
        S.usingDb
          ? ' · Supabase conectado'
          : ' · Modo local'
      );

  }


  render();

})();
