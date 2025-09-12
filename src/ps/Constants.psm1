# Constants for legacy conversion
$LegacyFunctionMap = @(
    'Execute-MSI','Start-ADTMsiProcess',
    'Execute-MSP','Start-ADTMspProcess',
    'Execute-Process','Start-ADTProcess',
    'Show-InstallationWelcome','Show-ADTInstallationWelcome',
    'Show-InstallationPrompt','Show-ADTInstallationPrompt',
    'Show-InstallationProgress','Show-ADTInstallationProgress',
    'Show-InstallationRestartPrompt','Show-ADTInstallationRestartPrompt'
)
$LegacyParameterMap = @(
    '-Path','-FilePath',
    '-Parameters','-ArgumentList',
    '-Transform','-Transforms',
    '-LogName','-LogFileName',
    '-CloseApps','-CloseProcesses',
    '-ProgressPercentage','-StatusBarPercentage'
)
Export-ModuleMember -Variable LegacyFunctionMap, LegacyParameterMap
