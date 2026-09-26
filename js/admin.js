const A = {
  categories: [],
  links: [],
  user: null,
  search: ''
};


const $ = s =>
  document.querySelector(s);


const esc = x =>
  String(x ?? '').replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[c])
  );


/* ============================================================
   ÍCONES ADMIN
   ============================================================ */

const ADMIN_ICONS = {

  edit: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 20h4l10.8-10.8a2.1 2.1 0 0 0-3-3L5 17v3Z"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linejoin="round"
      />
      <path
        d="m14.5 7.5 2 2"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
      />
    </svg>
  `,

  delete: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7h14M9 7V4.5h6V7M7 7l.8 13h8.4L17 7"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M10 11v5M14 11v5"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>
  `,

  folder: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.5 7.5h7l1.8 2h8.2v9a2 2 0 0 1-2 2h-13
        a2 2 0 0 1-2-2v-11Z"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linejoin="round"
      />
    </svg>
  `,

  bell: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3.5c-4 0-5.5 3-5.5 6.5 0 4-1.5 5-1.5 5.5h14c0-.5-1.5-1.5-1.5-5.5 0-3.5-1.5-6.5-5.5-6.5Z"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
      <path
        d="M10 18.5a2 2 0 0 0 4 0"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>
  `

};


/* ============================================================
   TOAST
   ============================================================ */

function toast(msg) {

  const t =
    $('#toast');

  if (!t) return;


  t.textContent =
    msg;

  t.hidden =
    false;

  t.style.display =
    'block';


  clearTimeout(
    window.__toast
  );


  window.__toast =
    setTimeout(
      () => {

        t.hidden =
          true;

        t.style.display =
          'none';

      },
      3500
    );

}


/* ============================================================
   MODO LOCAL
   ============================================================ */

function localMode() {

  return (
    !window.supabaseReady ||
    !window.portalSupabase
  );

}


/* ============================================================
   MODAIS
   ============================================================ */

function hideModal(el) {

  if (!el) return;

  el.hidden =
    true;

  el.style.display =
    'none';

  el.setAttribute(
    'aria-hidden',
    'true'
  );

}


function showModal(el) {

  if (!el) return;

  el.hidden =
    false;

  el.style.display =
    'flex';

  el.setAttribute(
    'aria-hidden',
    'false'
  );

}


function closeAllModals() {

  hideModal(
    $('#editor')
  );

  hideModal(
    $('#categoryModal')
  );

}


/* ============================================================
   LOGIN / ADMIN
   ============================================================ */

function showLogin() {

  closeAllModals();


  const lp =
    $('#loginPanel');

  const ap =
    $('#adminPanel');


  if (lp) {

    lp.hidden =
      false;

    lp.style.display =
      'block';

  }


  if (ap) {

    ap.hidden =
      true;

    ap.style.display =
      'none';

  }


  const lo =
    $('#logout');


  if (lo) {

    lo.hidden =
      true;

  }

}


function showAdmin() {

  closeAllModals();


  const lp =
    $('#loginPanel');

  const ap =
    $('#adminPanel');


  if (lp) {

    lp.hidden =
      true;

    lp.style.display =
      'none';

  }


  if (ap) {

    ap.hidden =
      false;

    ap.style.display =
      'block';

  }


  const lo =
    $('#logout');


  if (lo) {

    lo.hidden =
      false;

  }

}


/* ============================================================
   NORMALIZAÇÃO DE CAMINHO
   ============================================================ */

function normalizeLinkUrl(value) {

  let url =
    String(value || '').trim();


  if (!url) {
    return '';
  }


  if (
    /^https?:\/\//i.test(url)
  ) {
    return url;
  }


  if (/^\\\\/.test(url)) {

    url =
      'file://' +
      url
        .replace(/^\\+/, '')
        .replace(/\\/g, '/');

  } else if (
    /^[A-Za-z]:[\\/]/.test(url)
  ) {

    url =
      'file:///' +
      url.replace(/\\/g, '/');

  } else if (
    /^file:\/\//i.test(url)
  ) {

    // já está no formato file://, mantém como está

  } else {

    return url;

  }

  // Fase 1: quando o caminho estiver dentro da raiz de rede
  // configurada (PORTAL_CONFIG.networkRoot), salvamos como caminho
  // RELATIVO em vez de file:// absoluto — mesmo padrão já usado pela
  // maioria dos atalhos originais, mais fácil de ler/manter e já
  // resolvido corretamente pelo app.js na hora do clique.
  return toRelativeIfInsideRoot(url);

}

function toRelativeIfInsideRoot(fileUrl) {

  const root =
    String(window.PORTAL_CONFIG?.networkRoot || '').trim();

  if (!root) return fileUrl;

  const normalizedRoot =
    root
      .replace(/^file:\/+/i, '')
      .replace(/\\/g, '/')
      .replace(/\/+$/, '');

  const normalizedUrl =
    fileUrl
      .replace(/^file:\/+/i, '')
      .replace(/\\/g, '/');

  if (normalizedUrl.toLowerCase().startsWith(normalizedRoot.toLowerCase() + '/')) {
    return normalizedUrl.slice(normalizedRoot.length + 1);
  }

  return fileUrl;

}


/* ============================================================
   DADOS LOCAIS
   ============================================================ */

function refreshLocal() {

  const localData =
    window.portalData ||
    (
      typeof portalData !== 'undefined'
        ? portalData
        : null
    );


  const savedCats =
    JSON.parse(
      localStorage.getItem(
        'pti_local_cats'
      ) || 'null'
    );


  const savedLinks =
    JSON.parse(
      localStorage.getItem(
        'pti_local_links'
      ) || 'null'
    );


  if (savedCats) {

    A.categories =
      savedCats;

  } else if (
    localData?.categories
  ) {

    A.categories =
      localData.categories.map(
        (c, i) => ({

          id:
            String(i + 1),

          name:
            typeof c === 'string'
              ? c
              : c.name,

          icon:
            typeof c === 'object'
              ? c.icon || ''
              : '',

          description:
            typeof c === 'object'
              ? c.description || ''
              : ''

        })
      );

  } else {

    A.categories =
      [];

  }


  if (savedLinks) {

    A.links =
      savedLinks;

  } else if (
    localData?.links
  ) {

    A.links =
      localData.links.map(
        l => ({

          ...l,

          category_id:
            A.categories.find(
              c =>
                c.name ===
                l.category
            )?.id ||
            '1',

          category_name:
            l.category ||
            'Sem categoria',

          url:
            l.url_original ||
            l.url ||
            '',

          link_type:
            l.link_type ||
            'internal',

          active:
            l.active !== false

        })
      );

  } else {

    A.links =
      [];

  }


  renderCategories();

  renderLinks();

}


/* ============================================================
   SUPABASE
   ============================================================ */

async function refresh() {

  if (localMode()) {

    refreshLocal();

    return;

  }


  const [
    c,
    l
  ] =
    await Promise.all([

      portalSupabase
        .from('categories')
        .select('*')
        .order('sort_order'),

      portalSupabase
        .from('links')
        .select(
          '*, categories(name)'
        )
        .order('sort_order')

    ]);


  if (
    c.error ||
    l.error
  ) {

    toast(
      c.error?.message ||
      l.error?.message
    );

    return;

  }


  A.categories =
    c.data || [];


  A.links =
    (l.data || []).map(
      x => ({

        ...x,

        category_name:
          x.categories?.name ||
          'Sem categoria'

      })
    );


  renderCategories();

  renderLinks();

}


/* ============================================================
   CATEGORIAS
   ============================================================ */

function renderCategories() {

  const tbody =
    $('#categoryTableBody');


  if (!tbody) return;


  if (
    A.categories.length === 0
  ) {

    tbody.innerHTML = `
      <div class="ios-list-empty">
        Nenhuma categoria encontrada.
      </div>
    `;

    return;

  }


  tbody.innerHTML =
    A.categories.map(
      c => `

        <div class="ios-row">

          <span class="ios-row-icon" aria-hidden="true">
            ${ADMIN_ICONS.folder}
          </span>

          <div class="ios-row-main">

            <strong>
              ${esc(c.name)}
            </strong>

            ${
              c.description
                ? `
                  <div class="ios-row-meta">
                    <small>${esc(c.description)}</small>
                  </div>
                `
                : ''
            }

          </div>

          <div class="ios-row-actions">

            <button
              class="icon-btn"
              data-edit-cat="${esc(c.id)}"
              title="Editar categoria"
              aria-label="Editar categoria"
              type="button"
            >
              ${ADMIN_ICONS.edit}
            </button>


            <button
              class="icon-btn danger"
              data-delete-cat="${esc(c.id)}"
              title="Excluir categoria"
              aria-label="Excluir categoria"
              type="button"
            >
              ${ADMIN_ICONS.delete}
            </button>

          </div>

        </div>

      `
    ).join('');

}


/* ============================================================
   LINKS
   ============================================================ */

function renderLinks() {

  const tbody =
    $('#linksTableBody');


  if (!tbody) return;


  let filtered =
    A.links;


  if (A.search) {

    const q =
      A.search.toLocaleLowerCase(
        'pt-BR'
      );


    filtered =
      filtered.filter(
        x =>

          (
            x.name ||
            ''
          )
            .toLocaleLowerCase(
              'pt-BR'
            )
            .includes(q)

          ||

          (
            x.category_name ||
            ''
          )
            .toLocaleLowerCase(
              'pt-BR'
            )
            .includes(q)

          ||

          (
            x.description ||
            ''
          )
            .toLocaleLowerCase(
              'pt-BR'
            )
            .includes(q)

          ||

          (
            x.url ||
            ''
          )
            .toLocaleLowerCase(
              'pt-BR'
            )
            .includes(q)

      );

  }


  const countEl =
    $('#adminCount');


  if (countEl) {

    countEl.textContent =
      `${filtered.length} de ${A.links.length} ${
        A.links.length === 1
          ? 'atalho'
          : 'atalhos'
      }`;

  }


  if (
    filtered.length === 0
  ) {

    tbody.innerHTML = `
      <div class="ios-list-empty">
        Nenhum atalho encontrado.
      </div>
    `;

    return;

  }


  tbody.innerHTML =
    filtered.map(
      x => `

        <div class="ios-row">

          <span class="ios-row-icon" aria-hidden="true">
            ${ADMIN_ICONS.folder}
          </span>

          <div class="ios-row-main">

            <strong>
              ${esc(x.name)}
            </strong>

            <div class="ios-row-meta">

              <span class="badge secondary">
                ${esc(x.category_name)}
              </span>

              <span class="badge outline">
                ${esc(
                  x.link_type ||
                  'internal'
                )}
              </span>

              <span
                class="badge ${
                  x.active !== false
                    ? 'success'
                    : 'muted'
                }"
              >
                ${
                  x.active !== false
                    ? 'Ativo'
                    : 'Inativo'
                }
              </span>

              ${
                x.reported_broken_at
                  ? '<span class="badge danger" title="Reportado como quebrado por um usuário">⚠ Reportado</span>'
                  : ''
              }

            </div>

          </div>

          <div class="ios-row-actions">

            ${
              x.reported_broken_at
                ? `
                  <button
                    class="icon-btn"
                    data-resolve="${esc(x.id)}"
                    title="Marcar como resolvido"
                    aria-label="Marcar como resolvido"
                    type="button"
                  >
                    ✓
                  </button>
                `
                : ''
            }

            <button
              class="icon-btn"
              data-edit="${esc(x.id)}"
              title="Editar atalho"
              aria-label="Editar atalho"
              type="button"
            >
              ${ADMIN_ICONS.edit}
            </button>


            <button
              class="icon-btn danger"
              data-delete="${esc(x.id)}"
              title="Excluir atalho"
              aria-label="Excluir atalho"
              type="button"
            >
              ${ADMIN_ICONS.delete}
            </button>

          </div>

        </div>

      `
    ).join('');

}


/* ============================================================
   DROPDOWN CATEGORIA
   ============================================================ */

function populateCategoryDropdown(
  selectedCatIdOrName
) {

  const sel =
    $('#linkCategory');


  if (!sel) return;


  if (
    A.categories.length === 0
  ) {

    sel.innerHTML =
      '<option value="">Nenhuma categoria cadastrada</option>';

    return;

  }


  sel.innerHTML =
    A.categories.map(
      c => {

        const isSelected =
          String(
            selectedCatIdOrName
          ) === String(c.id) ||
          selectedCatIdOrName === c.name;


        return `
          <option
            value="${esc(c.id)}"
            ${isSelected ? 'selected' : ''}
          >
            ${esc(c.name)}
          </option>
        `;

      }
    ).join('');

}


/* ============================================================
   EDITOR DE ATALHO
   ============================================================ */

function openEditor(x = null) {

  closeAllModals();


  $('#editId').value =
    x?.id || '';


  $('#editorEyebrow')
    .textContent =
    x
      ? 'EDITAR ATALHO'
      : 'NOVO ATALHO';


  $('#editorTitle')
    .textContent =
    x
      ? 'Editar atalho'
      : 'Cadastrar atalho';


  $('#linkName').value =
    x?.name || '';


  $('#linkDescription').value =
    x?.description || '';


  $('#linkUrl').value =
    x?.url ||
    x?.url_original ||
    '';


  $('#linkType').value =
    x?.link_type ||
    'internal';


  $('#linkActive').checked =
    x?.active !== false;


  $('#formMsg').textContent =
    '';


  populateCategoryDropdown(
    x?.category_id ||
    x?.category
  );


  showModal(
    $('#editor')
  );

}


function closeEditor() {

  hideModal(
    $('#editor')
  );


  $('#linkForm').reset();


  $('#formMsg').textContent =
    '';

}


/* ============================================================
   CATEGORIA
   ============================================================ */

function openCategoryModal(
  c = null
) {

  closeAllModals();


  $('#categoryModalTitle')
    .textContent =
    c
      ? 'Editar categoria'
      : 'Nova categoria';


  $('#editCategoryId').value =
    c
      ? c.id
      : '';


  $('#categoryName').value =
    c
      ? c.name
      : '';


  $('#categoryDescription').value =
    c
      ? (
          c.description ||
          ''
        )
      : '';


  $('#categoryIcon').value =
    c
      ? (
          c.icon ||
          ''
        )
      : '';


  $('#categoryMsg').textContent =
    '';


  showModal(
    $('#categoryModal')
  );

}


function closeCategoryModal() {

  hideModal(
    $('#categoryModal')
  );


  $('#categoryForm').reset();


  $('#categoryMsg').textContent =
    '';

}


/* ============================================================
   LOAD ADMIN
   ============================================================ */

async function loadAdmin() {

  if (localMode()) {

    showAdmin();


    const info =
      $('#sessionInfo');


    if (info) {

      info.textContent =
        'Modo Local — gerenciamento no navegador';

    }


    refreshLocal();

    return;

  }


  if (
    !A.user &&
    window.portalSupabase
  ) {

    // getSession() lê a sessão salva localmente (rápido, sem rede).
    // Só cai para getUser() (que revalida com o servidor) se não
    // achar nada local — evita pedir login de novo por causa de
    // uma rede lenta/instável, já que quem chegou até aqui pelo
    // dashboard.html/login.html já autenticou nesta mesma aba.
    const s =
      await portalSupabase.auth.getSession();

    if (s.data?.session?.user) {

      A.user = s.data.session.user;

    } else {

      const r =
        await portalSupabase.auth.getUser();

      A.user =
        r.data?.user ||
        null;

    }

  }


  if (!A.user) {

    showLogin();

    return;

  }


  showAdmin();


  const info =
    $('#sessionInfo');


  if (info) {

    info.textContent =
      `Administrador: ${A.user.email}`;

  }


  await checkAdminRole();


  await refresh();

}


/* ============================================================
   VERIFICAÇÃO DE PAPEL (role) DO USUÁRIO LOGADO
   Como as políticas de escrita agora exigem profiles.role='admin',
   avisamos aqui se o usuário logado ainda não tem esse cadastro —
   sem isso, os formulários abrem normalmente mas toda gravação
   será silenciosamente bloqueada pelo RLS.
   ============================================================ */

async function checkAdminRole() {

  const warn = $('#roleWarning');
  if (!warn || !A.user) return;

  try {

    const { data: profile, error } =
      await portalSupabase
        .from('profiles')
        .select('role')
        .eq('id', A.user.id)
        .maybeSingle();

    if (error) throw error;

    if (profile?.role === 'admin') {
      warn.hidden = true;
      warn.textContent = '';
      return;
    }

    warn.hidden = false;
    warn.textContent =
      'Este usuário ainda não está cadastrado como admin em "profiles". ' +
      'As telas abrem normalmente, mas nenhuma gravação será salva até ' +
      'um administrador do banco rodar: insert into profiles (id, role) ' +
      `values ('${A.user.id}', 'admin') on conflict (id) do update set role='admin';`;

  } catch (err) {

    console.error(err);
    warn.hidden = false;
    warn.textContent =
      'Não foi possível confirmar o papel (role) deste usuário em "profiles".';

  }

}


/* ============================================================
   EVENTOS DOS MODAIS
   ============================================================ */

$('#newLink')?.addEventListener(
  'click',
  () =>
    openEditor()
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
  () =>
    openCategoryModal()
);


$('#closeCategory')?.addEventListener(
  'click',
  closeCategoryModal
);


$('#cancelCategory')?.addEventListener(
  'click',
  closeCategoryModal
);


/* ============================================================
   FECHAR MODAL NO BACKDROP
   ============================================================ */

document
  .querySelectorAll('.modal')
  .forEach(
    modal => {

      modal.addEventListener(
        'click',
        e => {

          if (
            e.target === modal
          ) {

            closeAllModals();

          }

        }
      );

    }
  );


/* ============================================================
   ESC
   ============================================================ */

document.addEventListener(
  'keydown',
  e => {

    if (
      e.key === 'Escape'
    ) {

      closeAllModals();

    }

  }
);


/* ============================================================
   PESQUISA ADMIN
   ============================================================ */

$('#adminSearch')?.addEventListener(
  'input',
  e => {

    A.search =
      e.target.value;

    renderLinks();

  }
);


/* ============================================================
   SALVAR ATALHO
   ============================================================ */

$('#linkForm')?.addEventListener(
  'submit',
  async e => {

    e.preventDefault();


    const id =
      $('#editId').value;


    const catId =
      $('#linkCategory').value;


    const catObj =
      A.categories.find(
        c =>
          String(c.id) ===
          String(catId)
      );


    const payload = {

      name:
        $('#linkName')
          .value
          .trim(),

      category_id:
        catId,

      description:
        $('#linkDescription')
          .value
          .trim(),

      url:
        normalizeLinkUrl(
          $('#linkUrl')
            .value
        ),

      link_type:
        $('#linkType')
          .value,

      active:
        $('#linkActive')
          .checked

    };


    if (
      !payload.name ||
      !payload.url
    ) {

      $('#formMsg')
        .textContent =
        'Preencha os campos obrigatórios (Nome e URL).';

      return;

    }


    if (localMode()) {

      if (id) {

        const idx =
          A.links.findIndex(
            x =>
              String(x.id) ===
              String(id)
          );


        if (idx !== -1) {

          A.links[idx] = {

            ...A.links[idx],

            ...payload,

            url_original:
              payload.url,

            category_name:
              catObj
                ? catObj.name
                : 'Sem categoria'

          };

        }

      } else {

        payload.id =
          String(Date.now());

        payload.url_original =
          payload.url;

        payload.category_name =
          catObj
            ? catObj.name
            : 'Sem categoria';


        A.links.push(
          payload
        );

      }


      localStorage.setItem(
        'pti_local_links',
        JSON.stringify(
          A.links
        )
      );


      closeEditor();

      refreshLocal();

      toast(
        'Atalho salvo no navegador.'
      );

      return;

    }


    const {
      error
    } =
      id

        ? await portalSupabase
            .from('links')
            .update(payload)
            .eq('id', id)

        : await portalSupabase
            .from('links')
            .insert([
              payload
            ]);


    if (error) {

      $('#formMsg')
        .textContent =
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


/* ============================================================
   SALVAR CATEGORIA
   ============================================================ */

$('#categoryForm')?.addEventListener(
  'submit',
  async e => {

    e.preventDefault();


    const id =
      $('#editCategoryId')
        .value;


    const payload = {

      name:
        $('#categoryName')
          .value
          .trim(),

      description:
        $('#categoryDescription')
          .value
          .trim(),

      icon:
        ''

    };


    if (!payload.name) {

      $('#categoryMsg')
        .textContent =
        'O nome da categoria é obrigatório.';

      return;

    }


    if (localMode()) {

      if (id) {

        const idx =
          A.categories.findIndex(
            c =>
              String(c.id) ===
              String(id)
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

        A.categories.push(
          payload
        );

      }


      localStorage.setItem(
        'pti_local_cats',
        JSON.stringify(
          A.categories
        )
      );


      closeCategoryModal();

      refreshLocal();

      toast(
        'Categoria salva.'
      );

      return;

    }


    const {
      error
    } =
      id

        ? await portalSupabase
            .from('categories')
            .update(payload)
            .eq('id', id)

        : await portalSupabase
            .from('categories')
            .insert([
              payload
            ]);


    if (error) {

      $('#categoryMsg')
        .textContent =
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


/* ============================================================
   DELEGAÇÃO DE EVENTOS
   ============================================================ */

document.addEventListener(
  'click',
  async e => {

    /* --------------------------------------------------------
       MARCAR ALERTA DE LINK QUEBRADO COMO RESOLVIDO
       -------------------------------------------------------- */

    const resolve =
      e.target.closest(
        '[data-resolve]'
      );


    if (resolve) {

      const id =
        resolve.dataset.resolve;


      if (localMode()) {

        const item =
          A.links.find(
            x => String(x.id) === String(id)
          );

        if (item) {
          item.reported_broken_at = null;
          item.reported_broken_by = null;
        }

        localStorage.setItem(
          'pti_local_links',
          JSON.stringify(A.links)
        );

        refreshLocal();

      } else {

        const { error } =
          await portalSupabase
            .from('links')
            .update({
              reported_broken_at: null,
              reported_broken_by: null
            })
            .eq('id', id);

        if (error) {
          toast(error.message);
          return;
        }

        await loadAdmin();

      }

      toast('Alerta marcado como resolvido.');

      return;

    }


    /* --------------------------------------------------------
       EDITAR ATALHO
       -------------------------------------------------------- */

    const ed =
      e.target.closest(
        '[data-edit]'
      );


    if (ed) {

      openEditor(
        A.links.find(
          x =>
            String(x.id) ===
            String(
              ed.dataset.edit
            )
        )
      );

      return;

    }


    /* --------------------------------------------------------
       EXCLUIR ATALHO
       -------------------------------------------------------- */

    const del =
      e.target.closest(
        '[data-delete]'
      );


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
            JSON.stringify(
              A.links
            )
          );


          refreshLocal();

          toast(
            'Atalho excluído.'
          );

        } else {

          const {
            error
          } =
            await portalSupabase
              .from('links')
              .delete()
              .eq('id', id);


          if (error) {

            toast(
              error.message
            );

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


    /* --------------------------------------------------------
       EDITAR CATEGORIA
       -------------------------------------------------------- */

    const edCat =
      e.target.closest(
        '[data-edit-cat]'
      );


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


    /* --------------------------------------------------------
       EXCLUIR CATEGORIA
       -------------------------------------------------------- */

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
            JSON.stringify(
              A.categories
            )
          );


          refreshLocal();

          toast(
            'Categoria excluída.'
          );

        } else {

          const {
            error
          } =
            await portalSupabase
              .from('categories')
              .delete()
              .eq('id', catId);


          if (error) {

            toast(
              error.message
            );

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


/* ============================================================
   LOGIN
   ============================================================ */

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


    const {
      error
    } =
      await portalSupabase.auth
        .signInWithPassword({
          email,
          password
        });


    if (error) {

      $('#loginMsg')
        .textContent =
        error.message;

    } else {

      await loadAdmin();

    }

  }
);


/* ============================================================
   LOGOUT
   ============================================================ */

$('#logout')?.addEventListener(
  'click',
  async () => {

    if (
      !localMode() &&
      window.portalSupabase
    ) {

      await portalSupabase
        .auth
        .signOut();

    }


    A.user =
      null;


    showLogin();

  }
);


/* ============================================================
   TEMA
   ============================================================ */

$('#theme')?.addEventListener(
  'click',
  () => {

    const isDark =
      document.documentElement
        .dataset.theme ===
      'dark';


    const newTheme =
      isDark
        ? 'light'
        : 'dark';


    document.documentElement
      .dataset.theme =
      newTheme;


    localStorage.setItem(
      'pti_theme',
      newTheme
    );

  }
);


/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */

(async () => {

  const savedTheme =
    localStorage.getItem(
      'pti_theme'
    );


  if (savedTheme) {

    document.documentElement
      .dataset.theme =
      savedTheme;

  }


  try {

    await loadAdmin();

  } catch (err) {

    console.error(
      'Erro ao carregar administração:',
      err
    );

    toast(
      'Não foi possível carregar a administração.'
    );

  }

})();
