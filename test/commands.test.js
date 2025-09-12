const assert = require('assert');
const { PSADT_SCENARIOS, convertLegacyCommand } = require('../js/commands.js');

const msi = PSADT_SCENARIOS.find(s => s.id === 'msi-install');
const cmd = msi.build({
  filePathBase: '$adtSession.DirFiles',
  filePath: 'app.msi',
  commonArgs: ['/qn'],
  transforms: '',
  argumentList: '',
  logFileName: ''
});
assert.strictEqual(
  cmd,
  'Start-ADTMsiProcess -Action Install -FilePath "$adtSession.DirFiles\\app.msi" -ArgumentList \'/qn\''
);

const legacy = "Execute-MSI -Action Install -Path 'app.msi' -Parameters '/qn' -LogName 'app.log'";
const converted = convertLegacyCommand(legacy);
assert.strictEqual(
  converted,
  "Start-ADTMsiProcess -Action Install -FilePath 'app.msi' -ArgumentList '/qn' -LogFileName 'app.log'"
);

// Parameter tokens inside larger words shouldn't be touched
const tricky = 'NoPath -Pathology -Path';
assert.strictEqual(
  convertLegacyCommand(tricky),
  'NoPath -Pathology -FilePath'
);

console.log('All tests passed.');
