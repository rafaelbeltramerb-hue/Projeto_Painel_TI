/* ============================================================
   TEMA CLARO/ESCURO — compartilhado entre index.html e dashboard.html
   Usa a mesma chave (pti_theme) que login.js, app.js e admin.js,
   então a preferência é a mesma em todas as páginas do portal.
   ============================================================ */

(function initTheme() {
  const saved = localStorage.getItem('pti_theme');
  if (saved === 'dark') document.documentElement.dataset.theme = 'dark';
})();

document.getElementById('themeToggle')?.addEventListener('click', () => {
  const isDark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
  localStorage.setItem('pti_theme', isDark ? 'light' : 'dark');
});
