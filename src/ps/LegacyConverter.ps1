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
Export-ModuleMember -Function Convert-LegacyCommand
