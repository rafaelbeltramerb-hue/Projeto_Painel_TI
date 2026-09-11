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

async function login() {
  if (localMode()) {
    $('#loginMsg').textContent = 'Configure o Supabase em js/supabase-config.js para realizar o login.';
    return;
  }
  const email = $('#email').value.trim();
  const password = $('#password').value;
  $('#loginMsg').textContent = 'Autenticando...';

  const { data, error } = await portalSupabase.auth.signInWithPassword({ email, password });
  if (error) {
    $('#loginMsg').textContent = error.message;
    return;
  }
  A.user = data.user;
  await loadAdmin();
}

async function loadAdmin() {
  if (!A.user && window.portalSupabase) {
    const r = await portalSupabase.auth.getUser();
    A.user = r.data.user;
  }
  if (!A.user) {
    showLogin();
    return;
  }

  // Verificar perfil / role
  const { data: profile, error: pe } = await portalSupabase.from('profiles').select('role').eq('id', A.user.id).single();
  if (pe || profile?.role !== 'admin') {
    showLogin();
    $('#loginMsg').textContent = pe ? 'Usuário autenticado, mas não foi possível verificar as permissões.' : 'Usuário sem permissão de administrador.';
    await portalSupabase.auth.signOut();
    return;
  }

  showAdmin();
  $('#sessionInfo').textContent = `Administrador: ${A.user.email}`;
  await refresh();
}

async function refresh() {
  if (localMode()) return;

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
  $('#categoryAdmin').innerHTML = A.categories.map(c => {
    const count = A.links.filter(x => String(x.category_id) === String(c.id)).length;
    return `
      <div class="admin-cat">
        <span>${esc(c.icon || '📁')}</span>
        <div>
          <b>${esc(c.name)}</b>
          <small>${count} ${count === 1 ? 'atalho' : 'atalhos'}</small>
        </div>
        <div class="admin-cat-actions">
          <button data-edit-cat="${esc(c.id)}" class="secondary small-btn" title="Editar categoria">✏️</button>
          <button data-delete-cat="${esc(c.id)}" class="danger small-btn" title="Excluir categoria">🗑️</button>
        </div>
      </div>
    `;
  }).join('') || '<div class="empty">Nenhuma categoria encontrada.</div>';
}

function renderLinks() {
  const q = $('#adminSearch').value.toLocaleLowerCase('pt-BR');
  const rows = A.links.filter(x => (x.name + ' ' + x.category_name + ' ' + (x.description || '')).toLocaleLowerCase('pt-BR').includes(q));
  
  $('#adminCount').textContent = `${rows.length} ${rows.length === 1 ? 'atalho' : 'atalhos'}`;
  $('#adminList').innerHTML = rows.map(x => `
    <div class="admin-row">
      <div class="admin-row-main">
        <span>${esc(x.category_name)}</span>
        <b>${esc(x.name)}</b>
        <small>${esc(x.url)}</small>
      </div>
      <div class="admin-row-actions">
        <button data-edit="${esc(x.id)}" class="secondary">Editar</button>
        <button data-delete="${esc(x.id)}" class="danger">Excluir</button>
      </div>
    </div>
  `).join('') || '<div class="empty">Nenhum atalho encontrado.</div>';
}

function openEditor(x = null) {
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

  $('#linkCategory').innerHTML = A.categories.length
    ? A.categories.map(c => `<option value="${c.id}" ${x?.category_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')
    : '<option value="">Crie uma categoria primeiro</option>';
}

function closeEditor() {
  $('#editor').hidden = true;
  $('#linkForm').reset();
  $('#formMsg').textContent = '';
}

async function saveLink(e) {
  e.preventDefault();
  const id = $('#editId').value;
  const catId = $('#linkCategory').value;

  if (!catId) {
    $('#formMsg').textContent = 'Por favor, selecione ou crie uma categoria antes de salvar.';
    return;
  }

  const payload = {
    name: $('#linkName').value.trim(),
    category_id: catId,
    description: $('#linkDescription').value.trim(),
    url: $('#linkUrl').value.trim(),
    link_type: $('#linkType').value,
    active: $('#linkActive').checked
  };

  let r;
  if (id) {
    r = await portalSupabase.from('links').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
  } else {
    payload.sort_order = A.links.length + 1;
    r = await portalSupabase.from('links').insert(payload);
  }

  if (r.error) {
    $('#formMsg').textContent = r.error.message;
    return;
  }

  closeEditor();
  await refresh();
  toast(id ? 'Atalho atualizado.' : 'Atalho cadastrado.');
}

async function deleteLink(id) {
  const x = A.links.find(v => String(v.id) === String(id));
  if (!x || !confirm(`Excluir o atalho “${x.name}”?`)) return;

  const { error } = await portalSupabase.from('links').delete().eq('id', id);
  if (error) {
    toast(error.message);
  } else {
    await refresh();
    toast('Atalho excluído.');
  }
}

function openCategoryModal(c = null) {
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

async function saveCategory(e) {
  e.preventDefault();
  const id = $('#editCategoryId').value;
  const payload = {
    name: $('#categoryName').value.trim(),
    description: $('#categoryDescription').value.trim(),
    icon: $('#categoryIcon').value.trim() || '📁',
    active: true
  };

  let r;
  if (id) {
    r = await portalSupabase.from('categories').update(payload).eq('id', id);
  } else {
    payload.sort_order = A.categories.length + 1;
    r = await portalSupabase.from('categories').insert(payload);
  }

  if (r.error) {
    $('#categoryMsg').textContent = r.error.message;
    return;
  }

  closeCategoryModal();
  await refresh();
  toast(id ? 'Categoria atualizada.' : 'Categoria criada.');
}

async function deleteCategory(id) {
  const c = A.categories.find(v => String(v.id) === String(id));
  if (!c) return;

  const linkedLinks = A.links.filter(x => String(x.category_id) === String(c.id));
  if (linkedLinks.length > 0) {
    toast(`Não é possível excluir "${c.name}": existem ${linkedLinks.length} atalho(s) nesta categoria.`);
    return;
  }

  if (!confirm(`Deseja excluir a categoria “${c.name}”?`)) return;

  const { error } = await portalSupabase.from('categories').delete().eq('id', id);
  if (error) {
    toast(error.message);
  } else {
    await refresh();
    toast('Categoria excluída.');
  }
}

$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  login();
});

$('#logout').onclick = async () => {
  if (window.portalSupabase) await portalSupabase.auth.signOut();
  A.user = null;
  showLogin();
};

$('#newLink').onclick = () => openEditor();
$('#closeEditor').onclick = closeEditor;
$('#cancelEditor').onclick = closeEditor;
$('#linkForm').addEventListener('submit', saveLink);

$('#newCategory').onclick = () => openCategoryModal();
$('#closeCategory').onclick = closeCategoryModal;
$('#cancelCategory').onclick = closeCategoryModal;
$('#categoryForm').addEventListener('submit', saveCategory);

$('#adminSearch').addEventListener('input', renderLinks);

document.addEventListener('click', e => {
  const ed = e.target.closest('[data-edit]');
  if (ed) {
    openEditor(A.links.find(x => String(x.id) === String(ed.dataset.edit)));
    return;
  }

  const del = e.target.closest('[data-delete]');
  if (del) {
    deleteLink(del.dataset.delete);
    return;
  }

  const edCat = e.target.closest('[data-edit-cat]');
  if (edCat) {
    openCategoryModal(A.categories.find(x => String(x.id) === String(edCat.dataset.editCat)));
    return;
  }

  const delCat = e.target.closest('[data-delete-cat]');
  if (delCat) {
    deleteCategory(delCat.dataset.deleteCat);
    return;
  }
});

$('#theme').onclick = () => {
  const isDark = document.documentElement.dataset.theme === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  document.documentElement.dataset.theme = newTheme;
  localStorage.setItem('pti_theme', newTheme);
};

(async () => {
  const savedTheme = localStorage.getItem('pti_theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;

  if (localMode()) {
    showLogin();
    $('#loginMsg').textContent = 'Configure o Supabase em js/supabase-config.js para habilitar a administração.';
    return;
  }

  const r = await portalSupabase.auth.getUser();
  A.user = r.data.user;
  if (A.user) await loadAdmin();
  else showLogin();
})();
