const { PSADT_SCENARIOS, convertLegacyCommand } = require('../../src/js/commands.js');

describe('PSADT commands', () => {
  test('builds MSI install command', () => {
    const msi = PSADT_SCENARIOS.find(s => s.id === 'msi-install');
    const cmd = msi.build({
      filePathBase: '$adtSession.DirFiles',
      filePath: 'app.msi',
      commonArgs: ['/qn'],
      transforms: '',
      argumentList: '',
      logFileName: ''
    });
    expect(cmd).toBe('Start-ADTMsiProcess -Action Install -FilePath "$adtSession.DirFiles\\app.msi" -ArgumentList \'/qn\'');
  });

  test('converts legacy command', () => {
    const legacy = "Execute-MSI -Action Install -Path 'app.msi' -Parameters '/qn' -LogName 'app.log'";
    const converted = convertLegacyCommand(legacy);
    expect(converted).toBe("Start-ADTMsiProcess -Action Install -FilePath 'app.msi' -ArgumentList '/qn' -LogFileName 'app.log'");
  });

  test('parameter tokens inside words untouched', () => {
    const tricky = 'NoPath -Pathology -Path';
    expect(convertLegacyCommand(tricky)).toBe('NoPath -Pathology -FilePath');
  });

  test('custom mapping', () => {
    const withExtra = convertLegacyCommand('Execute-Process -Path test.exe -Foo 1', [
      ['-Foo', '-Bar']
    ]);
    expect(withExtra).toBe('Start-ADTProcess -FilePath test.exe -Bar 1');
  });
});
