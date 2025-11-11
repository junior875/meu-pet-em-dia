$ErrorActionPreference = 'Stop'

if (-not (Test-Path .venv)) {
  python -m venv .venv
}

./.venv/Scripts/pip.exe install -r requirements.txt

if (${env:MEUPET_BASE_URL} -eq $null) {
  $env:MEUPET_BASE_URL = 'http://localhost:5173'
}

Write-Host "Running: test_register_login.py" -ForegroundColor Cyan
./.venv/Scripts/python.exe .\test_register_login.py

Write-Host "Running: test_pets_flow.py" -ForegroundColor Cyan
./.venv/Scripts/python.exe .\test_pets_flow.py

Write-Host "Running: test_agenda_flow.py" -ForegroundColor Cyan
./.venv/Scripts/python.exe .\test_agenda_flow.py

Write-Host "Running: test_registrosaude_flow.py" -ForegroundColor Cyan
./.venv/Scripts/python.exe .\test_registrosaude_flow.py

Write-Host "Running: test_admin_users_flow.py" -ForegroundColor Cyan
./.venv/Scripts/python.exe .\test_admin_users_flow.py

