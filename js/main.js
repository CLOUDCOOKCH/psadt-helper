(() => {
  const listEl = document.getElementById('scenario-list');
  const searchEl = document.getElementById('scenario-search');
  const detailsEl = document.getElementById('scenario-details');
  const commandEl = document.getElementById('command');
  const outputEl = document.getElementById('output');
  const introEl = document.getElementById('intro');
  const copyBtn = document.getElementById('copy-btn');
  const addBtn = document.getElementById('add-btn');
  const scriptEl = document.getElementById('script');
  const scriptCommandsEl = document.getElementById('script-commands');
  const copyScriptBtn = document.getElementById('copy-script-btn');
  const downloadScriptBtn = document.getElementById('download-script-btn');
  const shareScriptBtn = document.getElementById('share-script-btn');
  const accentEl = document.getElementById('accent');
  const swatchesEl = document.getElementById('accent-swatches');
  const bgEl = document.getElementById('background');
  const bgSwatchesEl = document.getElementById('bg-swatches');

  let activeId = null;
  const scriptCommands = [];

  const initialState = new URLSearchParams(location.hash.slice(1));

  function renderList(){
    listEl.innerHTML = '';
    const scenarios = Array.isArray(window.PSADT_SCENARIOS) ? window.PSADT_SCENARIOS : [];
    const term = searchEl ? searchEl.value.toLowerCase() : '';
    scenarios.filter(s => !term || s.name.toLowerCase().includes(term) || (s.description||'').toLowerCase().includes(term)).forEach(s => {
      const item = document.createElement('div');
      item.className = 'scenario-item' + (activeId === s.id ? ' active' : '');
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.setAttribute('aria-pressed', activeId === s.id ? 'true':'false');
      item.addEventListener('click', () => selectScenario(s.id));
      item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectScenario(s.id); } });
      const name = document.createElement('span');
      name.className = 'scenario-name';
      name.textContent = s.name;
      const desc = document.createElement('span');
      desc.className = 'scenario-desc';
      desc.textContent = s.description || '';
      item.appendChild(name);
      item.appendChild(desc);
      listEl.appendChild(item);
    });
    if (!scenarios.length){
      const none = document.createElement('div');
      none.className = 'scenario-item';
      none.textContent = 'No scenarios available.';
      listEl.appendChild(none);
    }
  }

  function selectScenario(id, preset = {}){
    activeId = id;
    renderList();
    const list = Array.isArray(window.PSADT_SCENARIOS) ? window.PSADT_SCENARIOS : [];
    const s = list.find(x => x.id === id);
    if (!s) return;

    introEl.classList.add('hidden');
    detailsEl.classList.remove('hidden');
    outputEl.classList.remove('hidden');

    detailsEl.innerHTML = '';
    const title = document.createElement('h2');
    title.textContent = s.name;
    detailsEl.appendChild(title);

    if (s.description){
      const d = document.createElement('p');
      d.textContent = s.description;
      d.style.color = 'var(--muted)';
      detailsEl.appendChild(d);
    }

    const form = document.createElement('form');
    form.className = 'form';

    // Build fields
    s.fields.forEach(field => {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      const label = document.createElement('label');
      label.textContent = field.label + (field.required ? ' *' : '');
      label.setAttribute('for', `f_${field.id}`);

      let container = wrap; // default container
      let input;
      let baseSel;

      // For file/path fields, add a base variable selector
      if (field.fileBase) {
        const row = document.createElement('div');
        row.style.display = 'grid';
        row.style.gridTemplateColumns = 'minmax(140px, 180px) 1fr';
        row.style.gap = '8px';
        baseSel = document.createElement('select');
        baseSel.id = `f_${field.id}_base`;
        ['($adtSession.DirFiles)','$adtSession.DirFiles','$adtSession.DirSupportFiles'].forEach((opt, idx) => {
          if (idx === 0) return; // ignore helper first
          const o = document.createElement('option'); o.value = opt; o.textContent = opt; baseSel.appendChild(o);
        });
        baseSel.value = preset[`${field.id}Base`] || '$adtSession.DirFiles';
        baseSel.addEventListener('change', () => updateCommand());
        row.appendChild(baseSel);
        container = row;
      }

      // Build the input element
      if (field.type === 'textarea'){
        input = document.createElement('textarea');
      } else if (field.type === 'select'){
        input = document.createElement('select');
        const empty = document.createElement('option');
        empty.value = '';
        empty.textContent = '—';
        input.appendChild(empty);
        (field.options || []).forEach(opt => {
          const o = document.createElement('option');
          if (typeof opt === 'object') { o.value = opt.value; o.textContent = opt.label || opt.value; }
          else { o.value = opt; o.textContent = opt; }
          input.appendChild(o);
        });
      } else if (field.type === 'multiselect'){
        input = document.createElement('select');
        input.multiple = true;
        (field.options || []).forEach(opt => {
          const o = document.createElement('option');
          if (typeof opt === 'object') { o.value = opt.value; o.textContent = opt.label || opt.value; }
          else { o.value = opt; o.textContent = opt; }
          input.appendChild(o);
        });
        // Make multi-select taller
        input.size = Math.min(8, (field.options || []).length || 4);
      } else if (field.type === 'number'){
        input = document.createElement('input');
        input.type = 'number';
        if (field.min != null) input.min = field.min;
        if (field.max != null) input.max = field.max;
      } else {
        input = document.createElement('input');
        input.type = 'text';
      }
      input.id = `f_${field.id}`;
      input.name = field.id;
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.required) input.required = true;
      if (field.pattern) { input.pattern = field.pattern; if (field.patternMessage) input.title = field.patternMessage; }

      input.addEventListener('input', () => updateCommand());
      wrap.appendChild(label);
      if (container !== wrap) {
        container.appendChild(input);
        wrap.appendChild(container);
      } else {
        wrap.appendChild(input);
      }
      form.appendChild(wrap);
      const presetVal = preset[field.id];
      if (presetVal !== undefined){
        if (field.type === 'multiselect' && Array.isArray(presetVal) && input instanceof HTMLSelectElement){
          Array.from(input.options).forEach(o => { o.selected = presetVal.includes(o.value); });
        } else {
          input.value = presetVal;
        }
      }
    });

    detailsEl.appendChild(form);

    function getValues(){
      const values = {};
      s.fields.forEach(field => {
        const el = form.querySelector(`#f_${field.id}`);
        let val;
        if (field.type === 'multiselect' && el instanceof HTMLSelectElement && el.multiple){
          val = Array.from(el.selectedOptions).map(o => o.value);
        } else {
          val = el.value;
        }
        if (field.type === 'number' && val !== '') val = Number(val);
        values[field.id] = val;
        if (field.fileBase) {
          const base = form.querySelector(`#f_${field.id}_base`);
          values[`${field.id}Base`] = base ? base.value : '$adtSession.DirFiles';
        }
      });
      return values;
    }

    function updateHash(v){
      const params = new URLSearchParams({ scenario: s.id });
      Object.entries(v).forEach(([k,val]) => {
        if (!val) return;
        params.set(k, Array.isArray(val) ? val.join(',') : val);
      });
      location.hash = params.toString();
    }

    function updateCommand(){
      const values = getValues();
      const missing = s.fields.filter(f => f.required && !values[f.id]);
      const invalid = s.fields.filter(f => {
        const el = form.querySelector(`#f_${f.id}`);
        return el && !el.checkValidity();
      });
      if (missing.length){
        commandEl.textContent = `// Missing: ${missing.map(m => m.label).join(', ')}`;
        updateHash(values);
        return;
      }
      if (invalid.length){
        commandEl.textContent = `// Invalid: ${invalid.map(m => m.label).join(', ')}`;
        updateHash(values);
        return;
      }
      try {
        const cmd = s.build(values);
        commandEl.textContent = cmd || '';
      } catch (e){
        commandEl.textContent = `// Error generating command: ${e.message}`;
      }
      updateHash(values);
    }

    updateCommand();
  }

  copyBtn.addEventListener('click', async () => {
    const txt = commandEl.textContent || '';
    if (!txt.trim()) return;
    try {
      await navigator.clipboard.writeText(txt);
      copyBtn.textContent = 'Copied!';
      copyBtn.style.background = 'var(--ok)';
      setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.style.background = ''; }, 1200);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = txt; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
  });

  function renderScript(){
    scriptCommandsEl.innerHTML = '';
    scriptCommands.forEach((cmd, idx) => {
      const row = document.createElement('div');
      row.className = 'script-row';
      const pre = document.createElement('pre');
      pre.className = 'code';
      pre.textContent = cmd;
      pre.contentEditable = 'true';
      pre.addEventListener('input', () => { scriptCommands[idx] = pre.textContent; });
      const tools = document.createElement('div');
      tools.className = 'script-row-tools';
      const up = document.createElement('button'); up.textContent = '↑'; up.className = 'script-btn'; up.title = 'Move up'; up.addEventListener('click', () => moveScript(idx,-1));
      const down = document.createElement('button'); down.textContent = '↓'; down.className = 'script-btn'; down.title = 'Move down'; down.addEventListener('click', () => moveScript(idx,1));
      const del = document.createElement('button'); del.textContent = '×'; del.className = 'script-btn'; del.title = 'Remove'; del.addEventListener('click', () => removeScript(idx));
      tools.appendChild(up); tools.appendChild(down); tools.appendChild(del);
      row.appendChild(pre); row.appendChild(tools);
      scriptCommandsEl.appendChild(row);
    });
    scriptEl.classList.toggle('hidden', scriptCommands.length === 0);
  }
  function moveScript(idx, delta){
    const n = idx + delta;
    if (n < 0 || n >= scriptCommands.length) return;
    const [cmd] = scriptCommands.splice(idx,1);
    scriptCommands.splice(n,0,cmd);
    renderScript();
  }
  function removeScript(idx){
    scriptCommands.splice(idx,1);
    renderScript();
  }
  addBtn.addEventListener('click', () => {
    const cmd = commandEl.textContent.trim();
    if (!cmd) return;
    scriptCommands.push(cmd);
    renderScript();
  });

  copyScriptBtn.addEventListener('click', async () => {
    const txt = scriptCommands.join('\n');
    if (!txt.trim()) return;
    try {
      await navigator.clipboard.writeText(txt);
      copyScriptBtn.textContent = 'Copied!';
      setTimeout(() => { copyScriptBtn.textContent = 'Copy Script'; }, 1200);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = txt; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
  });
    downloadScriptBtn.addEventListener('click', () => {
      const txt = scriptCommands.join('\n');
      if (!txt.trim()) return;
      const blob = new Blob([txt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'psadt-script.ps1';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    if (shareScriptBtn){
      shareScriptBtn.addEventListener('click', async () => {
        const txt = scriptCommands.join('\n');
        if (!txt.trim()) return;
        const b64 = btoa(txt);
        const url = `${location.origin}${location.pathname}#script=${encodeURIComponent(b64)}`;
        try {
          await navigator.clipboard.writeText(url);
          shareScriptBtn.textContent = 'Link Copied!';
          setTimeout(()=>{ shareScriptBtn.textContent = 'Copy Link'; }, 1200);
        } catch {
          const ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        }
      });
    }
    // Initial render
  renderList();
  if (searchEl) searchEl.addEventListener('input', renderList);
  if (initialState.get('scenario')){
    const id = initialState.get('scenario');
    const vals = {};
    initialState.forEach((v,k) => {
      if (k === 'scenario') return;
      if (k === 'script') return;
      vals[k] = v.includes(',') ? v.split(',') : v;
    });
    selectScenario(id, vals);
  }
  if (initialState.get('script')){
    try {
      const decoded = atob(initialState.get('script'));
      decoded.split('\n').forEach(c => { if (c.trim()) scriptCommands.push(c); });
      renderScript();
    } catch {}
  }

  // Theming: accent color persistence and contrast handling
  function hexToRgb(hex){
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return null; return { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) };
  }
  function relativeLuma({r,g,b}){
    // Simple sRGB luminance
    const toLin = (c)=>{ c/=255; return c<=0.03928? c/12.92: Math.pow((c+0.055)/1.055,2.4) };
    const R=toLin(r), G=toLin(g), B=toLin(b); return 0.2126*R + 0.7152*G + 0.0722*B;
  }
  function contrastRatio(c1,c2){
    const L1 = relativeLuma(c1)+0.05; const L2 = relativeLuma(c2)+0.05; return L1>L2? L1/L2 : L2/L1;
  }
  function setAccent(color){
    if (!color) return;
    document.documentElement.style.setProperty('--accent', color);
    const rgb = hexToRgb(color);
    if (rgb){
      const white = {r:255,g:255,b:255};
      const dark = {r:11,g:14,b:24};
      const cWhite = contrastRatio(rgb, white);
      const cDark = contrastRatio(rgb, dark);
      document.documentElement.style.setProperty('--accent-contrast', cWhite >= cDark ? '#ffffff' : '#0b0e18');
    }
    try { localStorage.setItem('psadtAccent', color); } catch {}
    if (accentEl) accentEl.value = color;
  }
  function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
  function hex(n){ const s = clamp(Math.round(n),0,255).toString(16).padStart(2,'0'); return s; }
  function mix(c1,c2,ratio){
    const a = hexToRgb(c1), b = hexToRgb(c2); if(!a||!b) return c1;
    const r = a.r*(1-ratio)+b.r*ratio, g=a.g*(1-ratio)+b.g*ratio, b2=a.b*(1-ratio)+b.b*ratio;
    return `#${hex(r)}${hex(g)}${hex(b2)}`;
  }
  function setBackground(color){
    if (!color) return;
    const rgb = hexToRgb(color); if (!rgb) return;
    document.documentElement.style.setProperty('--bg', color);
    const l = relativeLuma(rgb);
    // Derive panel/border/text based on background luminance
    let text = '#e6e7ee', muted = '#a1a6c5', panel, border;
    if (l >= 0.6){
      // Light background
      text = '#0b0e18';
      muted = '#3f4865';
      panel = mix(color, '#000000', 0.06);
      border = mix(color, '#000000', 0.12);
    } else {
      // Dark background
      text = '#e6e7ee';
      muted = '#a1a6c5';
      panel = mix(color, '#ffffff', 0.06);
      border = mix(color, '#ffffff', 0.12);
    }
    document.documentElement.style.setProperty('--panel', panel);
    document.documentElement.style.setProperty('--border', border);
    document.documentElement.style.setProperty('--text', text);
    document.documentElement.style.setProperty('--muted', muted);
    try { localStorage.setItem('psadtBg', color); } catch {}
    if (bgEl) bgEl.value = color;
  }
  const saved = (()=>{ try { return localStorage.getItem('psadtAccent'); } catch { return null } })();
  if (saved) setAccent(saved);
  if (accentEl){ accentEl.addEventListener('input', (e)=> setAccent(e.target.value)); }
  if (swatchesEl){ swatchesEl.addEventListener('click', (e)=>{
    const btn = e.target.closest('.swatch'); if (!btn) return; const c = btn.getAttribute('data-color'); setAccent(c);
  }); }
  const savedBg = (()=>{ try { return localStorage.getItem('psadtBg'); } catch { return null } })();
  if (savedBg) setBackground(savedBg);
  if (bgEl){ bgEl.addEventListener('input', (e)=> setBackground(e.target.value)); }
  if (bgSwatchesEl){ bgSwatchesEl.addEventListener('click', (e)=>{
    const btn = e.target.closest('.swatch'); if (!btn) return; const c = btn.getAttribute('data-color'); setBackground(c);
  }); }

  // Hidden gimmick: classic Konami code reveals a surprise
  const secret = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  const buffer = [];
  window.addEventListener('keydown', (e) => {
    buffer.push(e.key);
    if (buffer.length > secret.length) buffer.shift();
    if (secret.every((k,i) => k.toLowerCase() === (buffer[i] || '').toLowerCase())){
      alert('🍕 You found the hidden pizza!');
      buffer.length = 0;
    }
  });
})();
