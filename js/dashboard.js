const $ = s => document.querySelector(s);

/* ============================================================
   GUARDA DE AUTENTICAÇÃO
   Se o Supabase Auth estiver configurado, exige sessão válida
   antes de exibir o painel interno.
   ============================================================ */

(async function guard() {
  if (!window.supabaseReady || !window.portalSupabase) return;

  const { data } = await portalSupabase.auth.getUser();

  if (!data?.user) {
    window.location.href = 'login.html';
  }
})();

/* ============================================================
   SIDEBAR — RECOLHER / EXPANDIR
   ============================================================ */

const sidebar = $('#sidebar');
const toggleBtn = $('#sidebarToggle');

const MIN_WIDTH = 72;
const MAX_WIDTH = 340;
const DEFAULT_WIDTH = 250;

function applyWidth(px) {
  const w = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, px));
  sidebar.style.width = w + 'px';
  localStorage.setItem('pti_sidebar_width', String(w));
}

function initSidebar() {
  const collapsed = localStorage.getItem('pti_sidebar_collapsed') === '1';
  if (collapsed) {
    sidebar.classList.add('collapsed');
  } else {
    const savedWidth = parseInt(localStorage.getItem('pti_sidebar_width'), 10);
    applyWidth(Number.isFinite(savedWidth) ? savedWidth : DEFAULT_WIDTH);
  }
}

toggleBtn?.addEventListener('click', () => {
  const isCollapsed = sidebar.classList.toggle('collapsed');
  localStorage.setItem('pti_sidebar_collapsed', isCollapsed ? '1' : '0');

  if (!isCollapsed) {
    const savedWidth = parseInt(localStorage.getItem('pti_sidebar_width'), 10);
    applyWidth(Number.isFinite(savedWidth) ? savedWidth : DEFAULT_WIDTH);
  } else {
    sidebar.style.width = '';
  }
});

initSidebar();

/* ============================================================
   SIDEBAR — REDIMENSIONAR (arrastar)
   ============================================================ */

const resizer = $('#sidebarResizer');
let dragging = false;

resizer?.addEventListener('mousedown', (event) => {
  if (sidebar.classList.contains('collapsed')) return;
  dragging = true;
  document.body.style.userSelect = 'none';
  event.preventDefault();
});

window.addEventListener('mousemove', (event) => {
  if (!dragging) return;
  applyWidth(event.clientX);
});

window.addEventListener('mouseup', () => {
  if (!dragging) return;
  dragging = false;
  document.body.style.userSelect = '';
});

/* ============================================================
   SIDEBAR — LINKS RÁPIDOS DINÂMICOS (quick_links)
   Substitui os itens padrão (Reservas Agenda, Monitoramento Rede,
   Suporte WhatsApp) pelos cadastrados no admin, se o Supabase
   estiver disponível. Sem Supabase, mantém os itens fixos do HTML.
   ============================================================ */

const QUICKLINK_ICONS = {
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M4 9.5h16M8 3v3M16 3v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  network: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6"/><path d="M3.8 12h16.4M12 3.5c2.1 2.3 3.2 5.1 3.2 8.5S14.1 18.2 12 20.5C9.9 18.2 8.8 15.4 8.8 12S9.9 5.8 12 3.5Z" stroke="currentColor" stroke-width="1.4"/>',
  whatsapp: '<path d="M12 3.5A8.5 8.5 0 0 0 4.6 16.3L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.7 8.9c.3-.6 1-1.5 1.6-1.2.4.2 1 1.3 1.2 1.8.2.4 0 .6-.2.8-.5.5-.6.6-.3 1.1.4.7 1.6 1.9 2.5 2.2.5.2.6 0 1-.4.2-.3.5-.4.9-.2.5.2 1.5.9 1.7 1.2.2.4.1 1.2-.5 1.7-.7.6-1.6.7-2.7.3-1.9-.6-3.9-2.4-4.9-4.2-.5-.9-.6-1.9-.3-3.1Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>',
  gear: '<path d="M12 3.5L14 5.2L16.6 5.1L17.5 7.5L19.6 9L18.8 11.5L19.6 14L17.5 15.5L16.6 17.9L14 17.8L12 19.5L10 17.8L7.4 17.9L6.5 15.5L4.4 14L5.2 11.5L4.4 9L6.5 7.5L7.4 5.1L10 5.2L12 3.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="12" cy="11.5" r="2.4" stroke="currentColor" stroke-width="1.4"/>',
  home: '<path d="M4 11.5 12 4l8 7.5M6 10v9h5v-5h2v5h5v-9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  link: '<path d="M9.5 14.5 14.5 9.5M8 14.5 5.5 12a3 3 0 0 1 0-4.2l1.3-1.3a3 3 0 0 1 4.2 0L12 7.5M16 9.5l2.5 2.5a3 3 0 0 1 0 4.2l-1.3 1.3a3 3 0 0 1-4.2 0L12 16.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
};

function esc(x) {
  return String(x ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));
}

async function loadQuickLinks() {
  if (!window.supabaseReady || !window.portalSupabase) return;

  try {
    const { data, error } = await portalSupabase
      .from('quick_links')
      .select('*')
      .eq('active', true)
      .order('sort_order');

    if (error || !data || !data.length) return;

    const end = document.getElementById('quickLinksEnd');
    if (!end) return;

    document.querySelectorAll('.js-default-quicklink').forEach(a => a.closest('li').remove());

    data.forEach(item => {
      const icon = QUICKLINK_ICONS[item.icon_key] || QUICKLINK_ICONS.link;
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="${esc(item.url)}" target="_blank" data-tip="${esc(item.title)}">
          <span class="sidebar-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none">${icon}</svg></span>
          <span class="sidebar-label">${esc(item.title)}</span>
        </a>
      `;
      end.parentNode.insertBefore(li, end);
    });
  } catch (err) {
    console.warn('Links rápidos dinâmicos indisponíveis, mantendo os padrão.', err);
  }
}

loadQuickLinks();

/* ============================================================
   SAIR
   ============================================================ */

$('#logoutLink')?.addEventListener('click', async (event) => {
  event.preventDefault();

  if (window.portalSupabase) {
    await portalSupabase.auth.signOut();
  }

  window.location.href = 'index.html';
});
