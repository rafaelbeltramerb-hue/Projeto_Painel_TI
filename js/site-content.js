/* ============================================================
   CONTEÚDO DINÂMICO DO SITE PÚBLICO
   Lê site_content / site_cards do Supabase e substitui o texto
   estático das seções História, Locais Atendidos, Configurar
   Wi-Fi e Contato. Se o Supabase não estiver configurado, ou as
   tabelas ainda não existirem, ou não houver dados, a página
   simplesmente mantém o texto estático já presente no HTML.
   ============================================================ */

(async function loadPublicSiteContent() {
  if (!window.supabaseReady || !window.portalSupabase) return;

  try {
    const [{ data: content, error: contentErr }, { data: cards, error: cardsErr }] = await Promise.all([
      portalSupabase.from('site_content').select('*'),
      portalSupabase.from('site_cards').select('*').eq('active', true).order('sort_order')
    ]);

    if (contentErr || cardsErr) return; // tabelas ainda não criadas: mantém o texto estático

    applyContent(content || []);
    applyCards((cards || []).filter(c => c.section === 'locais'), 'locaisTitle', 'locaisGrid', renderLocalCard);
    applyWifiSteps((cards || []).filter(c => c.section === 'wifi_steps'));
  } catch (err) {
    console.warn('Conteúdo dinâmico indisponível, usando texto estático.', err);
  }
})();

function esc(x) {
  return String(x ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));
}

function applyContent(rows) {
  const bySlug = Object.fromEntries(rows.map(r => [r.slug, r]));

  fillTextBlock(bySlug.historia, 'historiaTitle', 'historiaBody', 'historiaImg');
  fillTextBlock(bySlug.wifi_intro, 'wifiTitle', 'wifiBody', null);
  fillContato(bySlug.contato);
}

function fillTextBlock(row, titleId, bodyId, imgId) {
  if (!row) return;

  const titleEl = document.getElementById(titleId);
  const bodyEl = document.getElementById(bodyId);
  const imgEl = imgId ? document.getElementById(imgId) : null;

  if (titleEl && row.title) titleEl.textContent = row.title;

  if (bodyEl) {
    if (row.body) {
      bodyEl.textContent = row.body;
      bodyEl.hidden = false;
    } else {
      bodyEl.hidden = true;
    }
  }

  if (imgEl) {
    if (row.image_url) {
      imgEl.src = row.image_url;
      imgEl.alt = row.title || '';
      imgEl.hidden = false;
    } else {
      imgEl.hidden = true;
    }
  }
}

function fillContato(row) {
  if (!row) return;

  const titleEl = document.getElementById('contatoTitle');
  const gridEl = document.getElementById('contatoGrid');
  if (titleEl && row.title) titleEl.textContent = row.title;
  if (!gridEl || !row.body) return;

  const linkified = esc(row.body)
    .replace(/\n/g, '<br>')
    .replace(/([\w.+-]+@[\w-]+\.[\w.-]+)/g, '<a href="mailto:$1">$1</a>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

  const imageHtml = row.image_url ? `<img class="card-img" src="${esc(row.image_url)}" alt="">` : '';

  gridEl.innerHTML = `<div class="card">${imageHtml}<p>${linkified}</p></div>`;
}

function renderLocalCard(card) {
  const imageHtml = card.image_url ? `<img class="card-img" src="${esc(card.image_url)}" alt="">` : '';
  return `
    <div class="card">
      ${imageHtml}
      <h3>${esc(card.title)}</h3>
      <p>${esc(card.description || '')}</p>
    </div>
  `;
}

function applyCards(items, titleId, gridId, renderFn) {
  if (!items.length) return;

  const gridEl = document.getElementById(gridId);
  if (!gridEl) return;

  gridEl.innerHTML = items.map(renderFn).join('');
}

function applyWifiSteps(steps) {
  if (!steps.length) return;

  const gridEl = document.getElementById('wifiGrid');
  if (!gridEl) return;

  gridEl.innerHTML = steps.map((step, idx) => `
    <div class="step">
      <span class="step-num">${idx + 1}</span>
      <h4>${esc(step.title)}</h4>
      <p>${esc(step.description || '')}</p>
    </div>
  `).join('');
}
