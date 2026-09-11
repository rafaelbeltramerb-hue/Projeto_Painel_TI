/* Cliente Supabase carregado por CDN. */
window.portalSupabase = null;
window.supabaseReady = false;

(function () {
  const cfg = window.SUPABASE_CONFIG || {};
  const valid = cfg.url && !cfg.url.includes('SEU-PROJETO') && cfg.anonKey && !cfg.anonKey.includes('SUA_');
  if (!valid || !window.supabase) return;
  window.portalSupabase = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  window.supabaseReady = true;
})();
