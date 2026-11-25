<#
  setup-intervys-gui.ps1 — assistant d'installation Intervys, 100 % PowerShell.

  Aucun exécutable : rien à signer, rien à faire débloquer par Smart App Control.

  Interface :
      powershell -NoProfile -ExecutionPolicy Bypass -File .\setup-intervys-gui.ps1

  Sans interface (tests, serveur, ou appelé par l'interface elle-même) :
      .\setup-intervys-gui.ps1 -NoGui -Mode remote -HostName 1.2.3.4 -User root -Port 80
      .\setup-intervys-gui.ps1 -NoGui -DryRun -Mode local
#>
[CmdletBinding()]
param(
    [ValidateSet('local','remote')] [string]$Mode = 'local',
    [string]$HostName = '',
    [string]$User = 'root',
    [int]$SshPort = 22,
    [string]$RemoteDir = '/opt/intervys',
    [int]$Port = 80,
    [string]$ReleaseUrl = 'https://github.com/Intervys/app/releases/latest/download',
    [switch]$NoGui,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Write-Log {
    param([string]$Message, [ValidateSet('info','ok','warn','err','cmd')] [string]$Level = 'info')
    $line = switch ($Level) {
        'ok'   { "OK  $Message" }
        'warn' { "!   $Message" }
        'err'  { "X   $Message" }
        'cmd'  { "    $ $Message" }
        default { ">   $Message" }
    }
    Write-Host $line
}

# Exécute une commande externe et capture sa sortie ; en -DryRun, l'affiche seulement.
function Invoke-Step {
    param([string]$Exe, [string[]]$CmdArgs, [switch]$AllowFailure)
    if ($DryRun) { Write-Log "$Exe $($CmdArgs -join ' ')" 'cmd'; return @{ Ok = $true; Out = '' } }
    try {
        $out = & $Exe @CmdArgs 2>&1 | Out-String
        $code = $LASTEXITCODE
        if ($code -ne 0 -and -not $AllowFailure) { throw "$Exe a echoue (code $code) : $($out.Trim())" }
        return @{ Ok = ($code -eq 0); Out = $out }
    } catch {
        if ($AllowFailure) { return @{ Ok = $false; Out = "$_" } }
        throw
    }
}

function New-Secret {
    $bytes = New-Object byte[] 24
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return (($bytes | ForEach-Object { $_.ToString('x2') }) -join '')
}

function Install-IntervysLocal {
    param([int]$Port = 80, [string]$ReleaseUrl = 'https://github.com/Intervys/app/releases/latest/download')

    Write-Log "Cible : ce PC Windows"

    # Trois cas distincts : Docker absent, Docker present mais demon arrete, pret.
    $dockerCmd = [bool](Get-Command docker -ErrorAction SilentlyContinue)
    $dockerOk = $false
    if ($DryRun) {
        $dockerOk = $dockerCmd
    } elseif ($dockerCmd) {
        & docker info *> $null
        $dockerOk = ($LASTEXITCODE -eq 0)
    }

    if (-not $dockerCmd) {
        Write-Log "Docker absent : installation de Docker Desktop." 'warn'
        if (-not $DryRun -and -not (Get-Command winget -ErrorAction SilentlyContinue)) {
            throw "winget introuvable. Installez Docker Desktop depuis https://www.docker.com/products/docker-desktop/"
        }
        $null = Invoke-Step 'winget' @('install','-e','--silent','--accept-package-agreements','--accept-source-agreements','--id','Docker.DockerDesktop')
        Write-Log "Docker Desktop installe : demarrez-le puis relancez cet assistant." 'warn'
        return $null
    }
    if (-not $dockerOk) {
        throw "Docker est installe mais le service ne repond pas : demarrez Docker Desktop, attendez 'Engine running', puis relancez."
    }
    Write-Log "Docker operationnel" 'ok'

    # $env:ProgramData n'existe que sous Windows ; repli sur le dossier temporaire
    # pour permettre l'exécution en -NoGui/-DryRun ailleurs.
    $baseDir = if ($env:ProgramData) { $env:ProgramData } else { [IO.Path]::GetTempPath() }
    $dir = Join-Path $baseDir 'Intervys'
    if (-not $DryRun) {
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        Set-Location $dir
    }

    $compose = Join-Path $dir 'docker-compose.yml'
    if ($DryRun) {
        Write-Log "telechargerait $ReleaseUrl/docker-compose.install.yml vers $compose" 'cmd'
    } elseif (-not (Test-Path $compose)) {
        Write-Log "Telechargement du fichier compose"
        Invoke-WebRequest -UseBasicParsing "$ReleaseUrl/docker-compose.install.yml" -OutFile $compose
    }

    $envFile = Join-Path $dir '.env'
    $adminPass = New-Secret
    if ($DryRun) {
        Write-Log "ecrirait $envFile (PORT=$Port, MOT DE PASSE genere)" 'cmd'
    } elseif (Test-Path $envFile) {
        Write-Log ".env existant conserve" 'ok'
    } else {
        @(
            "# Genere par setup-intervys-gui.ps1 le $(Get-Date -Format o)"
            "PORT=$Port"
            "MAILER_SECRET=$(New-Secret)"
            "PB_ADMIN_EMAIL=admin@intervys.local"
            "PB_ADMIN_PASSWORD=$adminPass"
        ) | Set-Content -Encoding ASCII $envFile
        Write-Log "Secrets generes dans $envFile" 'ok'
    }

    $null = Invoke-Step 'docker' @('compose','--project-name','intervys','--env-file','.env','up','-d')

    Write-Log "Attente de l'API (max 2 min)"
    $ready = $false
    if ($DryRun) { $ready = $true }
    else {
        for ($i = 0; $i -lt 40; $i++) {
            try {
                Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 "http://127.0.0.1:$Port/api/setup-status" | Out-Null
                $ready = $true; break
            } catch { Start-Sleep -Seconds 3 }
        }
    }
    if ($ready) { Write-Log "API en ligne" 'ok' }
    else { Write-Log "API pas encore prete : docker compose -p intervys logs init pocketbase" 'warn' }

    $url = "http://localhost$(if ($Port -ne 80) { ":$Port" })"
    Write-Log "Ouvrez $url/ - l'assistant de configuration s'ouvre automatiquement" 'ok'
    return "$url/"
}

function Install-IntervysRemote {
    param(
        [string]$HostName,
        [string]$User = 'root',
        [int]$SshPort = 22,
        [string]$RemoteDir = '/opt/intervys',
        [int]$Port = 80,
        [string]$ReleaseUrl = 'https://github.com/Intervys/app/releases/latest/download'
    )

    if (-not $HostName) { throw "Hote du serveur requis." }
    $target = "$User@$HostName"
    $ssh = @('-p', "$SshPort", '-o', 'ConnectTimeout=10', '-o', 'StrictHostKeyChecking=accept-new', $target)

    Write-Log "Test de la connexion SSH vers $target"
    $probe = Invoke-Step 'ssh' ($ssh + @('echo ok')) -AllowFailure
    if (-not $probe.Ok) { throw "Connexion SSH impossible (cle absente ? ssh-copy-id $target)" }
    Write-Log "SSH operationnel" 'ok'

    Write-Log "Detection de Docker sur le serveur"
    $docker = Invoke-Step 'ssh' ($ssh + @('command -v docker')) -AllowFailure
    if (-not $docker.Ok) {
        Write-Log "Docker absent : installation via get.docker.com" 'warn'
        $null = Invoke-Step 'ssh' ($ssh + @('sudo sh -c "curl -fsSL https://get.docker.com | sh"'))
        Write-Log "Docker installe sur le serveur" 'ok'
    } else { Write-Log "Docker deja present" 'ok' }

    $tmp = Join-Path ([IO.Path]::GetTempPath()) 'intervys-install.sh'
    if ($DryRun) {
        Write-Log "telechargerait $ReleaseUrl/install.sh vers $tmp" 'cmd'
    } else {
        Write-Log "Telechargement de install.sh"
        Invoke-WebRequest -UseBasicParsing "$ReleaseUrl/install.sh" -OutFile $tmp
    }
    $null = Invoke-Step 'scp' @('-P', "$SshPort", '-o', 'ConnectTimeout=10', $tmp, "${target}:/tmp/intervys-install.sh")

    Write-Log "Installation dans $RemoteDir (port $Port)"
    $null = Invoke-Step 'ssh' ($ssh + @("sudo bash /tmp/intervys-install.sh --dir '$RemoteDir' --port '$Port'"))

    $suffix = if ($Port -ne 80) { ":$Port" } else { '' }
    $url = "http://$HostName$suffix"
    Write-Log "Termine. Ouvrez $url/ - l'assistant s'ouvre automatiquement" 'ok'
    return "$url/"
}

function Start-Install {
    param([hashtable]$Config)
    try {
        if ($Config.Mode -eq 'remote') {
            return Install-IntervysRemote -HostName $Config.HostName -User $Config.User -SshPort $Config.SshPort `
                -RemoteDir $Config.RemoteDir -Port $Config.Port -ReleaseUrl $Config.ReleaseUrl
        }
        return Install-IntervysLocal -Port $Config.Port -ReleaseUrl $Config.ReleaseUrl
    } catch {
        Write-Log "$_" 'err'
        return $null
    }
}

# ── Mode sans interface ─────────────────────────────────────────────────────
if ($NoGui -or $DryRun) {
    $null = Start-Install -Config @{
        Mode = $Mode; HostName = $HostName; User = $User; SshPort = $SshPort
        RemoteDir = $RemoteDir; Port = $Port; ReleaseUrl = $ReleaseUrl
    }
    exit 0
}

# ── Interface WinForms ──────────────────────────────────────────────────────
# Tout est dans une fonction : les types System.Drawing ne sont résolus qu'à
# l'appel, ce qui permet d'exécuter le script en -NoGui sur Linux/macOS
# (System.Drawing.Common y lève PlatformNotSupportedException au chargement).
function Show-Gui {
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$form               = New-Object System.Windows.Forms.Form
$form.Text          = "Intervys - installation"
$form.ClientSize    = New-Object System.Drawing.Size(740, 600)
$form.StartPosition = 'CenterScreen'
$form.BackColor     = [System.Drawing.Color]::FromArgb(7, 9, 14)
$form.ForeColor     = [System.Drawing.Color]::FromArgb(221, 230, 240)
$form.Font          = New-Object System.Drawing.Font('Segoe UI', 9.5)
$form.FormBorderStyle = 'FixedSingle'
$form.MaximizeBox   = $false

$title              = New-Object System.Windows.Forms.Label
$title.Text         = "Installation d'Intervys"
$title.Font         = New-Object System.Drawing.Font('Segoe UI', 15, [System.Drawing.FontStyle]::Bold)
$title.ForeColor    = [System.Drawing.Color]::FromArgb(30, 144, 255)
$title.SetBounds(24, 16, 500, 32)
$form.Controls.Add($title)

$sub                = New-Object System.Windows.Forms.Label
$sub.Text           = "Choisissez la cible puis lancez : l'assistant de configuration s'ouvrira dans le navigateur."
$sub.ForeColor      = [System.Drawing.Color]::FromArgb(143, 168, 192)
$sub.SetBounds(24, 50, 690, 20)
$form.Controls.Add($sub)

$rdoLocal           = New-Object System.Windows.Forms.RadioButton
$rdoLocal.Text      = "Sur ce PC Windows (Docker Desktop)"
$rdoLocal.Checked   = $true
$rdoLocal.SetBounds(24, 82, 330, 22)
$form.Controls.Add($rdoLocal)

$rdoRemote          = New-Object System.Windows.Forms.RadioButton
$rdoRemote.Text     = "Sur un serveur Linux distant (SSH)"
$rdoRemote.SetBounds(24, 106, 330, 22)
$form.Controls.Add($rdoRemote)

$lblHost            = New-Object System.Windows.Forms.Label
$lblHost.Text       = "Hote / IP"
$lblHost.SetBounds(46, 140, 90, 20)
$form.Controls.Add($lblHost)
$txtHost            = New-Object System.Windows.Forms.TextBox
$txtHost.SetBounds(140, 138, 220, 24)
$form.Controls.Add($txtHost)

$lblUser            = New-Object System.Windows.Forms.Label
$lblUser.Text       = "Utilisateur"
$lblUser.SetBounds(378, 140, 80, 20)
$form.Controls.Add($lblUser)
$txtUser            = New-Object System.Windows.Forms.TextBox
$txtUser.Text       = "root"
$txtUser.SetBounds(460, 138, 120, 24)
$form.Controls.Add($txtUser)

$lblPort            = New-Object System.Windows.Forms.Label
$lblPort.Text       = "Port HTTP"
$lblPort.SetBounds(46, 172, 90, 20)
$form.Controls.Add($lblPort)
$numPort            = New-Object System.Windows.Forms.NumericUpDown
$numPort.Minimum    = 1
$numPort.Maximum    = 65535
$numPort.Value      = 80
$numPort.SetBounds(140, 170, 80, 24)
$form.Controls.Add($numPort)

$lblDir             = New-Object System.Windows.Forms.Label
$lblDir.Text        = "Dossier distant"
$lblDir.SetBounds(240, 172, 100, 20)
$form.Controls.Add($lblDir)
$txtDir             = New-Object System.Windows.Forms.TextBox
$txtDir.Text        = "/opt/intervys"
$txtDir.SetBounds(345, 170, 235, 24)
$form.Controls.Add($txtDir)

$btnInstall         = New-Object System.Windows.Forms.Button
$btnInstall.Text    = "Installer"
$btnInstall.Size    = New-Object System.Drawing.Size(170, 34)
$btnInstall.Location = New-Object System.Drawing.Point(24, 210)
$btnInstall.BackColor = [System.Drawing.Color]::FromArgb(30, 144, 255)
$btnInstall.ForeColor = [System.Drawing.Color]::FromArgb(4, 16, 29)
$btnInstall.FlatStyle = 'Flat'
$form.Controls.Add($btnInstall)

$btnOpen            = New-Object System.Windows.Forms.Button
$btnOpen.Text       = "Ouvrir l'assistant"
$btnOpen.Size       = New-Object System.Drawing.Size(170, 34)
$btnOpen.Location   = New-Object System.Drawing.Point(206, 210)
$btnOpen.Enabled    = $false
$form.Controls.Add($btnOpen)

$log                = New-Object System.Windows.Forms.RichTextBox
$log.SetBounds(24, 258, 692, 316)
$log.ReadOnly       = $true
$log.BackColor      = [System.Drawing.Color]::FromArgb(15, 21, 32)
$log.ForeColor      = [System.Drawing.Color]::FromArgb(221, 230, 240)
$log.Font           = New-Object System.Drawing.Font('Consolas', 9)
$log.BorderStyle    = 'FixedSingle'
$form.Controls.Add($log)

function Update-Fields {
    $remote = $rdoRemote.Checked
    $txtHost.Enabled = $remote
    $txtUser.Enabled = $remote
    $txtDir.Enabled  = $remote
}
$rdoLocal.Add_CheckedChanged({ Update-Fields })
$rdoRemote.Add_CheckedChanged({ Update-Fields })
Update-Fields

# Le travail est lancé dans un processus enfant (même script, -NoGui) : la sortie
# est redirigée vers un fichier que le timer lit au fil de l'eau. Pas de runspace,
# donc pas de sérialisation ni de blocage du message pump.
$script:LogFile = Join-Path ([IO.Path]::GetTempPath()) 'intervys-setup.log'
$script:LogPos  = 0
$script:Proc    = $null
$script:Url     = $null

$timer          = New-Object System.Windows.Forms.Timer
$timer.Interval = 250
$timer.Add_Tick({
    if (Test-Path $script:LogFile) {
        try {
            $fs = [IO.File]::Open($script:LogFile, 'Open', 'Read', 'ReadWrite')
            $null = $fs.Seek($script:LogPos, 'Begin')
            $sr = New-Object IO.StreamReader($fs)
            $chunk = $sr.ReadToEnd()
            $script:LogPos = $fs.Position
            $sr.Close(); $fs.Close()
            if ($chunk) { $log.AppendText($chunk); $log.ScrollToCaret() }
        } catch { }
    }
    if ($script:Proc -and $script:Proc.HasExited) {
        $script:Proc = $null
        $btnInstall.Enabled = $true
        if (-not $script:Url) {
            $m = [regex]::Match($log.Text, 'http://\S+?/\s*$', 'Multiline')
            if ($m.Success) { $script:Url = $m.Value.Trim() }
        }
        if ($script:Url) { $btnOpen.Enabled = $true }
    }
})
$timer.Start()

$btnInstall.Add_Click({
    $btnInstall.Enabled = $false
    $btnOpen.Enabled    = $false
    $log.Clear()
    $script:Url = $null
    $script:LogPos = 0
    Remove-Item $script:LogFile -ErrorAction SilentlyContinue

    $mode = if ($rdoRemote.Checked) { 'remote' } else { 'local' }
    $childArgs = @(
        '-NoProfile','-ExecutionPolicy','Bypass','-File', "`"$PSCommandPath`"",
        '-NoGui','-Mode',$mode,
        '-Port', [int]$numPort.Value,
        '-ReleaseUrl', "`"$ReleaseUrl`""
    )
    if ($mode -eq 'remote') {
        $childArgs += @('-HostName', "`"$($txtHost.Text.Trim())`"", '-User', "`"$($txtUser.Text.Trim())`"", '-RemoteDir', "`"$($txtDir.Text.Trim())`"")
        if (-not $txtHost.Text.Trim()) {
            $log.AppendText("X   Renseignez l'hote du serveur.`r`n")
            $btnInstall.Enabled = $true
            return
        }
    }

    $script:Proc = Start-Process -FilePath 'powershell.exe' -ArgumentList $childArgs `
        -NoNewWindow -PassThru `
        -RedirectStandardOutput $script:LogFile
})

$btnOpen.Add_Click({
    if ($script:Url) { Start-Process $script:Url }
})

[void]$form.ShowDialog()
}

if (-not ($NoGui -or $DryRun)) { Show-Gui }
