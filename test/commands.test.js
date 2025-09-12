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

const proc = PSADT_SCENARIOS.find(s => s.id === 'process-system');
const procCmd = proc.build({
  filePathBase: '$adtSession.DirFiles',
  filePath: 'setup.exe',
  commonArgs: ['/S'],
  argumentList: '--flag',
  workingDir: 'files'
});
assert.strictEqual(
  procCmd,
  "Start-ADTProcess -FilePath \"$adtSession.DirFiles\\setup.exe\" -ArgumentList '/S --flag' -WorkingDirectory 'files'"
);

const copy = PSADT_SCENARIOS.find(s => s.id === 'file-copy');
const copyCmd = copy.build({
  sourceBase: '$adtSession.DirFiles',
  source: 'a.txt',
  dest: 'C\\Temp',
  overwrite: 'Yes'
});
assert.strictEqual(
  copyCmd,
  "Copy-ADTFile -Path \"$adtSession.DirFiles\\a.txt\" -Destination 'C\\Temp' -Overwrite"
);

// Custom mapping for legacy conversion
const withExtra = convertLegacyCommand('Execute-Process -Path test.exe -Foo 1', [
  ['-Foo', '-Bar']
]);
assert.strictEqual(
  withExtra,
  'Start-ADTProcess -FilePath test.exe -Bar 1'
);

console.log('All tests passed.');
