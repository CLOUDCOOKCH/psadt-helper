const PSADT_VARIABLES = [
  {
    id: 'toolkit-name',
    title: 'Toolkit Name',
    variables: [
      {
        variable: '$appDeployMainScriptFriendlyName',
        description: 'Full name of toolkit including spaces',
      },
      {
        variable: '$appDeployToolkitName',
        description: 'Short-name of toolkit without spaces',
      },
    ],
  },
  {
    id: 'script-info',
    title: 'Script Info',
    variables: [
      {
        variable: '$appDeployMainScriptVersion',
        description: 'Version number of the PSAppDeployToolkit',
      },
    ],
  },
  {
    id: 'culture',
    title: 'Culture',
    variables: [
      {
        variable: '$culture',
        description:
          'Object which contains all of the current Windows culture settings',
      },
      {
        variable: '$currentLanguage',
        description:
          'Current Windows two letter ISO language name (e.g. EN, FR, DE, JA etc)',
      },
      {
        variable: '$currentUILanguage',
        description:
          'Current Windows two letter UI ISO language name (e.g. EN, FR, DE, JA etc)',
      },
    ],
  },
  {
    id: 'environment-variables',
    title: 'Environment Variables',
    variables: [
      {
        variable: '$envAllUsersProfile',
        description: '%ALLUSERSPROFILE%, e.g. C:\\ProgramData',
      },
      {
        variable: '$envAppData',
        description: '%APPDATA%, e.g. C:\\Users\\%USERNAME%\\AppData\\Roaming',
      },
      {
        variable: '$envArchitecture',
        description:
          '%PROCESSOR_ARCHITECTURE%, e.g. AMD64/IA64/x86.Note - This doesn\'t tell you the architecture of the processor but only of the current process, so it returns "x86" for a 32-bit WOW process running on 64-bit Windows.',
      },
      {
        variable: '$envCommonDesktop',
        description: 'e.g. C:\\Users\\Public\\Desktop',
      },
      {
        variable: '$envCommonDocuments',
        description: 'e.g. C:\\Users\\Public\\Documents',
      },
      {
        variable: '$envCommonProgramFiles',
        description:
          '%COMMONPROGRAMFILES%, e.g. C:\\Program Files\\Common Files)',
      },
      {
        variable: '$envCommonProgramFilesX86',
        description:
          '%COMMONPROGRAMFILES(x86)%, e.g. C:\\Program Files (x86)\\Common Files',
      },
      {
        variable: '$envCommonStartMenu',
        description: 'e.g. C:\\ProgramData\\Microsoft\\Windows\\Start Menu',
      },
      {
        variable: '$envCommonStartMenuPrograms',
        description:
          'e.g. C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs',
      },
      {
        variable: '$envCommonStartUp',
        description:
          'e.g. C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup',
      },
      {
        variable: '$envCommonTemplates',
        description: 'e.g. C:\\ProgramData\\Microsoft\\Windows\\Templates',
      },
      {
        variable: '$envComputerName',
        description: '$COMPUTERNAME%, e.g. Computer1',
      },
      {
        variable: '$envComputerNameFQDN',
        description:
          'Fully qualified computer name, e.g. computer1.contoso.com',
      },
      {
        variable: '$envHomeDrive',
        description: '%HOMEDRIVE%, e.g. C:',
      },
      {
        variable: '$envHomePath',
        description: '%HOMEPATH%, e.g. C:\\Users\\%USERNAME%',
      },
      {
        variable: '$envHomeShare',
        description:
          '%HOMESHARE% (Used instead of HOMEDRIVE if the home folder uses UNC paths.)',
      },
      {
        variable: '$envLocalAppData',
        description:
          '%LOCALAPPDATA%, e.g. C:\\Users\\%USERNAME%\\AppData\\Local',
      },
      {
        variable: '$envLogicalDrives',
        description:
          'An array containing all of the logical drives on the system.',
      },
      {
        variable: '$envProgramData',
        description: '%PROGRAMDATA%, e.g. C:\\ProgramData',
      },
      {
        variable: '$envProgramFiles',
        description: '%PROGRAMFILES%, e.g. C:\\Program Files',
      },
      {
        variable: '$envProgramFilesX86',
        description:
          '%ProgramFiles(x86)%, e.g. C:\\Program Files (x86) (Only on 64 bit. Used to store 32 bit apps.)',
      },
      {
        variable: '$envPublic',
        description: '%PUBLIC%, e.g. C:\\Users\\Public',
      },
      {
        variable: '$envSystem32Directory',
        description: 'C:\\WINDOWS\\system32',
      },
      {
        variable: '$envSystemDrive',
        description: '%SYSTEMDRIVE%, e.g. C:',
      },
      {
        variable: '$envSystemRAM',
        description: 'System RAM as an integer',
      },
      {
        variable: '$envSystemRoot',
        description: '%SYSTEMROOT%, e.g. C:\\Windows',
      },
      {
        variable: '$envTemp',
        description:
          'Checks for the existence of environment variables in the following order and uses the first path found:- The path specified by TEMP environment variable, (e.g. C:\\Users\\%USERNAME%\\AppData\\Local\\Temp).- The path specified by the USERPROFILE environment variable.- The Windows root (C:\\Windows) folder.',
      },
      {
        variable: '$envUserCookies',
        description:
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Microsoft\\Windows\\INetCookies',
      },
      {
        variable: '$envUserDesktop',
        description: 'C:\\Users\\%USERNAME%\\Desktop',
      },
      {
        variable: '$envUserFavorites',
        description: 'C:\\Users\\%USERNAME%\\Favorites',
      },
      {
        variable: '$envUserInternetCache',
        description:
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Microsoft\\Windows\\INetCache',
      },
      {
        variable: '$envUserInternetHistory',
        description:
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Microsoft\\Windows\\History',
      },
      {
        variable: '$envUserMyDocuments',
        description: 'C:\\Users\\%USERNAME%\\Documents',
      },
      {
        variable: '$envUserName',
        description: '%USERNAME%',
      },
      {
        variable: '$envUserProfile',
        description: '%USERPROFILE%, e.g. %SystemDrive%\\Users\\%USERNAME%',
      },
      {
        variable: '$envUserSendTo',
        description:
          'C:\\Users\\%USERNAME%\\AppData\\Roaming\\Microsoft\\Windows\\SendTo',
      },
      {
        variable: '$envUserStartMenu',
        description:
          'C:\\Users\\%USERNAME%\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu',
      },
      {
        variable: '$envUserStartMenuPrograms',
        description:
          'C:\\Users\\%USERNAME%\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs',
      },
      {
        variable: '$envUserStartUp',
        description:
          'C:\\Users\\%USERNAME%\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup',
      },
      {
        variable: '$envWinDir',
        description: '%WINDIR%, e.g. C:\\Windows',
      },
    ],
  },
  {
    id: 'domain-membership',
    title: 'Domain Membership',
    variables: [
      {
        variable: '$envLogonServer',
        description:
          'FQDN of %LOGONSERVER% used for authenticating logged in user',
      },
      {
        variable: '$envMachineADDomain',
        description: 'Root AD domain name for machine, e.g. domain.contoso.com',
      },
      {
        variable: '$envMachineDNSDomain',
        description: 'Full Domain name for machine, e.g. <name>.contoso.com',
      },
      {
        variable: '$envMachineWorkgroup',
        description:
          'If machine not joined to domain, what is the WORKGROUP it belongs to?',
      },
      {
        variable: '$envUserDNSDomain',
        description:
          '%USERDNSDOMAIN%. Root AD domain name for user, e.g. domain.contoso.com',
      },
      {
        variable: '$envUserDomain',
        description: '%USERDOMAIN%, e.g. domain.contoso.com',
      },
      {
        variable: '$IsMachinePartOfDomain',
        description: 'Is machine joined to a domain, e.g. $true/$false',
      },
      {
        variable: '$MachineDomainController',
        description: 'FQDN of an AD domain controller used for authentication',
      },
    ],
  },
  {
    id: 'operating-system',
    title: 'Operating System',
    variables: [
      {
        variable: '$envOS',
        description: 'Object that contains details about the operating system',
      },
      {
        variable: '$envOSArchitecture',
        description: 'Represents the OS architecture (e.g. 32-Bit/64-Bit)',
      },
      {
        variable: '$envOSName',
        description:
          'Name of the operating system (e.g. Microsoft Windows 8.1 Pro)',
      },
      {
        variable: '$envOSProductType',
        description: 'OS product type represented as an integer (e.g. 1/2/3)',
      },
      {
        variable: '$envOSProductTypeName',
        description:
          'OS product type name (e.g. Server/Domain Controller/Workstation/Unknown)',
      },
      {
        variable: '$envOSServicePack',
        description:
          'Latest service pack installed on the system (e.g. Service Pack 3)',
      },
      {
        variable: '$envOSVersion',
        description:
          'Full version number of the OS (e.g. <major>.<minor>.<build>.<revision>)',
      },
      {
        variable: '$envOSVersionBuild',
        description:
          'Build portion of the OS version number (e.g. <major>.<minor>.<build>.<revision>)',
      },
      {
        variable: '$envOSVersionMajor',
        description:
          'Major portion of the OS version number (e.g. <major>.<minor>.<build>.<revision>)',
      },
      {
        variable: '$envOSVersionMinor',
        description:
          'Minor portion of the OS version number (e.g. <major>.<minor>.<build>.<revision>)',
      },
      {
        variable: '$envOSVersionRevision',
        description:
          'Revision portion of the OS version number (e.g. <major>.<minor>.<build>.<revision>)',
      },
      {
        variable: '$Is64Bit',
        description: 'Is this a 64-bit OS? (e.g. $true/$false)',
      },
      {
        variable: '$IsDomainControllerOS',
        description: 'Is domain controller OS? (e.g. $true/$false)',
      },
      {
        variable: '$IsServerOS',
        description: 'Is server OS? (e.g. $true/$false)',
      },
      {
        variable: '$IsWorkStationOS',
        description: 'Is workstation OS? (e.g. $true/$false)',
      },
    ],
  },
  {
    id: 'current-process-architecture',
    title: 'Current Process Architecture',
    variables: [
      {
        variable: '$Is64BitProcess',
        description: 'Is the current process 64-bits? (e.g. $true/$false)',
      },
      {
        variable: '$psArchitecture',
        description:
          'Represents the current process architecture (e.g. x86/x64)',
      },
    ],
  },
  {
    id: 'powershell-and-clr-net-versions',
    title: 'PowerShell And CLR (.NET) Versions',
    variables: [
      {
        variable: '$envCLRVersion',
        description:
          'Full version number of .NET used by PS (e.g. <major>.<minor>.<build>.<revision>)',
      },
      {
        variable: '$envCLRVersionBuild',
        description:
          'Build portion of PS .NET version number (e.g. <major>.<minor>.<build>.<revision>)',
      },
      {
        variable: '$envCLRVersionMajor',
        description:
          'Major portion of PS .NET version number (e.g. <major>.<minor>.<build>.<revision>)',
      },
      {
        variable: '$envCLRVersionMinor',
        description:
          'Minor portion of PS .NET version number (e.g. <major>.<minor>.<build>.<revision>)',
      },
      {
        variable: '$envCLRVersionRevision',
        description:
          'Revision portion of PS .NET version number (e.g. <major>.<minor>.<build>.<revision>)',
      },
      {
        variable: '$envHost',
        description:
          'Object that contains details about the current PowerShell console',
      },
      {
        variable: '$envPSVersion',
        description:
          'Full version number of PS (e.g. <major>.<minor>.<build>.<revision>)',
      },
      {
        variable: '$envPSVersionBuild',
        description:
          'Build portion of PS version number (e.g. <major>.<minor>.<build>.<revision>)',
      },
      {
        variable: '$envPSVersionMajor',
        description:
          'Major portion of PS version number (e.g. <major>.<minor>.<build>.<revision>)',
      },
      {
        variable: '$envPSVersionMinor',
        description:
          'Minor portion of PS version number (e.g. <major>.<minor>.<build>.<revision>)',
      },
      {
        variable: '$envPSVersionRevision',
        description:
          'Revision portion of PS version number (e.g. <major>.<minor>.<build>.<revision>)',
      },
      {
        variable: '$envPSVersionTable',
        description:
          'Object containing PowerShell version details from PS variable $PSVersionTable',
      },
    ],
  },
  {
    id: 'permissions--accounts',
    title: 'Permissions / Accounts',
    variables: [
      {
        variable: '$CurrentProcessSID',
        description:
          'Object that represents the current process account SID (e.g. S-1-5-32-544)',
      },
      {
        variable: '$CurrentProcessToken',
        description:
          'Object that represents the current processes Windows Identity user token. Contains all details regarding user permissions.',
      },
      {
        variable: '$IsAdmin',
        description:
          'Is the current process running with elevated admin privileges? (e.g. $true/$false)',
      },
      {
        variable: '$IsLocalServiceAccount',
        description:
          'Is the current process running under LOCAL SERVICE account? (e.g. $true/$false)',
      },
      {
        variable: '$IsLocalSystemAccount',
        description:
          'Is the current process running under the SYSTEM account? (e.g. $true/$false)',
      },
      {
        variable: '$IsNetworkServiceAccount',
        description:
          'Is the current process running under the NETWORK SERVICE account? (e.g. $true/$false)',
      },
      {
        variable: '$IsProcessUserInteractive',
        description: 'Is the current process able to display a user interface?',
      },
      {
        variable: '$IsServiceAccount',
        description:
          'Is the current process running as a service? (e.g. $true/$false)',
      },
      {
        variable: '$LocalSystemNTAccount',
        description:
          'Localized NT account name of the SYSTEM account (e.g. NT AUTHORITY\\SYSTEM)',
      },
      {
        variable: '$ProcessNTAccount',
        description: 'Current process NT Account (e.g. NT AUTHORITY\\SYSTEM)',
      },
      {
        variable: '$ProcessNTAccountSID',
        description: 'Current process account SID (e.g. S-1-5-32-544)',
      },
      {
        variable: '$SessionZero',
        description:
          'Is the current process currently in session zero? In session zero isolation, process is not able to display a user interface. (e.g. $true/$false)',
      },
    ],
  },
  {
    id: 'regex-patterns',
    title: 'RegEx Patterns',
    variables: [
      {
        variable: '$MSIProductCodeRegExPattern',
        description:
          'Contains the regex pattern used to detect a MSI product code',
      },
    ],
  },
  {
    id: 'com-objects',
    title: 'COM Objects',
    variables: [
      {
        variable: '$Shell',
        description:
          'Represents and allows use of the WScript.Shell COM object',
      },
      {
        variable: '$ShellApp',
        description:
          'Represents and allows use of the Shell.Application COM object',
      },
    ],
  },
  {
    id: 'logged-on-users',
    title: 'Logged On Users',
    variables: [
      {
        variable: '$CurrentConsoleUserSession',
        description:
          'Objects that contains the account and session details of the console user (user with control of the physical monitor, keyboard, and mouse). This is the object from $LoggedOnUserSessions where the IsConsoleSession property is $true.',
      },
      {
        variable: '$CurrentLoggedOnUserSession',
        description:
          'Object that contains account and session details for the current process if it is running as a logged in user. This is the object from $LoggedOnUserSessions where the IsCurrentSession property is $true.',
      },
      {
        variable: '$LoggedOnUserSessions',
        description:
          'Object that contains account and session details for all users',
      },
      {
        variable: '$RunAsActiveUser',
        description:
          'The active console user. If no console user exists but users are logged in, such as on terminal servers, then the first logged-in non-console user.',
      },
      {
        variable: '$UsersLoggedOn',
        description:
          'Array that contains all of the NTAccount names of logged in users',
      },
    ],
  },
  {
    id: 'microsoft-office',
    title: 'Microsoft Office',
    variables: [
      {
        variable: 'envOfficeBitness',
        description:
          'Architecture of current Office installation, e.g. x86 or x64',
      },
      {
        variable: 'envOfficeChannel',
        description: "Current Office Channel, e.g. 'Monthly Enterprise'",
      },
      {
        variable: 'envOfficeVars',
        description:
          'Properties of HKLM\\SOFTWARE\\Microsoft\\Office\\ClickToRun\\Configuration',
      },
      {
        variable: 'envOfficeVersion',
        description: 'Microsoft Office version, e.g. 16.0.x.x',
      },
    ],
  },
  {
    id: 'miscellaneous',
    title: 'Miscellaneous',
    variables: [
      {
        variable: '$invalidFileNameChars',
        description:
          'Array of all invalid file name characters used to sanitize variables which may be used to create file names.',
      },
      {
        variable: '$LocalAdministratorsGroup',
        description:
          'Returns the name of the local Administrators group, typically BUILTIN\\Administrators',
      },
      {
        variable: '$LocalUsersGroup',
        description:
          'Returns the name of the local Users group, typically BUILTIN\\Users',
      },
      {
        variable: '$RunningTaskSequence',
        description:
          'Is the current process running in a SCCM task sequence? (e.g. $true / $false)',
      },
    ],
  },
];
window.PSADT_VARIABLES = PSADT_VARIABLES;
