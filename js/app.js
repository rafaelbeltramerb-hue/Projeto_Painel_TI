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
   ÍCONES DOS ATALHOS — estilo "ícone de app" (iOS)

   Cada atalho ganha um ícone e uma cor PRÓPRIOS, escolhidos a
   partir de palavras-chave no NOME do atalho (não só da
   categoria) — assim, itens de uma mesma categoria ampla como
   "Administrativo" não ficam todos com a cara idêntica. Quando
   nenhuma palavra-chave bate, cai no ícone padrão da categoria;
   sem categoria reconhecida, cai numa pasta genérica.
   ============================================================ */

const categoryIconMap = new Map();

function stripAccents(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/* Biblioteca de glifos. `var(--ico-shade, currentColor)` é o tom mais escuro do
   degradê do próprio ícone (injetado inline por iconStyle), usado
   para dar profundidade/detalhe de dois tons dentro do glifo. */
const ICON_GLYPHS = {

  calendar: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="14.5" rx="3" fill="currentColor"/>
      <path fill="var(--ico-shade, currentColor)" d="M4 8.5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v1H4v-1Z"/>
      <rect x="7" y="3.2" width="1.8" height="4.2" rx=".9" fill="currentColor"/>
      <rect x="15.2" y="3.2" width="1.8" height="4.2" rx=".9" fill="currentColor"/>
    </svg>
  `,

  network: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="17" r="1.6" fill="currentColor"/>
      <path fill="currentColor" d="M8.8 13.7a4.7 4.7 0 0 1 6.4 0 1 1 0 0 1-1.35 1.47 2.7 2.7 0 0 0-3.7 0 1 1 0 1 1-1.35-1.47Z"/>
      <path fill="var(--ico-shade, currentColor)" d="M5.6 10.3a9.2 9.2 0 0 1 12.8 0 1 1 0 1 1-1.4 1.44 7.2 7.2 0 0 0-10 0 1 1 0 1 1-1.4-1.44Z"/>
    </svg>
  `,

  switch: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="9" rx="2.2" fill="currentColor"/>
      <rect x="5.5" y="15" width="2.2" height="3.6" rx=".6" fill="var(--ico-shade, currentColor)"/>
      <rect x="10.9" y="15" width="2.2" height="3.6" rx=".6" fill="var(--ico-shade, currentColor)"/>
      <rect x="16.3" y="15" width="2.2" height="3.6" rx=".6" fill="var(--ico-shade, currentColor)"/>
    </svg>
  `,

  phone: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" d="M7.2 3.8 4.8 5.2c-.9.5-1.3 1.6-.9 2.6
        2.2 5.6 6.7 10.1 12.3 12.3 1 .4 2.1 0 2.6-.9l1.4-2.4
        c.4-.7.2-1.6-.4-2l-3.1-2.1c-.6-.4-1.4-.3-1.9.2l-1.3 1.3
        a15.7 15.7 0 0 1-4.2-4.2l1.3-1.3c.5-.5.6-1.3.2-1.9
        L9.2 4.2c-.4-.6-1.3-.8-2-.4Z"/>
    </svg>
  `,

  shield: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" d="M12 3 5.2 5.4v5.2c0 4.6 2.9 8.7 6.8 9.9
        3.9-1.2 6.8-5.3 6.8-9.9V5.4L12 3Z"/>
      <path stroke="var(--ico-shade, currentColor)" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round" d="m8.7 12.3 2.3 2.3 4.3-4.6"/>
    </svg>
  `,

  key: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8" cy="13.5" r="4.3" fill="currentColor"/>
      <circle cx="8" cy="13.5" r="1.7" fill="var(--ico-shade, currentColor)"/>
      <path stroke="currentColor" stroke-width="2.4" stroke-linecap="round"
        d="M11 10.5 18.5 3M15.2 6.3l2 2M17.6 3.9l2 2"/>
    </svg>
  `,

  server: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="3.5" width="16" height="7.2" rx="1.8" fill="currentColor"/>
      <rect x="4" y="13.3" width="16" height="7.2" rx="1.8" fill="currentColor"/>
      <circle cx="7.3" cy="7.1" r="1.1" fill="var(--ico-shade, currentColor)"/>
      <circle cx="7.3" cy="16.9" r="1.1" fill="var(--ico-shade, currentColor)"/>
    </svg>
  `,

  clipboard: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" d="M6.5 5A1.8 1.8 0 0 1 8.3 3.2h7.4A1.8 1.8 0 0 1 17.5 5v.4h1
        a1.6 1.6 0 0 1 1.6 1.6v12.2a1.6 1.6 0 0 1-1.6 1.6H5.5
        a1.6 1.6 0 0 1-1.6-1.6V7a1.6 1.6 0 0 1 1.6-1.6h1V5Z"/>
      <rect x="8.2" y="2" width="7.6" height="3.6" rx="1.1" fill="var(--ico-shade, currentColor)"/>
      <path stroke="var(--ico-shade, currentColor)" stroke-width="1.6" stroke-linecap="round"
        d="M7.5 12.5h9M7.5 15.8h6"/>
    </svg>
  `,

  battery: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="8" width="16" height="9" rx="2.2" fill="currentColor"/>
      <rect x="19.5" y="10.5" width="2" height="4" rx="1" fill="currentColor"/>
      <path fill="var(--ico-shade, currentColor)" d="m12.6 9.6-3.4 4.3h2.1l-.7 3.3 3.6-4.5h-2.1l.5-3.1Z"/>
    </svg>
  `,

  scale: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
        d="M12 3.5v16.8M7.5 20.3h9"/>
      <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
        stroke-linejoin="round" d="M12 6 5.5 7.8M12 6l6.5 1.8"/>
      <path fill="var(--ico-shade, currentColor)" d="M5.5 7.8 3 13a2.7 2.7 0 0 0 5 0L5.5 7.8Z"/>
      <path fill="var(--ico-shade, currentColor)" d="M18.5 7.8 16 13a2.7 2.7 0 0 0 5 0l-2.5-5.2Z"/>
    </svg>
  `,

  contract: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" d="M6 3.5h8.5l4.5 4.5V19a1.6 1.6 0 0 1-1.6 1.6H6
        A1.6 1.6 0 0 1 4.4 19V5.1A1.6 1.6 0 0 1 6 3.5Z"/>
      <path fill="var(--ico-shade, currentColor)" d="M14.5 3.5v4a1 1 0 0 0 1 1h4v.2L14.5 3.7Z"/>
      <path stroke="var(--ico-shade, currentColor)" stroke-width="1.6" stroke-linecap="round"
        d="M7.8 13h8.4M7.8 16h5.5"/>
    </svg>
  `,

  book: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" d="M4 5.2c0-.9.8-1.6 1.7-1.4C7.6 4.1 9.8 4.8 11.3 6v12.8
        c-1.5-1.1-3.6-1.7-5.5-2-.9-.1-1.8-1-1.8-1.9V5.2Z"/>
      <path fill="var(--ico-shade, currentColor)" d="M20 5.2c0-.9-.8-1.6-1.7-1.4-1.9.3-4.1 1-5.6 2.2v12.8
        c1.5-1.1 3.6-1.7 5.5-2 .9-.1 1.8-1 1.8-1.9V5.2Z"/>
    </svg>
  `,

  cap: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" d="M12 3.3 2 8l10 4.3L20 9v4.3a1 1 0 1 0 2 0V8.6
        a1 1 0 0 0-.6-.9L12 3.3Z"/>
      <path fill="var(--ico-shade, currentColor)" d="M6 10.6v3.6c0 1.7 2.7 3.1 6 3.1s6-1.4 6-3.1v-3.6
        l-6 2.6-6-2.6Z"/>
    </svg>
  `,

  projector: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="11.5" rx="2" fill="currentColor"/>
      <circle cx="17" cy="10.7" r="2" fill="var(--ico-shade, currentColor)"/>
      <path stroke="var(--ico-shade, currentColor)" stroke-width="2" stroke-linecap="round"
        d="M9 20.3h6M12 16.5v3.8"/>
    </svg>
  `,

  briefcase: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.3" y="7.5" width="17.4" height="12" rx="2.4" fill="currentColor"/>
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"
        stroke="var(--ico-shade, currentColor)" stroke-width="2" stroke-linecap="round"/>
      <rect x="3.3" y="12.4" width="17.4" height="1.6" fill="var(--ico-shade, currentColor)"/>
    </svg>
  `,

  grid: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7.2" height="7.2" rx="2" fill="currentColor"/>
      <rect x="13.3" y="3.5" width="7.2" height="7.2" rx="2" fill="var(--ico-shade, currentColor)"/>
      <rect x="3.5" y="13.3" width="7.2" height="7.2" rx="2" fill="var(--ico-shade, currentColor)"/>
      <rect x="13.3" y="13.3" width="7.2" height="7.2" rx="2" fill="currentColor"/>
    </svg>
  `,

  gear: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" d="M12 3.5 14 5.2 16.6 5.1 17.5 7.5 19.6 9 18.8 11.5 19.6 14
        17.5 15.5 16.6 17.9 14 17.8 12 19.5 10 17.8 7.4 17.9 6.5 15.5
        4.4 14 5.2 11.5 4.4 9 6.5 7.5 7.4 5.1 10 5.2 12 3.5Z"/>
      <circle cx="12" cy="11.5" r="2.6" fill="var(--ico-shade, currentColor)"/>
    </svg>
  `,

  folder: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" d="M3.5 7.2a1.7 1.7 0 0 1 1.7-1.7h5.1l1.8 2h6.7
        a1.7 1.7 0 0 1 1.7 1.7v8.1a1.7 1.7 0 0 1-1.7 1.7H5.2
        a1.7 1.7 0 0 1-1.7-1.7V7.2Z"/>
      <path fill="var(--ico-shade, currentColor)" d="M3.5 7.2a1.7 1.7 0 0 1 1.7-1.7h5.1l1.8 2H5.2
        a1.7 1.7 0 0 0-1.7 1.7v-2Z"/>
    </svg>
  `
};

/* Cor (degradê) de cada glifo — pensada para lembrar as cores de
   apps reais do iOS (Calendário = vermelho, Telefone = verde,
   Senhas = grafite, etc.), sem repetir tom entre glifos vizinhos. */
const ICON_COLORS = {
  calendar: ['#ff6b6b', '#e63946'],
  network: ['#4fd1c5', '#0e9488'],
  switch: ['#7c9cff', '#4361ee'],
  phone: ['#69db8f', '#22a85e'],
  shield: ['#ff9f6b', '#e8622e'],
  key: ['#98989d', '#48484a'],
  server: ['#8a97a8', '#4b5563'],
  clipboard: ['#b48cff', '#8b5cf6'],
  battery: ['#ffd166', '#f2a91e'],
  scale: ['#d4a373', '#a9784a'],
  contract: ['#6ea8fe', '#3d63e8'],
  book: ['#f0b86e', '#d98e2f'],
  cap: ['#ff8fc7', '#e0499e'],
  projector: ['#9aa4b2', '#64748b'],
  briefcase: ['#5b93ff', '#2f5fe0'],
  grid: ['#b18cff', '#7c5cf0'],
  gear: ['#aab2c0', '#7c8698'],
  folder: ['#9aa4b2', '#707c8c']
};

/* Ícone padrão por categoria (usado quando nenhuma palavra-chave
   do nome do atalho bate com nada mais específico). */
const CATEGORY_DEFAULT_ICON = {
  'Administrativo': 'briefcase',
  'Rede': 'network',
  'Manuais': 'book',
  'Telefonia': 'phone',
  'Softwares': 'grid',
  'Termos': 'scale',
  'Reconhecimento de curso': 'cap',
  'Planejamento': 'calendar',
  'SENHAS': 'key',
  'Datashow': 'projector',
  'Contratos OBC': 'contract'
};

/* Palavras-chave no NOME do atalho → ícone específico. Avaliadas
   em ordem; a primeira que bater vence. Cobrem os casos mais
   comuns da planilha original; itens que não baterem em nada
   caem no ícone padrão da categoria. */
const NAME_ICON_RULES = [
  [/kaspersky|antivirus/, 'shield'],
  [/\bsenha/, 'key'],
  [/nobreak|no-break|\bups\b/, 'battery'],
  [/reserva|agenda/, 'calendar'],
  [/wi-?fi|eduroam/, 'network'],
  [/switch|porta poe|topologia|diagrama.*rede/, 'switch'],
  [/monitorament|rede geral/, 'network'],
  [/central telefonic|telefonic|ramal|voip/, 'phone'],
  [/acesso.*servidor|servidores e sistemas/, 'server'],
  [/levantamento|invent[a\u00e1]rio|equipamento/, 'clipboard'],
  [/contrato/, 'contract'],
  [/termo|responsabilidade|emprestimo/, 'contract'],
  [/manual|procedimento|tutorial/, 'book'],
  [/curso|reconhecimento|diploma|certifica/, 'cap'],
  [/datashow|projetor/, 'projector'],
  [/planejamento|\bplano\b/, 'calendar']
];

function getIconKey(x) {

  const custom = categoryIconMap.get(x?.category);

  if (custom && String(custom).trim().startsWith('<svg')) {
    return null; // ícone customizado (bruto) definido pelo admin: usado direto, sem cor calculada
  }

  const name = stripAccents(x?.name);

  for (const [re, key] of NAME_ICON_RULES) {
    if (re.test(name)) return key;
  }

  return CATEGORY_DEFAULT_ICON[x?.category] || 'folder';

}

function getShortcutIcon(x) {

  const custom = categoryIconMap.get(x?.category);

  if (custom && String(custom).trim().startsWith('<svg')) {
    return custom;
  }

  const key = getIconKey(x);

  return ICON_GLYPHS[key] || ICON_GLYPHS.folder;

}

/* Ícone de categoria "genérico" usado nos chips de filtro
   (ali não há um nome de atalho específico para casar). */
function getCategoryIcon(c) {

  const custom = categoryIconMap.get(c);

  if (custom && String(custom).trim().startsWith('<svg')) {
    return custom;
  }

  const key = CATEGORY_DEFAULT_ICON[c] || 'folder';

  return ICON_GLYPHS[key] || ICON_GLYPHS.folder;

}

function iconStyle(x) {

  const key = getIconKey(x);

  if (!key) return ''; // ícone customizado: sem gradiente calculado

  const [from, to] = ICON_COLORS[key] || ICON_COLORS.folder;

  return (
    `background: linear-gradient(155deg, ${from}, ${to}); --ico-shade: ${to};`
  );

}

function categoryIconStyle(c) {

  const key = CATEGORY_DEFAULT_ICON[c] || 'folder';
  const [from, to] = ICON_COLORS[key] || ICON_COLORS.folder;

  return (
    `background: linear-gradient(155deg, ${from}, ${to}); --ico-shade: ${to};`
  );

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
      normalizeUriPath(u.replace(/\\/g, '/'));

  }


  if (/^\\\\/.test(u)) {

    return 'file://' +
      normalizeUriPath(
        u
          .replace(/^\\\\+/, '')
          .replace(/\\/g, '/')
      );

  }


  if (/^file:\/\//i.test(u)) {

    let rest =
      u.replace(/^file:\/+/i, '');

    rest =
      rest
        .replace(/^\\\\+/, '')
        .replace(/\\/g, '/');

    if (/^[A-Za-z]:/.test(rest)) {

      return 'file:///' + normalizeUriPath(rest);

    }

    return 'file://' +
      normalizeUriPath(rest.replace(/^\/+/, ''));

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

function normalizeUriPath(s) {

  // Alguns caminhos já vieram com %20 (espaço) parcialmente
  // codificado na origem, misturado com acentos "crus" (ç, ã...).
  // Decodifica primeiro (volta tudo a texto literal) e codifica de
  // novo de uma vez só, de forma consistente — evita tanto
  // caracteres não-ASCII soltos quanto codificação duplicada
  // (%2520) em cima do que já estava certo.
  let decoded = s;

  try {
    decoded = decodeURIComponent(s);
  } catch (e) {
    decoded = s;
  }

  return encodeURI(decoded);

}


/* ------------------------------------------------------------
   O protocolo "ofe|u|" do Office (ms-word:/ms-excel:/...) NÃO
   decodifica acentos codificados em UTF-8 (%C3%A7 continua
   %C3%A7 em vez de virar "ç") — confirmado na prática, mesmo com
   a codificação consistente acima. Handlers legados desse tipo
   costumam esperar Windows-1252/ANSI (1 byte por caractere) em
   vez de UTF-8 (2+ bytes). Esta função codifica só os acentos
   latinos comuns em Windows-1252; o resto segue como URI normal.
   ------------------------------------------------------------ */
const WIN1252_MAP = {
  'À': 'C0', 'Á': 'C1', 'Â': 'C2', 'Ã': 'C3', 'Ä': 'C4', 'Å': 'C5',
  'Ç': 'C7', 'È': 'C8', 'É': 'C9', 'Ê': 'CA', 'Ë': 'CB',
  'Ì': 'CC', 'Í': 'CD', 'Î': 'CE', 'Ï': 'CF', 'Ñ': 'D1',
  'Ò': 'D2', 'Ó': 'D3', 'Ô': 'D4', 'Õ': 'D5', 'Ö': 'D6',
  'Ù': 'D9', 'Ú': 'DA', 'Û': 'DB', 'Ü': 'DC', 'Ý': 'DD',
  'à': 'E0', 'á': 'E1', 'â': 'E2', 'ã': 'E3', 'ä': 'E4', 'å': 'E5',
  'ç': 'E7', 'è': 'E8', 'é': 'E9', 'ê': 'EA', 'ë': 'EB',
  'ì': 'EC', 'í': 'ED', 'î': 'EE', 'ï': 'EF', 'ñ': 'F1',
  'ò': 'F2', 'ó': 'F3', 'ô': 'F4', 'õ': 'F5', 'ö': 'F6',
  'ù': 'F9', 'ú': 'FA', 'û': 'FB', 'ü': 'FC', 'ý': 'FD',
  'º': 'BA', 'ª': 'AA', '§': 'A7', '°': 'B0'
};

function encodeOfficeMonikerPath(s) {

  // Parte do texto raw (decodifica o que já estiver %-codificado).
  let decoded = s;

  try {
    decoded = decodeURIComponent(s);
  } catch (e) {
    decoded = s;
  }

  let out = '';

  for (const ch of decoded) {

    if (WIN1252_MAP[ch]) {

      out += '%' + WIN1252_MAP[ch];

    } else if (ch === ' ') {

      out += '%20';

    } else if (ch.codePointAt(0) < 128) {

      // ASCII normal: mantém caracteres de caminho/URL intactos
      // (letras, números, / \ : . , - _ etc.) e escapa o resto.
      out += /[A-Za-z0-9\-_.!~*'()/\\:,;]/.test(ch)
        ? ch
        : encodeURIComponent(ch);

    } else {

      // Fora do conjunto Windows-1252 mapeado acima (raro nestes
      // caminhos): usa UTF-8 como último recurso.
      out += encodeURIComponent(ch);

    }

  }

  return out;

}


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

  } else if (
    /\.(vsdx|vsd|vsdm|vssx|vstx)$/i.test(lower)
  ) {

    protocol =
      'ms-visio:ofe|u|';

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
      encodeOfficeMonikerPath(
        path
          .replace(/^\\\\+/, '')
          .replace(/\\/g, '/')
      );

    return protocol + fileUrl;

  }


  if (/^[A-Za-z]:[\\/]/.test(path)) {

    const fileUrl =
      'file:///' +
      encodeOfficeMonikerPath(
        path.replace(/\\/g, '/')
      );

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
      encodeOfficeMonikerPath(
        (
          root + relative
        )
          .replace(/^file:\/+/i, '')
          .replace(/^\/+/, '')
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

    // Protocolo do Office (ms-word:/ms-excel:/ms-powerpoint:) — um
    // link real, clicado de verdade, na mesma janela.
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


  // PDF, TXT, Visio, pastas, etc. — sem protocolo de app do Office
  // pra usar. Navegar direto pra file:// é bloqueado pelo próprio
  // navegador quando o site está em https:// (confirmado: não tem
  // técnica de JS que contorne isso). Em vez de tentar e falhar em
  // silêncio, copia o caminho automaticamente e avisa — sem modal,
  // sem clique extra.
  copyPathAndNotify(x, url);

}


/* ============================================================
   COPIAR CAMINHO (fallback pra PDF/TXT/Visio/pastas)
   ============================================================ */

async function copyPathAndNotify(x, url) {

  const winPath =
    toWindowsPath(url);

  try {

    await navigator.clipboard.writeText(winPath);

    toast(
      `Caminho de "${x.name}" copiado — cole no Explorador de Arquivos (Ctrl+V).`
    );

  } catch (e) {

    // Sem permissão de clipboard (raro): mostra o caminho pra
    // copiar manualmente.
    toast(
      `Não deu pra copiar automaticamente. Caminho: ${winPath}`
    );

  }

}

function toWindowsPath(fileUrl) {

  let rest =
    fileUrl.replace(/^file:\/+/i, '');

  let decoded;

  try {
    decoded = decodeURIComponent(rest);
  } catch (e) {
    decoded = rest;
  }

  if (/^[A-Za-z]:\//.test(decoded)) {
    return decoded.replace(/\//g, '\\');
  }

  return '\\\\' + decoded.replace(/\//g, '\\');

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
      title="${esc(x.name)}"
    >

      <div class="ct">

        <span
          class="ico"
          style="${iconStyle(x)}"
          aria-hidden="true"
        >
          ${getShortcutIcon(x)}
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


  $('#favoritesBtn')?.classList.toggle('active', S.mode === 'fav');
  $('#recentBtn')?.classList.toggle('active', S.mode === 'recent');
  $('#allBtn')?.classList.toggle('active', S.mode === 'all' && !S.cat);


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
