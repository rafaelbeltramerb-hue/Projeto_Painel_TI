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
   SAIR
   ============================================================ */

$('#logoutLink')?.addEventListener('click', async (event) => {
  event.preventDefault();

  if (window.portalSupabase) {
    await portalSupabase.auth.signOut();
  }

  window.location.href = 'index.html';
});
