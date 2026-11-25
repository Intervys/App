#!/usr/bin/env bash
# ============================================================================
# Intervys — installation serveur en une commande.
#
#   curl -fsSL https://github.com/Intervys/app/releases/latest/download/install.sh | bash
#   curl -fsSL .../install.sh | bash -s -- --port 8080 --dir /srv/intervys
#
# Prérequis : Docker + plugin docker compose (le script vérifie et explique).
# Ce que fait le script :
#   1. crée le dossier d'installation et y écrit docker-compose.yml
#   2. génère les secrets (mailer, mot de passe admin) dans .env
#   3. démarre la stack (le conteneur init télécharge l'application)
#   4. attend que l'API réponde
#   5. affiche l'URL à ouvrir → l'assistant /setup.html s'ouvre tout seul
# ============================================================================
set -euo pipefail

PORT_CLI=""
PORT="${PORT:-80}"
DIR="${DIR:-/opt/intervys}"
ADMIN_EMAIL="${PB_ADMIN_EMAIL:-admin@intervys.local}"
PROJECT="${PROJECT:-intervys}"
WAIT="${WAIT_SECONDS:-180}"
COMPOSE_URL="${COMPOSE_URL:-https://github.com/Intervys/app/releases/latest/download/docker-compose.install.yml}"

while [ $# -gt 0 ]; do
    case "$1" in
        --port)    PORT="$2"; PORT_CLI="$2"; shift 2 ;;
        --dir)     DIR="$2"; shift 2 ;;
        --email)   ADMIN_EMAIL="$2"; shift 2 ;;
        --project) PROJECT="$2"; shift 2 ;;
        -h|--help) sed -n '2,18p' "$0"; exit 0 ;;
        *) echo "Option inconnue : $1"; exit 1 ;;
    esac
done

say()  { printf '\033[1;34m▸\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m✓\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

# ── 0. Prérequis ─────────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || die "Docker n'est pas installé. Installez-le :
  Debian/Ubuntu : curl -fsSL https://get.docker.com | sh
  Windows/macOS : Docker Desktop"
docker compose version >/dev/null 2>&1 || die "Le plugin 'docker compose' est absent (paquet docker-compose-plugin)."
docker info >/dev/null 2>&1 || die "Le démon Docker ne répond pas (droits ? lancez avec sudo ou ajoutez l'utilisateur au groupe docker)."
ok "Docker $(docker version --format '{{.Server.Version}}' 2>/dev/null || echo présent) et docker compose disponibles"

# ── 1. Dossier d'installation ────────────────────────────────────────────────
mkdir -p "$DIR" 2>/dev/null || die "Impossible de créer $DIR (droits insuffisants). Relancez avec sudo ou passez --dir <chemin accessible>."
cd "$DIR" || die "Dossier inaccessible : $DIR"

if [ -f docker-compose.yml ]; then
    say "docker-compose.yml déjà présent, conservé ($(pwd)/docker-compose.yml)"
else
    say "Téléchargement du fichier compose…"
    curl -fsSL "$COMPOSE_URL" -o docker-compose.yml \
        || die "Téléchargement impossible : $COMPOSE_URL"
fi

# ── 2. Secrets ───────────────────────────────────────────────────────────────
gen_secret() {
    if command -v openssl >/dev/null 2>&1; then openssl rand -hex 24
    else head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n'; fi
}

if [ -f .env ]; then
    say ".env existant conservé (secrets inchangés)"
    # shellcheck disable=SC1091
    set -a; . ./.env; set +a
    ADMIN_EMAIL="${PB_ADMIN_EMAIL:-$ADMIN_EMAIL}"
    ADMIN_PASSWORD="${PB_ADMIN_PASSWORD:-}"
    if [ -n "$PORT_CLI" ] && [ "$PORT_CLI" != "${PORT:-80}" ]; then
        sed -i "s/^PORT=.*/PORT=$PORT_CLI/" .env
        PORT="$PORT_CLI"
        say "Port mis à jour dans .env : $PORT"
    else
        PORT="${PORT:-80}"
    fi
else
    ADMIN_PASSWORD="$(gen_secret)"
    MAILER_SECRET="$(gen_secret)"
    cat > .env <<ENV
# Généré par install.sh le $(date -u +%Y-%m-%dT%H:%M:%SZ)
PORT=$PORT
PROJECT_NAME=$PROJECT
MAILER_SECRET=$MAILER_SECRET
PB_ADMIN_EMAIL=$ADMIN_EMAIL
PB_ADMIN_PASSWORD=$ADMIN_PASSWORD
ENV
    chmod 600 .env
    ok "Secrets générés dans $DIR/.env (chmod 600)"
fi

# ── 3. Démarrage ─────────────────────────────────────────────────────────────
say "Démarrage de la stack (projet « $PROJECT »)…"
docker compose --project-name "$PROJECT" --env-file .env up -d

# ── 4. Attente de l'API ──────────────────────────────────────────────────────
say "Attente de l'API (max ${WAIT}s)…"
deadline=$(( $(date +%s) + WAIT ))
status=""
while [ "$(date +%s)" -lt "$deadline" ]; do
    status="$(curl -fsS -m 3 "http://127.0.0.1:${PORT}/api/setup-status" 2>/dev/null || true)"
    [ -n "$status" ] && break
    sleep 3
done

if [ -z "$status" ]; then
    printf '\033[1;33m⚠\033[0m L’API ne répond pas encore. Vérifiez : docker compose -p %s logs init pocketbase\n' "$PROJECT"
else
    ok "API en ligne — état d'installation : $status"
fi

# ── 5. Récapitulatif ─────────────────────────────────────────────────────────
HOST="$(hostname -I 2>/dev/null | awk '{print $1}')"; [ -n "$HOST" ] || HOST="localhost"
PORT_SUFFIX=""; [ "$PORT" = "80" ] || PORT_SUFFIX=":$PORT"

cat <<TXT

────────────────────────────────────────────────────────────
 Intervys est installé dans $DIR

 1. Ouvrez          http://$HOST$PORT_SUFFIX/
    → l'assistant de configuration s'ouvre automatiquement
      (ou directement /setup.html)

 2. Compte administrateur créé au démarrage :
      e-mail          : $ADMIN_EMAIL
      mot de passe    : ${ADMIN_PASSWORD:-(déjà défini dans .env)}

 3. Console PocketBase : http://$HOST$PORT_SUFFIX/_/

 Commandes utiles :
   cd $DIR && docker compose -p $PROJECT ps
   cd $DIR && docker compose -p $PROJECT logs -f pocketbase
   cd $DIR && docker compose -p $PROJECT down        # arrêt
────────────────────────────────────────────────────────────
TXT
