#!/usr/bin/env bash
# ============================================================================
# setup-intervys.sh — lanceur d'installation Intervys (Linux / macOS / WSL).
#
#   bash setup-intervys.sh
#
# Deux cibles :
#   1) cette machine        → vérifie/installe Docker, puis installe Intervys ici
#   2) serveur Linux distant → se connecte en SSH, installe Docker si absent,
#                              copie install.sh et l'exécute à distance
#
# L'installation se termine toujours sur l'assistant : http(s)://<hôte>/setup.html
# ============================================================================
set -euo pipefail

RELEASE="${RELEASE:-https://github.com/Intervys/app/releases/latest/download}"
REMOTE_DIR="${REMOTE_DIR:-/opt/intervys}"
PORT="${PORT:-80}"

say()  { printf '\033[1;34m▸\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m✓\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m⚠\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

need() { command -v "$1" >/dev/null 2>&1 || die "$1 est requis mais absent."; }

install_docker_local() {
    say "Installation de Docker (script officiel get.docker.com)…"
    if [ "$(id -u)" -eq 0 ]; then
        curl -fsSL https://get.docker.com | sh
    else
        sudo sh -c 'curl -fsSL https://get.docker.com | sh'
    fi
    command -v docker >/dev/null 2>&1 || die "Docker reste introuvable après installation."
    ok "Docker installé"
}

installer_local() {
    need curl
    if ! command -v docker >/dev/null 2>&1; then
        warn "Docker n'est pas installé sur cette machine."
        read -r -p "L'installer maintenant via get.docker.com ? [o/N] " rep
        case "$rep" in o|O|y|Y) install_docker_local ;; *) die "Docker requis pour continuer." ;; esac
    fi
    docker compose version >/dev/null 2>&1 || die "Plugin 'docker compose' absent (paquet docker-compose-plugin)."
    say "Téléchargement de l'installateur…"
    curl -fsSL "$RELEASE/install.sh" -o /tmp/intervys-install.sh \
        || die "Téléchargement impossible : $RELEASE/install.sh"
    bash /tmp/intervys-install.sh --port "$PORT" ${DIR:+--dir "$DIR"}
}

ask() { # $1 = libellé, $2 = défaut
    local v
    read -r -p "$1${2:+ [$2]}: " v
    printf '%s' "${v:-$2}"
}

installer_distant() {
    need ssh; need scp
    local host user port pass_dir target
    host="$(ask 'Hôte ou IP du serveur' '')"
    [ -n "$host" ] || die "Hôte requis."
    user="$(ask 'Utilisateur SSH' 'root')"
    port="$(ask 'Port SSH' '22')"
    pass_dir="$(ask 'Dossier d’installation sur le serveur' "$REMOTE_DIR")"
    target="$user@$host"
    local opts=(-p "$port" -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)

    say "Test de la connexion SSH vers $target…"
    ssh "${opts[@]}" "$target" 'echo ok' >/dev/null 2>&1 \
        || die "Connexion SSH impossible (clé absente ? utilisez ssh-copy-id $target)."
    ok "SSH opérationnel"

    say "Détection de Docker sur le serveur…"
    if ! ssh "${opts[@]}" "$target" 'command -v docker' >/dev/null 2>&1; then
        warn "Docker absent sur le serveur."
        read -r -p "L'installer à distance via get.docker.com ? [o/N] " rep
        case "$rep" in
            o|O|y|Y)
                ssh "${opts[@]}" "$target" 'sudo sh -c "curl -fsSL https://get.docker.com | sh"' \
                    || die "Installation de Docker échouée sur le serveur."
                ok "Docker installé sur le serveur" ;;
            *) die "Docker requis sur le serveur cible." ;;
        esac
    else
        ok "Docker déjà présent"
    fi

    ssh "${opts[@]}" "$target" 'docker compose version' >/dev/null 2>&1 \
        || warn "Plugin 'docker compose' incertain — vérifiez sur le serveur."

    say "Copie de l'installateur sur le serveur…"
    curl -fsSL "$RELEASE/install.sh" -o /tmp/intervys-install.sh \
        || die "Téléchargement impossible : $RELEASE/install.sh"
    scp -P "$port" -o ConnectTimeout=10 /tmp/intervys-install.sh "$target:/tmp/intervys-install.sh" >/dev/null

    say "Installation à distance dans $pass_dir (port $PORT)…"
    ssh "${opts[@]}" "$target" "sudo bash /tmp/intervys-install.sh --dir '$pass_dir' --port '$PORT'" \
        || die "L'installation distante a échoué (journal ci-dessus)."

    local suffix=""; [ "$PORT" = "80" ] || suffix=":$PORT"
    ok "Terminé. Ouvrez http://$host$suffix/ — l'assistant s'ouvre automatiquement."
}

# ── Menu ────────────────────────────────────────────────────────────────────
cat <<'TXT'
┌──────────────────────────────────────────────┐
│  Intervys — installation                      │
├──────────────────────────────────────────────┤
│  1) Sur cette machine                         │
│  2) Sur un serveur Linux distant (SSH)        │
│  q) Quitter                                   │
└──────────────────────────────────────────────┘
TXT
read -r -p "Choix [1] : " choix
case "${choix:-1}" in
    1) installer_local ;;
    2) installer_distant ;;
    q|Q) exit 0 ;;
    *) die "Choix invalide." ;;
esac
