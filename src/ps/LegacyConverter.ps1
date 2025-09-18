. $PSScriptRoot/Constants.psm1

function Convert-LegacyCommand {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Command,
        [string[][]]$ExtraParameterMap
    )
    begin {
        $fnMap = @{}
        for($i=0; $i -lt $LegacyFunctionMap.Count; $i+=2){
            $fnMap[$LegacyFunctionMap[$i]] = $LegacyFunctionMap[$i+1]
        }
        $paramMap = @{}
        for($i=0; $i -lt $LegacyParameterMap.Count; $i+=2){
            $paramMap[$LegacyParameterMap[$i]] = $LegacyParameterMap[$i+1]
        }
        if($ExtraParameterMap){
            foreach($p in $ExtraParameterMap){ if($p.Count -eq 2){ $paramMap[$p[0]] = $p[1] } }
        }
    }
    process {
        $out = $Command
        foreach($k in $fnMap.Keys){
            $out = [Regex]::Replace($out, "\b$k\b", $fnMap[$k], 'IgnoreCase')
        }
        foreach($k in $paramMap.Keys){
            $re = "(^|[^\w-])"+[Regex]::Escape($k)+"(?=\s|$)"
            $out = [Regex]::Replace($out, $re, {
                param($m)
                return $m.Groups[1].Value + $paramMap[$k]
            }, 'IgnoreCase')
        }
        return $out
    }
}

function Convert-LegacyDeploymentScript {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Content,
        [string[][]]$ExtraParameterMap
    )

    function Get-VariableNameFromAstNode {
        param(
            [System.Management.Automation.Language.Ast]$Node
        )

        switch ($Node) {
            { $_ -is [System.Management.Automation.Language.VariableExpressionAst] } { return $_.VariablePath.UserPath }
            { $_ -is [System.Management.Automation.Language.ConvertExpressionAst] } { return Get-VariableNameFromAstNode -Node $_.Child }
            { $_ -is [System.Management.Automation.Language.AttributedExpressionAst] } { return Get-VariableNameFromAstNode -Node $_.Child }
            default { return $null }
        }
    }

    function Get-StatementBlockText {
        param(
            [System.Management.Automation.Language.StatementBlockAst]$Block
        )

        if (-not $Block) { return [string]::Empty }

        $text = $Block.Extent.Text
        if ([string]::IsNullOrWhiteSpace($text)) { return [string]::Empty }

        $trimmed = $text.Trim()
        if ($trimmed.StartsWith('{') -and $trimmed.EndsWith('}')) {
            $trimmed = $trimmed.Substring(1, $trimmed.Length - 2)
        }

        return $trimmed.Trim("`r`n")
    }

    function Convert-BlockContent {
        param(
            [string]$Text
        )

        if ([string]::IsNullOrWhiteSpace($Text)) {
            return '    ## No commands were converted from the legacy script.'
        }

        $updated = Convert-LegacyCommand -Command $Text -ExtraParameterMap $ExtraParameterMap
        $updated = [Regex]::Replace($updated, '\[String\]\s*\$installPhase', '$adtSession.InstallPhase')
        $updated = [Regex]::Replace($updated, '\$installPhase', '$adtSession.InstallPhase')
        $updated = [Regex]::Replace($updated, '\$useDefaultMsi', '$adtSession.UseDefaultMsi')
        $updated = [Regex]::Replace($updated, '\$defaultMsiFile', '$adtSession.DefaultMsiFile')
        $updated = [Regex]::Replace($updated, '\$defaultMstFile', '$adtSession.DefaultMstFile')
        $updated = [Regex]::Replace($updated, '\$defaultMspFiles', '$adtSession.DefaultMspFiles')
        $updated = [Regex]::Replace($updated, '\$deploymentType', '$adtSession.DeploymentType')

        $lines = $updated -split "`r?`n"
        while ($lines.Length -gt 0 -and [string]::IsNullOrWhiteSpace($lines[0])) {
            $lines = $lines[1..($lines.Length - 1)]
        }
        while ($lines.Length -gt 0 -and [string]::IsNullOrWhiteSpace($lines[-1])) {
            $lines = $lines[0..($lines.Length - 2)]
        }

        $minIndent = $null
        foreach ($line in $lines) {
            if ([string]::IsNullOrWhiteSpace($line)) { continue }
            $currentIndent = [Regex]::Match($line, '^\s*').Value.Length
            if ($minIndent -eq $null -or $currentIndent -lt $minIndent) {
                $minIndent = $currentIndent
            }
        }
        if ($minIndent -eq $null) { $minIndent = 0 }

        $normalized = foreach ($line in $lines) {
            if ([string]::IsNullOrWhiteSpace($line)) { '' }
            else {
                $trimLength = [Math]::Min($line.Length, $minIndent)
                $line.Substring($trimLength)
            }
        }

        return ($normalized | ForEach-Object { if ([string]::IsNullOrEmpty($_)) { '' } else { '    ' + $_ } }) -join "`n"
    }

    $tokens = $null
    $errors = $null
    $ast = [System.Management.Automation.Language.Parser]::ParseInput($Content, [ref]$tokens, [ref]$errors)

    $variableAssignments = @{}
    $assignmentNodes = $ast.FindAll({
            param($node)
            $node -is [System.Management.Automation.Language.AssignmentStatementAst]
        }, $true)
    foreach ($assignment in $assignmentNodes) {
        $name = Get-VariableNameFromAstNode -Node $assignment.Left
        if (-not $name) { continue }
        if (-not $variableAssignments.ContainsKey($name)) {
            $variableAssignments[$name] = $assignment.Right.Extent.Text.Trim()
        }
    }

    $installBlock = $null
    $uninstallBlock = $null
    $repairBlock = $null

    $ifStatements = $ast.FindAll({
            param($node)
            $node -is [System.Management.Automation.Language.IfStatementAst]
        }, $true) | Sort-Object { $_.Extent.StartOffset }
    foreach ($ifAst in $ifStatements) {
        $clauseMatched = $false
        foreach ($clause in $ifAst.Clauses) {
            if ($clause.Item1 -and $clause.Item1.Extent.Text -match '\$deploymentType') {
                $clauseMatched = $true
                break
            }
        }
        if (-not $clauseMatched) { continue }

        foreach ($clause in $ifAst.Clauses) {
            $conditionText = $clause.Item1.Extent.Text
            $block = $clause.Item2
            if ($conditionText -match '(?i)uninstall') {
                if (-not $uninstallBlock) { $uninstallBlock = $block }
            }
            elseif ($conditionText -match '(?i)repair') {
                if (-not $repairBlock) { $repairBlock = $block }
            }
            else {
                if (-not $installBlock) { $installBlock = $block }
            }
        }

        if (-not $repairBlock -and $ifAst.ElseClause) {
            $repairBlock = $ifAst.ElseClause
        }

        if ($installBlock -or $uninstallBlock -or $repairBlock) { break }
    }

    $sessionVariableMap = @(
        @{ Name = 'AppVendor'; Source = 'appVendor'; Default = "''"; Comment = '    # App variables.'; FirstInGroup = $true },
        @{ Name = 'AppName'; Source = 'appName'; Default = "''" },
        @{ Name = 'AppVersion'; Source = 'appVersion'; Default = "''" },
        @{ Name = 'AppArch'; Source = 'appArch'; Default = "''" },
        @{ Name = 'AppLang'; Source = 'appLang'; Default = "'EN'" },
        @{ Name = 'AppRevision'; Source = 'appRevision'; Default = "'01'" },
        @{ Name = 'AppSuccessExitCodes'; Source = 'appSuccessExitCodes'; Default = '@(0)' },
        @{ Name = 'AppRebootExitCodes'; Source = 'appRebootExitCodes'; Default = '@(1641, 3010)' },
        @{ Name = 'AppProcessesToClose'; Source = 'appProcesses'; Default = '@()  # Example: @(''excel'', @{ Name = ''winword''; Description = ''Microsoft Word'' })' },
        @{ Name = 'AppScriptVersion'; Source = 'appScriptVersion'; Default = "'1.0.0'" },
        @{ Name = 'AppScriptDate'; Source = 'appScriptDate'; Default = "'2000-12-31'" },
        @{ Name = 'AppScriptAuthor'; Source = 'appScriptAuthor'; Default = "'<author name>'" },
        @{ Name = 'RequireAdmin'; Source = 'requireAdmin'; Default = '$true' },
        @{ Name = 'InstallName'; Source = 'installName'; Default = "''"; Comment = '    # Install Titles (Only set here to override defaults set by the toolkit).' },
        @{ Name = 'InstallTitle'; Source = 'installTitle'; Default = "''" },
        @{ Name = 'DeployAppScriptFriendlyName'; Source = 'deployAppScriptFriendlyName'; Default = '$MyInvocation.MyCommand.Name'; Comment = '    # Script variables.' },
        @{ Name = 'DeployAppScriptParameters'; Source = 'deployAppScriptParameters'; Default = '$PSBoundParameters' },
        @{ Name = 'DeployAppScriptVersion'; Source = 'deployAppScriptVersion'; Default = "'4.1.5'" }
    )

    $sessionBuilder = [System.Text.StringBuilder]::new()
    foreach ($entry in $sessionVariableMap) {
        if ($entry.ContainsKey('Comment')) {
            if ($entry['FirstInGroup']) {
                $sessionBuilder.AppendLine($entry['Comment']) | Out-Null
            }
            else {
                $sessionBuilder.AppendLine() | Out-Null
                $sessionBuilder.AppendLine($entry['Comment']) | Out-Null
            }
        }

        $value = $entry.Default
        if ($entry.Source -and $variableAssignments.ContainsKey($entry.Source)) {
            $value = $variableAssignments[$entry.Source]
        }

        $sessionBuilder.AppendLine(('    {0} = {1}' -f $entry.Name, $value)) | Out-Null
    }

    $installContent = Convert-BlockContent -Text (Get-StatementBlockText -Block $installBlock)
    $uninstallContent = Convert-BlockContent -Text (Get-StatementBlockText -Block $uninstallBlock)
    $repairContent = Convert-BlockContent -Text (Get-StatementBlockText -Block $repairBlock)

    $builder = [System.Text.StringBuilder]::new()
    $builder.AppendLine('[CmdletBinding()]') | Out-Null
    $builder.AppendLine('param') | Out-Null
    $builder.AppendLine('(') | Out-Null
    $builder.AppendLine("    [Parameter(Mandatory = `$false)]") | Out-Null
    $builder.AppendLine("    [ValidateSet('Install', 'Uninstall', 'Repair')]") | Out-Null
    $builder.AppendLine('    [System.String]$DeploymentType,') | Out-Null
    $builder.AppendLine("    [Parameter(Mandatory = `$false)]") | Out-Null
    $builder.AppendLine("    [ValidateSet('Auto', 'Interactive', 'NonInteractive', 'Silent')]") | Out-Null
    $builder.AppendLine('    [System.String]$DeployMode,') | Out-Null
    $builder.AppendLine("    [Parameter(Mandatory = `$false)]") | Out-Null
    $builder.AppendLine('    [System.Management.Automation.SwitchParameter]$SuppressRebootPassThru,') | Out-Null
    $builder.AppendLine("    [Parameter(Mandatory = `$false)]") | Out-Null
    $builder.AppendLine('    [System.Management.Automation.SwitchParameter]$TerminalServerMode,') | Out-Null
    $builder.AppendLine("    [Parameter(Mandatory = `$false)]") | Out-Null
    $builder.AppendLine('    [System.Management.Automation.SwitchParameter]$DisableLogging') | Out-Null
    $builder.AppendLine(')') | Out-Null
    $builder.AppendLine() | Out-Null
    $builder.AppendLine('##================================================') | Out-Null
    $builder.AppendLine('## MARK: Variables') | Out-Null
    $builder.AppendLine('##================================================') | Out-Null
    $builder.AppendLine() | Out-Null
    $builder.AppendLine('# Zero-Config MSI support is provided when "AppName" is null or empty.') | Out-Null
    $builder.AppendLine('# By setting the "AppName" property, Zero-Config MSI will be disabled.') | Out-Null
    $builder.AppendLine('$adtSession = @{') | Out-Null
    $builder.Append($sessionBuilder.ToString().TrimEnd()) | Out-Null
    $builder.AppendLine() | Out-Null
    $builder.AppendLine('}') | Out-Null
    $builder.AppendLine() | Out-Null
    $builder.AppendLine('function Install-ADTDeployment') | Out-Null
    $builder.AppendLine('{') | Out-Null
    $builder.AppendLine('    [CmdletBinding()]') | Out-Null
    $builder.AppendLine('    param') | Out-Null
    $builder.AppendLine('    (') | Out-Null
    $builder.AppendLine('    )') | Out-Null
    $builder.AppendLine() | Out-Null
    $builder.AppendLine($installContent) | Out-Null
    $builder.AppendLine('}') | Out-Null
    $builder.AppendLine() | Out-Null
    $builder.AppendLine('function Uninstall-ADTDeployment') | Out-Null
    $builder.AppendLine('{') | Out-Null
    $builder.AppendLine('    [CmdletBinding()]') | Out-Null
    $builder.AppendLine('    param') | Out-Null
    $builder.AppendLine('    (') | Out-Null
    $builder.AppendLine('    )') | Out-Null
    $builder.AppendLine() | Out-Null
    $builder.AppendLine($uninstallContent) | Out-Null
    $builder.AppendLine('}') | Out-Null
    $builder.AppendLine() | Out-Null
    $builder.AppendLine('function Repair-ADTDeployment') | Out-Null
    $builder.AppendLine('{') | Out-Null
    $builder.AppendLine('    [CmdletBinding()]') | Out-Null
    $builder.AppendLine('    param') | Out-Null
    $builder.AppendLine('    (') | Out-Null
    $builder.AppendLine('    )') | Out-Null
    $builder.AppendLine() | Out-Null
    $builder.AppendLine($repairContent) | Out-Null
    $builder.AppendLine('}') | Out-Null
    $builder.AppendLine() | Out-Null
    $builder.AppendLine('##================================================') | Out-Null
    $builder.AppendLine('## MARK: Initialization') | Out-Null
    $builder.AppendLine('##================================================') | Out-Null
    $builder.AppendLine() | Out-Null
    $builder.AppendLine('$ErrorActionPreference = [System.Management.Automation.ActionPreference]::Stop') | Out-Null
    $builder.AppendLine('$ProgressPreference = [System.Management.Automation.ActionPreference]::SilentlyContinue') | Out-Null
    $builder.AppendLine('Set-StrictMode -Version 1') | Out-Null
    $builder.AppendLine() | Out-Null
    $builder.AppendLine('try') | Out-Null
    $builder.AppendLine('{') | Out-Null
    $builder.AppendLine('    if (Test-Path -LiteralPath "$PSScriptRoot\PSAppDeployToolkit.psd1" -PathType Leaf)') | Out-Null
    $builder.AppendLine('    {') | Out-Null
    $builder.AppendLine('        Import-Module -Name "$PSScriptRoot\PSAppDeployToolkit.psd1" -Force') | Out-Null
    $builder.AppendLine('    }') | Out-Null
    $builder.AppendLine('    else') | Out-Null
    $builder.AppendLine('    {') | Out-Null
    $builder.AppendLine('        Import-Module -Name ''PSAppDeployToolkit'' -Force') | Out-Null
    $builder.AppendLine('    }') | Out-Null
    $builder.AppendLine() | Out-Null
    $builder.AppendLine('    $sessionParams = @{}') | Out-Null
    $builder.AppendLine('    foreach ($name in ''DeploymentType'', ''DeployMode'')') | Out-Null
    $builder.AppendLine('    {') | Out-Null
    $builder.AppendLine('        if ($PSBoundParameters.ContainsKey($name)) {') | Out-Null
    $builder.AppendLine('            $sessionParams[$name] = $PSBoundParameters[$name]') | Out-Null
    $builder.AppendLine('        }') | Out-Null
    $builder.AppendLine('    }') | Out-Null
    $builder.AppendLine('    foreach ($name in ''SuppressRebootPassThru'', ''TerminalServerMode'', ''DisableLogging'')') | Out-Null
    $builder.AppendLine('    {') | Out-Null
    $builder.AppendLine('        if ($PSBoundParameters.ContainsKey($name)) {') | Out-Null
    $builder.AppendLine('            $sessionParams[$name] = $true') | Out-Null
    $builder.AppendLine('        }') | Out-Null
    $builder.AppendLine('    }') | Out-Null
    $builder.AppendLine() | Out-Null
    $builder.AppendLine('    $adtSession = Open-ADTSession @adtSession @sessionParams -PassThru') | Out-Null
    $builder.AppendLine('}') | Out-Null
    $builder.AppendLine('catch') | Out-Null
    $builder.AppendLine('{') | Out-Null
    $builder.AppendLine('    Write-Error -Message ("Failed to initialize PSAppDeployToolkit session: {0}" -f $_)') | Out-Null
    $builder.AppendLine('    exit 60008') | Out-Null
    $builder.AppendLine('}') | Out-Null
    $builder.AppendLine() | Out-Null
    $builder.AppendLine('##================================================') | Out-Null
    $builder.AppendLine('## MARK: Invocation') | Out-Null
    $builder.AppendLine('##================================================') | Out-Null
    $builder.AppendLine() | Out-Null
    $builder.AppendLine('try') | Out-Null
    $builder.AppendLine('{') | Out-Null
    $builder.AppendLine('    & "$($adtSession.DeploymentType)-ADTDeployment"') | Out-Null
    $builder.AppendLine('    Close-ADTSession') | Out-Null
    $builder.AppendLine('}') | Out-Null
    $builder.AppendLine('catch') | Out-Null
    $builder.AppendLine('{') | Out-Null
    $builder.AppendLine('    $errorMessage = "An unhandled error occurred.`n$(Resolve-ADTErrorRecord -ErrorRecord $_)"') | Out-Null
    $builder.AppendLine('    Write-ADTLogEntry -Message $errorMessage -Severity 3') | Out-Null
    $builder.AppendLine('    Close-ADTSession -ExitCode 60001') | Out-Null
    $builder.AppendLine('}') | Out-Null

    return $builder.ToString().TrimEnd()
}

Export-ModuleMember -Function Convert-LegacyCommand, Convert-LegacyDeploymentScript
