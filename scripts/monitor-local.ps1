param(
    [string]$BackendHealthUrl = "http://127.0.0.1:8000/api/health",
    [string]$FrontendUrl = "http://127.0.0.1:3000",
    [int]$IntervalSeconds = 30,
    [int]$TimeoutSeconds = 5,
    [switch]$Loop,
    [switch]$AsJson
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-Check {
    param(
        [string]$Name,
        [string]$Url,
        [scriptblock]$IsOk
    )

    $start = Get-Date
    try {
        $res = Invoke-WebRequest -UseBasicParsing -Uri $Url -Method GET -TimeoutSec $TimeoutSeconds
        $duration = [int]((Get-Date) - $start).TotalMilliseconds
        $ok = & $IsOk $res.StatusCode

        [pscustomobject]@{
            Name       = $Name
            Url        = $Url
            StatusCode = $res.StatusCode
            Ok         = [bool]$ok
            DurationMs = $duration
            Error      = ""
            Time       = (Get-Date).ToString("s")
        }
    } catch {
        $duration = [int]((Get-Date) - $start).TotalMilliseconds
        [pscustomobject]@{
            Name       = $Name
            Url        = $Url
            StatusCode = 0
            Ok         = $false
            DurationMs = $duration
            Error      = $_.Exception.Message
            Time       = (Get-Date).ToString("s")
        }
    }
}

function Run-Checks {
    $results = @(
        Invoke-Check -Name "backend-health" -Url $BackendHealthUrl -IsOk { param($code) $code -eq 200 }
        Invoke-Check -Name "frontend-home" -Url $FrontendUrl -IsOk { param($code) $code -ge 200 -and $code -lt 400 }
    )

    if (-not $AsJson) {
        foreach ($r in $results) {
            $flag = if ($r.Ok) { "OK" } else { "KO" }
            $line = "[{0}] {1} {2} ({3}ms) {4}" -f $flag, $r.Name, $r.StatusCode, $r.DurationMs, $r.Url
            if (-not [string]::IsNullOrWhiteSpace($r.Error)) {
                $line = "$line - $($r.Error)"
            }
            Write-Host $line
        }
    }

    return ,$results
}

if ($Loop) {
    Write-Host ("Monitoring local demarre (interval: {0}s). Ctrl+C pour arreter." -f $IntervalSeconds)
    while ($true) {
        $all = Run-Checks
        if ($AsJson) {
            $all | ConvertTo-Json -Depth 3
        }
        $hasError = @($all | Where-Object { -not $_.Ok }).Count -gt 0
        if ($hasError) {
            [console]::beep(1200, 120)
        }
        Start-Sleep -Seconds $IntervalSeconds
    }
} else {
    $all = Run-Checks
    if ($AsJson) {
        $all | ConvertTo-Json -Depth 3
    }
    $hasError = @($all | Where-Object { -not $_.Ok }).Count -gt 0
    if ($hasError) {
        exit 1
    }
}
