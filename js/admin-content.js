/* ============================================================
   CONTEÚDO DO SITE — Administração
   (História, Locais Atendidos, Configurar Wi-Fi, Contato)

   Usa as mesmas tabelas/convenções do restante do admin.js:
   - localMode() decide entre Supabase e localStorage
   - toast() para feedback
   - $()/esc() helpers já definidos em admin.js
   ============================================================ */

const CONTENT_DEFAULTS = {
  historia: {
    title: 'Nossa História no Campus',
    body: 'Desde a consolidação do Campus Xanxerê, a equipe de TI tem atuado na expansão da infraestrutura de rede, modernização de laboratórios e suporte a alunos e servidores. Nosso compromisso é manter os serviços acadêmicos e administrativos sempre ativos e seguros.',
    image_url: ''
  },
  wifi_intro: {
    title: 'Como Configurar o Wi-Fi (Eduroam)',
    body: '',
    image_url: ''
  },
  contato: {
    title: 'Contato',
    body: 'WhatsApp: (49) 3441-7020\nE-mail: ti.xanxere@unoesc.edu.br\nHorário: Segunda a sexta, das 7h30 às 21h30.',
    image_url: ''
  }
};

const SLUG_TO_PREFIX = { historia: 'historia', wifi_intro: 'wifi', contato: 'contato' };

const CC = {
  content: {},
  cards: { locais: [], wifi_steps: [] },
  pendingFile: { historia: null, wifi: null, contato: null, card: null }
};

/* ============================================================
   HELPERS
   ============================================================ */

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------
   Fase 3: redimensiona/comprime imagens antes de gerar a prévia
   e de enviar, para não inflar o Storage (ou o localStorage, em
   Modo Local) com fotos em resolução cheia de celular.
   ------------------------------------------------------------ */
function resizeImageFile(file, maxDim = 1280, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
      resolve(file);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        if (width <= maxDim && height <= maxDim) {
          resolve(file);
          return;
        }

        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) { resolve(file); return; }
          const newName = file.name.replace(/\.\w+$/, '') + '.jpg';
          resolve(new File([blob], newName, { type: 'image/jpeg' }));
        }, 'image/jpeg', quality);
      };

      img.onerror = () => resolve(file);
      img.src = reader.result;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

async function uploadSiteImage(file, folder) {
  if (!file) return null;

  if (localMode()) {
    return await fileToDataUrl(file);
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;

  const { error } = await portalSupabase.storage
    .from('site-images')
    .upload(path, file, { upsert: true, cacheControl: '3600' });

  if (error) {
    toast('Erro ao enviar imagem: ' + error.message);
    return null;
  }

  const { data } = portalSupabase.storage.from('site-images').getPublicUrl(path);
  return data?.publicUrl || null;
}

/* ============================================================
   ABAS — Atalhos / Conteúdo do Site
   ============================================================ */

$('#adminTabs')?.addEventListener('click', (event) => {
  const btn = event.target.closest('.admin-tab');
  if (!btn) return;

  document.querySelectorAll('#adminTabs .admin-tab').forEach(b => b.classList.toggle('active', b === btn));

  const tab = btn.dataset.tab;
  $('#tabAtalhos').hidden = tab !== 'atalhos';
  $('#tabConteudo').hidden = tab !== 'conteudo';
  $('#tabMenuLateral').hidden = tab !== 'menulateral';
  $('#tabAvisos').hidden = tab !== 'avisos';

  const newLinkBtn = $('#newLink');
  if (newLinkBtn) newLinkBtn.style.display = tab === 'atalhos' ? '' : 'none';

  if (tab === 'conteudo') loadSiteContent();
  if (tab === 'menulateral') loadQuickLinks();
  if (tab === 'avisos') loadAnnouncements();
});

$('#contentSubtabs')?.addEventListener('click', (event) => {
  const btn = event.target.closest('.admin-tab');
  if (!btn) return;

  document.querySelectorAll('#contentSubtabs .admin-tab').forEach(b => b.classList.toggle('active', b === btn));

  const sub = btn.dataset.sub;
  $('#paneHistoria').hidden = sub !== 'historia';
  $('#paneLocais').hidden = sub !== 'locais';
  $('#paneWifi').hidden = sub !== 'wifi';
  $('#paneContato').hidden = sub !== 'contato';
});

/* ============================================================
   CARREGAR CONTEÚDO
   ============================================================ */

async function loadSiteContent() {
  if (localMode()) {
    CC.content.historia = JSON.parse(localStorage.getItem('pti_content_historia') || 'null') || { ...CONTENT_DEFAULTS.historia };
    CC.content.wifi_intro = JSON.parse(localStorage.getItem('pti_content_wifi') || 'null') || { ...CONTENT_DEFAULTS.wifi_intro };
    CC.content.contato = JSON.parse(localStorage.getItem('pti_content_contato') || 'null') || { ...CONTENT_DEFAULTS.contato };
    CC.cards.locais = JSON.parse(localStorage.getItem('pti_cards_locais') || '[]');
    CC.cards.wifi_steps = JSON.parse(localStorage.getItem('pti_cards_wifi_steps') || '[]');
  } else {
    try {
      const { data: rows } = await portalSupabase.from('site_content').select('*');
      CC.content.historia = rows?.find(r => r.slug === 'historia') || { ...CONTENT_DEFAULTS.historia };
      CC.content.wifi_intro = rows?.find(r => r.slug === 'wifi_intro') || { ...CONTENT_DEFAULTS.wifi_intro };
      CC.content.contato = rows?.find(r => r.slug === 'contato') || { ...CONTENT_DEFAULTS.contato };

      const { data: cards } = await portalSupabase.from('site_cards').select('*').order('sort_order');
      CC.cards.locais = (cards || []).filter(c => c.section === 'locais');
      CC.cards.wifi_steps = (cards || []).filter(c => c.section === 'wifi_steps');
    } catch (err) {
      console.error(err);
      toast('Não foi possível carregar o conteúdo do site (verifique se as tabelas site_content/site_cards existem).');
      CC.content.historia = { ...CONTENT_DEFAULTS.historia };
      CC.content.wifi_intro = { ...CONTENT_DEFAULTS.wifi_intro };
      CC.content.contato = { ...CONTENT_DEFAULTS.contato };
      CC.cards.locais = [];
      CC.cards.wifi_steps = [];
    }
  }

  fillContentForm('historia');
  fillContentForm('wifi_intro');
  fillContentForm('contato');

  renderCardList('locais');
  renderCardList('wifi_steps');
}

function fillContentForm(slug) {
  const prefix = SLUG_TO_PREFIX[slug];
  const data = CC.content[slug] || {};

  const titleInput = $(`#${prefix}TitleInput`);
  const bodyInput = $(`#${prefix}BodyInput`);

  if (titleInput) titleInput.value = data.title || '';
  if (bodyInput) bodyInput.value = data.body || '';

  setImagePreview(prefix, data.image_url || '');
}

function setImagePreview(prefix, url) {
  const wrap = $(`#${prefix}ImagePreviewWrap`);
  const img = $(`#${prefix}ImagePreview`);
  if (!wrap || !img) return;

  if (url) {
    img.src = url;
    wrap.hidden = false;
  } else {
    img.src = '';
    wrap.hidden = true;
  }
}

/* ============================================================
   FORMULÁRIOS — HISTÓRIA / WI-FI (intro) / CONTATO
   ============================================================ */

function wireContentForm(slug, formId, msgId) {
  const prefix = SLUG_TO_PREFIX[slug];

  $(`#${prefix}ImageInput`)?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const resized = await resizeImageFile(file);
    CC.pendingFile[prefix] = resized;
    const dataUrl = await fileToDataUrl(resized);
    setImagePreview(prefix, dataUrl);
  });

  $(`#${prefix}ImageRemove`)?.addEventListener('click', () => {
    CC.pendingFile[prefix] = null;
    CC.content[slug] = { ...(CC.content[slug] || {}), image_url: '' };
    setImagePreview(prefix, '');
    const fileInput = $(`#${prefix}ImageInput`);
    if (fileInput) fileInput.value = '';
  });

  $(`#${formId}`)?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const msg = $(`#${msgId}`);
    if (msg) msg.textContent = 'Salvando...';

    const title = $(`#${prefix}TitleInput`)?.value.trim() || '';
    const body = $(`#${prefix}BodyInput`)?.value.trim() || '';

    let image_url = CC.content[slug]?.image_url || '';
    const pending = CC.pendingFile[prefix];

    if (pending) {
      const uploaded = await uploadSiteImage(pending, 'content');
      if (uploaded) image_url = uploaded;
    }

    const payload = { title, body, image_url };

    const ok = await saveSiteContent(slug, payload);

    if (ok) {
      CC.content[slug] = { ...payload, slug };
      CC.pendingFile[prefix] = null;
      if (msg) { msg.className = 'form-msg success'; msg.textContent = 'Salvo com sucesso.'; }
      toast('Conteúdo salvo.');
    } else if (msg) {
      msg.className = 'form-msg warning';
      msg.textContent = 'Não foi possível salvar. Tente novamente.';
    }
  });
}

async function saveSiteContent(slug, payload) {
  if (localMode()) {
    const key = slug === 'wifi_intro' ? 'pti_content_wifi' : `pti_content_${slug}`;
    localStorage.setItem(key, JSON.stringify(payload));
    return true;
  }

  try {
    const { error } = await portalSupabase
      .from('site_content')
      .upsert({ slug, ...payload, updated_at: new Date().toISOString() }, { onConflict: 'slug' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

wireContentForm('historia', 'historiaForm', 'historiaMsg');
wireContentForm('wifi_intro', 'wifiIntroForm', 'wifiIntroMsg');
wireContentForm('contato', 'contatoForm', 'contatoMsg');

/* ============================================================
   CARTÕES — LOCAIS ATENDIDOS / PASSOS WI-FI
   ============================================================ */

const SECTION_LABEL = {
  locais: { new: 'NOVO LOCAL', title: 'Cadastrar local atendido' },
  wifi_steps: { new: 'NOVO PASSO', title: 'Cadastrar passo do Wi-Fi' }
};

function renderCardList(section) {
  const listId = section === 'locais' ? '#locaisList' : '#wifiStepsList';
  const list = $(listId);
  if (!list) return;

  const items = (CC.cards[section] || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (!items.length) {
    list.innerHTML = `<p class="card-admin-empty">Nenhum item cadastrado ainda.</p>`;
    return;
  }

  list.innerHTML = items.map((item, idx) => `
    <div class="card-admin-item" data-id="${esc(item.id)}">
      ${item.image_url
        ? `<img src="${esc(item.image_url)}" alt="">`
        : ''
      }
      <div class="card-admin-top">
        ${!item.image_url ? `<span class="card-admin-icon" aria-hidden="true">${ADMIN_ICONS.folder}</span>` : ''}
        <h4>${section === 'wifi_steps' ? `${idx + 1}. ` : ''}${esc(item.title)}</h4>
      </div>
      <p>${esc(item.description || '')}</p>
      <div class="card-admin-actions">
        <button class="icon-btn" data-action="up" title="Mover para cima">↑</button>
        <button class="icon-btn" data-action="down" title="Mover para baixo">↓</button>
        <button class="icon-btn" data-action="edit" title="Editar">${ADMIN_ICONS.edit}</button>
        <button class="icon-btn danger" data-action="delete" title="Excluir">${ADMIN_ICONS.delete}</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.card-admin-item').forEach(el => {
    const id = el.dataset.id;

    el.querySelector('[data-action="edit"]')?.addEventListener('click', () => openCardEditor(section, id));
    el.querySelector('[data-action="delete"]')?.addEventListener('click', () => deleteCard(section, id));
    el.querySelector('[data-action="up"]')?.addEventListener('click', () => moveCard(section, id, -1));
    el.querySelector('[data-action="down"]')?.addEventListener('click', () => moveCard(section, id, 1));
  });
}

function openCardEditor(section, id) {
  const item = id ? CC.cards[section].find(c => String(c.id) === String(id)) : null;

  $('#cardSection').value = section;
  $('#cardEditId').value = item ? item.id : '';
  $('#cardEditorEyebrow').textContent = item ? 'EDITAR' : SECTION_LABEL[section].new;
  $('#cardEditorTitle').textContent = item ? 'Editar item' : SECTION_LABEL[section].title;

  $('#cardTitle').value = item?.title || '';
  $('#cardDescription').value = item?.description || '';
  $('#cardImageInput').value = '';
  CC.pendingFile.card = null;
  setImagePreview('card', item?.image_url || '');
  $('#cardMsg').textContent = '';

  showModal($('#cardEditor'));
}

$('#newLocal')?.addEventListener('click', () => openCardEditor('locais', null));
$('#newWifiStep')?.addEventListener('click', () => openCardEditor('wifi_steps', null));
$('#closeCardEditor')?.addEventListener('click', () => hideModal($('#cardEditor')));
$('#cancelCard')?.addEventListener('click', () => hideModal($('#cardEditor')));

$('#cardImageInput')?.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const resized = await resizeImageFile(file);
  CC.pendingFile.card = resized;
  const dataUrl = await fileToDataUrl(resized);
  setImagePreview('card', dataUrl);
});

$('#cardImageRemove')?.addEventListener('click', () => {
  CC.pendingFile.card = null;
  setImagePreview('card', '');
  $('#cardImageInput').value = '';
});

$('#cardForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const section = $('#cardSection').value;
  const id = $('#cardEditId').value || null;
  const title = $('#cardTitle').value.trim();
  const description = $('#cardDescription').value.trim();
  const msg = $('#cardMsg');

  if (!title) {
    msg.className = 'form-msg warning';
    msg.textContent = 'Informe um título.';
    return;
  }

  msg.textContent = 'Salvando...';

  const existing = id ? CC.cards[section].find(c => String(c.id) === String(id)) : null;
  let image_url = existing?.image_url || '';

  if (CC.pendingFile.card) {
    const uploaded = await uploadSiteImage(CC.pendingFile.card, section);
    if (uploaded) image_url = uploaded;
  }

  const ok = await saveCard(section, { id, title, description, image_url, sort_order: existing?.sort_order ?? CC.cards[section].length });

  if (ok) {
    toast('Item salvo.');
    hideModal($('#cardEditor'));
    await loadSiteContent();
  } else {
    msg.className = 'form-msg warning';
    msg.textContent = 'Não foi possível salvar este item.';
  }
});

async function saveCard(section, payload) {
  if (localMode()) {
    const key = section === 'locais' ? 'pti_cards_locais' : 'pti_cards_wifi_steps';
    const list = CC.cards[section].slice();

    if (payload.id) {
      const idx = list.findIndex(c => String(c.id) === String(payload.id));
      if (idx > -1) list[idx] = { ...list[idx], ...payload };
    } else {
      list.push({ ...payload, id: 'local-' + Date.now(), active: true });
    }

    localStorage.setItem(key, JSON.stringify(list));
    return true;
  }

  try {
    if (payload.id && !String(payload.id).startsWith('local-')) {
      const { error } = await portalSupabase
        .from('site_cards')
        .update({
          title: payload.title,
          description: payload.description,
          image_url: payload.image_url,
          sort_order: payload.sort_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', payload.id);

      if (error) throw error;
    } else {
      const { error } = await portalSupabase.from('site_cards').insert({
        section,
        title: payload.title,
        description: payload.description,
        image_url: payload.image_url,
        sort_order: payload.sort_order,
        active: true
      });

      if (error) throw error;
    }

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function deleteCard(section, id) {
  if (!confirm('Excluir este item?')) return;

  if (localMode()) {
    const key = section === 'locais' ? 'pti_cards_locais' : 'pti_cards_wifi_steps';
    const list = CC.cards[section].filter(c => String(c.id) !== String(id));
    localStorage.setItem(key, JSON.stringify(list));
  } else {
    try {
      const { error } = await portalSupabase.from('site_cards').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error(err);
      toast('Não foi possível excluir.');
      return;
    }
  }

  toast('Item excluído.');
  await loadSiteContent();
}

async function moveCard(section, id, direction) {
  const list = CC.cards[section].slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const idx = list.findIndex(c => String(c.id) === String(id));
  const swapIdx = idx + direction;

  if (idx === -1 || swapIdx < 0 || swapIdx >= list.length) return;

  const a = list[idx];
  const b = list[swapIdx];
  const aOrder = a.sort_order ?? idx;
  const bOrder = b.sort_order ?? swapIdx;

  a.sort_order = bOrder;
  b.sort_order = aOrder;

  if (localMode()) {
    const key = section === 'locais' ? 'pti_cards_locais' : 'pti_cards_wifi_steps';
    localStorage.setItem(key, JSON.stringify(list));
  } else {
    try {
      await portalSupabase.from('site_cards').update({ sort_order: a.sort_order }).eq('id', a.id);
      await portalSupabase.from('site_cards').update({ sort_order: b.sort_order }).eq('id', b.id);
    } catch (err) {
      console.error(err);
      toast('Não foi possível reordenar.');
      return;
    }
  }

  await loadSiteContent();
}

/* ============================================================
   MENU LATERAL DO PAINEL (quick_links)
   ============================================================ */

const QL_ICON_LABEL = {
  link: 'Link genérico', calendar: 'Agenda / Calendário', network: 'Rede / Monitoramento',
  whatsapp: 'WhatsApp', gear: 'Configurações', home: 'Início'
};

let QUICK_LINKS = [];

async function loadQuickLinks() {
  if (localMode()) {
    QUICK_LINKS = JSON.parse(localStorage.getItem('pti_quick_links') || '[]');
  } else {
    try {
      const { data, error } = await portalSupabase.from('quick_links').select('*').order('sort_order');
      if (error) throw error;
      QUICK_LINKS = data || [];
    } catch (err) {
      console.error(err);
      toast('Não foi possível carregar o menu lateral (verifique se a tabela quick_links existe).');
      QUICK_LINKS = [];
    }
  }

  renderQuickLinks();
}

function renderQuickLinks() {
  const list = $('#quickLinksList');
  if (!list) return;

  const items = QUICK_LINKS.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (!items.length) {
    list.innerHTML = `<p class="card-admin-empty">Nenhum link cadastrado ainda.</p>`;
    return;
  }

  list.innerHTML = items.map(item => `
    <div class="card-admin-item" data-id="${esc(item.id)}">
      <div class="card-admin-top">
        <span class="card-admin-icon" aria-hidden="true">${ADMIN_ICONS.folder}</span>
        <h4>${esc(item.title)}</h4>
      </div>
      <p>${esc(item.url)}<br><small>Ícone: ${esc(QL_ICON_LABEL[item.icon_key] || item.icon_key)}</small></p>
      <div class="card-admin-actions">
        <button class="icon-btn" data-action="up" title="Mover para cima">↑</button>
        <button class="icon-btn" data-action="down" title="Mover para baixo">↓</button>
        <button class="icon-btn" data-action="edit" title="Editar">${ADMIN_ICONS.edit}</button>
        <button class="icon-btn danger" data-action="delete" title="Excluir">${ADMIN_ICONS.delete}</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.card-admin-item').forEach(el => {
    const id = el.dataset.id;
    el.querySelector('[data-action="edit"]')?.addEventListener('click', () => openQuickLinkEditor(id));
    el.querySelector('[data-action="delete"]')?.addEventListener('click', () => deleteQuickLink(id));
    el.querySelector('[data-action="up"]')?.addEventListener('click', () => moveQuickLink(id, -1));
    el.querySelector('[data-action="down"]')?.addEventListener('click', () => moveQuickLink(id, 1));
  });
}

function openQuickLinkEditor(id) {
  const item = id ? QUICK_LINKS.find(c => String(c.id) === String(id)) : null;

  $('#quickLinkEditId').value = item ? item.id : '';
  $('#quickLinkEditorEyebrow').textContent = item ? 'EDITAR' : 'NOVO LINK';
  $('#quickLinkEditorTitle').textContent = item ? 'Editar link' : 'Cadastrar link';
  $('#quickLinkTitle').value = item?.title || '';
  $('#quickLinkUrl').value = item?.url || '';
  $('#quickLinkIcon').value = item?.icon_key || 'link';
  $('#quickLinkMsg').textContent = '';

  showModal($('#quickLinkEditor'));
}

$('#newQuickLink')?.addEventListener('click', () => openQuickLinkEditor(null));
$('#closeQuickLinkEditor')?.addEventListener('click', () => hideModal($('#quickLinkEditor')));
$('#cancelQuickLink')?.addEventListener('click', () => hideModal($('#quickLinkEditor')));

$('#quickLinkForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = $('#quickLinkEditId').value || null;
  const title = $('#quickLinkTitle').value.trim();
  const url = $('#quickLinkUrl').value.trim();
  const icon_key = $('#quickLinkIcon').value;
  const msg = $('#quickLinkMsg');

  if (!title || !url) {
    msg.className = 'form-msg warning';
    msg.textContent = 'Preencha título e endereço.';
    return;
  }

  msg.textContent = 'Salvando...';

  const existing = id ? QUICK_LINKS.find(c => String(c.id) === String(id)) : null;
  const payload = { id, title, url, icon_key, sort_order: existing?.sort_order ?? QUICK_LINKS.length };

  const ok = await saveQuickLink(payload);

  if (ok) {
    toast('Link salvo.');
    hideModal($('#quickLinkEditor'));
    await loadQuickLinks();
  } else {
    msg.className = 'form-msg warning';
    msg.textContent = 'Não foi possível salvar este link.';
  }
});

async function saveQuickLink(payload) {
  if (localMode()) {
    const list = QUICK_LINKS.slice();
    if (payload.id) {
      const idx = list.findIndex(c => String(c.id) === String(payload.id));
      if (idx > -1) list[idx] = { ...list[idx], ...payload };
    } else {
      list.push({ ...payload, id: 'local-' + Date.now(), active: true });
    }
    localStorage.setItem('pti_quick_links', JSON.stringify(list));
    return true;
  }

  try {
    if (payload.id && !String(payload.id).startsWith('local-')) {
      const { error } = await portalSupabase
        .from('quick_links')
        .update({
          title: payload.title, url: payload.url, icon_key: payload.icon_key,
          sort_order: payload.sort_order, updated_at: new Date().toISOString()
        })
        .eq('id', payload.id);
      if (error) throw error;
    } else {
      const { error } = await portalSupabase.from('quick_links').insert({
        title: payload.title, url: payload.url, icon_key: payload.icon_key,
        sort_order: payload.sort_order, active: true
      });
      if (error) throw error;
    }
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function deleteQuickLink(id) {
  if (!confirm('Excluir este link do menu lateral?')) return;

  if (localMode()) {
    localStorage.setItem('pti_quick_links', JSON.stringify(QUICK_LINKS.filter(c => String(c.id) !== String(id))));
  } else {
    try {
      const { error } = await portalSupabase.from('quick_links').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error(err);
      toast('Não foi possível excluir.');
      return;
    }
  }

  toast('Link excluído.');
  await loadQuickLinks();
}

async function moveQuickLink(id, direction) {
  const list = QUICK_LINKS.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const idx = list.findIndex(c => String(c.id) === String(id));
  const swapIdx = idx + direction;

  if (idx === -1 || swapIdx < 0 || swapIdx >= list.length) return;

  const a = list[idx];
  const b = list[swapIdx];
  const aOrder = a.sort_order ?? idx;
  const bOrder = b.sort_order ?? swapIdx;

  a.sort_order = bOrder;
  b.sort_order = aOrder;

  if (localMode()) {
    localStorage.setItem('pti_quick_links', JSON.stringify(list));
  } else {
    try {
      await portalSupabase.from('quick_links').update({ sort_order: a.sort_order }).eq('id', a.id);
      await portalSupabase.from('quick_links').update({ sort_order: b.sort_order }).eq('id', b.id);
    } catch (err) {
      console.error(err);
      toast('Não foi possível reordenar.');
      return;
    }
  }

  await loadQuickLinks();
}

/* ============================================================
   BACKUP / EXPORTAÇÃO (Fase 3)
   Baixa um .json com tudo que o admin gerencia hoje: categorias,
   atalhos, conteúdo do site e menu lateral. Útil como salvaguarda
   antes de mexer no Supabase, ou para levar os dados para outro
   ambiente.
   ============================================================ */

$('#exportBackup')?.addEventListener('click', async () => {

  toast('Gerando backup...');

  try {
    const backup = {
      generated_at: new Date().toISOString(),
      mode: localMode() ? 'local' : 'supabase'
    };

    if (localMode()) {

      backup.categories = A.categories || [];
      backup.links = A.links || [];
      backup.site_content = Object.values(CC.content || {});
      backup.site_cards = [...(CC.cards?.locais || []), ...(CC.cards?.wifi_steps || [])];
      backup.quick_links = QUICK_LINKS || [];

    } else {

      const [
        { data: cats }, { data: links }, { data: content }, { data: cards }, { data: ql }
      ] = await Promise.all([
        portalSupabase.from('categories').select('*'),
        portalSupabase.from('links').select('*'),
        portalSupabase.from('site_content').select('*'),
        portalSupabase.from('site_cards').select('*'),
        portalSupabase.from('quick_links').select('*')
      ]);

      backup.categories = cats || [];
      backup.links = links || [];
      backup.site_content = content || [];
      backup.site_cards = cards || [];
      backup.quick_links = ql || [];

    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `portal-ti-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);

    toast('Backup baixado.');

  } catch (err) {
    console.error(err);
    toast('Não foi possível gerar o backup.');
  }

});

/* ============================================================
   INTEGRAÇÃO COM O CICLO DE VIDA DO ADMIN
   ============================================================ */

const _originalLoadAdmin = window.loadAdmin;

window.loadAdmin = async function patchedLoadAdmin() {
  await _originalLoadAdmin();

  if (A.user || localMode()) {
    const activeTab = document.querySelector('#adminTabs .admin-tab.active')?.dataset.tab;
    if (activeTab === 'conteudo') {
      try { await loadSiteContent(); } catch (err) { console.error(err); }
    }
  }
};
