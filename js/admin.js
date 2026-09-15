const A = {
  categories: [],
  links: [],
  user: null,
  search: ''
};

const $ = s => document.querySelector(s);

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
   TOAST
   ============================================================ */

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


/* ============================================================
   MODO LOCAL
   ============================================================ */

function localMode() {

  return !window.supabaseReady ||
         !window.portalSupabase;

}


/* ============================================================
   MODAIS
   ============================================================ */

function hideModal(el) {

  if (!el) return;

  el.hidden = true;
  el.style.display = 'none';

  el.setAttribute(
    'aria-hidden',
    'true'
  );

}


function showModal(el) {

  if (!el) return;

  el.hidden = false;
  el.style.display = 'flex';

  el.setAttribute(
    'aria-hidden',
    'false'
  );

}


function closeAllModals() {

  hideModal($('#editor'));
  hideModal($('#categoryModal'));

}


/* ============================================================
   LOGIN / ADMIN
   ============================================================ */

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


/* ============================================================
   NORMALIZA CAMINHO DE PASTA
   ============================================================ */

function normalizeFolderPath(value) {

  let path =
    String(value || '').trim();

  if (!path) return '';


  /*
    Remove aspas caso o caminho tenha
    sido copiado entre aspas.
  */

  if (
    (path.startsWith('"') &&
     path.endsWith('"')) ||

    (path.startsWith("'") &&
     path.endsWith("'"))
  ) {

    path =
      path.slice(1, -1).trim();

  }


  /*
    Se já for file://,
    mantém.
  */

  if (/^file:\/\//i.test(path)) {

    return path
      .replace(/\\/g, '/')
      .replace(/\/+$/, '');

  }


  /*
    Caminho UNC:

    \\arquivos\ti\...
  */

  if (/^\\\\/.test(path)) {

    return (
      'file://' +
      path
        .replace(/^\\+/, '')
        .replace(/\\/g, '/')
        .replace(/\/+$/, '')
    );

  }


  /*
    Caminho local:

    C:\Pasta
  */

  if (/^[A-Za-z]:[\\/]/.test(path)) {

    return (
      'file:///' +
      path
        .replace(/\\/g, '/')
        .replace(/\/+$/, '')
    );

  }


  /*
    Caso o usuário tenha digitado
    um caminho usando apenas barras.
  */

  return path
    .replace(/\\/g, '/')
    .replace(/\/+$/, '');

}


/* ============================================================
   NORMALIZA URL
   ============================================================ */

function normalizeLinkUrl(value) {

  let url =
    String(value || '').trim();

  if (!url) return '';


  if (/^https?:\/\//i.test(url)) {
    return url;
  }


  if (/^file:\/\//i.test(url)) {

    return url
      .replace(/\\/g, '/');

  }


  if (/^\\\\/.test(url)) {

    return (
      'file://' +
      url
        .replace(/^\\+/, '')
        .replace(/\\/g, '/')
    );

  }


  if (/^[A-Za-z]:[\\/]/.test(url)) {

    return (
      'file:///' +
      url.replace(/\\/g, '/')
    );

  }


  return url;

}


/* ============================================================
   MONTA ENDEREÇO FINAL
   ============================================================ */

function buildFileUrl() {

  const folder =
    normalizeFolderPath(
      $('#linkFolder')?.value
    );

  const fileName =
    String(
      $('#linkFileName')?.value || ''
    ).trim();


  if (!folder || !fileName) {

    return '';

  }


  /*
    Remove barras no final
    e no início do nome do arquivo.
  */

  const cleanFolder =
    folder.replace(/\/+$/, '');

  const cleanFile =
    fileName.replace(/^[/\\]+/, '');


  /*
    Se for uma URL web,
    utiliza barra normal.
  */

  if (/^https?:\/\//i.test(cleanFolder)) {

    return (
      cleanFolder +
      '/' +
      cleanFile.replace(/\\/g, '/')
    );

  }


  /*
    Caminho file://
  */

  if (/^file:\/\//i.test(cleanFolder)) {

    return (
      cleanFolder +
      '/' +
      cleanFile.replace(/\\/g, '/')
    );

  }


  return (
    cleanFolder +
    '/' +
    cleanFile.replace(/\\/g, '/')
  );

}


/* ============================================================
   ATUALIZA ENDEREÇO GERADO
   ============================================================ */

function updateGeneratedUrl() {

  const url =
    buildFileUrl();

  const input =
    $('#linkUrl');

  const hint =
    $('#urlHint');

  if (!input) return;


  input.value = url;


  if (!hint) return;


  if (url) {

    hint.textContent =
      '✓ Endereço completo gerado automaticamente.';

    hint.classList.remove(
      'warning'
    );

    hint.classList.add(
      'success'
    );

  } else {

    hint.textContent =
      'Informe o caminho da pasta e selecione o arquivo.';

    hint.classList.remove(
      'success'
    );

  }

}


/* ============================================================
   ATUALIZA STATUS DA PASTA
   ============================================================ */

function updateFolderHint() {

  const input =
    $('#linkFolder');

  const hint =
    $('#folderHint');

  if (!input || !hint) return;


  const value =
    input.value.trim();


  hint.classList.remove(
    'success',
    'warning'
  );


  if (!value) {

    hint.textContent =
      'Copie no Windows Explorer o caminho da pasta onde está o arquivo.';

    updateGeneratedUrl();

    return;

  }


  if (
    /^\\\\/.test(value) ||
    /^file:\/\//i.test(value) ||
    /^[A-Za-z]:[\\/]/.test(value)
  ) {

    hint.textContent =
      '✓ Caminho de pasta reconhecido.';

    hint.classList.add(
      'success'
    );

  } else {

    hint.textContent =
      'Informe um caminho de rede como \\\\arquivos\\ti\\...';

    hint.classList.add(
      'warning'
    );

  }


  updateGeneratedUrl();

}


/* ============================================================
   COLAR CAMINHO DA PASTA
   ============================================================ */

async function pasteFolderPath() {

  const input =
    $('#linkFolder');

  if (!input) return;


  try {

    if (
      !navigator.clipboard ||
      !navigator.clipboard.readText
    ) {

      toast(
        'Cole o caminho manualmente usando Ctrl+V.'
      );

      input.focus();

      return;

    }


    const text =
      await navigator.clipboard.readText();


    if (!text.trim()) {

      toast(
        'A área de transferência está vazia.'
      );

      return;

    }


    input.value =
      normalizeFolderPath(text);


    updateFolderHint();

    input.focus();


    input.setSelectionRange(
      input.value.length,
      input.value.length
    );


    toast(
      'Caminho da pasta inserido.'
    );


  } catch (err) {

    console.warn(
      'Erro ao acessar clipboard:',
      err
    );


    toast(
      'O navegador bloqueou a área de transferência. Use Ctrl+V no campo.'
    );


    input.focus();

  }

}


/* ============================================================
   REMOVE EXTENSÃO DO NOME DO ARQUIVO
   ============================================================ */

function fileNameWithoutExtension(
  fileName
) {

  const name =
    String(fileName || '')
      .trim();


  if (!name) return '';


  /*
    Remove somente a última extensão.

    Exemplo:

    arquivo.xlsx
    ->
    arquivo

    arquivo.backup.xlsx
    ->
    arquivo.backup
  */

  return name.replace(
    /\.[^.]+$/,
    ''
  );

}


/* ============================================================
   SELEÇÃO DO ARQUIVO
   ============================================================ */

function selectFile() {

  const picker =
    $('#filePicker');

  if (!picker) return;

  picker.click();

}


/* ============================================================
   ARQUIVO SELECIONADO
   ============================================================ */

function handleFileSelected(
  event
) {

  const file =
    event.target.files?.[0];


  if (!file) return;


  /*
    O navegador entrega o nome real do arquivo,
    mesmo que esconda o caminho completo.
  */

  const fileNameInput =
    $('#linkFileName');


  if (fileNameInput) {

    fileNameInput.value =
      file.name;

  }


  /*
    Preenche automaticamente o nome
    do atalho, mas somente se:

    - estiver vazio; ou
    - o nome anterior tiver sido
      gerado automaticamente.
  */

  const linkName =
    $('#linkName');


  const previousAutoName =
    linkName?.dataset.autoName ||
    '';


  const generatedName =
    fileNameWithoutExtension(
      file.name
    );


  if (
    linkName &&
    (
      !linkName.value.trim() ||
      linkName.value.trim() === previousAutoName
    )
  ) {

    linkName.value =
      generatedName;

    linkName.dataset.autoName =
      generatedName;

  }


  /*
    Informação visual.
  */

  const info =
    $('#selectedFileInfo');


  if (info) {

    info.hidden = false;

    info.textContent =
      `✓ Arquivo selecionado: ${file.name}`;

  }


  const hint =
    $('#fileHint');


  if (hint) {

    hint.textContent =
      '✓ Arquivo selecionado. O nome foi preenchido automaticamente.';

    hint.classList.remove(
      'warning'
    );

    hint.classList.add(
      'success'
    );

  }


  updateGeneratedUrl();


  /*
    Limpa o input para permitir selecionar
    novamente o mesmo arquivo.
  */

  event.target.value = '';

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

  } else if (localData?.categories) {

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
              ? c.icon || '📁'
              : '📁',

          description:
            typeof c === 'object'
              ? c.description || ''
              : ''

        })
      );

  } else {

    A.categories = [];

  }


  if (savedLinks) {

    A.links =
      savedLinks;

  } else if (localData?.links) {

    A.links =
      localData.links.map(
        l => ({

          ...l,

          category_id:
            A.categories.find(
              c =>
                c.name ===
                l.category
            )?.id || '1',

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

    A.links = [];

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


  const [c, l] =
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


  if (c.error || l.error) {

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

    tbody.innerHTML =
      `
      <tr>
        <td
          colspan="2"
          style="text-align:center;padding:1.5rem;">
          Nenhuma categoria encontrada.
        </td>
      </tr>
      `;

    return;

  }


  tbody.innerHTML =
    A.categories
      .map(
        c => `

        <tr>

          <td>

            <strong>
              ${esc(c.icon || '📁')}
              ${esc(c.name)}
            </strong>

            ${
              c.description
                ? `
                  <br>
                  <small style="opacity:.7">
                    ${esc(c.description)}
                  </small>
                `
                : ''
            }

          </td>


          <td
            style="text-align:right;white-space:nowrap;">

            <button
              class="icon-btn"
              data-edit-cat="${esc(c.id)}"
              title="Editar categoria">

              ✏️

            </button>


            <button
              class="icon-btn danger"
              data-delete-cat="${esc(c.id)}"
              title="Excluir categoria">

              🗑️

            </button>

          </td>

        </tr>

      `
      )
      .join('');

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
      A.search.toLowerCase();


    filtered =
      filtered.filter(
        x =>

          (x.name || '')
            .toLowerCase()
            .includes(q)

          ||

          (x.category_name || '')
            .toLowerCase()
            .includes(q)

          ||

          (x.description || '')
            .toLowerCase()
            .includes(q)

          ||

          (x.url || '')
            .toLowerCase()
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

    tbody.innerHTML =
      `
      <tr>
        <td
          colspan="5"
          style="text-align:center;padding:1.5rem;">
          Nenhum atalho encontrado.
        </td>
      </tr>
      `;

    return;

  }


  tbody.innerHTML =
    filtered
      .map(
        x => `

        <tr>

          <td>
            <strong>
              ${esc(x.name)}
            </strong>
          </td>


          <td>
            <span class="badge secondary">
              ${esc(x.category_name)}
            </span>
          </td>


          <td>
            <span class="badge outline">
              ${esc(
                x.link_type ||
                'internal'
              )}
            </span>
          </td>


          <td>

            <span
              class="badge ${
                x.active !== false
                  ? 'success'
                  : 'muted'
              }">

              ${
                x.active !== false
                  ? 'Ativo'
                  : 'Inativo'
              }

            </span>

          </td>


          <td
            style="text-align:right;white-space:nowrap;">

            <button
              class="icon-btn"
              data-edit="${esc(x.id)}"
              title="Editar atalho">

              ✏️

            </button>


            <button
              class="icon-btn danger"
              data-delete="${esc(x.id)}"
              title="Excluir atalho">

              🗑️

            </button>

          </td>

        </tr>

      `
      )
      .join('');

}


/* ============================================================
   CATEGORIA DO LINK
   ============================================================ */

function populateCategoryDropdown(
  selected
) {

  const sel =
    $('#linkCategory');

  if (!sel) return;


  if (
    A.categories.length === 0
  ) {

    sel.innerHTML =
      `
      <option value="">
        Nenhuma categoria cadastrada
      </option>
      `;

    return;

  }


  sel.innerHTML =
    A.categories
      .map(
        c => {

          const selectedValue =
            String(selected) ===
              String(c.id) ||

            selected === c.name;


          return `

            <option
              value="${esc(c.id)}"
              ${
                selectedValue
                  ? 'selected'
                  : ''
              }>

              ${esc(c.icon || '📁')}
              ${esc(c.name)}

            </option>

          `;

        }
      )
      .join('');

}


/* ============================================================
   ABRIR EDITOR
   ============================================================ */

function openEditor(
  x = null
) {

  closeAllModals();


  $('#editId').value =
    x?.id || '';


  $('#editorEyebrow').textContent =
    x
      ? 'EDITAR ATALHO'
      : 'NOVO ATALHO';


  $('#editorTitle').textContent =
    x
      ? 'Editar atalho'
      : 'Cadastrar atalho';


  $('#linkName').value =
    x?.name || '';


  $('#linkDescription').value =
    x?.description || '';


  /*
    Tenta separar a URL antiga em
    pasta + nome do arquivo.
  */

  let folder = '';
  let fileName = '';


  const oldUrl =
    String(
      x?.url ||
      x?.url_original ||
      ''
    ).trim();


  if (oldUrl) {

    const normalized =
      oldUrl.replace(
        /\\/g,
        '/'
      );


    const lastSlash =
      normalized.lastIndexOf('/');


    if (lastSlash >= 0) {

      folder =
        normalized.substring(
          0,
          lastSlash
        );

      fileName =
        normalized.substring(
          lastSlash + 1
        );

    } else {

      fileName =
        normalized;

    }

  }


  $('#linkFolder').value =
    folder;


  $('#linkFileName').value =
    fileName;


  $('#linkName').dataset.autoName =
    '';


  $('#linkType').value =
    x?.link_type ||
    'internal';


  $('#linkActive').checked =
    x?.active !== false;


  $('#formMsg').textContent =
    '';


  const info =
    $('#selectedFileInfo');


  if (info) {

    info.hidden = true;
    info.textContent = '';

  }


  const fileHint =
    $('#fileHint');


  if (fileHint) {

    fileHint.textContent =
      'Selecione o arquivo no Windows. O nome será preenchido automaticamente.';

    fileHint.classList.remove(
      'success',
      'warning'
    );

  }


  populateCategoryDropdown(
    x?.category_id ||
    x?.category
  );


  updateFolderHint();
  updateGeneratedUrl();


  showModal(
    $('#editor')
  );

}


/* ============================================================
   FECHAR EDITOR
   ============================================================ */

function closeEditor() {

  hideModal(
    $('#editor')
  );


  $('#linkForm').reset();


  $('#formMsg').textContent =
    '';


  $('#linkName').dataset.autoName =
    '';


  updateFolderHint();

}


/* ============================================================
   CATEGORIA
   ============================================================ */

function openCategoryModal(
  c = null
) {

  closeAllModals();


  $('#categoryModalTitle').textContent =
    c
      ? 'Editar categoria'
      : 'Nova categoria';


  $('#editCategoryId').value =
    c?.id || '';


  $('#categoryName').value =
    c?.name || '';


  $('#categoryDescription').value =
    c?.description || '';


  $('#categoryIcon').value =
    c?.icon || '📁';


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
        'Modo Local (Gerenciamento no navegador / LocalStorage)';

    }


    refreshLocal();

    return;

  }


  if (
    !A.user &&
    window.portalSupabase
  ) {

    const r =
      await portalSupabase.auth.getUser();


    A.user =
      r.data?.user ||
      null;

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


  await refresh();

}


/* ============================================================
   EVENTOS
   ============================================================ */

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


$('#pasteFolder')?.addEventListener(
  'click',
  pasteFolderPath
);


$('#selectFile')?.addEventListener(
  'click',
  selectFile
);


$('#filePicker')?.addEventListener(
  'change',
  handleFileSelected
);


$('#linkFolder')?.addEventListener(
  'input',
  updateFolderHint
);


$('#linkFileName')?.addEventListener(
  'input',
  updateGeneratedUrl
);


$('#linkName')?.addEventListener(
  'input',
  () => {

    /*
      Se o usuário alterar manualmente
      o nome, deixamos de considerar
      que ele foi preenchido
      automaticamente.
    */

    const input =
      $('#linkName');

    if (input) {

      const auto =
        input.dataset.autoName ||
        '';


      if (
        input.value.trim() !== auto
      ) {

        input.dataset.autoName =
          '';

      }

    }

  }
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


/* ============================================================
   FECHAR MODAL
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
   PESQUISA
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


    /*
      Gera novamente o endereço
      para garantir que o valor
      salvo esteja atualizado.
    */

    const generatedUrl =
      buildFileUrl();


    /*
      Se o usuário estiver editando
      um link web antigo, preserva
      o valor do campo URL caso
      não haja pasta/arquivo.
    */

    let finalUrl =
      generatedUrl;


    if (!finalUrl) {

      finalUrl =
        String(
          $('#linkUrl').value ||
          ''
        ).trim();

    }


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
          finalUrl
        ),

      link_type:
        $('#linkType').value,

      active:
        $('#linkActive').checked

    };


    if (
      !payload.name ||
      !payload.url
    ) {

      $('#formMsg').textContent =
        'Preencha o nome, caminho da pasta e selecione o arquivo.';

      return;

    }


    /* ========================================================
       MODO LOCAL
       ======================================================== */

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
        'Salvo no navegador (Modo Local).'
      );


      return;

    }


    /* ========================================================
       SUPABASE
       ======================================================== */

    const { error } =
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


/* ============================================================
   SALVAR CATEGORIA
   ============================================================ */

$('#categoryForm')?.addEventListener(
  'submit',
  async e => {

    e.preventDefault();


    const id =
      $('#editCategoryId').value;


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
        $('#categoryIcon')
          .value
          .trim() ||
        '📁'

    };


    if (!payload.name) {

      $('#categoryMsg').textContent =
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
        'Categoria salva (Modo Local).'
      );


      return;

    }


    const { error } =
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


/* ============================================================
   EDIÇÃO / EXCLUSÃO
   ============================================================ */

document.addEventListener(
  'click',
  async e => {

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
            'Excluído (Modo Local).'
          );


        } else {

          const { error } =
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
              String(catId)

            ||

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
            'Categoria excluída (Modo Local).'
          );


        } else {

          const { error } =
            await portalSupabase
              .from('categories')
              .delete()
              .eq(
                'id',
                catId
              );


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


    const { error } =
      await portalSupabase.auth
        .signInWithPassword({

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

      await portalSupabase.auth.signOut();

    }


    A.user = null;

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
      document.documentElement.dataset.theme ===
      'dark';


    const newTheme =
      isDark
        ? 'light'
        : 'dark';


    document.documentElement.dataset.theme =
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

    document.documentElement.dataset.theme =
      savedTheme;

  }


  try {

    await loadAdmin();

  } catch (err) {

    console.error(
      'Erro na inicialização:',
      err
    );


    toast(
      'Não foi possível carregar a administração. Verifique o console do navegador.'
    );

  }

})();
