#!/bin/bash
set -e

echo ""
echo "  ██ Intervys — Setup Docker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Créer .env depuis l'exemple si absent
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "  ✎  .env créé — éditez-le avant de continuer:"
    echo "     - MAILER_SECRET   : token partagé (gardez-le secret)"
    echo "     - PB_ADMIN_EMAIL  : email du compte superadmin"
    echo "     - PB_ADMIN_PASSWORD : mot de passe (8 caractères min)"
    echo ""
    echo "  Puis relancez : bash setup.sh"
    exit 0
fi

source .env

# Créer le répertoire de données PocketBase
mkdir -p pocketbase/data

echo "  ▶  Démarrage de la stack…"
docker compose up -d

echo "  ⏳  Attente démarrage PocketBase (10s)…"
sleep 10

echo "  👤  Création du compte superadmin…"
docker exec Intervys_pocketbase /pb/pocketbase superuser upsert \
    "${PB_ADMIN_EMAIL}" "${PB_ADMIN_PASSWORD}" --dir=/pb_data && \
    echo "  ✓  Compte créé : ${PB_ADMIN_EMAIL}" || \
    echo "  ℹ  Compte déjà existant ou mise à jour ignorée."

echo ""
echo "  ✅  Intervys est prêt !"
echo "      Site     : http://localhost:${PORT:-80}"
echo "      Admin    : http://localhost:${PORT:-80}/app/#/admin-login"
echo "      PB admin : http://localhost:${PORT:-80}/_/"
echo ""
