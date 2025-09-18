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
    expect(cmd).toBe('Start-ADTMsiProcess -Action Install -FilePath "$($adtSession.DirFiles)\\app.msi" -ArgumentList \'/qn\'');
  });

  test('converts legacy command', () => {
    const legacy = "Execute-MSI -Action Install -Path 'app.msi' -Parameters '/qn' -LogName 'app.log'";
    const converted = convertLegacyCommand(legacy);
    expect(converted).toBe("Start-ADTMsiProcess -Action Install -FilePath 'app.msi' -ArgumentList '/qn' -LogFileName 'app.log'");
  });

  test('converts renamed helper functions beyond installers', () => {
    const converted = convertLegacyCommand('Write-Log -Message "Migrating"');
    expect(converted).toBe('Write-ADTLogEntry -Message "Migrating"');
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

  test('builds EXE install command', () => {
    const exe = PSADT_SCENARIOS.find(s => s.id === 'exe-install');
    const cmd = exe.build({
      filePathBase: '$adtSession.DirFiles',
      filePath: 'setup.exe',
      silent: '/S',
      installDir: 'C:\\App',
      reboot: 'Default'
    });
    expect(cmd).toBe('Start-ADTProcess -FilePath "$($adtSession.DirFiles)\\setup.exe" -ArgumentList \'/S INSTALLDIR="C:\\App"\'');
  });

  test('builds winget install command', () => {
    const w = PSADT_SCENARIOS.find(s => s.id === 'winget-install');
    const cmd = w.build({
      package: 'Vendor.App',
      silent: '--silent',
      installDir: 'C:\\Apps',
      reboot: 'Suppress'
    });
    expect(cmd).toBe('Start-ADTProcess -FilePath winget -ArgumentList \'install Vendor.App --silent --location "C:\\Apps" --no-restart\'');
  });
});

