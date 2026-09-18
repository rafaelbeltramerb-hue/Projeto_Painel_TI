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
   CORES DOS ÍCONES (estilo "ícone de app" — iOS)
   ============================================================ */

const CATEGORY_GRADIENTS = {
  'Administrativo': ['#5b93ff', '#2f5fe0'],
  'Rede': ['#33d1c9', '#0ea5b7'],
  'Manuais': ['#ffb054', '#f2802f'],
  'Telefonia': ['#5fdb8e', '#22a85e'],
  'Softwares': ['#b18cff', '#7c5cf0'],
  'Termos': ['#aab2c0', '#7c8698'],
  'Reconhecimento de curso': ['#6fa8ff', '#3d63e8'],
  'Planejamento': ['#ff7fc0', '#e5399e'],
  'SENHAS': ['#ff8a80', '#e6483f'],
  'Datashow': ['#ffd469', '#f5a524'],
  'Contratos OBC': ['#d4a373', '#a9784a'],
  'default': ['#9aa4b2', '#707c8c']
};

function getCategoryGradient(name) {

  const key = String(name || '').trim();

  if (CATEGORY_GRADIENTS[key]) {
    return CATEGORY_GRADIENTS[key];
  }

  // Categoria criada pelo admin sem cor definida: gera uma cor
  // estável a partir do nome, para sempre cair na mesma cor.
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }

  const hue = hash % 360;

  return [
    `hsl(${hue}, 78%, 68%)`,
    `hsl(${hue}, 70%, 48%)`
  ];
}

function iconStyle(name) {

  const [from, to] =
    getCategoryGradient(name);

  return (
    `background: linear-gradient(155deg, ${from}, ${to});`
  );

}


/* ============================================================
   ÍCONES SVG
   ============================================================ */

const categoryIconMap = new Map();

const ICONS = {

  'Manuais': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" d="M4 5.2c0-.9.8-1.6 1.7-1.4C7.6 4.1 9.8 4.8 11.3 6v12.8c-1.5-1.1-3.6-1.7-5.5-2-.9-.1-1.8-1-1.8-1.9V5.2Z"/>
      <path fill="currentColor" d="M20 5.2c0-.9-.8-1.6-1.7-1.4-1.9.3-4.1 1-5.6 2.2v12.8c1.5-1.1 3.6-1.7 5.5-2 .9-.1 1.8-1 1.8-1.9V5.2Z"/>
    </svg>
  `,

  'Telefonia': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" d="M7.2 3.8 4.8 5.2c-.9.5-1.3 1.6-.9 2.6
        2.2 5.6 6.7 10.1 12.3 12.3 1 .4 2.1 0 2.6-.9l1.4-2.4
        c.4-.7.2-1.6-.4-2l-3.1-2.1c-.6-.4-1.4-.3-1.9.2l-1.3 1.3
        a15.7 15.7 0 0 1-4.2-4.2l1.3-1.3c.5-.5.6-1.3.2-1.9
        L9.2 4.2c-.4-.6-1.3-.8-2-.4Z"/>
    </svg>
  `,

  'Rede': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="17" r="1.6" fill="currentColor"/>
      <path fill="currentColor" d="M8.8 13.7a4.7 4.7 0 0 1 6.4 0 1 1 0 0 1-1.35 1.47
        2.7 2.7 0 0 0-3.7 0 1 1 0 1 1-1.35-1.47Z"/>
      <path fill="currentColor" d="M5.6 10.3a9.2 9.2 0 0 1 12.8 0 1 1 0 1 1-1.4 1.44
        7.2 7.2 0 0 0-10 0 1 1 0 1 1-1.4-1.44Z"/>
    </svg>
  `,

  'Softwares': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7.2" height="7.2" rx="2" fill="currentColor"/>
      <rect x="13.3" y="3.5" width="7.2" height="7.2" rx="2" fill="currentColor"/>
      <rect x="3.5" y="13.3" width="7.2" height="7.2" rx="2" fill="currentColor"/>
      <rect x="13.3" y="13.3" width="7.2" height="7.2" rx="2" fill="currentColor"/>
    </svg>
  `,

  'Administrativo': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.3" y="7.5" width="17.4" height="12" rx="2.4" fill="currentColor"/>
      <path
        d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  `,

  'Termos': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5v16.8M7.5 20.3h9"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
      <path
        d="M12 6 5.5 7.8M12 6l6.5 1.8"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path fill="currentColor" d="M5.5 7.8 3 13a2.7 2.7 0 0 0 5 0L5.5 7.8Z"/>
      <path fill="currentColor" d="M18.5 7.8 16 13a2.7 2.7 0 0 0 5 0l-2.5-5.2Z"/>
    </svg>
  `,

  'Reconhecimento de curso': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" d="M12 3.3 2 8l10 4.3L20 9v4.3a1 1 0 1 0 2 0V8.6
        a1 1 0 0 0-.6-.9L12 3.3Z"/>
      <path fill="currentColor" d="M6 10.6v3.6c0 1.7 2.7 3.1 6 3.1s6-1.4 6-3.1v-3.6
        l-6 2.6-6-2.6Z"/>
    </svg>
  `,

  'Planejamento': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="14.5" rx="2.4" fill="currentColor"/>
      <rect x="7" y="3.5" width="1.8" height="4" rx=".9" fill="currentColor"/>
      <rect x="15.2" y="3.5" width="1.8" height="4" rx=".9" fill="currentColor"/>
    </svg>
  `,

  'SENHAS': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9.5" rx="2.4" fill="currentColor"/>
      <path
        d="M8 11V8a4 4 0 1 1 8 0v3"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  `,

  'Datashow': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="11.5" rx="2" fill="currentColor"/>
      <path
        d="M9 20.3h6M12 16.5v3.8"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  `,

  'Contratos OBC': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="7" y="3.5" width="12" height="15" rx="1.6" fill="currentColor" opacity=".55"/>
      <rect x="4.5" y="6.5" width="12" height="15" rx="1.6" fill="currentColor"/>
    </svg>
  `,

  'default': `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" d="M3.5 7.2a1.7 1.7 0 0 1 1.7-1.7h5.1l1.8 2h6.7
        a1.7 1.7 0 0 1 1.7 1.7v8.1a1.7 1.7 0 0 1-1.7 1.7H5.2
        a1.7 1.7 0 0 1-1.7-1.7V7.2Z"/>
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
          style="${iconStyle(x.category)}"
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
