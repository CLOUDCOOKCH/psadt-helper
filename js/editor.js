// Custom command editor with drag-and-drop PSADT command boxes
(() => {
  const builderEl = document.getElementById('builder');
  if (!builderEl) return;

  const boxesEl = document.getElementById('command-boxes');
  const editorEl = document.getElementById('editor-area');

  // allow dropping into editor
  editorEl.addEventListener('dragover', e => e.preventDefault());
  editorEl.addEventListener('drop', e => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      // append command followed by newline
      editorEl.textContent += (editorEl.textContent ? '\n' : '') + text;
    }
  });

  // fetch list of PSADT commands and render draggable boxes
  fetch('psadt/psadt-cmds.txt')
    .then(r => r.text())
    .then(txt => {
      const cmds = txt.split(/\r?\n/).filter(Boolean);
      cmds.forEach(cmd => {
        const box = document.createElement('div');
        box.className = 'cmd-box';
        box.textContent = cmd;
        box.draggable = true;
        box.addEventListener('dragstart', e => {
          e.dataTransfer.setData('text/plain', cmd);
        });
        boxesEl.appendChild(box);
      });
    })
    .catch(err => {
      const msg = document.createElement('div');
      msg.textContent = 'Failed to load commands';
      boxesEl.appendChild(msg);
      console.error(err);
    });
})();
