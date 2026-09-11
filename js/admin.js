const A = { categories: [], links: [], user: null };
const $ = s => document.querySelector(s);
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => (t.hidden = true), 3500);
}

function localMode() {
  return !window.supabaseReady || !window.portalSupabase;
}

function showLogin() {
  $('#loginPanel').hidden = false;
  $('#adminPanel').hidden = true;
  $('#logout').hidden = true;
}

function showAdmin() {
  $('#loginPanel').hidden = true;
  $('#adminPanel').hidden = false;
  $('#logout').hidden = false;
}

function refreshLocal() {
  const localData = window.portalData || (typeof portalData !== 'undefined' ? portalData : null);
  
  const savedCats = JSON.parse(localStorage.getItem('pti_local_cats') || 'null');
  const savedLinks = JSON.parse(localStorage.getItem('pti_local_links') || 'null');

  if (savedCats) {
    A.categories = savedCats;
  } else if (localData?.categories) {
    A.categories = localData.categories.map((c, i) => ({
      id: String(i + 1),
      name: typeof c === 'string' ? c : c.name,
      icon: typeof c === 'object' ? c.icon || '📁' : '📁',
      description: typeof c === 'object' ? c.description || '' : ''
    }));
  }

  if (savedLinks) {
    A.links = savedLinks;
  } else if (localData?.links) {
    A.links = localData.links.map(l => ({
      ...l,
      category_id: A.categories.find(c => c.name === l.category)?.id || '1',
      category_name: l.category || 'Sem categoria',
      url: l.url_original || l.url || ''
    }));
  }

  renderCategories();
  renderLinks();
}

async function refresh() {
  if (localMode()) {
    refreshLocal();
    return;
  }

  const [c, l] = await Promise.all([
    portalSupabase.from('categories').select('*').order('sort_order'),
    portalSupabase.from('links').select('*, categories(name)').order('sort_order')
  ]);

  if (c.error || l.error) {
    toast(c.error?.message || l.error?.message);
    return;
  }

  A.categories = c.data || [];
  A.links = (l.data || []).map(x => ({ ...x, category_name: x.categories?.name || 'Sem categoria' }));
  renderCategories();
  renderLinks();
}

function renderCategories() {
  const tbody = $('#categoryTableBody');
  if (!tbody) return;

  if (A.categories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1.5rem;">Nenhuma categoria encontrada.</td></tr>';
    return;
  }

  tbody.innerHTML = A.categories.map(c => `
    <tr>
      <td><strong>${esc(c.icon || '📁')} ${esc(c.name)}</strong></td>
      <td>${esc(c.description || '-')}</td>
      <td><span class="badge ${c.active !== false ? 'success' : 'muted'}">${c.active !== false ? 'Ativa' : 'Inativa'}</span></td>
      <td style="text-align:right;">
        <button class="icon-btn" data-edit-cat="${esc(c.id)}" title="Editar Categoria">✏️</button>
        <button class="icon-btn danger" data-delete-cat="${esc(c.id)}" title="Excluir Categoria">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function renderLinks() {
  const tbody = $('#linksTableBody');
  if (!tbody) return;

  if (A.links.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem;">Nenhum atalho cadastrado.</td></tr>';
    return;
  }

  tbody.innerHTML = A.links.map(x => `
    <tr>
      <td><strong>${esc(x.name)}</strong></td>
      <td><span class="badge secondary">${esc(x.category_name)}</span></td>
      <td><span class="badge outline">${esc(x.link_type || 'internal')}</span></td>
      <td><span class="badge ${x.active !== false ? 'success' : 'muted'}">${x.active !== false ? 'Ativo' : 'Inativo'}</span></td>
      <td style="text-align:right;">
        <button class="icon-btn" data-edit="${esc(x.id)}" title="Editar Atalho">✏️</button>
        <button class="icon-btn danger" data-delete="${esc(x.id)}" title="Excluir Atalho">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function openEditor(x = null) {
  // Garante que o modal de categoria esteja fechado antes de abrir o de atalho
  closeCategoryModal();

  $('#editor').hidden = false;
  $('#editId').value = x?.id || '';
  $('#editorEyebrow').textContent = x ? 'EDITAR ATALHO' : 'NOVO ATALHO';
  $('#editorTitle').textContent = x ? 'Editar atalho' : 'Cadastrar atalho';
  $('#linkName').value = x?.name || '';
  $('#linkDescription').value = x?.description || '';
  $('#linkUrl').value = x?.url || '';
  $('#linkType').value = x?.link_type || 'internal';
  $('#linkActive').checked = x?.active !== false;
  $('#formMsg').textContent = '';

  if (A.categories.length === 0) {
    $('#linkCategory').innerHTML = '<option value="">Nenhuma categoria cadastrada</option>';
  } else {
    $('#linkCategory').innerHTML = A.categories.map(c => 
      `<option value="${c.id}" ${String(x?.category_id || x?.category) === String(c.id) || x?.category === c.name ? 'selected' : ''}>${esc(c.name)}</option>`
    ).join('');
  }
}

function closeEditor() {
  $('#editor').hidden = true;
  $('#linkForm').reset();
  $('#formMsg').textContent = '';
}

function openCategoryModal(c = null) {
  // Oculta o editor de atalho para evitar sobreposição
  $('#editor').hidden = true;

  $('#categoryModal').hidden = false;
  $('#categoryModalTitle').textContent = c ? 'Editar categoria' : 'Nova categoria';
  $('#editCategoryId').value = c ? c.id : '';
  $('#categoryName').value = c ? c.name : '';
  $('#categoryDescription').value = c ? (c.description || '') : '';
  $('#categoryIcon').value = c ? (c.icon || '📁') : '📁';
  $('#categoryMsg').textContent = '';
}

function closeCategoryModal() {
  $('#categoryModal').hidden = true;
  $('#categoryForm').reset();
  $('#categoryMsg').textContent = '';
}

async function loadAdmin() {
  if (localMode()) {
    showAdmin();
    $('#sessionInfo').textContent = 'Modo Local (Gerenciamento em memória local)';
    refreshLocal();
    return;
  }

  if (!A.user && window.portalSupabase) {
    const r = await portalSupabase.auth.getUser();
    A.user = r.data.user;
  }

  if (!A.user) {
    showLogin();
    return;
  }

  showAdmin();
  $('#sessionInfo').textContent = `Administrador: ${A.user.email}`;
  await refresh();
}

// Event Listeners
$('#newLink').onclick = () => openEditor();
$('#closeEditor').onclick = closeEditor;
$('#cancelEditor').onclick = closeEditor;

$('#newCategory').onclick = () => openCategoryModal();
$('#closeCategoryModal').onclick = closeCategoryModal;
$('#cancelCategoryModal').onclick = closeCategoryModal;

$('#linkForm').onsubmit = async e => {
  e.preventDefault();
  const id = $('#editId').value;
  const payload = {
    name: $('#linkName').value.trim(),
    category_id: $('#linkCategory').value,
    description: $('#linkDescription').value.trim(),
    url: $('#linkUrl').value.trim(),
    link_type: $('#linkType').value,
    active: $('#linkActive').checked
  };

  if (!payload.name || !payload.url) {
    $('#formMsg').textContent = 'Preencha os campos obrigatórios (Nome e URL).';
    return;
  }

  if (localMode()) {
    if (id) {
      const idx = A.links.findIndex(x => String(x.id) === String(id));
      if (idx !== -1) A.links[idx] = { ...A.links[idx], ...payload };
    } else {
      payload.id = String(Date.now());
      const cat = A.categories.find(c => String(c.id) === String(payload.category_id));
      payload.category_name = cat ? cat.name : 'Geral';
      A.links.push(payload);
    }
    localStorage.setItem('pti_local_links', JSON.stringify(A.links));
    closeEditor();
    refreshLocal();
    toast('Salvo no navegador (Modo Local).');
    return;
  }

  const { error } = id 
    ? await portalSupabase.from('links').update(payload).eq('id', id)
    : await portalSupabase.from('links').insert([payload]);

  if (error) {
    $('#formMsg').textContent = error.message;
  } else {
    closeEditor();
    await refresh();
    toast('Atalho salvo com sucesso!');
  }
};

$('#categoryForm').onsubmit = async e => {
  e.preventDefault();
  const id = $('#editCategoryId').value;
  const payload = {
    name: $('#categoryName').value.trim(),
    description: $('#categoryDescription').value.trim(),
    icon: $('#categoryIcon').value.trim() || '📁'
  };

  if (!payload.name) {
    $('#categoryMsg').textContent = 'O nome da categoria é obrigatório.';
    return;
  }

  if (localMode()) {
    if (id) {
      const idx = A.categories.findIndex(c => String(c.id) === String(id));
      if (idx !== -1) A.categories[idx] = { ...A.categories[idx], ...payload };
    } else {
      payload.id = String(Date.now());
      A.categories.push(payload);
    }
    localStorage.setItem('pti_local_cats', JSON.stringify(A.categories));
    closeCategoryModal();
    refreshLocal();
    toast('Categoria salva (Modo Local).');
    return;
  }

  const { error } = id
    ? await portalSupabase.from('categories').update(payload).eq('id', id)
    : await portalSupabase.from('categories').insert([payload]);

  if (error) {
    $('#categoryMsg').textContent = error.message;
  } else {
    closeCategoryModal();
    await refresh();
    toast('Categoria salva com sucesso!');
  }
};

document.addEventListener('click', e => {
  const ed = e.target.closest('[data-edit]');
  if (ed) {
    openEditor(A.links.find(x => String(x.id) === String(ed.dataset.edit)));
    return;
  }

  const del = e.target.closest('[data-delete]');
  if (del) {
    if (confirm('Deseja realmente excluir este atalho?')) {
      const id = del.dataset.delete;
      if (localMode()) {
        A.links = A.links.filter(x => String(x.id) !== String(id));
        localStorage.setItem('pti_local_links', JSON.stringify(A.links));
        refreshLocal();
        toast('Excluído (Modo Local).');
      }
    }
    return;
  }

  const edCat = e.target.closest('[data-edit-cat]');
  if (edCat) {
    openCategoryModal(A.categories.find(c => String(c.id) === String(edCat.dataset.editCat)));
    return;
  }
});

$('#loginForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  if (localMode()) {
    toast('Supabase não configurado. Operando em Modo Local.');
    loadAdmin();
    return;
  }
  const email = $('#email').value;
  const password = $('#password').value;
  const { error } = await portalSupabase.auth.signInWithPassword({ email, password });
  if (error) {
    $('#loginMsg').textContent = error.message;
  } else {
    await loadAdmin();
  }
});

$('#logout')?.addEventListener('click', async () => {
  if (!localMode() && window.portalSupabase) {
    await portalSupabase.auth.signOut();
  }
  A.user = null;
  showLogin();
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
  await loadAdmin();
})();
