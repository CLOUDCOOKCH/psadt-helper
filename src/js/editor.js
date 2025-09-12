// Modern command editor with filtering and click-to-add
(() => {
  const builderEl = document.getElementById('builder');
  if (!builderEl) return;

  const boxesEl = document.getElementById('command-boxes');
  const editorEl = document.getElementById('editor-area');
  const searchEl = document.getElementById('command-search');

  // Insert command text into editor
  function insertCommand(cmd){
    const current = editorEl.textContent;
    editorEl.textContent = current ? `${current}\n${cmd}` : cmd;
  }

  // Allow dropping commands
  editorEl.addEventListener('dragover', e => e.preventDefault());
  editorEl.addEventListener('drop', e => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text/plain');
    if (text) insertCommand(text);
  });

  // Render command boxes
  function render(list){
    boxesEl.innerHTML = '';
    list.forEach(cmd => {
      const box = document.createElement('div');
      box.className = 'cmd-box';
      box.textContent = cmd;
      box.draggable = true;
      box.tabIndex = 0;
      box.setAttribute('role','button');
      box.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', cmd));
      box.addEventListener('click', () => insertCommand(cmd));
      box.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); insertCommand(cmd); }
      });
      boxesEl.appendChild(box);
    });
  }

  // Load commands and set up filtering
  async function init(){
    try {
      const res = await fetch('psadt/psadt-cmds.txt');
      const txt = await res.text();
      const cmds = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      render(cmds);
      if (searchEl){
        searchEl.addEventListener('input', () => {
          const term = searchEl.value.trim().toLowerCase();
          const filtered = cmds.filter(c => c.toLowerCase().includes(term));
          render(filtered);
        });
      }
    } catch (err){
      const msg = document.createElement('div');
      msg.textContent = 'Failed to load commands';
      boxesEl.appendChild(msg);
      console.error(err);
    }
  }

  init();
})();

