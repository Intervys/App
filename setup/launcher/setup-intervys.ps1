<#
  setup-intervys.ps1 — lanceur d'installation Intervys pour Windows.

  .\setup-intervys.ps1

  Deux cibles :
    1) ce PC Windows        → installe Docker Desktop (winget) si absent, puis
                              déploie la stack Intervys localement
    2) serveur Linux distant → SSH (client OpenSSH intégré à Windows 10/11),
                              installe Docker si absent, copie install.sh et
                              l'exécute à distance

  À la fin, ouvrir http://<hôte>/ — l'assistant /setup.html s'ouvre tout seul.
#>

param(
    [int]$Port = 80,
    [string]$InstallDir = "$env:ProgramData\Intervys",
    [string]$ReleaseUrl = "https://github.com/Intervys/app/releases/latest/download"
)

$ErrorActionPreference = "Stop"

function Say($msg)  { Write-Host "> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "OK $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "! $msg" -ForegroundColor Yellow }
function Die($msg)  { Write-Host "X $msg" -ForegroundColor Red; exit 1 }

function Test-Docker {
    try { docker info 2>$null | Out-Null; return ($LASTEXITCODE -eq 0) } catch { return $false }
}

function Install-DockerDesktop {
    Say "Installation de Docker Desktop (winget)…"
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Die "winget introuvable. Installez Docker Desktop manuellement : https://www.docker.com/products/docker-desktop/"
    }
    winget install -e --accept-package-agreements --accept-source-agreements --id Docker.DockerDesktop
    Warn "Docker Desktop vient d'être installé : démarrez-le (et reconnectez-vous si demandé),"
    Warn "puis relancez ce script pour terminer l'installation d'Intervys."
}

function New-Secret {
    $bytes = New-Object byte[] 24
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
}

function Installer-Local {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue) -or -not (Test-Docker)) {
        Warn "Docker n'est pas opérationnel sur ce PC."
        $rep = Read-Host "Installer Docker Desktop maintenant ? [o/N]"
        if ($rep -match '^(o|O|y|Y)$') { Install-DockerDesktop; return } else { Die "Docker requis pour continuer." }
    }
    Ok "Docker opérationnel"

    if (-not (Test-Path $InstallDir)) { New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null }
    Set-Location $InstallDir

    if (-not (Test-Path "docker-compose.yml")) {
        Say "Téléchargement du fichier compose…"
        Invoke-WebRequest -UseBasicParsing "$ReleaseUrl/docker-compose.install.yml" -OutFile "docker-compose.yml"
    }

    if (Test-Path ".env") {
        Say ".env existant conservé"
    } else {
        $adminPass = New-Secret
        $mailerSecret = New-Secret
        @(
            "# Généré par setup-intervys.ps1 le $(Get-Date -Format o)",
            "PORT=$Port",
            "MAILER_SECRET=$mailerSecret",
            "PB_ADMIN_EMAIL=admin@intervys.local",
            "PB_ADMIN_PASSWORD=$adminPass"
        ) | Set-Content -Encoding ASCII ".env"
        Ok "Secrets générés dans $InstallDir\.env"
    }
    $envMap = @{}
    Get-Content ".env" | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object {
        $k, $v = $_ -split '=', 2; $envMap[$k] = $v
    }

    Say "Démarrage de la stack…"
    docker compose --project-name intervys --env-file .env up -d
    if ($LASTEXITCODE -ne 0) { Die "docker compose a échoué." }

    Say "Attente de l'API…"
    $ready = $false
    for ($i = 0; $i -lt 40; $i++) {
        try {
            Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 "http://127.0.0.1:$Port/api/setup-status" | Out-Null
            $ready = $true; break
        } catch { Start-Sleep -Seconds 3 }
    }
    if ($ready) { Ok "API en ligne" } else { Warn "API pas encore prête : docker compose -p intervys logs init pocketbase" }

    $url = "http://localhost$(if ($Port -ne 80) { ":$Port" })"
    Write-Host ""
    Write-Host "Intervys est installé dans $InstallDir" -ForegroundColor Green
    Write-Host "  Ouvrez         $url/            (l'assistant s'ouvre automatiquement)"
    Write-Host "  Admin          $($envMap['PB_ADMIN_EMAIL']) / $($envMap['PB_ADMIN_PASSWORD'])"
    Write-Host "  Console        $url/_/"
}

function Installer-Distant {
    if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
        Die "Client OpenSSH absent : Paramètres > Applications > Fonctionnalités facultatives > Client OpenSSH."
    }
    $hostIp  = Read-Host "Hôte ou IP du serveur"
    if (-not $hostIp) { Die "Hôte requis." }
    $user    = Read-Host "Utilisateur SSH [root]"; if (-not $user) { $user = "root" }
    $sshPort = Read-Host "Port SSH [22]";         if (-not $sshPort) { $sshPort = "22" }
    $remoteDir = Read-Host "Dossier d'installation sur le serveur [/opt/intervys]"
    if (-not $remoteDir) { $remoteDir = "/opt/intervys" }
    $target = "$user@$hostIp"

    Say "Test de la connexion SSH vers $target…"
    ssh -p $sshPort -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new $target "echo ok" | Out-Null
    if ($LASTEXITCODE -ne 0) { Die "Connexion SSH impossible (clé absente ? ssh-copy-id $target)." }
    Ok "SSH opérationnel"

    Say "Détection de Docker sur le serveur…"
    ssh -p $sshPort $target "command -v docker" 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Warn "Docker absent sur le serveur."
        $rep = Read-Host "L'installer à distance via get.docker.com ? [o/N]"
        if ($rep -match '^(o|O|y|Y)$') {
            ssh -p $sshPort $target "sudo sh -c 'curl -fsSL https://get.docker.com | sh'"
            if ($LASTEXITCODE -ne 0) { Die "Installation de Docker échouée sur le serveur." }
            Ok "Docker installé sur le serveur"
        } else { Die "Docker requis sur le serveur cible." }
    } else { Ok "Docker déjà présent" }

    Say "Copie de l'installateur…"
    $tmp = Join-Path $env:TEMP "intervys-install.sh"
    Invoke-WebRequest -UseBasicParsing "$ReleaseUrl/install.sh" -OutFile $tmp
    scp -P $sshPort -o ConnectTimeout=10 $tmp "${target}:/tmp/intervys-install.sh" | Out-Null

    Say "Installation à distance dans $remoteDir (port $Port)…"
    ssh -p $sshPort $target "sudo bash /tmp/intervys-install.sh --dir '$remoteDir' --port $Port"
    if ($LASTEXITCODE -ne 0) { Die "L'installation distante a échoué." }

    $suffix = if ($Port -ne 80) { ":$Port" } else { "" }
    Ok "Terminé. Ouvrez http://$hostIp$suffix/ — l'assistant s'ouvre automatiquement."
}

# ── Menu ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  Intervys — installation" -ForegroundColor White
Write-Host "  ─────────────────────────────────────────────"
Write-Host "   1) Sur ce PC Windows"
Write-Host "   2) Sur un serveur Linux distant (SSH)"
Write-Host "   q) Quitter"
Write-Host ""
$choix = Read-Host "Choix [1]"
switch ($choix) {
    "2"      { Installer-Distant }
    "q"      { exit 0 }
    "Q"      { exit 0 }
    default  { Installer-Local }
}
