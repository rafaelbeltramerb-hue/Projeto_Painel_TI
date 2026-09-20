/* ============================================================
   BANNER DE AVISOS — site público e painel interno (Fase 4.1)
   Mostra avisos ativos (dentro do período configurado) no topo
   da página, com opção de fechar. Um aviso fechado não volta a
   aparecer NESTE navegador, a não ser que seja um aviso novo.
   ============================================================ */

(async function loadAnnouncements() {
  const wrap = document.getElementById('announcementsWrap');
  if (!wrap) return;
  if (!window.supabaseReady || !window.portalSupabase) return;

  try {
    const { data, error } = await portalSupabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || !data.length) return;

    const dismissed = JSON.parse(localStorage.getItem('pti_dismissed_announcements') || '[]');

    const visible = data.filter(a => !dismissed.includes(String(a.id)));

    if (!visible.length) return;

    wrap.innerHTML = visible.map(renderBanner).join('');

    wrap.querySelectorAll('[data-dismiss]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.dismiss;
        const list = JSON.parse(localStorage.getItem('pti_dismissed_announcements') || '[]');
        if (!list.includes(id)) list.push(id);
        localStorage.setItem('pti_dismissed_announcements', JSON.stringify(list));
        btn.closest('.announce-bar')?.remove();
      });
    });

  } catch (err) {
    console.warn('Avisos indisponíveis.', err);
  }
})();

function announceEsc(x) {
  return String(x ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));
}

const ANNOUNCE_ICON = {
  info: 'ℹ',
  warning: '⚠',
  critical: '⛔'
};

function renderBanner(a) {
  const icon = ANNOUNCE_ICON[a.level] || ANNOUNCE_ICON.info;

  return `
    <div class="announce-bar announce-${announceEsc(a.level || 'info')}" data-id="${announceEsc(a.id)}">
      <span class="announce-icon" aria-hidden="true">${icon}</span>
      <div class="announce-text">
        <strong>${announceEsc(a.title)}</strong> — ${announceEsc(a.message)}
      </div>
      <button class="announce-close" data-dismiss="${announceEsc(a.id)}" aria-label="Fechar aviso" type="button">×</button>
    </div>
  `;
}
