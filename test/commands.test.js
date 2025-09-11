const assert = require('assert');
const { PSADT_SCENARIOS } = require('../js/commands.js');

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

console.log('All tests passed.');
