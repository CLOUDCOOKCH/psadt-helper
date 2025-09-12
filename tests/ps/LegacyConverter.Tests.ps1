Import-Module "$PSScriptRoot/../../src/ps/LegacyConverter.ps1"
Describe 'Convert-LegacyCommand' {
    It 'replaces function and parameters' {
        $cmd = "Execute-MSI -Path 'app.msi' -Parameters '/qn'"
        $result = Convert-LegacyCommand -Command $cmd
        $result | Should -Be "Start-ADTMsiProcess -FilePath 'app.msi' -ArgumentList '/qn'"
    }
    It 'supports extra map' {
        $cmd = "Execute-Process -Path test.exe -Foo 1"
        $result = Convert-LegacyCommand -Command $cmd -ExtraParameterMap @(@('-Foo','-Bar'))
        $result | Should -Be "Start-ADTProcess -FilePath test.exe -Bar 1"
    }
}
