Import-Module "$PSScriptRoot/../../src/ps/LegacyConverter.ps1"

Describe 'Convert-LegacyDeploymentScript' {
    $legacy = @"
[CmdletBinding()]
param()
Try {
    [String]$appVendor = 'Fabrikam'
    [String]$appName = 'WidgetPro'
    [String]$appScriptAuthor = 'Deployment Team'
    [Version]$deployAppScriptVersion = [Version]'3.10.0'
    [String]$deployAppScriptFriendlyName = 'Deploy Application'
    [Hashtable]$deployAppScriptParameters = $PSBoundParameters

    If ($deploymentType -ine 'Uninstall' -and $deploymentType -ine 'Repair') {
        [String]$installPhase = 'Pre-Installation'
        Show-InstallationWelcome -CloseApps 'iexplore'
        Execute-MSI -Path 'widget.msi' -Parameters '/qn'
    }
    ElseIf ($deploymentType -ieq 'Uninstall') {
        [String]$installPhase = 'Uninstallation'
        Show-InstallationProgress
        Execute-MSP -Path 'widget.msp'
    }
    ElseIf ($deploymentType -ieq 'Repair') {
        Execute-Process -Path 'repair.exe' -Parameters '/repair'
    }

    Exit-Script -ExitCode 0
} Catch {
    Exit-Script -ExitCode 60001
}
"@

    $result = Convert-LegacyDeploymentScript -Content $legacy

    It 'copies known variables into the session hashtable' {
        $result | Should -Match "AppVendor = 'Fabrikam'"
        $result | Should -Match "AppName = 'WidgetPro'"
        $result | Should -Match "DeployAppScriptVersion = '4.1.5'"
        $result | Should -Match "DeployAppScriptFriendlyName = \$MyInvocation.MyCommand.Name"
    }

    It 'converts install commands to v4 equivalents' {
        $result | Should -Match 'Show-ADTInstallationWelcome'
        $result | Should -Match "Start-ADTMsiProcess -FilePath 'widget.msi' -ArgumentList '/qn'"
        $result | Should -Match "Start-ADTMspProcess -FilePath 'widget.msp'"
        $result | Should -Match "Start-ADTProcess -FilePath 'repair.exe' -ArgumentList '/repair'"
    }

    It 'normalizes install phase assignments' {
        $result | Should -Match '\$adtSession.InstallPhase'
    }

    It 'emits a new invocation pipeline' {
        $result | Should -Match 'Close-ADTSession'
        $result | Should -NotMatch 'Exit-Script'
    }
}
