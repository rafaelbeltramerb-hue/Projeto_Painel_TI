/* ============================================================
   AVISOS DO SITE PÚBLICO — Administração (Fase 4.1)
   ============================================================ */

const LEVEL_LABEL = {
  info: 'Informativo',
  warning: 'Atenção',
  critical: 'Crítico'
};

let ANNOUNCEMENTS = [];

function fmtDateTimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtDateTimeDisplay(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

async function loadAnnouncements() {
  if (localMode()) {
    ANNOUNCEMENTS = JSON.parse(localStorage.getItem('pti_announcements') || '[]');
  } else {
    try {
      const { data, error } = await portalSupabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      ANNOUNCEMENTS = data || [];
    } catch (err) {
      console.error(err);
      toast('Não foi possível carregar os avisos (verifique se a tabela announcements existe).');
      ANNOUNCEMENTS = [];
    }
  }

  renderAnnouncements();
}

function renderAnnouncements() {
  const list = $('#announcementsAdminList');
  if (!list) return;

  if (!ANNOUNCEMENTS.length) {
    list.innerHTML = `<p class="card-admin-empty">Nenhum aviso cadastrado ainda.</p>`;
    return;
  }

  list.innerHTML = ANNOUNCEMENTS.map(a => `
    <div class="card-admin-item" data-id="${esc(a.id)}">
      <h4>
        <span class="badge ${a.level === 'critical' ? 'danger' : a.level === 'warning' ? 'muted' : 'success'}">${esc(LEVEL_LABEL[a.level] || a.level)}</span>
        ${esc(a.title)}
        ${a.active ? '' : '<span class="badge muted">Inativo</span>'}
      </h4>
      <p>
        ${esc(a.message)}<br>
        <small>Início: ${fmtDateTimeDisplay(a.starts_at)} · Fim: ${fmtDateTimeDisplay(a.ends_at)}</small>
      </p>
      <div class="card-admin-actions">
        <button class="icon-btn" data-action="edit" title="Editar">${ADMIN_ICONS.edit}</button>
        <button class="icon-btn danger" data-action="delete" title="Excluir">${ADMIN_ICONS.delete}</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.card-admin-item').forEach(el => {
    const id = el.dataset.id;
    el.querySelector('[data-action="edit"]')?.addEventListener('click', () => openAnnouncementEditor(id));
    el.querySelector('[data-action="delete"]')?.addEventListener('click', () => deleteAnnouncement(id));
  });
}

function openAnnouncementEditor(id) {
  const item = id ? ANNOUNCEMENTS.find(a => String(a.id) === String(id)) : null;

  $('#announcementEditId').value = item ? item.id : '';
  $('#announcementEditorEyebrow').textContent = item ? 'EDITAR' : 'NOVO AVISO';
  $('#announcementEditorTitle').textContent = item ? 'Editar aviso' : 'Cadastrar aviso';
  $('#announcementTitle').value = item?.title || '';
  $('#announcementMessage').value = item?.message || '';
  $('#announcementLevel').value = item?.level || 'info';
  $('#announcementStarts').value = fmtDateTimeLocal(item?.starts_at);
  $('#announcementEnds').value = fmtDateTimeLocal(item?.ends_at);
  $('#announcementActive').checked = item ? !!item.active : true;
  $('#announcementMsg').textContent = '';

  showModal($('#announcementEditor'));
}

$('#newAnnouncement')?.addEventListener('click', () => openAnnouncementEditor(null));
$('#closeAnnouncementEditor')?.addEventListener('click', () => hideModal($('#announcementEditor')));
$('#cancelAnnouncement')?.addEventListener('click', () => hideModal($('#announcementEditor')));

$('#announcementForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = $('#announcementEditId').value || null;
  const title = $('#announcementTitle').value.trim();
  const message = $('#announcementMessage').value.trim();
  const level = $('#announcementLevel').value;
  const startsLocal = $('#announcementStarts').value;
  const endsLocal = $('#announcementEnds').value;
  const active = $('#announcementActive').checked;
  const msg = $('#announcementMsg');

  if (!title || !message) {
    msg.className = 'form-msg warning';
    msg.textContent = 'Preencha título e mensagem.';
    return;
  }

  msg.textContent = 'Salvando...';

  const payload = {
    id,
    title,
    message,
    level,
    starts_at: startsLocal ? new Date(startsLocal).toISOString() : null,
    ends_at: endsLocal ? new Date(endsLocal).toISOString() : null,
    active
  };

  const ok = await saveAnnouncement(payload);

  if (ok) {
    toast('Aviso salvo.');
    hideModal($('#announcementEditor'));
    await loadAnnouncements();
  } else {
    msg.className = 'form-msg warning';
    msg.textContent = 'Não foi possível salvar este aviso.';
  }
});

async function saveAnnouncement(payload) {
  if (localMode()) {
    const list = ANNOUNCEMENTS.slice();
    if (payload.id) {
      const idx = list.findIndex(a => String(a.id) === String(payload.id));
      if (idx > -1) list[idx] = { ...list[idx], ...payload };
    } else {
      list.push({ ...payload, id: 'local-' + Date.now(), created_at: new Date().toISOString() });
    }
    localStorage.setItem('pti_announcements', JSON.stringify(list));
    return true;
  }

  try {
    if (payload.id && !String(payload.id).startsWith('local-')) {
      const { error } = await portalSupabase
        .from('announcements')
        .update({
          title: payload.title,
          message: payload.message,
          level: payload.level,
          starts_at: payload.starts_at,
          ends_at: payload.ends_at,
          active: payload.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', payload.id);
      if (error) throw error;
    } else {
      const { error } = await portalSupabase.from('announcements').insert({
        title: payload.title,
        message: payload.message,
        level: payload.level,
        starts_at: payload.starts_at,
        ends_at: payload.ends_at,
        active: payload.active
      });
      if (error) throw error;
    }
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function deleteAnnouncement(id) {
  if (!confirm('Excluir este aviso?')) return;

  if (localMode()) {
    localStorage.setItem('pti_announcements', JSON.stringify(ANNOUNCEMENTS.filter(a => String(a.id) !== String(id))));
  } else {
    try {
      const { error } = await portalSupabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error(err);
      toast('Não foi possível excluir.');
      return;
    }
  }

  toast('Aviso excluído.');
  await loadAnnouncements();
}
