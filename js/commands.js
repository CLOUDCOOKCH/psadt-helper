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

// Build a Join-Path expression using a base variable (e.g., $adtSession.DirFiles)
function joinPath(baseVar, relPath) {
  const base = baseVar && typeof baseVar === 'string' ? baseVar : '$adtSession.DirFiles';
  const rel = psq(relPath || '');
  return `Join-Path ${base} '${rel}'`;
}

// Build an array of Join-Path expressions from a comma/newline list
function joinPathArray(baseVar, listText) {
  if (!listText) return '';
  const base = baseVar && typeof baseVar === 'string' ? baseVar : '$adtSession.DirFiles';
  const items = String(listText)
    .split(/[\n,]/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(p => `(Join-Path ${base} '${psq(p)}')`);
  return items.length ? `@(${items.join(', ')})` : '';
}

const PSADT_SCENARIOS = [
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
      { id: 'productCode', label: 'ProductCode (GUID)', type: 'text', required: false, placeholder: '{GUID-HERE}' },
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
      { id: 'productCode', label: 'ProductCode (GUID)', type: 'text', required: false, placeholder: '{GUID-HERE}' },
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

  // Generic process (system)
  {
    id: 'process-system',
    name: 'Process: Run (System)',
    description: 'Start-ADTProcess to run an EXE in system context.',
    fields: [
      { id: 'filePath', label: 'EXE File', type: 'text', required: true, placeholder: "setup.exe", fileBase: true },
      { id: 'argumentList', label: 'Arguments', type: 'text', required: false, placeholder: '/S or /quiet' },
      { id: 'workingDir', label: 'Working Directory', type: 'text', required: false, placeholder: 'files' }
    ],
    build: (v) => {
      const parts = ["Start-ADTProcess", `-FilePath ${joinPath(v.filePathBase, v.filePath)}`];
      if (v.argumentList) parts.push(`-ArgumentList '${psq(v.argumentList)}'`);
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
}

if (typeof module !== 'undefined') {
  module.exports = { PSADT_SCENARIOS };
}
