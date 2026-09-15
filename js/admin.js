const A = { categories: [], links: [], user: null, search: '' };
const $ = s => document.querySelector(s);
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  t.style.display = 'block';
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => {
    t.hidden = true;
    t.style.display = 'none';
  }, 3500);
}

function localMode() {
  return !window.supabaseReady || !window.portalSupabase;
}

/*
 * Normaliza o endereço informado no cadastro/edição.
 *
 * Aceita:
 *   https://site.com/arquivo
 *   http://site.com/arquivo
 *   \\arquivos\ti\G_Xanxere_TI\arquivo.xlsx
 *   C:\pasta\arquivo.xlsx
 *   file://arquivos/ti/G_Xanxere_TI/arquivo.xlsx
 *
 * O Supabase armazenará o endereço no formato file:// quando
 * for um caminho interno da rede.
 */
function normalizeLinkUrl(value) {
  let url = String(value || '').trim();

  if (!url) return '';

  // URLs web permanecem iguais
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // Caminho UNC:
  // \\arquivos\ti\G_Xanxere_TI\arquivo.xlsx
  //
  // vira:
  // file://arquivos/ti/G_Xanxere_TI/arquivo.xlsx
  if (/^\\\\/.test(url)) {
    return 'file://' + url
      .replace(/^\\+/, '')
      .replace(/\\/g, '/');
  }

  // Caminho local Windows:
  // C:\Pasta\arquivo.xlsx
  //
  // vira:
  // file:///C:/Pasta/arquivo.xlsx
  if (/^[A-Za-z]:[\\/]/.test(url)) {
    return 'file:///' + url.replace(/\\/g, '/');
  }

  // Se já estiver em file://, mantém
  if (/^file:\/\//i.test(url)) {
    return url;
  }

  // Qualquer outro endereço permanece como foi informado
  return url;
}

function hideModal(el) {
  if (!el) return;
  el.hidden = true;
  el.style.display = 'none';
  el.setAttribute('aria-hidden', 'true');
}

function showModal(el) {
  if (!el) return;
  el.hidden = false;
  el.style.display = 'flex';
  el.setAttribute('aria-hidden', 'false');
}

function closeAllModals() {
  hideModal($('#editor'));
  hideModal($('#categoryModal'));
}

function showLogin() {
  closeAllModals();

  const lp = $('#loginPanel');
  const ap = $('#adminPanel');

  if (lp) {
    lp.hidden = false;
    lp.style.display = 'block';
  }

  if (ap) {
    ap.hidden = true;
    ap.style.display = 'none';
  }

  const lo = $('#logout');

  if (lo) {
    lo.hidden = true;
  }
}

function showAdmin() {
  closeAllModals();

  const lp = $('#loginPanel');
  const ap = $('#adminPanel');

  if (lp) {
    lp.hidden = true;
    lp.style.display = 'none';
  }

  if (ap) {
    ap.hidden = false;
    ap.style.display = 'block';
  }

  const lo = $('#logout');

  if (lo) {
    lo.hidden = false;
  }
}

function refreshLocal() {
  const localData = window.portalData || (typeof portalData !== 'undefined' ? portalData : null);

  const savedCats = JSON.parse(
    localStorage.getItem('pti_local_cats') || 'null'
  );

  const savedLinks = JSON.parse(
    localStorage.getItem('pti_local_links') || 'null'
  );

  if (savedCats) {
    A.categories = savedCats;
  } else if (localData?.categories) {
    A.categories = localData.categories.map((c, i) => ({
      id: String(i + 1),
      name: typeof c === 'string' ? c : c.name,
      icon: typeof c === 'object' ? c.icon || '📁' : '📁',
      description: typeof c === 'object' ? c.description || '' : ''
    }));
  } else {
    A.categories = [];
  }

  if (savedLinks) {
    A.links = savedLinks;
  } else if (localData?.links) {
    A.links = localData.links.map(l => ({
      ...l,
      category_id:
        A.categories.find(c => c.name === l.category)?.id || '1',
      category_name: l.category || 'Sem categoria',
      url: l.url_original || l.url || '',
      link_type: l.link_type || 'internal',
      active: l.active !== false
    }));
  } else {
    A.links = [];
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
    portalSupabase
      .from('categories')
      .select('*')
      .order('sort_order'),

    portalSupabase
      .from('links')
      .select('*, categories(name)')
      .order('sort_order')
  ]);

  if (c.error || l.error) {
    toast(c.error?.message || l.error?.message);
    return;
  }

  A.categories = c.data || [];

  A.links = (l.data || []).map(x => ({
    ...x,
    category_name: x.categories?.name || 'Sem categoria'
  }));

  renderCategories();
  renderLinks();
}

function renderCategories() {
  const tbody = $('#categoryTableBody');

  if (!tbody) return;

  if (A.categories.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="2" style="text-align:center; padding:1.5rem;">Nenhuma categoria encontrada.</td></tr>';
    return;
  }

  tbody.innerHTML = A.categories.map(c => `
    <tr>
      <td>
        <strong>${esc(c.icon || '📁')} ${esc(c.name)}</strong>
        ${c.description
          ? `<br><small style="opacity:0.7">${esc(c.description)}</small>`
          : ''}
      </td>

      <td style="text-align:right; white-space:nowrap;">
        <button
          class="icon-btn"
          data-edit-cat="${esc(c.id)}"
          title="Editar Categoria">
          ✏️
        </button>

        <button
          class="icon-btn danger"
          data-delete-cat="${esc(c.id)}"
          title="Excluir Categoria">
          🗑️
        </button>
      </td>
    </tr>
  `).join('');
}

function renderLinks() {
  const tbody = $('#linksTableBody');

  if (!tbody) return;

  let filtered = A.links;

  if (A.search) {
    const q = A.search.toLowerCase();

    filtered = filtered.filter(x =>
      (x.name || '').toLowerCase().includes(q) ||
      (x.category_name || '').toLowerCase().includes(q) ||
      (x.description || '').toLowerCase().includes(q) ||
      (x.url || '').toLowerCase().includes(q)
    );
  }

  const countEl = $('#adminCount');

  if (countEl) {
    countEl.textContent =
      `${filtered.length} de ${A.links.length} ${A.links.length === 1 ? 'atalho' : 'atalhos'}`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center; padding:1.5rem;">Nenhum atalho encontrado.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(x => `
    <tr>
      <td>
        <strong>${esc(x.name)}</strong>
      </td>

      <td>
        <span class="badge secondary">
          ${esc(x.category_name)}
        </span>
      </td>

      <td>
        <span class="badge outline">
          ${esc(x.link_type || 'internal')}
        </span>
      </td>

      <td>
        <span class="badge ${x.active !== false ? 'success' : 'muted'}">
          ${x.active !== false ? 'Ativo' : 'Inativo'}
        </span>
      </td>

      <td style="text-align:right; white-space:nowrap;">
        <button
          class="icon-btn"
          data-edit="${esc(x.id)}"
          title="Editar Atalho">
          ✏️
        </button>

        <button
          class="icon-btn danger"
          data-delete="${esc(x.id)}"
          title="Excluir Atalho">
          🗑️
        </button>
      </td>
    </tr>
  `).join('');
}

function populateCategoryDropdown(selectedCatIdOrName) {
  const sel = $('#linkCategory');

  if (!sel) return;

  if (A.categories.length === 0) {
    sel.innerHTML =
      '<option value="">Nenhuma categoria cadastrada</option>';
    return;
  }

  sel.innerHTML = A.categories.map(c => {
    const isSelected =
      String(selectedCatIdOrName) === String(c.id) ||
      selectedCatIdOrName === c.name;

    return `
      <option
        value="${c.id}"
        ${isSelected ? 'selected' : ''}>
        ${esc(c.icon || '📁')} ${esc(c.name)}
      </option>
    `;
  }).join('');
}

function openEditor(x = null) {
  closeAllModals();

  $('#editId').value = x?.id || '';

  $('#editorEyebrow').textContent =
    x ? 'EDITAR ATALHO' : 'NOVO ATALHO';

  $('#editorTitle').textContent =
    x ? 'Editar atalho' : 'Cadastrar atalho';

  $('#linkName').value = x?.name || '';

  $('#linkDescription').value =
    x?.description || '';

  // Aceita tanto registros antigos quanto registros novos
  $('#linkUrl').value =
    x?.url || x?.url_original || '';

  $('#linkType').value =
    x?.link_type || 'internal';

  $('#linkActive').checked =
    x?.active !== false;

  $('#formMsg').textContent = '';

  populateCategoryDropdown(
    x?.category_id || x?.category
  );

  showModal($('#editor'));
}

function closeEditor() {
  hideModal($('#editor'));

  $('#linkForm').reset();

  $('#formMsg').textContent = '';
}

function openCategoryModal(c = null) {
  closeAllModals();

  $('#categoryModalTitle').textContent =
    c ? 'Editar categoria' : 'Nova categoria';

  $('#editCategoryId').value =
    c ? c.id : '';

  $('#categoryName').value =
    c ? c.name : '';

  $('#categoryDescription').value =
    c ? (c.description || '') : '';

  $('#categoryIcon').value =
    c ? (c.icon || '📁') : '📁';

  $('#categoryMsg').textContent = '';

  showModal($('#categoryModal'));
}

function closeCategoryModal() {
  hideModal($('#categoryModal'));

  $('#categoryForm').reset();

  $('#categoryMsg').textContent = '';
}

async function loadAdmin() {
  if (localMode()) {
    showAdmin();

    const info = $('#sessionInfo');

    if (info) {
      info.textContent =
        'Modo Local (Gerenciamento no navegador / LocalStorage)';
    }

    refreshLocal();
    return;
  }

  if (!A.user && window.portalSupabase) {
    const r = await portalSupabase.auth.getUser();

    A.user = r.data?.user || null;
  }

  if (!A.user) {
    showLogin();
    return;
  }

  showAdmin();

  const info = $('#sessionInfo');

  if (info) {
    info.textContent =
      `Administrador: ${A.user.email}`;
  }

  await refresh();
}


// ============================================================
// EVENTOS DOS MODAIS
// ============================================================

$('#newLink')?.addEventListener(
  'click',
  () => openEditor()
);

$('#closeEditor')?.addEventListener(
  'click',
  closeEditor
);

$('#cancelEditor')?.addEventListener(
  'click',
  closeEditor
);

$('#newCategory')?.addEventListener(
  'click',
  () => openCategoryModal()
);

$('#closeCategory')?.addEventListener(
  'click',
  closeCategoryModal
);

$('#cancelCategory')?.addEventListener(
  'click',
  closeCategoryModal
);


// Fechar modal clicando no fundo
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      closeAllModals();
    }
  });
});


// Fechar com ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeAllModals();
  }
});


// Pesquisa
$('#adminSearch')?.addEventListener(
  'input',
  e => {
    A.search = e.target.value;
    renderLinks();
  }
);


// ============================================================
// SALVAR ATALHO
// ============================================================

$('#linkForm')?.addEventListener(
  'submit',
  async e => {
    e.preventDefault();

    const id = $('#editId').value;

    const catId =
      $('#linkCategory').value;

    const catObj =
      A.categories.find(
        c => String(c.id) === String(catId)
      );

    const payload = {
      name: $('#linkName').value.trim(),

      category_id: catId,

      description:
        $('#linkDescription').value.trim(),

      url:
        normalizeLinkUrl(
          $('#linkUrl').value
        ),

      link_type:
        $('#linkType').value,

      active:
        $('#linkActive').checked
    };

    if (!payload.name || !payload.url) {
      $('#formMsg').textContent =
        'Preencha os campos obrigatórios (Nome e URL).';

      return;
    }


    // -------------------------
    // MODO LOCAL
    // -------------------------

    if (localMode()) {

      if (id) {

        const idx =
          A.links.findIndex(
            x => String(x.id) === String(id)
          );

        if (idx !== -1) {

          A.links[idx] = {
            ...A.links[idx],
            ...payload,
            url_original: payload.url,
            category_name:
              catObj
                ? catObj.name
                : 'Sem categoria'
          };
        }

      } else {

        payload.id =
          String(Date.now());

        payload.category_name =
          catObj
            ? catObj.name
            : 'Sem categoria';

        payload.url_original =
          payload.url;

        A.links.push(payload);
      }

      localStorage.setItem(
        'pti_local_links',
        JSON.stringify(A.links)
      );

      closeEditor();

      refreshLocal();

      toast(
        'Salvo no navegador (Modo Local).'
      );

      return;
    }


    // -------------------------
    // SUPABASE
    // -------------------------

    const { error } = id
      ? await portalSupabase
          .from('links')
          .update(payload)
          .eq('id', id)

      : await portalSupabase
          .from('links')
          .insert([payload]);


    if (error) {

      $('#formMsg').textContent =
        error.message;

    } else {

      closeEditor();

      await refresh();

      toast(
        'Atalho salvo com sucesso!'
      );
    }
  }
);


// ============================================================
// SALVAR CATEGORIA
// ============================================================

$('#categoryForm')?.addEventListener(
  'submit',
  async e => {

    e.preventDefault();

    const id =
      $('#editCategoryId').value;

    const payload = {
      name:
        $('#categoryName').value.trim(),

      description:
        $('#categoryDescription').value.trim(),

      icon:
        $('#categoryIcon').value.trim() || '📁'
    };

    if (!payload.name) {

      $('#categoryMsg').textContent =
        'O nome da categoria é obrigatório.';

      return;
    }


    // MODO LOCAL

    if (localMode()) {

      if (id) {

        const idx =
          A.categories.findIndex(
            c => String(c.id) === String(id)
          );

        if (idx !== -1) {

          A.categories[idx] = {
            ...A.categories[idx],
            ...payload
          };
        }

      } else {

        payload.id =
          String(Date.now());

        A.categories.push(payload);
      }

      localStorage.setItem(
        'pti_local_cats',
        JSON.stringify(A.categories)
      );

      closeCategoryModal();

      refreshLocal();

      toast(
        'Categoria salva (Modo Local).'
      );

      return;
    }


    // SUPABASE

    const { error } = id

      ? await portalSupabase
          .from('categories')
          .update(payload)
          .eq('id', id)

      : await portalSupabase
          .from('categories')
          .insert([payload]);


    if (error) {

      $('#categoryMsg').textContent =
        error.message;

    } else {

      closeCategoryModal();

      await refresh();

      toast(
        'Categoria salva com sucesso!'
      );
    }
  }
);


// ============================================================
// EDIÇÃO / EXCLUSÃO
// ============================================================

document.addEventListener(
  'click',
  async e => {

    // Editar atalho
    const ed =
      e.target.closest('[data-edit]');

    if (ed) {

      openEditor(
        A.links.find(
          x =>
            String(x.id) ===
            String(ed.dataset.edit)
        )
      );

      return;
    }


    // Excluir atalho
    const del =
      e.target.closest('[data-delete]');

    if (del) {

      if (
        confirm(
          'Deseja realmente excluir este atalho?'
        )
      ) {

        const id =
          del.dataset.delete;


        if (localMode()) {

          A.links =
            A.links.filter(
              x =>
                String(x.id) !==
                String(id)
            );

          localStorage.setItem(
            'pti_local_links',
            JSON.stringify(A.links)
          );

          refreshLocal();

          toast(
            'Excluído (Modo Local).'
          );

        } else {

          const { error } =
            await portalSupabase
              .from('links')
              .delete()
              .eq('id', id);

          if (error) {

            toast(error.message);

          } else {

            await refresh();

            toast(
              'Atalho excluído com sucesso.'
            );
          }
        }
      }

      return;
    }


    // Editar categoria
    const edCat =
      e.target.closest('[data-edit-cat]');

    if (edCat) {

      openCategoryModal(
        A.categories.find(
          c =>
            String(c.id) ===
            String(
              edCat.dataset.editCat
            )
        )
      );

      return;
    }


    // Excluir categoria
    const delCat =
      e.target.closest(
        '[data-delete-cat]'
      );

    if (delCat) {

      const catId =
        delCat.dataset.deleteCat ||
        delCat.getAttribute(
          'data-delete-cat'
        );

      const hasLinks =
        A.links.some(
          x =>
            String(x.category_id) ===
              String(catId) ||
            String(x.category) ===
              String(catId)
        );

      if (hasLinks) {

        alert(
          'Não é possível excluir uma categoria que possui atalhos vinculados. Remova os atalhos primeiro.'
        );

        return;
      }

      if (
        confirm(
          'Deseja realmente excluir esta categoria?'
        )
      ) {

        if (localMode()) {

          A.categories =
            A.categories.filter(
              c =>
                String(c.id) !==
                String(catId)
            );

          localStorage.setItem(
            'pti_local_cats',
            JSON.stringify(A.categories)
          );

          refreshLocal();

          toast(
            'Categoria excluída (Modo Local).'
          );

        } else {

          const { error } =
            await portalSupabase
              .from('categories')
              .delete()
              .eq('id', catId);

          if (error) {

            toast(error.message);

          } else {

            await refresh();

            toast(
              'Categoria excluída com sucesso.'
            );
          }
        }
      }

      return;
    }
  }
);


// ============================================================
// LOGIN
// ============================================================

$('#loginForm')?.addEventListener(
  'submit',
  async e => {

    e.preventDefault();

    if (localMode()) {

      toast(
        'Supabase não configurado. Operando em Modo Local.'
      );

      loadAdmin();

      return;
    }

    const email =
      $('#email').value;

    const password =
      $('#password').value;


    const { error } =
      await portalSupabase.auth.signInWithPassword({
        email,
        password
      });


    if (error) {

      $('#loginMsg').textContent =
        error.message;

    } else {

      await loadAdmin();
    }
  }
);


// ============================================================
// LOGOUT
// ============================================================

$('#logout')?.addEventListener(
  'click',
  async () => {

    if (
      !localMode() &&
      window.portalSupabase
    ) {

      await portalSupabase.auth.signOut();
    }

    A.user = null;

    showLogin();
  }
);


// ============================================================
// TEMA
// ============================================================

$('#theme')?.addEventListener(
  'click',
  () => {

    const isDark =
      document.documentElement.dataset.theme === 'dark';

    const newTheme =
      isDark ? 'light' : 'dark';

    document.documentElement.dataset.theme =
      newTheme;

    localStorage.setItem(
      'pti_theme',
      newTheme
    );
  }
);


// ============================================================
// INICIALIZAÇÃO
// ============================================================

(async () => {

  const savedTheme =
    localStorage.getItem('pti_theme');

  if (savedTheme) {
    document.documentElement.dataset.theme =
      savedTheme;
  }

  try {

    await loadAdmin();

  } catch (error) {

    console.error(
      'Erro ao inicializar Administração:',
      error
    );

    showLogin();

    const msg =
      $('#loginMsg');

    if (msg) {
      msg.textContent =
        'Erro ao carregar a administração. Verifique o console do navegador.';
    }
  }

})();
