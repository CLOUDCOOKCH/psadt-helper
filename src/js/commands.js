// PSADT 4.1.x scenarios catalog. Each scenario defines fields and a build(values) -> string.
/**
 * @typedef {Object} Field
 * @property {string} id
 * @property {string} label
 * @property {'text'|'textarea'|'select'|'multiselect'|'number'} type
 * @property {boolean} [required]
 * @property {string[]} [options]
 * @property {boolean} [fileBase]
 * @property {string} [placeholder]
 */
/**
 * @typedef {Object} Scenario
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {Field[]} fields
 * @property {(values:Object) => string} build
 */

function psq(s) {
  // PowerShell single-quote escaping
  return String(s ?? '').replace(/'/g, "''");
}

function toArrayLiteral(input) {
  // Convert comma- or newline-separated text into a PowerShell array literal: @('a','b')
  if (!input) return '';
  const items = String(input)
    .split(/[,\n]/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(x => `'${psq(x)}'`);
  return items.length ? `@(${items.join(',')})` : '';
}

function formatBase(baseVar) {
  const base = baseVar && typeof baseVar === 'string' && baseVar.trim()
    ? baseVar.trim()
    : '$adtSession.DirFiles';
  if (base.startsWith('$(')) return base;
  const bareVariablePattern = /^\$[A-Za-z_][\w:]*([.][A-Za-z_][\w]*)*$/;
  if (bareVariablePattern.test(base)) return `$(${base})`;
  return base;
}

// Build an absolute path using a base variable (e.g., $adtSession.DirFiles)
function joinPath(baseVar, relPath) {
  const base = formatBase(baseVar);
  const rel = String(relPath || '')
    .replace(/`/g, '``')
    .replace(/"/g, '`"');
  return `"${base}\\${rel}"`;
}

// Build an array of absolute paths from a comma/newline list
function joinPathArray(baseVar, listText) {
  if (!listText) return '';
  const base = formatBase(baseVar);
  const items = String(listText)
    .split(/[\n,]/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(p => `"${base}\\${p.replace(/`/g, '``').replace(/"/g, '`"')}"`);
  return items.length ? `@(${items.join(', ')})` : '';
}

const legacyMapping = (() => {
  if (typeof window !== 'undefined' && window.LEGACY_MAPPING) {
    return window.LEGACY_MAPPING;
  }
  if (typeof module !== 'undefined' && module.exports) {
    try {
      // eslint-disable-next-line global-require
      return require('./legacy-mapping.js');
    } catch (err) {
      // ignore and use fallback
    }
  }
  return null;
})();

const FALLBACK_FUNCTION_MAP = [
  ['Execute-MSI', 'Start-ADTMsiProcess'],
  ['Execute-MSP', 'Start-ADTMspProcess'],
  ['Execute-Process', 'Start-ADTProcess'],
  ['Show-InstallationWelcome', 'Show-ADTInstallationWelcome'],
  ['Show-InstallationPrompt', 'Show-ADTInstallationPrompt'],
  ['Show-InstallationProgress', 'Show-ADTInstallationProgress'],
  ['Show-InstallationRestartPrompt', 'Show-ADTInstallationRestartPrompt']
];

const FALLBACK_PARAMETER_MAP = [
  ['-Path', '-FilePath'],
  ['-Parameters', '-ArgumentList'],
  ['-Transform', '-Transforms'],
  ['-LogName', '-LogFileName'],
  ['-CloseApps', '-CloseProcesses'],
  ['-ProgressPercentage', '-StatusBarPercentage']
];

const FUNCTION_MAP = legacyMapping && Array.isArray(legacyMapping.functionMap) && legacyMapping.functionMap.length
  ? legacyMapping.functionMap.filter(pair => Array.isArray(pair) && pair.length === 2)
  : FALLBACK_FUNCTION_MAP;

const PARAMETER_MAP = legacyMapping && Array.isArray(legacyMapping.parameterMap) && legacyMapping.parameterMap.length
  ? legacyMapping.parameterMap.filter(pair => Array.isArray(pair) && pair.length === 2)
  : FALLBACK_PARAMETER_MAP;

// Convert a PSADT 3.8/3.10 command to PSADT 4.1 syntax.
// Performs simple token replacements for function and parameter names.
function convertLegacyCommand(cmd, extraParamMap = []) {
  if (!cmd) return '';
  let out = String(cmd);
  FUNCTION_MAP.forEach(([oldName, newName]) => {
    out = out.replace(new RegExp(`\\b${oldName}\\b`, 'gi'), newName);
  });
  const combinedMap = Array.isArray(extraParamMap)
    ? PARAMETER_MAP.concat(extraParamMap.filter(p => Array.isArray(p) && p.length === 2))
    : PARAMETER_MAP;
  // Avoid lookbehind for Safari compatibility: capture possible prefix and reinsert
  combinedMap.forEach(([oldName, newName]) => {
    const re = new RegExp(`(^|[^\\w-])${oldName}(?=\\s|$)`, 'gi');
    out = out.replace(re, (m, p1) => `${p1}${newName}`);
  });
  return out;
}

const PSADT_SCENARIOS = [
  {
    id: 'convert-legacy',
    name: 'Convert 3.x Command',
    description: 'Convert a PSADT 3.8/3.10 command to PSADT 4.1 syntax.',
    fields: [
      { id: 'legacy', label: 'Legacy Command', type: 'textarea', required: true },
      { id: 'extraParams', label: 'Extra Parameter Mappings (old=new per line)', type: 'textarea', required: false }
    ],
    build: (v) => {
      const extra = String(v.extraParams || '')
        .split(/\n/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(line => {
          const [oldName, newName] = line.split('=').map(x => x.trim());
          return oldName && newName ? [oldName, newName] : null;
        })
        .filter(Boolean);
      return convertLegacyCommand(v.legacy, extra);
    }
  },
  // MSI operations via Start-ADTMsiProcess
  {
    id: 'msi-install',
    name: 'MSI: Install',
    description: 'Start-ADTMsiProcess -Action Install with transforms and properties.',
    fields: [
      { id: 'filePath', label: 'MSI File', type: 'text', required: true, placeholder: "app.msi", fileBase: true },
      { id: 'commonArgs', label: 'Common Parameters', type: 'multiselect', required: false, options: [
        '/qn', 'REBOOT=ReallySuppress', 'ALLUSERS=1', 'MSIINSTALLPERUSER=1', 'ADDLOCAL=ALL', 'ARPSYSTEMCOMPONENT=1'
      ]},
      { id: 'transforms', label: 'Transforms (comma-separated)', type: 'text', required: false, placeholder: "app.mst, custom.mst", fileBase: true },
      { id: 'argumentList', label: 'Additional Parameters', type: 'text', required: false, placeholder: "ADDLOCAL=ALL" },
      { id: 'logFileName', label: 'Log File Name', type: 'text', required: false, placeholder: 'app_install.log' }
    ],
    build: (v) => {
      const parts = ["Start-ADTMsiProcess", `-Action Install`, `-FilePath ${joinPath(v.filePathBase, v.filePath)}`];
      const t = joinPathArray(v.transformsBase, v.transforms);
      if (t) parts.push(`-Transforms ${t}`);
      const args = [];
      if (Array.isArray(v.commonArgs) && v.commonArgs.length) args.push(...v.commonArgs);
      if (v.argumentList) args.push(v.argumentList);
      if (args.length) parts.push(`-ArgumentList '${psq(args.join(' '))}'`);
      if (v.logFileName) parts.push(`-LogFileName '${psq(v.logFileName)}'`);
      return parts.join(' ');
    }
  },
  {
    id: 'msi-uninstall',
    name: 'MSI: Uninstall',
    description: 'Start-ADTMsiProcess -Action Uninstall by ProductCode or MSI path.',
    fields: [
      { id: 'productCode', label: 'ProductCode (GUID)', type: 'text', required: false, placeholder: '{GUID-HERE}', pattern: '^\\{?[0-9A-Fa-f]{8}(-[0-9A-Fa-f]{4}){3}-[0-9A-Fa-f]{12}\\}?$', patternMessage: 'Enter a valid GUID' },
      { id: 'filePath', label: 'MSI File (alternative)', type: 'text', required: false, placeholder: "app.msi", fileBase: true },
      { id: 'commonArgs', label: 'Common Parameters', type: 'multiselect', required: false, options: [
        '/qn', 'REBOOT=ReallySuppress'
      ]},
      { id: 'argumentList', label: 'Additional Parameters', type: 'text', required: false, placeholder: '' }
    ],
    build: (v) => {
      const parts = ["Start-ADTMsiProcess", `-Action Uninstall`];
      if (v.productCode) parts.push(`-ProductCode '${psq(v.productCode)}'`);
      else if (v.filePath) parts.push(`-FilePath ${joinPath(v.filePathBase, v.filePath)}`);
      const args = [];
      if (Array.isArray(v.commonArgs) && v.commonArgs.length) args.push(...v.commonArgs);
      if (v.argumentList) args.push(v.argumentList);
      if (args.length) parts.push(`-ArgumentList '${psq(args.join(' '))}'`);
      return parts.join(' ');
    }
  },
  {
    id: 'msi-repair',
    name: 'MSI: Repair',
    description: 'Start-ADTMsiProcess -Action Repair with optional RepairMode.',
    fields: [
      { id: 'productCode', label: 'ProductCode (GUID)', type: 'text', required: false, placeholder: '{GUID-HERE}', pattern: '^\\{?[0-9A-Fa-f]{8}(-[0-9A-Fa-f]{4}){3}-[0-9A-Fa-f]{12}\\}?$', patternMessage: 'Enter a valid GUID' },
      { id: 'filePath', label: 'MSI File (alternative)', type: 'text', required: false, placeholder: "app.msi", fileBase: true },
      { id: 'repairMode', label: 'RepairMode', type: 'text', required: false, placeholder: 'vomus' },
      { id: 'commonArgs', label: 'Common Parameters', type: 'multiselect', required: false, options: [
        '/qn', 'REBOOT=ReallySuppress', 'REINSTALL=ALL', 'REINSTALLMODE=vomus'
      ]},
      { id: 'repairFromSource', label: 'Repair from source', type: 'select', options: ['No','Yes'] }
    ],
    build: (v) => {
      const parts = ["Start-ADTMsiProcess", `-Action Repair`];
      if (v.productCode) parts.push(`-ProductCode '${psq(v.productCode)}'`);
      else if (v.filePath) parts.push(`-FilePath ${joinPath(v.filePathBase, v.filePath)}`);
      if (v.repairMode) parts.push(`-RepairMode '${psq(v.repairMode)}'`);
      const args = [];
      if (Array.isArray(v.commonArgs) && v.commonArgs.length) args.push(...v.commonArgs);
      if (args.length) parts.push(`-ArgumentList '${psq(args.join(' '))}'`);
      if (v.repairFromSource === 'Yes') parts.push(`-RepairFromSource`);
      return parts.join(' ');
    }
  },

  // MSP patch
  {
    id: 'msp-apply',
    name: 'MSP: Apply Patch',
    description: 'Start-ADTMspProcess to apply .MSP patch.',
    fields: [
      { id: 'filePath', label: 'MSP File', type: 'text', required: true, placeholder: "update.msp", fileBase: true },
      { id: 'additionalArgs', label: 'AdditionalArgumentList', type: 'text', required: false, placeholder: '/qb!' }
    ],
    build: (v) => {
      const parts = ["Start-ADTMspProcess", `-FilePath ${joinPath(v.filePathBase, v.filePath)}`];
      if (v.additionalArgs) parts.push(`-AdditionalArgumentList '${psq(v.additionalArgs)}'`);
      return parts.join(' ');
    }
  },

  // MSI as user (advanced)
  {
    id: 'msi-install-user',
    name: 'MSI: Install (User Context)',
    description: 'Start-ADTMsiProcessAsUser -Action Install for per-user installs.',
    fields: [
      { id: 'filePath', label: 'MSI File', type: 'text', required: true, placeholder: "app.msi", fileBase: true },
      { id: 'commonArgs', label: 'Common Parameters', type: 'multiselect', required: false, options: [
        '/qn', 'REBOOT=ReallySuppress', 'MSIINSTALLPERUSER=1', 'ADDLOCAL=ALL'
      ]},
      { id: 'argumentList', label: 'Additional Parameters', type: 'text', required: false, placeholder: "" }
    ],
    build: (v) => {
      const parts = ["Start-ADTMsiProcessAsUser", `-Action Install`, `-FilePath ${joinPath(v.filePathBase, v.filePath)}`];
      const args = [];
      if (Array.isArray(v.commonArgs) && v.commonArgs.length) args.push(...v.commonArgs);
      if (v.argumentList) args.push(v.argumentList);
      if (args.length) parts.push(`-ArgumentList '${psq(args.join(' '))}'`);
      return parts.join(' ');
    }
  },

  // Common installer templates
  {
    id: 'exe-install',
    name: 'EXE: Install',
    description: 'Run a setup EXE with common silent options.',
    fields: [
      { id: 'filePath', label: 'Setup EXE', type: 'text', required: true, placeholder: 'setup.exe', fileBase: true },
      { id: 'silent', label: 'Silent Switch', type: 'text', required: false, placeholder: '/S' },
      { id: 'installDir', label: 'InstallDir', type: 'text', required: false, placeholder: 'C\\Program Files\\App' },
      { id: 'reboot', label: 'Reboot Behavior', type: 'select', options: ['Default','Force','Suppress'] }
    ],
    build: (v) => {
      const parts = ["Start-ADTProcess", `-FilePath ${joinPath(v.filePathBase, v.filePath)}`];
      const args = [];
      if (v.silent) args.push(v.silent);
      if (v.installDir) args.push(`INSTALLDIR="${psq(v.installDir)}"`);
      if (args.length) parts.push(`-ArgumentList '${psq(args.join(' '))}'`);
      if (v.reboot === 'Force') parts.push('-WaitForExit');
      if (v.reboot === 'Suppress') parts.push('-NoWait');
      return parts.join(' ');
    }
  },
  {
    id: 'msix-install',
    name: 'MSIX: Install',
    description: 'Install an MSIX package using Add-AppxPackage.',
    fields: [
      { id: 'filePath', label: 'MSIX File', type: 'text', required: true, placeholder: 'app.msix', fileBase: true },
      { id: 'installDir', label: 'InstallDir', type: 'text', required: false, placeholder: 'C\\Program Files\\App' },
      { id: 'reboot', label: 'Reboot Behavior', type: 'select', options: ['Default','Force','Suppress'] }
    ],
    build: (v) => {
      const parts = ["Add-AppxPackage", joinPath(v.filePathBase, v.filePath)];
      if (v.installDir) parts.push(`-InstallLocation '${psq(v.installDir)}'`);
      if (v.reboot === 'Suppress') parts.push('-NoRestart');
      return parts.join(' ');
    }
  },
  {
    id: 'winget-install',
    name: 'winget: Install',
    description: 'Use winget to install a package silently.',
    fields: [
      { id: 'package', label: 'Package Id', type: 'text', required: true, placeholder: 'Vendor.App' },
      { id: 'silent', label: 'Silent Switch', type: 'text', required: false, placeholder: '--silent' },
      { id: 'installDir', label: 'InstallDir', type: 'text', required: false, placeholder: 'C\\Program Files\\App' },
      { id: 'reboot', label: 'Reboot Behavior', type: 'select', options: ['Default','Force','Suppress'] }
    ],
    build: (v) => {
      const parts = ["Start-ADTProcess", `-FilePath winget`];
      const args = ['install', v.package];
      if (v.silent) args.push(v.silent);
      if (v.installDir) args.push(`--location "${psq(v.installDir)}"`);
      if (v.reboot === 'Suppress') args.push('--no-restart');
      if (v.reboot === 'Force') args.push('--force');
      parts.push(`-ArgumentList '${psq(args.join(' '))}'`);
      return parts.join(' ');
    }
  },

  // Generic process (system)
  {
    id: 'process-system',
    name: 'Process: Run (System)',
    description: 'Start-ADTProcess to run an EXE in system context.',
    fields: [
      { id: 'filePath', label: 'EXE File', type: 'text', required: true, placeholder: "setup.exe", fileBase: true },
      { id: 'commonArgs', label: 'Common Silent Switches', type: 'multiselect', required: false, options: ['/S','/s','/silent','/verysilent','/quiet'] },
      { id: 'argumentList', label: 'Additional Arguments', type: 'text', required: false, placeholder: '/log=app.log' },
      { id: 'workingDir', label: 'Working Directory', type: 'text', required: false, placeholder: 'files' }
    ],
    build: (v) => {
      const parts = ["Start-ADTProcess", `-FilePath ${joinPath(v.filePathBase, v.filePath)}`];
      const args = [];
      if (Array.isArray(v.commonArgs) && v.commonArgs.length) args.push(...v.commonArgs);
      if (v.argumentList) args.push(v.argumentList);
      if (args.length) parts.push(`-ArgumentList '${psq(args.join(' '))}'`);
      if (v.workingDir) parts.push(`-WorkingDirectory '${psq(v.workingDir)}'`);
      return parts.join(' ');
    }
  },
  {
    id: 'process-user',
    name: 'Process: Run (User)',
    description: 'Start-ADTProcessAsUser to run a process in user context.',
    fields: [
      { id: 'filePath', label: 'EXE File', type: 'text', required: true, placeholder: "tool.exe", fileBase: true },
      { id: 'argumentList', label: 'Arguments', type: 'text', required: false, placeholder: '--help' },
      { id: 'workingDir', label: 'Working Directory', type: 'text', required: false, placeholder: 'files' }
    ],
    build: (v) => {
      const parts = ["Start-ADTProcessAsUser", `-FilePath ${joinPath(v.filePathBase, v.filePath)}`];
      if (v.argumentList) parts.push(`-ArgumentList '${psq(v.argumentList)}'`);
      if (v.workingDir) parts.push(`-WorkingDirectory '${psq(v.workingDir)}'`);
      return parts.join(' ');
    }
  },

  // File and registry helpers
  {
    id: 'file-copy',
    name: 'File: Copy',
    description: 'Copy-ADTFile to copy a file from toolkit to a destination.',
    fields: [
      { id: 'source', label: 'Source File', type: 'text', required: true, placeholder: 'file.txt', fileBase: true },
      { id: 'dest', label: 'Destination Path', type: 'text', required: true, placeholder: 'C:\\\\Path' },
      { id: 'overwrite', label: 'Overwrite', type: 'select', options: ['No','Yes'] }
    ],
    build: (v) => {
      const parts = ["Copy-ADTFile", `-Path ${joinPath(v.sourceBase, v.source)}`, `-Destination '${psq(v.dest)}'`];
      if (v.overwrite === 'Yes') parts.push('-Overwrite');
      return parts.join(' ');
    }
  },
  {
    id: 'registry-set',
    name: 'Registry: Set Value',
    description: 'Set-ADTRegistryKey to create or update a registry value.',
    fields: [
      { id: 'key', label: 'Key Path', type: 'text', required: true, placeholder: 'HKLM:SOFTWARE\\Vendor' },
      { id: 'name', label: 'Value Name', type: 'text', required: true, placeholder: 'Value' },
      { id: 'value', label: 'Value', type: 'text', required: true, placeholder: 'Data' },
      { id: 'type', label: 'Type', type: 'select', options: ['String','Dword','Qword'] }
    ],
    build: (v) => {
      const parts = ["Set-ADTRegistryKey", `-Key '${psq(v.key)}'`, `-Name '${psq(v.name)}'`, `-Value '${psq(v.value)}'`];
      if (v.type) parts.push(`-Type ${v.type}`);
      return parts.join(' ');
    }
  },
  {
    id: 'zip-copy-extract',
    name: 'Archive: Copy & Extract ZIP',
    description: 'Copy a ZIP from toolkit files to a temp folder and extract it.',
    fields: [
      { id: 'zipPath', label: 'ZIP File', type: 'text', required: true, placeholder: 'package.zip', fileBase: true },
      { id: 'stagingDir', label: 'Temp Folder (defaults to $env:TEMP)', type: 'text', required: false, placeholder: '$env:TEMP' },
      { id: 'extractDestination', label: 'Extract Destination', type: 'text', required: true, placeholder: 'C\\Temp\\App' },
      { id: 'overwrite', label: 'Overwrite existing content', type: 'select', options: ['No','Yes'] },
      { id: 'cleanup', label: 'Remove ZIP after extraction', type: 'select', options: ['No','Yes'] },
      { id: 'variableName', label: 'Variable name for staged ZIP', type: 'text', required: false, placeholder: '$zipArchivePath' }
    ],
    build: (v) => {
      const zipName = String(v.zipPath || '').split(/[\\/]/).filter(Boolean).pop();
      if (!zipName) return '';
      const variableName = (() => {
        const candidate = typeof v.variableName === 'string' ? v.variableName.trim() : '';
        if (/^\$[A-Za-z_][\w]*$/.test(candidate)) return candidate;
        return '$zipArchivePath';
      })();
      const stagingDirRaw = typeof v.stagingDir === 'string' && v.stagingDir.trim()
        ? v.stagingDir.trim()
        : '$env:TEMP';
      const joinBase = /^\$/.test(stagingDirRaw) || stagingDirRaw.startsWith('$(')
        ? stagingDirRaw
        : `'${psq(stagingDirRaw)}'`;
      const lines = [];
      lines.push(`${variableName} = Join-Path ${joinBase} '${psq(zipName)}'`);
      const copyParts = [
        'Copy-ADTFile',
        `-Path ${joinPath(v.zipPathBase, v.zipPath)}`,
        `-Destination ${variableName}`
      ];
      if (v.overwrite === 'Yes') copyParts.push('-Overwrite');
      lines.push(copyParts.join(' '));
      const expandParts = [
        'Expand-Archive',
        `-Path ${variableName}`,
        `-DestinationPath '${psq(v.extractDestination)}'`
      ];
      if (v.overwrite === 'Yes') expandParts.push('-Force');
      lines.push(expandParts.join(' '));
      if (v.cleanup === 'Yes') {
        lines.push(`Remove-Item ${variableName} -ErrorAction SilentlyContinue`);
      }
      return lines.join('\n');
    }
  },
  {
    id: 'file-copy-user-profiles',
    name: 'File: Copy to User Profiles',
    description: 'Copy-ADTFileToUserProfiles to seed files into each user profile.',
    fields: [
      { id: 'paths', label: 'Source File(s) (comma/newline separated)', type: 'text', required: true, placeholder: 'config.json, defaults\\settings.xml', fileBase: true },
      { id: 'destination', label: 'Destination (relative to selected base)', type: 'text', required: false, placeholder: 'AppData\\Roaming\\Vendor' },
      { id: 'basePath', label: 'User profile base folder', type: 'select', options: ['Profile','AppData','LocalAppData','Desktop','Documents','StartMenu','Temp','OneDrive','OneDriveCommercial'] },
      { id: 'recurse', label: 'Recurse subfolders', type: 'select', options: ['No','Yes'] },
      { id: 'flatten', label: 'Flatten files', type: 'select', options: ['No','Yes'] },
      { id: 'continueOnError', label: 'Continue on copy errors', type: 'select', options: ['No','Yes'] },
      { id: 'fileCopyMode', label: 'File copy mode', type: 'select', options: ['', 'Native', 'Robocopy'] },
      { id: 'robocopyParams', label: 'Robocopy Params (override)', type: 'text', required: false },
      { id: 'robocopyAdditionalParams', label: 'Robocopy Additional Params (append)', type: 'text', required: false },
      { id: 'excludeAccounts', label: 'Exclude accounts (comma/newline)', type: 'text', required: false, placeholder: 'DOMAIN\\User1, DOMAIN\\User2' },
      { id: 'includeSystem', label: 'Include system profiles', type: 'select', options: ['No','Yes'] },
      { id: 'includeService', label: 'Include service profiles', type: 'select', options: ['No','Yes'] },
      { id: 'excludeDefault', label: 'Exclude Default User', type: 'select', options: ['No','Yes'] }
    ],
    build: (v) => {
      const pathArray = joinPathArray(v.pathsBase, v.paths);
      if (!pathArray) return '';
      const parts = ['Copy-ADTFileToUserProfiles', `-Path ${pathArray}`];
      if (v.destination) parts.push(`-Destination '${psq(v.destination)}'`);
      if (v.basePath) parts.push(`-BasePath ${v.basePath}`);
      if (v.recurse === 'Yes') parts.push('-Recurse');
      if (v.flatten === 'Yes') parts.push('-Flatten');
      if (v.continueOnError === 'Yes') parts.push('-ContinueFileCopyOnError');
      if (v.fileCopyMode) parts.push(`-FileCopyMode ${v.fileCopyMode}`);
      if (v.robocopyParams) parts.push(`-RobocopyParams '${psq(v.robocopyParams)}'`);
      if (v.robocopyAdditionalParams) parts.push(`-RobocopyAdditionalParams '${psq(v.robocopyAdditionalParams)}'`);
      const exclude = toArrayLiteral(v.excludeAccounts);
      if (exclude) parts.push(`-ExcludeNTAccount ${exclude}`);
      if (v.includeSystem === 'Yes') parts.push('-IncludeSystemProfiles');
      if (v.includeService === 'Yes') parts.push('-IncludeServiceProfiles');
      if (v.excludeDefault === 'Yes') parts.push('-ExcludeDefaultUser');
      return parts.join(' ');
    }
  },
  {
    id: 'env-set',
    name: 'Environment Variable: Set',
    description: 'Set-ADTEnvironmentVariable to create or update an environment variable.',
    fields: [
      { id: 'variable', label: 'Variable Name', type: 'text', required: true, placeholder: 'PATH' },
      { id: 'value', label: 'Value', type: 'text', required: true, placeholder: 'C\\Tools' },
      { id: 'target', label: 'Target Scope', type: 'select', options: ['', 'Process', 'User', 'Machine'] }
    ],
    build: (v) => {
      const parts = [
        'Set-ADTEnvironmentVariable',
        `-Variable '${psq(v.variable)}'`,
        `-Value '${psq(v.value)}'`
      ];
      if (v.target) parts.push(`-Target ${v.target}`);
      return parts.join(' ');
    }
  },
  {
    id: 'shortcut-create',
    name: 'Shortcut: Create',
    description: 'New-ADTShortcut to create Start Menu, Desktop, or URL shortcuts.',
    fields: [
      { id: 'literalPath', label: 'Shortcut Path (.lnk or .url)', type: 'text', required: true, placeholder: '$envCommonDesktop\\My App.lnk' },
      { id: 'targetPath', label: 'Target Path or URL', type: 'text', required: true, placeholder: 'C\\Program Files\\MyApp\\App.exe' },
      { id: 'arguments', label: 'Arguments', type: 'text', required: false, placeholder: '--silent' },
      { id: 'iconLocation', label: 'Icon Location', type: 'text', required: false, placeholder: 'C\\Program Files\\MyApp\\App.exe' },
      { id: 'iconIndex', label: 'Icon Index', type: 'number', required: false, placeholder: '0' },
      { id: 'description', label: 'Description', type: 'text', required: false, placeholder: 'Launch My App' },
      { id: 'workingDirectory', label: 'Working Directory', type: 'text', required: false, placeholder: 'C\\Program Files\\MyApp' },
      { id: 'windowStyle', label: 'Window Style', type: 'select', options: ['Normal','Maximized','Minimized'] },
      { id: 'runAsAdmin', label: 'Run as administrator', type: 'select', options: ['No','Yes'] },
      { id: 'hotkey', label: 'Hotkey (e.g. CTRL+SHIFT+F)', type: 'text', required: false }
    ],
    build: (v) => {
      const parts = [
        'New-ADTShortcut',
        `-LiteralPath '${psq(v.literalPath)}'`,
        `-TargetPath '${psq(v.targetPath)}'`
      ];
      if (v.arguments) parts.push(`-Arguments '${psq(v.arguments)}'`);
      if (v.iconLocation) parts.push(`-IconLocation '${psq(v.iconLocation)}'`);
      if (v.iconIndex !== '' && v.iconIndex !== undefined && v.iconIndex !== null) parts.push(`-IconIndex ${Number(v.iconIndex)}`);
      if (v.description) parts.push(`-Description '${psq(v.description)}'`);
      if (v.workingDirectory) parts.push(`-WorkingDirectory '${psq(v.workingDirectory)}'`);
      if (v.windowStyle) parts.push(`-WindowStyle ${v.windowStyle}`);
      if (v.runAsAdmin === 'Yes') parts.push('-RunAsAdmin');
      if (v.hotkey) parts.push(`-Hotkey '${psq(v.hotkey)}'`);
      return parts.join(' ');
    }
  },

  // Dialogs / UI
  {
    id: 'ui-prompt',
    name: 'UI: Installation Prompt',
    description: 'Show-ADTInstallationPrompt with buttons and optional timeout.',
    fields: [
      { id: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'Please save your work before continuing.' },
      { id: 'title', label: 'Title', type: 'text', required: false, placeholder: 'Information' },
      { id: 'subtitle', label: 'Subtitle', type: 'text', required: false },
      { id: 'icon', label: 'Icon', type: 'select', required: false, options: ['Information','Warning','Stop','Question'] },
      { id: 'buttonLeft', label: 'Button Left', type: 'text', required: false, placeholder: 'Cancel' },
      { id: 'buttonRight', label: 'Button Right', type: 'text', required: false, placeholder: 'OK' },
      { id: 'buttonMiddle', label: 'Button Middle', type: 'text', required: false },
      { id: 'timeout', label: 'Timeout (seconds)', type: 'number', required: false, placeholder: '30' }
    ],
    build: (v) => {
      const parts = ["Show-ADTInstallationPrompt", `-Message '${psq(v.message)}'`];
      if (v.title) parts.push(`-Title '${psq(v.title)}'`);
      if (v.subtitle) parts.push(`-Subtitle '${psq(v.subtitle)}'`);
      if (v.icon) parts.push(`-Icon ${v.icon}`);
      if (v.buttonLeft) parts.push(`-ButtonLeftText '${psq(v.buttonLeft)}'`);
      if (v.buttonRight) parts.push(`-ButtonRightText '${psq(v.buttonRight)}'`);
      if (v.buttonMiddle) parts.push(`-ButtonMiddleText '${psq(v.buttonMiddle)}'`);
      if (v.timeout) parts.push(`-Timeout ${Number(v.timeout)}`);
      return parts.join(' ');
    }
  },
  {
    id: 'ui-welcome',
    name: 'UI: Installation Welcome',
    description: 'Show-ADTInstallationWelcome with close-processes and deferral options.',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: false, placeholder: 'Welcome' },
      { id: 'subtitle', label: 'Subtitle', type: 'text', required: false },
      { id: 'closeProcesses', label: 'Processes to close (comma-separated exe names)', type: 'text', required: false, placeholder: 'winword, excel, chrome' },
      { id: 'allowDefer', label: 'Allow Defer', type: 'select', options: ['No','Yes'] },
      { id: 'deferTimes', label: 'Defer Times', type: 'number', required: false, placeholder: '3' },
      { id: 'promptToSave', label: 'Prompt to Save', type: 'select', options: ['No','Yes'] }
    ],
    build: (v) => {
      const parts = ["Show-ADTInstallationWelcome"];
      if (v.title) parts.push(`-Title '${psq(v.title)}'`);
      if (v.subtitle) parts.push(`-Subtitle '${psq(v.subtitle)}'`);
      if (v.closeProcesses) {
        const arr = toArrayLiteral(v.closeProcesses.replace(/\.exe\b/gi,'').split(',').join(','));
        if (arr) parts.push(`-CloseProcesses ${arr}`);
      }
      if (v.allowDefer === 'Yes') parts.push(`-AllowDefer`);
      if (v.deferTimes) parts.push(`-DeferTimes ${Number(v.deferTimes)}`);
      if (v.promptToSave === 'Yes') parts.push(`-PromptToSave`);
      return parts.join(' ');
    }
  },
  {
    id: 'ui-progress',
    name: 'UI: Installation Progress',
    description: 'Show-ADTInstallationProgress with status messages.',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: false },
      { id: 'subtitle', label: 'Subtitle', type: 'text', required: false },
      { id: 'status', label: 'Status Message', type: 'text', required: false, placeholder: 'Installing application...' },
      { id: 'detail', label: 'Status Detail', type: 'text', required: false },
      { id: 'percent', label: 'Progress %', type: 'number', required: false, placeholder: '50' }
    ],
    build: (v) => {
      const parts = ["Show-ADTInstallationProgress"];
      if (v.title) parts.push(`-Title '${psq(v.title)}'`);
      if (v.subtitle) parts.push(`-Subtitle '${psq(v.subtitle)}'`);
      if (v.status) parts.push(`-StatusMessage '${psq(v.status)}'`);
      if (v.detail) parts.push(`-StatusMessageDetail '${psq(v.detail)}'`);
      if (v.percent) parts.push(`-StatusBarPercentage ${Number(v.percent)}`);
      return parts.join(' ');
    }
  },
  {
    id: 'ui-restart',
    name: 'UI: Restart Prompt',
    description: 'Show-ADTInstallationRestartPrompt with optional countdown.',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: false, placeholder: 'Restart Required' },
      { id: 'subtitle', label: 'Subtitle', type: 'text', required: false },
      { id: 'silentRestart', label: 'Silent Restart', type: 'select', options: ['No','Yes'] },
      { id: 'countdown', label: 'Countdown (seconds)', type: 'number', required: false, placeholder: '300' },
      { id: 'noCountdown', label: 'No countdown', type: 'select', options: ['No','Yes'] }
    ],
    build: (v) => {
      const parts = ["Show-ADTInstallationRestartPrompt"];
      if (v.title) parts.push(`-Title '${psq(v.title)}'`);
      if (v.subtitle) parts.push(`-Subtitle '${psq(v.subtitle)}'`);
      if (v.silentRestart === 'Yes') parts.push('-SilentRestart');
      if (v.noCountdown === 'Yes') parts.push('-NoCountdown');
      else if (v.countdown) parts.push(`-CountdownSeconds ${Number(v.countdown)}`);
      return parts.join(' ');
    }
  },

  {
    id: 'service-stop',
    name: 'Service: Stop',
    description: 'Stop-ServiceAndDependents for a Windows service.',
    fields: [
      { id: 'serviceName', label: 'Service Name', type: 'text', required: true, placeholder: 'Spooler' },
      { id: 'timeout', label: 'Timeout (seconds)', type: 'number', required: false, placeholder: '30' }
    ],
    build: (v) => {
      const parts = ["Stop-ServiceAndDependents", `-ServiceName '${psq(v.serviceName)}'`];
      if (v.timeout) parts.push(`-Timeout ${v.timeout}`);
      return parts.join(' ');
    }
  },

  // App blocking
  {
    id: 'block-apps',
    name: 'Block App Execution',
    description: 'Block-ADTAppExecution for one or more process names.',
    fields: [
      { id: 'processes', label: 'Process names (comma-separated)', type: 'text', required: true, placeholder: 'winword, excel, notepad' }
    ],
    build: (v) => {
      const arr = toArrayLiteral(v.processes);
      if (!arr) return '';
      return `Block-ADTAppExecution -ProcessName ${arr}`;
    }
  },

  // Uninstall by Name or ProductCode(s)
  {
    id: 'uninstall-app',
    name: 'Uninstall Application',
    description: 'Uninstall-ADTApplication by Name or ProductCode.',
    fields: [
      { id: 'name', label: 'Application Name(s) (comma-separated)', type: 'text', required: false, placeholder: 'App Name' },
      { id: 'productCodes', label: 'ProductCode GUID(s) (comma-separated)', type: 'text', required: false, placeholder: '{GUID},{GUID}' },
      { id: 'appType', label: 'ApplicationType', type: 'select', required: false, options: ['','MSI','EXE'] }
    ],
    build: (v) => {
      const parts = ["Uninstall-ADTApplication"];
      const names = toArrayLiteral(v.name);
      const codes = toArrayLiteral(v.productCodes);
      if (names) parts.push(`-Name ${names}`);
      if (codes) parts.push(`-ProductCode ${codes}`);
      if (v.appType) parts.push(`-ApplicationType '${psq(v.appType)}'`);
      return parts.join(' ');
    }
  }
];

if (typeof window !== 'undefined') {
  window.PSADT_SCENARIOS = PSADT_SCENARIOS;
  window.convertLegacyCommand = convertLegacyCommand;
}

if (typeof module !== 'undefined') {
  module.exports = { PSADT_SCENARIOS, convertLegacyCommand };
}
