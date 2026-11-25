@echo off
REM ===========================================================================
REM  setup-intervys.cmd — lanceur d'installation Intervys pour Windows.
REM  Double-clic : telecharge le script PowerShell, le debloque (marque
REM  "provenance Internet") et l'execute en contournant l'ExecutionPolicy.
REM  Aucun droit administrateur n'est requis pour cette etape (il le sera
REM  pour installer Docker Desktop).
REM ===========================================================================
setlocal
set "URL=https://github.com/Intervys/App/releases/latest/download/setup-intervys.ps1"
set "PS1=%TEMP%\setup-intervys.ps1"

echo.
echo   Intervys - installation
echo   -----------------------
echo   Telechargement du lanceur...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing '%URL%' -OutFile '%PS1%'; Unblock-File -Path '%PS1%'; Write-Host '  Lanceur pret.' -ForegroundColor Green"

if not exist "%PS1%" (
  echo.
  echo   ECHEC du telechargement. Verifiez la connexion Internet,
  echo   ou telechargez manuellement :
  echo   %URL%
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%"

echo.
pause
