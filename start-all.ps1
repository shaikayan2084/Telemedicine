$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$logs = Join-Path $root "logs"
New-Item -ItemType Directory -Path $logs -Force | Out-Null

$services = @(
    @{ Name="Backend"; Dir=Join-Path $root "backend"; Cmd="node server.js"; Port=5000; Log="backend.log" },
    @{ Name="Signaling"; Dir=Join-Path $root "signaling-server"; Cmd="node index.js"; Port=4000; Log="signaling.log" },
    @{ Name="Frontend"; Dir=Join-Path $root "frontend"; Cmd="npm start"; Port=3000; Log="frontend.log" }
)

$procs = @{}
foreach ($svc in $services) {
    $logFile = Join-Path $logs $svc.Log
    $proc = Start-Process -PassThru powershell -ArgumentList "-NoExit -Command", "cd '$($svc.Dir)'; $($svc.Cmd) *>'$logFile'"
    $procs[$svc.Name] = $proc
    Write-Host "$($svc.Name) starting (PID $($proc.Id))..."
}

Write-Host "`nWaiting for services to start..."
Start-Sleep 10

foreach ($svc in $services) {
    $portOpen = netstat -ano | findstr "LISTEN" | findstr ":$($svc.Port) "
    if ($portOpen) {
        Write-Host "[OK] $($svc.Name) on port $($svc.Port)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $($svc.Name) on port $($svc.Port)" -ForegroundColor Red
        $logFile = Join-Path $logs $svc.Log
        if (Test-Path $logFile) { Get-Content $logFile -Tail 5 }
    }
}

Write-Host "`nFrontend: http://localhost:3000"
Write-Host "Backend:  http://localhost:5000"
Write-Host "Logs:     $logs"
Write-Host "`nTo stop:  taskkill /f /im node.exe"
