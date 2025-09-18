function stripQuotes(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  const match = trimmed.match(/^(["'])([\s\S]*)\1$/);
  if (!match) return trimmed;
  return match[2];
}

function createParameterState(command) {
  const state = {};
  if (!command || !Array.isArray(command.parameters)) {
    return state;
  }
  command.parameters.forEach(param => {
    const defaultValue = stripQuotes(param.defaultValue || '');
    const placeholder = stripQuotes(param.placeholder || '');
    const baseValue = defaultValue || placeholder;
    const defaultRaw = (param.defaultRaw || '').toLowerCase();
    const switchEnabled =
      param.isSwitch && (param.required || defaultRaw === '$true');
    state[param.name] = {
      enabled: param.isSwitch ? switchEnabled : !!param.required,
      value: param.isSwitch ? '' : baseValue,
    };
  });
  return state;
}

function inferQuoteChar(param) {
  if (!param) return '';
  if (param.defaultQuote) return param.defaultQuote;
  if (param.placeholderQuote) return param.placeholderQuote;
  if (param.type && /string$/i.test(param.type)) return '"';
  return '';
}

function formatParameterValue(param, rawValue) {
  if (!param) return '';
  const value = (rawValue || '').toString().trim();
  if (!value) return '';
  if (/^(['"]).*\1$/.test(value)) {
    return value;
  }
  let quote = inferQuoteChar(param);
  if (!quote && /\s/.test(value)) {
    quote = '"';
  }
  if (!quote) {
    return value;
  }
  const escaped = value.replace(new RegExp(quote, 'g'), `\\${quote}`);
  return `${quote}${escaped}${quote}`;
}

function buildCommandString(command, state) {
  if (!command) return '';
  const resolvedState = state || createParameterState(command);
  const parts = [command.name];
  const parameters = Array.isArray(command.parameters)
    ? command.parameters
    : [];
  parameters.forEach(param => {
    const paramState = resolvedState[param.name] || {
      enabled: !!param.required,
      value: stripQuotes(param.defaultValue || param.placeholder || ''),
    };
    if (param.isSwitch) {
      if (paramState.enabled || param.required) {
        parts.push(`-${param.name}`);
      }
      return;
    }
    const enabled = param.required || paramState.enabled;
    if (!enabled) {
      return;
    }
    let value = paramState.value;
    if (!value) {
      value = param.defaultValue || param.placeholder || '';
    }
    const formatted = formatParameterValue(param, value);
    if (formatted) {
      parts.push(`-${param.name} ${formatted}`);
    } else {
      parts.push(`-${param.name}`);
    }
  });
  return parts.join(' ');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    stripQuotes,
    createParameterState,
    formatParameterValue,
    buildCommandString,
  };
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
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
    const commandStates = new Map();

    function getSafeId(commandName, paramName, suffix) {
      return `${commandName}-${paramName}-${suffix}`.replace(/[^A-Za-z0-9_-]/g, '-');
    }

    function getCommandState(cmd) {
      if (!commandStates.has(cmd.name)) {
        commandStates.set(cmd.name, createParameterState(cmd));
      }
      return commandStates.get(cmd.name);
    }

    function insertCommand(cmdText) {
      if (!editorEl) return;
      const current = editorEl.textContent;
      editorEl.textContent = current ? `${current}\n${cmdText}` : cmdText;
    }

    function highlightActive(name) {
      activeName = name;
      if (!boxesEl) return;
      boxesEl.querySelectorAll('.cmd-box').forEach(box => {
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

    function renderParameter(cmd, param) {
      const item = document.createElement('div');
      item.className = 'cmd-param';
      const state = getCommandState(cmd);
      if (!state[param.name]) {
        state[param.name] = {
          enabled: !!param.required,
          value: stripQuotes(param.defaultValue || param.placeholder || ''),
        };
      }
      const paramState = state[param.name];

      const header = document.createElement('div');
      header.className = 'cmd-param-header';
      item.appendChild(header);

      const toggleWrap = document.createElement('div');
      toggleWrap.className = 'cmd-param-toggle';
      header.appendChild(toggleWrap);

      const toggleId = getSafeId(cmd.name, param.name, 'toggle');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = toggleId;
      checkbox.className = 'cmd-param-checkbox';
      checkbox.checked = param.required ? true : !!paramState.enabled;
      if (param.required) {
        checkbox.disabled = true;
        checkbox.setAttribute('aria-disabled', 'true');
      }
      toggleWrap.appendChild(checkbox);

      const label = document.createElement('label');
      label.className = 'cmd-param-label';
      label.setAttribute('for', toggleId);
      const nameCode = document.createElement('code');
      nameCode.className = 'cmd-param-name';
      nameCode.textContent = `-${param.name}`;
      label.appendChild(nameCode);
      if (param.required) {
        const requiredBadge = document.createElement('span');
        requiredBadge.className = 'cmd-param-required';
        requiredBadge.textContent = 'Required';
        label.appendChild(requiredBadge);
      }
      if (param.isSwitch && !param.required) {
        label.appendChild(document.createTextNode(' (toggle)'));
      }
      toggleWrap.appendChild(label);

      if (param.type) {
        const type = document.createElement('span');
        type.className = 'cmd-param-type';
        type.textContent = param.type;
        header.appendChild(type);
      }

      let descId = '';
      if (param.description) {
        const desc = document.createElement('p');
        desc.className = 'cmd-param-desc';
        descId = getSafeId(cmd.name, param.name, 'desc');
        desc.id = descId;
        desc.textContent = param.description;
        item.appendChild(desc);
      }

      const metaEntries = [];
      if (param.defaultRaw || param.defaultValue) {
        const defaultDisplay = param.defaultRaw || param.defaultValue;
        metaEntries.push({ label: 'Default', value: defaultDisplay, code: true });
      }
      if (param.placeholder) {
        const placeholderValue = param.placeholderQuote
          ? `${param.placeholderQuote}${param.placeholder}${param.placeholderQuote}`
          : param.placeholder;
        metaEntries.push({ label: 'Example', value: placeholderValue, code: true });
      }

      if (metaEntries.length) {
        const meta = document.createElement('dl');
        meta.className = 'cmd-param-meta';
        metaEntries.forEach(entry => {
          const dt = document.createElement('dt');
          dt.textContent = entry.label;
          const dd = document.createElement('dd');
          if (entry.code) {
            const codeEl = document.createElement('code');
            codeEl.textContent = entry.value;
            dd.appendChild(codeEl);
          } else {
            dd.textContent = entry.value;
          }
          meta.appendChild(dt);
          meta.appendChild(dd);
        });
        item.appendChild(meta);
      }

      if (!param.isSwitch) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'cmd-param-input';
        input.value = paramState.value || '';
        input.placeholder = param.placeholder || '';
        input.disabled = param.required ? false : !paramState.enabled;
        if (descId) {
          input.setAttribute('aria-describedby', descId);
        }
        input.addEventListener('input', () => {
          state[param.name].value = input.value;
        });
        checkbox.addEventListener('change', () => {
          if (param.required) return;
          state[param.name].enabled = checkbox.checked;
          if (checkbox.checked && !input.value) {
            input.value = stripQuotes(
              param.defaultValue || param.placeholder || ''
            );
            state[param.name].value = input.value;
          }
          input.disabled = !checkbox.checked;
          if (checkbox.checked) {
            input.focus();
          }
        });
        item.appendChild(input);
      } else {
        checkbox.addEventListener('change', () => {
          if (param.required) return;
          state[param.name].enabled = checkbox.checked;
        });
      }

      return item;
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
      addBtn.addEventListener('click', () => {
        const state = getCommandState(cmd);
        const commandText = buildCommandString(cmd, state);
        insertCommand(commandText);
      });
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
        cmd.parameters.forEach(param => {
          const rendered = renderParameter(cmd, param);
          list.appendChild(rendered);
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
      list.forEach(cmd => {
        const box = document.createElement('div');
        box.className = 'cmd-box' + (cmd.name === activeName ? ' active' : '');
        box.textContent = cmd.name;
        box.draggable = true;
        box.tabIndex = 0;
        box.dataset.command = cmd.name;
        box.setAttribute('role', 'button');
        box.setAttribute('aria-pressed', cmd.name === activeName ? 'true' : 'false');
        box.addEventListener('dragstart', e => {
          const state = getCommandState(cmd);
          const commandText = buildCommandString(cmd, state);
          e.dataTransfer.setData('text/plain', commandText);
        });
        box.addEventListener('click', () => {
          showCommandDetail(cmd);
        });
        box.addEventListener('dblclick', e => {
          e.preventDefault();
          const state = getCommandState(cmd);
          const commandText = buildCommandString(cmd, state);
          insertCommand(commandText);
        });
        box.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            showCommandDetail(cmd);
          } else if (e.key === 'Insert') {
            const state = getCommandState(cmd);
            const commandText = buildCommandString(cmd, state);
            insertCommand(commandText);
          }
        });
        boxesEl.appendChild(box);
      });
    }

    function applyFilter(term) {
      const normalized = term.trim().toLowerCase();
      filtered = !normalized
        ? commands.slice()
        : commands.filter(cmd => {
            const haystack = `${cmd.name} ${cmd.synopsis || ''} ${
              cmd.description || ''
            }`.toLowerCase();
            return haystack.includes(normalized);
          });
      if (activeName && !filtered.some(cmd => cmd.name === activeName)) {
        activeName = '';
        renderEmptyDetail('Select a command to view parameters.');
      }
      renderCommands(filtered);
    }

    if (editorEl) {
      editorEl.addEventListener('dragover', e => e.preventDefault());
      editorEl.addEventListener('drop', e => {
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
          searchEl.addEventListener('input', () =>
            applyFilter(searchEl.value || '')
          );
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
}
