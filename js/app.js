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
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

const categoryIconMap = new Map();

function getCategoryIcon(c) {
  if (categoryIconMap.has(c)) return categoryIconMap.get(c);
  const fallbacks = {
    'Manuais': '📘',
    'Telefonia': '☎️',
    'Rede': '🌐',
    'Softwares': '💻',
    'Administrativo': '📋',
    'Termos': '📄',
    'Reconhecimento de curso': '🎓',
    'Planejamento': '📅',
    'SENHAS': '🔑',
    'Datashow': '📽️',
    'Contratos OBC': '📦'
  };
  return fallbacks[c] || '📁';
}

function processData(cats, links) {
  const catNames = [];
  (cats || []).forEach(c => {
    if (typeof c === 'string') {
      catNames.push(c);
    } else if (c && typeof c === 'object') {
      if (c.name) {
        catNames.push(c.name);
        if (c.icon) categoryIconMap.set(c.name, c.icon);
      }
    }
  });

  return {
    categories: [...new Set(catNames)],
    links: (links || [])
      .filter(l => l.active !== false)
      .map(l => {
        const catName = typeof l.category === 'string' 
          ? l.category 
          : (l.category_name || l.categories?.name || 'Sem categoria');
        
        return {
          ...l,
          category: catName,
          url_original: l.url_original || l.url || ''
        };
      })
  };
}

function saveLocal() {
  localStorage.setItem('pti_recent', JSON.stringify(S.recent));
  localStorage.setItem('pti_fav', JSON.stringify(S.favorites));
}

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

function isFav(x) {
  const idStr = String(x.id);
  return S.usingDb ? S.dbFavorites.has(idStr) : S.favorites.includes(idStr);
}

function resolveUrl(x) {
  let u = String(x.url_original || x.url || '').trim();
  if (!u) return null;

  if (/^https?:\/\//i.test(u)) return u;

  if (/^[A-Za-z]:[\\/]/.test(u)) {
    return 'file:///' + u.replace(/\\/g, '/');
  }

  if (/^\\\\/.test(u)) {
    return 'file://' + u.replace(/^\\\\+/, '').replace(/\\/g, '/');
  }

  if (/^file:\/\//i.test(u)) {
    let rest = u.replace(/^file:\/+/i, '');
    rest = rest.replace(/^\\\\+/, '').replace(/\\/g, '/');
    if (/^[A-Za-z]:/.test(rest)) {
      return 'file:///' + rest;
    }
    return 'file://' + rest.replace(/^\/+/, '');
  }

  const cfg = window.PORTAL_CONFIG || {};
  let root = String(cfg.networkRoot || '').trim();

  if (root) {
    root = root.replace(/\\/g, '/');
    if (!root.endsWith('/')) root += '/';
    let cleanRel = u.replace(/\\/g, '/');
    try {
      return new URL(cleanRel, root).href;
    } catch (e) {
      return root + cleanRel.replace(/^\.\//, '');
    }
  }

  return u;
}

function openItem(x) {
  const url = resolveUrl(x);
  if (!url) {
    toast('Este atalho ainda precisa de uma URL HTTP/HTTPS ou caminho válido.');
    return;
  }
  const idStr = String(x.id);
  S.recent = [idStr, ...S.recent.filter(v => String(v) !== idStr)].slice(0, 8);
  saveLocal();
  renderQuick();
  window.open(url, '_blank', 'noopener');
}

function filtered() {
  let a = [...S.data.links];
  if (S.cat) a = a.filter(x => x.category === S.cat);
  if (S.mode === 'fav') a = a.filter(isFav);
  if (S.mode === 'recent') {
    a = a
      .filter(x => S.recent.includes(String(x.id)))
      .sort((x, y) => S.recent.indexOf(String(x.id)) - S.recent.indexOf(String(y.id)));
  }
  if (S.q) {
    const q = S.q.toLocaleLowerCase('pt-BR');
    const terms = q.split(/\s+/).filter(Boolean);
    a = a.filter(x => {
      const searchBlob = `${x.name} ${x.category} ${x.description || ''} ${x.url_original || x.url || ''}`.toLocaleLowerCase('pt-BR');
      return terms.every(term => searchBlob.includes(term));
    });
  }
  return a;
}

function card(x) {
  const f = isFav(x);
  const raw = String(x.url_original || x.url || '');
  const type = /^https?:\/\//i.test(raw)
    ? 'WEB'
    : /^file:\/\//i.test(raw) || /^[A-Za-z]:[\\/]/.test(raw) || /^\\\\/.test(raw)
    ? 'ARQUIVO / REDE'
    : 'INTERNO';

  return `
    <article class="card" data-o="${esc(x.id)}">
      <div class="ct">
        <span class="ico">${getCategoryIcon(x.category)}</span>
        <button class="star ${f ? 'on' : ''}" data-f="${esc(x.id)}" title="${f ? 'Remover favorito' : 'Adicionar favorito'}" aria-label="Favorito">
          ${f ? '★' : '☆'}
        </button>
      </div>
      <h3>${esc(x.name)}</h3>
      <p>${esc(x.description || x.category)}</p>
      <div class="cf">
        <small>${type}</small>
        <button class="open-btn" data-o="${esc(x.id)}">Abrir ↗</button>
      </div>
    </article>
  `;
}

function renderQuick() {
  const favList = S.usingDb ? Array.from(S.dbFavorites) : S.favorites;
  const ids = [...favList, ...S.recent.filter(id => !favList.includes(String(id)))].slice(0, 8);
  const a = ids.map(id => S.data.links.find(x => String(x.id) === String(id))).filter(Boolean);
  
  const qg = $('#quickGrid');
  if (qg) {
    qg.innerHTML = a.length
      ? a.map(card).join('')
      : '<div class="quick-empty">Favorite atalhos ou abra documentos para vê-los aqui.</div>';
  }
}

function render() {
  const a = filtered();
  const grid = $('#grid');
  const empty = $('#empty');
  const count = $('#count');
  const title = $('#sectionTitle');
  const chips = $('#chips');

  if (grid) grid.innerHTML = a.map(card).join('');
  if (empty) empty.hidden = a.length > 0;
  if (count) count.textContent = `${a.length} ${a.length === 1 ? 'atalho' : 'atalhos'}`;
  if (title) title.textContent = S.mode === 'fav' ? 'Favoritos' : S.mode === 'recent' ? 'Recentes' : S.cat || 'Todos os atalhos';
  
  if (chips) {
    chips.innerHTML = S.data.categories
      .map(c => `<button class="chip ${S.cat === c ? 'sel' : ''}" data-c="${esc(c)}">${getCategoryIcon(c)} ${esc(c)}</button>`)
      .join('');
  }
    
  renderQuick();
}

async function toggleFavorite(x) {
  const idStr = String(x.id);
  if (!S.usingDb) {
    S.favorites = S.favorites.includes(idStr) ? S.favorites.filter(v => v !== idStr) : [...S.favorites, idStr];
    saveLocal();
    render();
    return;
  }

  if (!window.portalSupabase) {
    toast('Supabase não inicializado.');
    return;
  }

  const { data: { user } } = await portalSupabase.auth.getUser();
  if (!user) {
    toast('Entre na administração para sincronizar favoritos.');
    return;
  }

  if (S.dbFavorites.has(idStr)) {
    const { error } = await portalSupabase.from('favorites').delete().eq('user_id', user.id).eq('link_id', x.id);
    if (error) {
      toast(error.message);
    } else {
      S.dbFavorites.delete(idStr);
    }
  } else {
    const { error } = await portalSupabase.from('favorites').insert({ user_id: user.id, link_id: x.id });
    if (error) {
      toast(error.message);
    } else {
      S.dbFavorites.add(idStr);
    }
  }
  render();
}

async function loadDb() {
  if (!window.supabaseReady || !window.portalSupabase) return false;

  try {
    const [{ data: cats, error: e1 }, { data: links, error: e2 }] = await Promise.all([
      portalSupabase.from('categories').select('*').eq('active', true).order('sort_order'),
      portalSupabase.from('links').select('*, categories(name)').eq('active', true).order('sort_order')
    ]);

    if (e1 || e2 || !cats || !links) {
      return false;
    }

    S.data = processData(cats, links);
    S.usingDb = true;

    const { data: { user } } = await portalSupabase.auth.getUser();
    if (user) {
      const { data: f } = await portalSupabase.from('favorites').select('link_id').eq('user_id', user.id);
      S.dbFavorites = new Set((f || []).map(v => String(v.link_id)));
    }
    return true;
  } catch (err) {
    return false;
  }
}

function loadLocal() {
  const savedCats = JSON.parse(localStorage.getItem('pti_local_cats') || 'null');
  const savedLinks = JSON.parse(localStorage.getItem('pti_local_links') || 'null');
  const baseData = window.portalData || (typeof portalData !== 'undefined' ? portalData : { categories: [], links: [] });

  let cats = savedCats || baseData.categories || [];
  let links = savedLinks || baseData.links || [];

  if (savedCats && savedLinks) {
    links = links.map(l => {
      if (!l.category && l.category_id) {
        const foundCat = cats.find(c => String(c.id) === String(l.category_id));
        if (foundCat) l.category = foundCat.name;
      }
      return l;
    });
  }

  S.data = processData(cats, links);
}

document.addEventListener('click', e => {
  const f = e.target.closest('[data-f]');
  if (f) {
    e.stopPropagation();
    const x = S.data.links.find(v => String(v.id) === String(f.dataset.f));
    if (x) toggleFavorite(x);
    return;
  }

  const o = e.target.closest('[data-o]');
  if (o) {
    const x = S.data.links.find(v => String(v.id) === String(o.dataset.o));
    if (x) openItem(x);
    return;
  }

  const c = e.target.closest('[data-c]');
  if (c) {
    S.cat = S.cat === c.dataset.c ? '' : c.dataset.c;
    S.mode = 'all';
    render();
  }
});

$('#q')?.addEventListener('input', e => {
  S.q = e.target.value;
  S.cat = '';
  S.mode = 'all';
  render();
});

$('#clear')?.addEventListener('click', () => {
  if ($('#q')) $('#q').value = '';
  S.q = '';
  render();
});

$('#favoritesBtn')?.addEventListener('click', () => {
  S.mode = 'fav';
  S.cat = '';
  render();
});

$('#recentBtn')?.addEventListener('click', () => {
  S.mode = 'recent';
  S.cat = '';
  render();
});

$('#allBtn')?.addEventListener('click', () => {
  S.mode = 'all';
  S.cat = '';
  if ($('#q')) $('#q').value = '';
  S.q = '';
  render();
});

$('#theme')?.addEventListener('click', () => {
  const isDark = document.documentElement.dataset.theme === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  document.documentElement.dataset.theme = newTheme;
  localStorage.setItem('pti_theme', newTheme);
});

(async () => {
  const savedTheme = localStorage.getItem('pti_theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;

  loadLocal();

  await loadDb();

  const footerInfo = $('#footerInfo');
  if (footerInfo) {
    footerInfo.textContent = `${S.data.links.length} atalhos · ${S.data.categories.length} categorias${S.usingDb ? ' · Supabase conectado' : ' · Modo local'}`;
  }

  render();
})();
