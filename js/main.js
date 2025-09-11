(() => {
  const listEl = document.getElementById('scenario-list');
  const detailsEl = document.getElementById('scenario-details');
  const commandEl = document.getElementById('command');
  const outputEl = document.getElementById('output');
  const emptyEl = document.getElementById('empty');
  const copyBtn = document.getElementById('copy-btn');
  const searchEl = document.getElementById('search');
  const accentEl = document.getElementById('accent');
  const swatchesEl = document.getElementById('accent-swatches');
  const bgEl = document.getElementById('background');
  const bgSwatchesEl = document.getElementById('bg-swatches');

  let activeId = null;

  function renderList(filter = ''){
    listEl.innerHTML = '';
    const f = filter.trim().toLowerCase();
    const scenarios = window.PSADT_SCENARIOS.filter(s =>
      !f || s.name.toLowerCase().includes(f) || (s.description||'').toLowerCase().includes(f) || s.id.includes(f)
    );
    scenarios.forEach(s => {
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
      none.textContent = 'No scenarios match your search.';
      listEl.appendChild(none);
    }
  }

  function selectScenario(id){
    activeId = id;
    renderList(searchEl.value);
    const s = window.PSADT_SCENARIOS.find(x => x.id === id);
    if (!s) return;

    emptyEl.classList.add('hidden');
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
        baseSel.value = '$adtSession.DirFiles';
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

      input.addEventListener('input', () => updateCommand());
      wrap.appendChild(label);
      if (container !== wrap) {
        container.appendChild(input);
        wrap.appendChild(container);
      } else {
        wrap.appendChild(input);
      }
      form.appendChild(wrap);
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

    function updateCommand(){
      const values = getValues();
      try {
        const cmd = s.build(values);
        commandEl.textContent = cmd || '';
      } catch (e){
        commandEl.textContent = `// Error generating command: ${e.message}`;
      }
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

  searchEl.addEventListener('input', () => renderList(searchEl.value));

  // Initial render
  renderList();

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
  function setAccent(color){
    if (!color) return;
    document.documentElement.style.setProperty('--accent', color);
    const rgb = hexToRgb(color);
    const contrast = (rgb && relativeLuma(rgb) < 0.55) ? '#ffffff' : '#0b0e18';
    document.documentElement.style.setProperty('--accent-contrast', contrast);
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
})();
