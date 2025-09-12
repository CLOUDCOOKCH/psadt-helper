param([switch]$Install)
if($Install){ npm install }
npm test
Invoke-Pester -Path tests/ps
