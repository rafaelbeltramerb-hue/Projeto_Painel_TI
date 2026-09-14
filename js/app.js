const S = {
  cat: '',
  q: '',
  mode: 'all',
  data: { categories: [], links: [] },
  recent: JSON.parse(localStorage.getItem('pti_recent') || '[]'),
  favorites: JSON.parse(localStorage.getItem('pti_fav') || '[]'),
  dbFavorites: new Set(),
  usingDb: false
};

const $ = s => document.querySelector(s);

const esc = x =>
  String(x ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[c]));

const categoryIconMap = new Map();

function getCategoryIcon(c) {
  if (categoryIconMap.has(c)) return categoryIconMap.get(c);

  const fallbacks = {
    'Manuais': '📘',
    'Redes': '🌐',
    'Sistemas': '💻',
    'Telefonia': '☎️',
    'TI - Administrativo': '🗂️',
    'Documentação': '📄'
  };

  const icon = fallbacks[c] || '📁';
  categoryIconMap.set(c, icon);
  return icon;
}

/* =========================================================
   UTILITÁRIOS DE CAMINHO
   ========================================================= */

function normalizeRawPath(value) {
  if (!value) return '';

  let path = String(value).trim();

  // Remove aspas que eventualmente tenham vindo do Excel
  path = path.replace(/^["']|["']$/g, '');

  // Converte barras invertidas duplicadas somente onde necessário,
  // preservando o UNC inicial.
  if (path.startsWith('\\\\')) {
    path = path.replace(/\//g, '\\');
  }

  return path;
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function isFileUrl(value) {
  return /^file:\/\//i.test(String(value || '').trim());
}

function isUncPath(value) {
  return /^\\\\/.test(String(value || '').trim());
}

function getFileExtension(path) {
  const clean = String(path || '').split('?')[0].split('#')[0];
  const file = clean.split(/[\\/]/).pop() || '';

  const index = file.lastIndexOf('.');
  if (index < 0) return '';

  return file.substring(index + 1).toLowerCase();
}

/*
 * Converte um caminho UNC ou file:// para o formato que
 * os protocolos do Microsoft Office esperam.
 *
 * IMPORTANTE:
 * Não usa encodeURIComponent() no caminho inteiro.
 * Isso preserva:
 *   espaços
 *   acentos
 *   +
 *   parênteses
 *   subpastas
 * etc.
 */
function toOfficeFileUrl(value) {
  let path = normalizeRawPath(value);

  // Caso já venha como file://
  if (/^file:\/\//i.test(path)) {
    path = path.replace(/^file:\/\//i, '');
  }

  // Remove barras extras do início para reconstruir file:// corretamente
  path = path.replace(/^[/\\]+/, '');

  // Normaliza barras para o formato usado no protocolo
  path = path.replace(/\\/g, '/');

  return 'file://' + path;
}

function buildOfficeProtocol(value, protocol) {
  const fileUrl = toOfficeFileUrl(value);
  return `${protocol}:ofe|u|${fileUrl}`;
}

function resolveOriginalPath(x) {
  /*
   * IMPORTANTE:
   * Se o registro já possui um caminho completo, usamos
   * exatamente esse caminho.
   *
   * Não reconstruímos o caminho usando networkRoot.
   * Isso evita perder subpastas como:
   *
   * Documentacao/TI-Administrativo/
   * Documentacao/Manuais/
   * Documentacao/Redes/
   */
  const candidates = [
    x?.url,
    x?.link,
    x?.href,
    x?.path,
    x?.caminho,
    x?.arquivo
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null) {
      const value = String(candidate).trim();

      if (value) {
        return value;
      }
    }
  }

  return '';
}

function resolveUrl(x) {
  const raw = resolveOriginalPath(x);

  if (!raw) return '';

  // Links web continuam funcionando normalmente.
  if (isHttpUrl(raw)) {
    return raw;
  }

  // Caminhos locais/rede são preservados.
  return normalizeRawPath(raw);
}

/* =========================================================
   ABERTURA DOS ARQUIVOS
   ========================================================= */

function openItem(x) {
  const raw = resolveUrl(x);

  if (!raw) {
    toast('Este atalho ainda precisa de um caminho ou URL válido.');
    return;
  }

  const idStr = String(x.id);

  S.recent = [
    idStr,
    ...S.recent.filter(v => String(v) !== idStr)
  ].slice(0, 8);

  saveLocal();
  renderQuick();

  /*
   * Links HTTP/HTTPS:
   * comportamento normal do Portal.
   */
  if (isHttpUrl(raw)) {
    window.open(raw, '_blank', 'noopener');
    return;
  }

  const ext = getFileExtension(raw);

  /*
   * Microsoft Excel
   */
  if ([
    'xlsx',
    'xls',
    'xlsm',
    'xlsb',
    'csv'
  ].includes(ext)) {
    const target = buildOfficeProtocol(raw, 'ms-excel');

    triggerExternalProtocol(target);
    return;
  }

  /*
   * Microsoft Word
   */
  if ([
    'docx',
    'doc',
    'docm',
    'rtf'
  ].includes(ext)) {
    const target = buildOfficeProtocol(raw, 'ms-word');

    triggerExternalProtocol(target);
    return;
  }

  /*
   * Microsoft PowerPoint
   */
  if ([
    'pptx',
    'ppt',
    'pptm',
    'ppsx',
    'pps'
  ].includes(ext)) {
    const target = buildOfficeProtocol(raw, 'ms-powerpoint');

    triggerExternalProtocol(target);
    return;
  }

  /*
   * PDF e demais arquivos:
   *
   * Tentamos abrir o caminho original.
   * O Chrome pode bloquear file:// quando a origem
   * for HTTPS, mas não interferimos no restante do Portal.
   */
  if (isFileUrl(raw)) {
    window.open(raw, '_blank', 'noopener');
    return;
  }

  if (isUncPath(raw)) {
    const fileUrl = toOfficeFileUrl(raw);
    window.open(fileUrl, '_blank', 'noopener');
    return;
  }

  /*
   * Fallback para outros tipos.
   */
  window.open(raw, '_blank', 'noopener');
}

function triggerExternalProtocol(url) {
  /*
   * Cria um link real e dispara o clique.
   * Isso permite que Chrome apresente a confirmação:
   *
   * "Deseja abrir o Microsoft Excel?"
   *
   * em vez de tentar carregar o recurso como uma página.
   */
  const a = document.createElement('a');

  a.href = url;
  a.target = '_self';
  a.rel = 'noopener';

  a.style.display = 'none';

  document.body.appendChild(a);

  a.click();

  setTimeout(() => {
    a.remove();
  }, 1000);
}

/* =========================================================
   ARMAZENAMENTO LOCAL
   ========================================================= */

function saveLocal() {
  localStorage.setItem('pti_recent', JSON.stringify(S.recent));
  localStorage.setItem('pti_fav', JSON.stringify(S.favorites));
}

function isFavorite(id) {
  return S.favorites.some(v => String(v) === String(id));
}

function toggleFavorite(id) {
  const value = String(id);

  if (isFavorite(value)) {
    S.favorites = S.favorites.filter(v => String(v) !== value);
  } else {
    S.favorites.unshift(value);
  }

  saveLocal();
  renderQuick();
  render();
}

function toast(message) {
  const el = document.querySelector('#toast');

  if (!el) {
    console.log(message);
    return;
  }

  el.textContent = message;
  el.classList.add('show');

  clearTimeout(el._timer);

  el._timer = setTimeout(() => {
    el.classList.remove('show');
  }, 3000);
}

/* =========================================================
   DADOS
   ========================================================= */

function processData(data) {
  const categories = Array.isArray(data?.categories)
    ? data.categories
    : [];

  const links = Array.isArray(data?.links)
    ? data.links
    : [];

  S.data.categories = categories;
  S.data.links = links;

  return S.data;
}

async function loadDb() {
  try {
    /*
     * Mantém aqui o carregamento original do projeto.
     * Esta função não deve alterar os caminhos dos atalhos.
     */

    if (typeof window.loadPortalData === 'function') {
      const result = await window.loadPortalData();

      processData(result || {});

      S.usingDb = true;

      render();
      renderQuick();

      return;
    }

    /*
     * Caso o projeto já disponibilize os dados através
     * de outra variável global.
     */
    if (window.PORTAL_DATA) {
      processData(window.PORTAL_DATA);

      S.usingDb = true;

      render();
      renderQuick();

      return;
    }

    console.warn('Fonte de dados do Portal não encontrada.');

  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    toast('Não foi possível carregar os atalhos.');
  }
}

/* =========================================================
   FILTROS
   ========================================================= */

function filtered() {
  let links = [...S.data.links];

  if (S.cat) {
    links = links.filter(x =>
      String(x.category || x.categoria || '') === String(S.cat)
    );
  }

  const q = String(S.q || '').trim().toLowerCase();

  if (q) {
    links = links.filter(x => {
      const text = [
        x.name,
        x.nome,
        x.title,
        x.titulo,
        x.description,
        x.descricao,
        x.category,
        x.categoria
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(q);
    });
  }

  if (S.mode === 'favorites') {
    links = links.filter(x => isFavorite(x.id));
  }

  if (S.mode === 'recent') {
    const order = new Map(
      S.recent.map((id, index) => [String(id), index])
    );

    links = links
      .filter(x => order.has(String(x.id)))
      .sort(
        (a, b) =>
          order.get(String(a.id)) -
          order.get(String(b.id))
      );
  }

  return links;
}

/* =========================================================
   RENDERIZAÇÃO
   ========================================================= */

function renderQuick() {
  const container =
    document.querySelector('#quick') ||
    document.querySelector('#quickLinks');

  if (!container) return;

  const recent = S.recent
    .map(id =>
      S.data.links.find(
        x => String(x.id) === String(id)
      )
    )
    .filter(Boolean)
    .slice(0, 8);

  container.innerHTML = recent.map(x => {
    const name =
      x.name ||
      x.nome ||
      x.title ||
      x.titulo ||
      'Atalho';

    return `
      <button
        class="quick-item"
        type="button"
        data-open-id="${esc(x.id)}"
      >
        ${esc(name)}
      </button>
    `;
  }).join('');

  container.querySelectorAll('[data-open-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = S.data.links.find(
        x => String(x.id) === String(btn.dataset.openId)
      );

      if (item) openItem(item);
    });
  });
}

function render() {
  const container =
    document.querySelector('#links') ||
    document.querySelector('#shortcuts') ||
    document.querySelector('#cards');

  if (!container) return;

  const links = filtered();

  if (!links.length) {
    container.innerHTML = `
      <div class="empty-state">
        Nenhum atalho encontrado.
      </div>
    `;

    return;
  }

  container.innerHTML = links.map(x => {
    const name =
      x.name ||
      x.nome ||
      x.title ||
      x.titulo ||
      'Atalho';

    const description =
      x.description ||
      x.descricao ||
      '';

    const category =
      x.category ||
      x.categoria ||
      '';

    const favorite = isFavorite(x.id);

    return `
      <article
        class="shortcut-card"
        data-id="${esc(x.id)}"
      >
        <button
          class="favorite-btn ${favorite ? 'active' : ''}"
          type="button"
          data-favorite-id="${esc(x.id)}"
          aria-label="Favoritar"
        >
          ${favorite ? '★' : '☆'}
        </button>

        <button
          class="shortcut-main"
          type="button"
          data-open-id="${esc(x.id)}"
        >
          <div class="shortcut-icon">
            ${getCategoryIcon(category)}
          </div>

          <div class="shortcut-content">
            <h3>${esc(name)}</h3>

            ${
              description
                ? `<p>${esc(description)}</p>`
                : ''
            }

            ${
              category
                ? `<span class="shortcut-category">${esc(category)}</span>`
                : ''
            }
          </div>
        </button>
      </article>
    `;
  }).join('');

  container
    .querySelectorAll('[data-open-id]')
    .forEach(btn => {
      btn.addEventListener('click', () => {
        const item = S.data.links.find(
          x => String(x.id) === String(btn.dataset.openId)
        );

        if (item) {
          openItem(item);
        }
      });
    });

  container
    .querySelectorAll('[data-favorite-id]')
    .forEach(btn => {
      btn.addEventListener('click', event => {
        event.stopPropagation();

        toggleFavorite(btn.dataset.favoriteId);
      });
    });
}

/* =========================================================
   EVENTOS
   ========================================================= */

function initEvents() {
  const search =
    document.querySelector('#search') ||
    document.querySelector('#searchInput');

  if (search) {
    search.addEventListener('input', event => {
      S.q = event.target.value || '';
      render();
    });
  }

  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      S.mode = btn.dataset.mode || 'all';

      document
        .querySelectorAll('[data-mode]')
        .forEach(x => x.classList.remove('active'));

      btn.classList.add('active');

      render();
    });
  });

  document.querySelectorAll('[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      S.cat = btn.dataset.category || '';

      render();
    });
  });
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  initEvents();

  await loadDb();

  render();
  renderQuick();
});
