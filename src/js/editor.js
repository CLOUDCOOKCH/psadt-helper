// Modern command explorer with parameter details
(() => {
  const builderEl = document.getElementById('builder');
  if (!builderEl) return;

  const boxesEl = document.getElementById('command-boxes');
  const detailEl = document.getElementById('command-detail');
  const editorEl = document.getElementById('editor-area');
  const searchEl = document.getElementById('command-search');

  let commands = [];
  let filtered = [];
  let activeName = '';

  function insertCommand(cmd) {
    if (!editorEl) return;
    const current = editorEl.textContent;
    editorEl.textContent = current ? `${current}\n${cmd}` : cmd;
  }

  function highlightActive(name) {
    activeName = name;
    if (!boxesEl) return;
    boxesEl.querySelectorAll('.cmd-box').forEach((box) => {
      const isActive = box.dataset.command === name;
      box.classList.toggle('active', isActive);
      box.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function renderEmptyDetail(message) {
    if (!detailEl) return;
    detailEl.innerHTML = '';
    detailEl.classList.add('empty');
    const p = document.createElement('p');
    p.textContent = message;
    detailEl.appendChild(p);
  }

  function showCommandDetail(cmd) {
    if (!detailEl) return;
    highlightActive(cmd.name);
    detailEl.classList.remove('empty');
    detailEl.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'cmd-detail-header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'cmd-detail-title';
    const title = document.createElement('h3');
    title.textContent = cmd.name;
    titleWrap.appendChild(title);
    if (cmd.synopsis) {
      const synopsis = document.createElement('p');
      synopsis.className = 'cmd-detail-synopsis';
      synopsis.textContent = cmd.synopsis;
      titleWrap.appendChild(synopsis);
    }
    header.appendChild(titleWrap);

    const actions = document.createElement('div');
    actions.className = 'cmd-detail-actions';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-ghost cmd-detail-add';
    addBtn.textContent = 'Add to editor';
    addBtn.addEventListener('click', () => insertCommand(cmd.name));
    actions.appendChild(addBtn);
    if (cmd.link) {
      const link = document.createElement('a');
      link.href = cmd.link;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.className = 'cmd-detail-link';
      link.textContent = 'View documentation';
      actions.appendChild(link);
    }
    header.appendChild(actions);
    detailEl.appendChild(header);

    if (cmd.parameters && cmd.parameters.length) {
      const list = document.createElement('div');
      list.className = 'cmd-param-list';
      cmd.parameters.forEach((param) => {
        const item = document.createElement('div');
        item.className = 'cmd-param';

        const nameRow = document.createElement('div');
        nameRow.className = 'cmd-param-header';
        const nameEl = document.createElement('code');
        nameEl.className = 'cmd-param-name';
        nameEl.textContent = `-${param.name}`;
        nameRow.appendChild(nameEl);
        item.appendChild(nameRow);

        if (param.description) {
          const desc = document.createElement('p');
          desc.className = 'cmd-param-desc';
          desc.textContent = param.description;
          item.appendChild(desc);
        }
        list.appendChild(item);
      });
      detailEl.appendChild(list);
    } else {
      const noParams = document.createElement('p');
      noParams.className = 'cmd-no-params';
      noParams.textContent = 'This command does not document any parameters.';
      detailEl.appendChild(noParams);
    }
  }

  function renderCommands(list) {
    if (!boxesEl) return;
    boxesEl.innerHTML = '';
    if (!list.length) {
      const msg = document.createElement('div');
      msg.className = 'cmd-empty';
      msg.textContent = 'No commands found.';
      boxesEl.appendChild(msg);
      highlightActive('');
      renderEmptyDetail('Select a command to view parameters.');
      return;
    }
    list.forEach((cmd) => {
      const box = document.createElement('div');
      box.className = 'cmd-box' + (cmd.name === activeName ? ' active' : '');
      box.textContent = cmd.name;
      box.draggable = true;
      box.tabIndex = 0;
      box.dataset.command = cmd.name;
      box.setAttribute('role', 'button');
      box.setAttribute('aria-pressed', cmd.name === activeName ? 'true' : 'false');
      box.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', cmd.name);
      });
      box.addEventListener('click', () => {
        showCommandDetail(cmd);
      });
      box.addEventListener('dblclick', (e) => {
        e.preventDefault();
        insertCommand(cmd.name);
      });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showCommandDetail(cmd);
        } else if (e.key === 'Insert') {
          insertCommand(cmd.name);
        }
      });
      boxesEl.appendChild(box);
    });
  }

  function applyFilter(term) {
    const normalized = term.trim().toLowerCase();
    filtered = !normalized
      ? commands.slice()
      : commands.filter((cmd) => {
          const haystack = `${cmd.name} ${cmd.synopsis || ''} ${cmd.description || ''}`.toLowerCase();
          return haystack.includes(normalized);
        });
    if (activeName && !filtered.some((cmd) => cmd.name === activeName)) {
      activeName = '';
      renderEmptyDetail('Select a command to view parameters.');
    }
    renderCommands(filtered);
  }

  if (editorEl) {
    editorEl.addEventListener('dragover', (e) => e.preventDefault());
    editorEl.addEventListener('drop', (e) => {
      e.preventDefault();
      const text = e.dataTransfer.getData('text/plain');
      if (text) insertCommand(text);
    });
  }

  async function init() {
    if (!boxesEl) return;
    try {
      const res = await fetch('src/data/command-metadata.json');
      const data = await res.json();
      commands = Array.isArray(data) ? data : [];
      filtered = commands.slice();
      renderCommands(filtered);
      renderEmptyDetail('Select a command to view parameters.');
      if (searchEl) {
        searchEl.addEventListener('input', () => applyFilter(searchEl.value || ''));
      }
    } catch (err) {
      const msg = document.createElement('div');
      msg.className = 'cmd-empty';
      msg.textContent = 'Failed to load commands.';
      boxesEl.appendChild(msg);
      console.error(err);
    }
  }

  init();
})();
