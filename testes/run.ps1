$ErrorActionPreference = 'Stop'

if (-not (Test-Path .venv)) {
  python -m venv .venv
}

./.venv/Scripts/pip.exe install -r requirements.txt

if (${env:MEUPET_BASE_URL} -eq $null) {
  $env:MEUPET_BASE_URL = 'http://localhost:5173'
}

# Desativar modo headless para ver o navegador
if (${env:MEUPET_HEADLESS} -eq $null) {
  $env:MEUPET_HEADLESS = '0'
}

Write-Host "`n=== Executando testes E2E ===" -ForegroundColor Green

Write-Host "`n[1/5] Registro e Login..." -ForegroundColor Cyan
./.venv/Scripts/python.exe .\test_register_login.py

Write-Host "`n[2/5] Gestão de Pets..." -ForegroundColor Cyan
./.venv/Scripts/python.exe .\test_pets_flow.py

Write-Host "`n[3/5] Gestão de Agenda..." -ForegroundColor Cyan
./.venv/Scripts/python.exe .\test_agenda_flow.py

Write-Host "`n[4/5] Gestão de Registros de Saúde..." -ForegroundColor Cyan
./.venv/Scripts/python.exe .\test_registrosaude_flow.py

Write-Host "`n[5/5] Gestão de Usuários (Admin)..." -ForegroundColor Cyan
./.venv/Scripts/python.exe .\test_admin_users_flow.py

Write-Host "`n=== Todos os testes concluídos! ===" -ForegroundColor Green

