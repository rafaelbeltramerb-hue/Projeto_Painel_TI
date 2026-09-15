/* ============================================================
   PORTAL TI — XANXERÊ
   APP.JS
   ============================================================ */

const S = {
  cat: '',
  q: '',
  mode: 'all',

  data: {
    categories: [],
    links: []
  },

  recent: JSON.parse(
    localStorage.getItem('pti_recent') || '[]'
  ),

  favorites: JSON.parse(
    localStorage.getItem('pti_fav') || '[]'
  ),

  dbFavorites: new Set(),

  usingDb: false
};


/* ============================================================
   UTILITÁRIOS
   ============================================================ */

const $ = selector =>
  document.querySelector(selector);


const esc = value =>
  String(value ?? '').replace(
    /[&<>"']/g,
    char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char])
  );


/* ============================================================
   ÍCONES — ESTILO GOOGLE / GMAIL
   ============================================================ */

const ICONS = {

  folder: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>
      <path d="M3.5 9h17"/>
    </svg>
  `,

  file: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 3.5h7l4 4v13h-11a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2z"/>
      <path d="M13.5 3.5v4h4"/>
      <path d="M8 12h7"/>
      <path d="M8 15.5h5"/>
    </svg>
  `,

  document: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 3.5h7l4 4v13h-11a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2z"/>
      <path d="M13.5 3.5v4h4"/>
      <path d="M8 11.5h7"/>
      <path d="M8 15h7"/>
      <path d="M8 18.5h4"/>
    </svg>
  `,

  book: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4.5h10.5a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2v-12z"/>
      <path d="M17.5 19.5H7a2 2 0 0 1-2-2"/>
      <path d="M8.5 8h6"/>
      <path d="M8.5 11.5h5"/>
      <path d="M8.5 15h6"/>
    </svg>
  `,

  phone: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.2 4.2l3.1 3.1-2 2.4a14.5 14.5 0 0 0 6 6l2.4-2 3.1 3.1-1.7 2.2a2.2 2.2 0 0 1-2.4.7C8.7 17.7 6.3 15.3 4.3 8.3a2.2 2.2 0 0 1 .7-2.4z"/>
    </svg>
  `,

  network: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="3.5" width="6" height="4" rx="1"/>
      <rect x="3.5" y="16.5" width="6" height="4" rx="1"/>
      <rect x="14.5" y="16.5" width="6" height="4" rx="1"/>
      <path d="M12 7.5v4"/>
      <path d="M6.5 16.5v-3h11v3"/>
    </svg>
  `,

  computer: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="4" width="17" height="12" rx="1.8"/>
      <path d="M8 20h8"/>
      <path d="M12 16v4"/>
      <path d="M7 7.5h10"/>
    </svg>
  `,

  graduation: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 8.5L12 4l9 4.5-9 4.5z"/>
      <path d="M7 11v4.5c3 2 7 2 10 0V11"/>
      <path d="M21 8.5v5"/>
    </svg>
  `,

  calendar: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2"/>
      <path d="M8 3v4"/>
      <path d="M16 3v4"/>
      <path d="M4 9h16"/>
      <path d="M8 13h2"/>
      <path d="M13 13h3"/>
      <path d="M8 16.5h2"/>
      <path d="M13 16.5h3"/>
    </svg>
  `,

  key: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8" cy="15.5" r="4"/>
      <path d="M11 12.5l8-8"/>
      <path d="M16 6l2 2"/>
      <path d="M18 4l2 2"/>
    </svg>
  `,

  projector: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="11" rx="2"/>
      <circle cx="7.5" cy="10.5" r="1.2"/>
      <path d="M11 10.5h6"/>
      <path d="M8 20h8"/>
      <path d="M12 16v4"/>
    </svg>
  `,

  box: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7.5l8-4 8 4-8 4z"/>
      <path d="M4 7.5v9l8 4 8-4v-9"/>
      <path d="M12 11.5v9"/>
      <path d="M8 5.5l8 4"/>
    </svg>
  `,

  search: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.5"/>
      <path d="M16 16l4.5 4.5"/>
    </svg>
  `,

  star: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.8l2.5 5.1 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>
    </svg>
  `,

  arrow: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 17L17 7"/>
      <path d="M9 7h8v8"/>
    </svg>
  `
};


/* ============================================================
   ÍCONE DA CATEGORIA
   ============================================================ */

function getCategoryIconType(category) {

  const name =
    String(category || '')
      .trim()
      .toLocaleLowerCase('pt-BR');


  if (name.includes('manual'))
    return 'book';


  if (name.includes('telefon'))
    return 'phone';


  if (name.includes('rede'))
    return 'network';


  if (
    name.includes('software') ||
    name.includes('program')
  )
    return 'computer';


  if (name.includes('administr'))
    return 'document';


  if (name.includes('termo'))
    return 'file';


  if (
    name.includes('reconhecimento') ||
    name.includes('curso')
  )
    return 'graduation';


  if (name.includes('planejamento'))
    return 'calendar';


  if (name.includes('senha'))
    return 'key';


  if (name.includes('datashow'))
    return 'projector';


  if (
    name.includes('contrato') ||
    name.includes('obc')
  )
    return 'box';


  return 'folder';
}


function getCategoryIcon(category) {

  const type =
    getCategoryIconType(category);

  return ICONS[type] || ICONS.folder;
}


/* ============================================================
   PROCESSAMENTO DOS DADOS
   ============================================================ */

function processData(cats, links) {

  const catNames = [];

  (cats || []).forEach(c => {

    if (typeof c === 'string') {

      catNames.push(c);

    } else if (
      c &&
      typeof c === 'object' &&
      c.name
    ) {

      catNames.push(c.name);

    }

  });


  return {

    categories: [
      ...new Set(catNames)
    ],

    links: (links || [])

      .filter(
        l => l.active !== false
      )

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

          url_original:
            l.url_original ||
            l.url ||
            ''

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

function toast(message) {

  const t = $('#toast');

  if (!t) return;

  t.textContent = message;

  t.hidden = false;
  t.style.display = 'block';

  clearTimeout(window.__toast);

  window.__toast =
    setTimeout(() => {

      t.hidden = true;
      t.style.display = 'none';

    }, 3500);

}


/* ============================================================
   FAVORITOS
   ============================================================ */

function isFav(x) {

  const idStr =
    String(x.id);

  return S.usingDb
    ? S.dbFavorites.has(idStr)
    : S.favorites.includes(idStr);

}


/* ============================================================
   RESOLUÇÃO DE URL
   ============================================================ */

function resolveUrl(x) {

  let u =
    String(
      x.url_original ||
      x.url ||
      ''
    ).trim();


  if (!u)
    return null;


  if (
    /^https?:\/\//i.test(u)
  ) {

    return u;

  }


  if (
    /^[A-Za-z]:[\\/]/.test(u)
  ) {

    return (
      'file:///' +
      u.replace(/\\/g, '/')
    );

  }


  if (
    /^\\\\/.test(u)
  ) {

    return (
      'file://' +
      u
        .replace(/^\\\\+/, '')
        .replace(/\\/g, '/')
    );

  }


  if (
    /^file:\/\//i.test(u)
  ) {

    let rest =
      u.replace(
        /^file:\/+/i,
        ''
      );


    rest =
      rest
        .replace(/^\\\\+/, '')
        .replace(/\\/g, '/');


    if (
      /^[A-Za-z]:/.test(rest)
    ) {

      return (
        'file:///' +
        rest
      );

    }


    return (
      'file://' +
      rest.replace(/^\/+/, '')
    );

  }


  const cfg =
    window.PORTAL_CONFIG || {};


  let root =
    String(
      cfg.networkRoot || ''
    ).trim();


  if (root) {

    root =
      root.replace(
        /\\/g,
        '/'
      );


    if (!root.endsWith('/'))
      root += '/';


    const cleanRel =
      u
        .replace(/\\/g, '/')
        .replace(/^\.\//, '');


    try {

      return new URL(
        cleanRel,
        root
      ).href;

    } catch (e) {

      return (
        root +
        cleanRel
      );

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


  if (!path)
    return null;


  const lower =
    path.toLocaleLowerCase('pt-BR');


  let protocol = null;


  if (
    /\.(xlsx|xls|xlsm|xlsb|csv)$/i
      .test(lower)
  ) {

    protocol =
      'ms-excel:ofe|u|';

  }

  else if (
    /\.(docx|doc|docm|rtf)$/i
      .test(lower)
  ) {

    protocol =
      'ms-word:ofe|u|';

  }

  else if (
    /\.(pptx|ppt|pptm|ppsx|pps)$/i
      .test(lower)
  ) {

    protocol =
      'ms-powerpoint:ofe|u|';

  }


  if (!protocol)
    return null;


  if (
    /^file:\/\//i.test(path)
  ) {

    path =
      path.replace(
        /^file:\/+/i,
        ''
      );

    path =
      path.replace(
        /^\\+/,
        ''
      );


    if (
      /^[A-Za-z]:[\\/]/.test(path)
    ) {

      path =
        path.replace(
          /\//g,
          '\\'
        );

    }

    else {

      path =
        '\\\\' +
        path.replace(
          /\//g,
          '\\'
        );

    }

  }


  if (
    /^\\\\/.test(path)
  ) {

    const fileUrl =
      'file://' +
      path
        .replace(/^\\\\+/, '')
        .replace(/\\/g, '/');


    return (
      protocol +
      fileUrl
    );

  }


  if (
    /^[A-Za-z]:[\\/]/.test(path)
  ) {

    const fileUrl =
      'file:///' +
      path.replace(
        /\\/g,
        '/'
      );


    return (
      protocol +
      fileUrl
    );

  }


  const cfg =
    window.PORTAL_CONFIG || {};


  let root =
    String(
      cfg.networkRoot || ''
    ).trim();


  if (root) {

    root =
      root.replace(
        /\\/g,
        '/'
      );


    if (!root.endsWith('/'))
      root += '/';


    const relative =
      path
        .replace(/\\/g, '/')
        .replace(/^\.\//, '');


    return (
      protocol +
      (
        'file://' +
        (
          root +
          relative
        )
          .replace(
            /^file:\/+/i,
            ''
          )
          .replace(
            /^\/+/,
            ''
          )
      )
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


  const url =
    resolveUrl(x);


  if (!url) {

    toast(
      'Não foi possível resolver o caminho deste atalho.'
    );

    return;

  }


  /* ----------------------------------------------------------
     LINKS WEB
     ---------------------------------------------------------- */

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


  /* ----------------------------------------------------------
     ARQUIVOS OFFICE
     ---------------------------------------------------------- */

  const officeUrl =
    officeProtocolUrl(url);


  if (officeUrl) {

    const a =
      document.createElement('a');


    a.href =
      officeUrl;

    a.target =
      '_self';

    a.rel =
      'noopener';

    a.style.display =
      'none';


    document.body.appendChild(a);

    a.click();


    setTimeout(
      () => a.remove(),
      1000
    );

    return;

  }


  /* ----------------------------------------------------------
     OUTROS ARQUIVOS / CAMINHOS
     ---------------------------------------------------------- */

  window.open(
    url,
    '_blank',
    'noopener'
  );

}


/* ============================================================
   FILTROS
   ============================================================ */

function filtered() {

  let a =
    [...S.data.links];


  if (S.cat) {

    a =
      a.filter(
        x =>
          x.category === S.cat
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
          `
            ${x.name}
            ${x.category}
            ${x.description || ''}
            ${x.url_original || x.url || ''}
          `
          .toLocaleLowerCase(
            'pt-BR'
          );


        return terms.every(
          term =>
            searchBlob.includes(
              term
            )
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


  return `

    <article
      class="card"
      data-o="${esc(x.id)}"
      data-category="${esc(x.category)}"
    >

      <div class="ct">

        <span
          class="ico"
          aria-hidden="true"
        >
          ${getCategoryIcon(x.category)}
        </span>


        <button
          class="star ${f ? 'on' : ''}"
          data-f="${esc(x.id)}"
          title="${
            f
              ? 'Remover favorito'
              : 'Adicionar favorito'
          }"
          aria-label="${
            f
              ? 'Remover favorito'
              : 'Adicionar favorito'
          }"
        >

          ${ICONS.star}

        </button>

      </div>


      <h3>
        ${esc(x.name)}
      </h3>


      <p>
        ${esc(
          x.description ||
          x.category
        )}
      </p>


      <div class="cf">

        <small>
          ${type}
        </small>


        <button
          class="open-btn"
          data-o="${esc(x.id)}"
        >

          <span>
            Abrir
          </span>

          ${ICONS.arrow}

        </button>

      </div>

    </article>

  `;

}


/* ============================================================
   ACESSOS RÁPIDOS
   ============================================================
   A área "Mais utilizados" não é mais utilizada no layout.
   Caso ainda exista no index.html antigo, ela será escondida.
   ============================================================ */

function renderQuick() {

  const quick =
    document.querySelector(
      '.quick'
    );


  if (quick) {

    quick.style.display =
      'none';

  }

}


/* ============================================================
   RENDERIZAÇÃO
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

        .map(category => `

          <button
            class="
              chip
              ${
                S.cat === category
                  ? 'sel'
                  : ''
              }
            "
            data-c="${esc(category)}"
          >

            <span
              class="chip-icon"
              aria-hidden="true"
            >
              ${getCategoryIcon(category)}
            </span>

            <span>
              ${esc(category)}
            </span>

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


  /* ----------------------------------------------------------
     MODO LOCAL
     ---------------------------------------------------------- */

  if (!S.usingDb) {

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


  /* ----------------------------------------------------------
     SUPABASE
     ---------------------------------------------------------- */

  if (!window.portalSupabase) {

    toast(
      'Supabase não inicializado.'
    );

    return;

  }


  const {
    data: {
      user
    }
  } =
    await portalSupabase.auth.getUser();


  if (!user) {

    toast(
      'Entre na administração para sincronizar favoritos.'
    );

    return;

  }


  if (
    S.dbFavorites.has(idStr)
  ) {

    const {
      error
    } =
      await portalSupabase

        .from('favorites')

        .delete()

        .eq(
          'user_id',
          user.id
        )

        .eq(
          'link_id',
          x.id
        );


    if (error) {

      toast(
        error.message
      );

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

          user_id:
            user.id,

          link_id:
            x.id

        });


    if (error) {

      toast(
        error.message
      );

    } else {

      S.dbFavorites.add(
        idStr
      );

    }

  }


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

          .eq(
            'active',
            true
          )

          .order(
            'sort_order'
          ),


        portalSupabase

          .from('links')

          .select(
            '*, categories(name)'
          )

          .eq(
            'active',
            true
          )

          .order(
            'sort_order'
          )

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


    if (user) {

      const {
        data: f
      } =
        await portalSupabase

          .from('favorites')

          .select(
            'link_id'
          )

          .eq(
            'user_id',
            user.id
          );


      S.dbFavorites =
        new Set(
          (f || [])
            .map(
              v =>
                String(
                  v.link_id
                )
            )
        );

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
      typeof portalData !==
      'undefined'

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
                String(
                  l.category_id
                )
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
  event => {

    /* FAVORITO */

    const favorite =
      event.target.closest(
        '[data-f]'
      );


    if (favorite) {

      event.stopPropagation();


      const x =
        S.data.links.find(
          item =>
            String(item.id) ===
            String(
              favorite.dataset.f
            )
        );


      if (x) {

        toggleFavorite(x);

      }


      return;

    }


    /* ABRIR */

    const open =
      event.target.closest(
        '[data-o]'
      );


    if (open) {

      const x =
        S.data.links.find(
          item =>
            String(item.id) ===
            String(
              open.dataset.o
            )
        );


      if (x) {

        openItem(x);

      }


      return;

    }


    /* CATEGORIA */

    const category =
      event.target.closest(
        '[data-c]'
      );


    if (category) {

      S.cat =
        S.cat ===
        category.dataset.c

          ? ''

          : category.dataset.c;


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
  event => {

    S.q =
      event.target.value;


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

      $('#q').value =
        '';

    }


    S.q =
      '';


    render();

  }
);


/* ============================================================
   FILTRO FAVORITOS
   ============================================================ */

$('#favoritesBtn')?.addEventListener(
  'click',
  () => {

    S.mode =
      'fav';

    S.cat =
      '';

    render();

  }
);


/* ============================================================
   FILTRO RECENTES
   ============================================================ */

$('#recentBtn')?.addEventListener(
  'click',
  () => {

    S.mode =
      'recent';

    S.cat =
      '';

    render();

  }
);


/* ============================================================
   TODOS
   ============================================================ */

$('#allBtn')?.addEventListener(
  'click',
  () => {

    S.mode =
      'all';

    S.cat =
      '';


    if ($('#q')) {

      $('#q').value =
        '';

    }


    S.q =
      '';


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
        .dataset
        .theme === 'dark';


    const newTheme =
      isDark
        ? 'light'
        : 'dark';


    document.documentElement
      .dataset
      .theme =
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
      .dataset
      .theme =
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
