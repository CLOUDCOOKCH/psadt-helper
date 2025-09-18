# Constants for legacy conversion
$LegacyFunctionMap = @()
$LegacyParameterMap = @()

$dataPath = Join-Path $PSScriptRoot '..' 'data' 'legacy-mapping.json'
if (Test-Path -Path $dataPath) {
    try {
        $legacyData = Get-Content -Raw -Path $dataPath | ConvertFrom-Json
        if ($legacyData.functionMap) {
            foreach ($pair in $legacyData.functionMap) {
                if ($pair.Count -eq 2 -and $pair[0] -and $pair[1]) {
                    $LegacyFunctionMap += @($pair[0], $pair[1])
                }
            }
        }
        if ($legacyData.parameterMap) {
            foreach ($pair in $legacyData.parameterMap) {
                if ($pair.Count -eq 2 -and $pair[0] -and $pair[1]) {
                    $LegacyParameterMap += @($pair[0], $pair[1])
                }
            }
        }
    }
    catch {
        # Fallback to minimal mappings if the JSON file is invalid
        $LegacyFunctionMap = @()
        $LegacyParameterMap = @()
    }
}

if (-not $LegacyFunctionMap.Count) {
    $LegacyFunctionMap = @(
        'Execute-MSI','Start-ADTMsiProcess',
        'Execute-MSP','Start-ADTMspProcess',
        'Execute-Process','Start-ADTProcess',
        'Show-InstallationWelcome','Show-ADTInstallationWelcome',
        'Show-InstallationPrompt','Show-ADTInstallationPrompt',
        'Show-InstallationProgress','Show-ADTInstallationProgress',
        'Show-InstallationRestartPrompt','Show-ADTInstallationRestartPrompt'
    )
}

if (-not $LegacyParameterMap.Count) {
    $LegacyParameterMap = @(
        '-Path','-FilePath',
        '-Parameters','-ArgumentList',
        '-Transform','-Transforms',
        '-LogName','-LogFileName',
        '-CloseApps','-CloseProcesses',
        '-ProgressPercentage','-StatusBarPercentage'
    )
}
Export-ModuleMember -Variable LegacyFunctionMap, LegacyParameterMap
