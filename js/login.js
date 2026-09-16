const $ = s => document.querySelector(s);

/* ============================================================
   TEMA
   ============================================================ */

(function initTheme() {
  const saved = localStorage.getItem('pti_theme');
  if (saved === 'dark') document.documentElement.dataset.theme = 'dark';
})();

$('#themeFloat')?.addEventListener('click', () => {
  const isDark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
  localStorage.setItem('pti_theme', isDark ? 'light' : 'dark');
});

/* ============================================================
   LOGIN
   ============================================================ */

function setMsg(text, kind) {
  const el = $('#loginMsg');
  if (!el) return;
  el.textContent = text;
  el.className = 'form-msg' + (kind ? ' ' + kind : '');
}

async function redirectIfLoggedIn() {
  if (!window.supabaseReady || !window.portalSupabase) return;
  const { data } = await portalSupabase.auth.getUser();
  if (data?.user) {
    window.location.href = 'dashboard.html';
  }
}

redirectIfLoggedIn();

$('#loginForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = $('#email').value.trim();
  const password = $('#password').value;

  if (!window.supabaseReady || !window.portalSupabase) {
    setMsg('Login ainda não configurado. Contate o administrador do Portal TI para ativar o Supabase Auth.', 'warning');
    return;
  }

  const submitBtn = event.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  setMsg('Verificando credenciais...');

  const { data, error } = await portalSupabase.auth.signInWithPassword({ email, password });

  submitBtn.disabled = false;

  if (error) {
    setMsg('Usuário ou senha inválidos. Verifique e tente novamente.', 'warning');
    return;
  }

  if (data?.user) {
    setMsg('Login realizado! Redirecionando...', 'success');
    window.location.href = 'dashboard.html';
  }
});
