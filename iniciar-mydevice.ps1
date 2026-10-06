# Sobe o mydevice e abre no navegador.
#
# Lida com o caso que mais atrapalha na prática: o servidor JÁ estar rodando.
# Subir outro por cima falha com EADDRINUSE, e como o processo novo morre em
# silêncio quem fica respondendo é o antigo — dá a impressão de ter reiniciado
# sem ter reiniciado. Então aqui a porta é conferida antes.

$ErrorActionPreference = 'Stop'
$porta = 5177
$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = "http://localhost:$porta/"

function Porta-Ocupada {
    $null -ne (Get-NetTCPConnection -LocalPort $porta -State Listen -ErrorAction SilentlyContinue)
}

function Responde {
    try { return (Invoke-WebRequest -Uri "$url`health" -UseBasicParsing -TimeoutSec 5).StatusCode -eq 200 }
    catch { return $false }
}

if (Porta-Ocupada) {
    if (Responde) {
        Write-Host "mydevice ja estava rodando." -ForegroundColor Green
        Start-Process $url
        exit 0
    }
    # Porta preseada por um processo que nao responde mais: derruba, senao o
    # servidor novo nem sobe.
    Write-Host "Porta $porta presa por um processo que nao responde. Encerrando..." -ForegroundColor Yellow
    Get-NetTCPConnection -LocalPort $porta -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique |
        ForEach-Object { try { Stop-Process -Id $_ -Force -ErrorAction Stop } catch {} }
    Start-Sleep -Seconds 2
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js nao encontrado no PATH. Instale o Node e tente de novo." -ForegroundColor Red
    Read-Host "Enter para fechar"
    exit 1
}

Write-Host "Subindo o mydevice..." -ForegroundColor Cyan
$log = Join-Path $raiz 'mydevice.log'
Start-Process -FilePath 'node' -ArgumentList 'server.js' -WorkingDirectory $raiz `
    -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError "$log.err"

# O Chrome demora a subir na primeira vez; vale esperar um pouco.
for ($i = 1; $i -le 20; $i++) {
    Start-Sleep -Seconds 1
    if (Responde) {
        Write-Host "Pronto: $url" -ForegroundColor Green
        Start-Process $url
        exit 0
    }
}

Write-Host "O servidor nao respondeu a tempo. Veja o log:" -ForegroundColor Red
Write-Host "  $log"
if (Test-Path "$log.err") { Get-Content "$log.err" -Tail 15 }
Read-Host "Enter para fechar"
exit 1
