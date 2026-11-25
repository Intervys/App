#!/usr/bin/env bash
# ============================================================================
# prepare-client.sh — rend une copie d'Intervys prête pour un client.
# Usage : ./prepare-client.sh <domaine-vitrine> <domaine-app> <email-contact> [prefixe]
# Ex.   : ./prepare-client.sh intervys.fr app.intervys.fr contact@intervys.fr intervys
#
# Réécrit : liens et e-mails de la vitrine, valeurs par défaut de l'app,
#           e-mail admin par défaut du compose, et préfixe des conteneurs
#           Docker (plus de collision entre deux installations sur le même
#           serveur) — y compris dans le payload de l'installeur Windows.
# Sauvegarde horodatée dans _bak/prepare-<AAAAMMJJHHMMSS>/ avant toute écriture.
# ============================================================================
set -euo pipefail

SITE_DOMAIN="${1:?domaine vitrine requis}"
APP_DOMAIN="${2:?domaine app requis}"
CONTACT="${3:?email de contact requis}"
PREFIX="${4:-$(echo "$SITE_DOMAIN" | cut -d. -f1)}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
STAMP="$(date +%Y%m%d%H%M%S)"
BAK="$ROOT/_bak/prepare-$STAMP"

echo "→ domaine vitrine : $SITE_DOMAIN"
echo "→ domaine app     : $APP_DOMAIN"
echo "→ contact         : $CONTACT"
echo "→ préfixe docker  : $PREFIX"

# 1. Sauvegarde de tout ce qui va être modifié -------------------------------
mkdir -p "$BAK/payload"
cp -a "$ROOT/vitrine" "$ROOT/app" "$BAK/" 2>/dev/null || true
mkdir -p "$BAK/pocketbase"; cp -a "$ROOT/pocketbase/hooks" "$BAK/pocketbase/" 2>/dev/null || true
cp -a "$ROOT"/docker-compose*.yml "$BAK/" 2>/dev/null || true
cp -a "$ROOT/nginx.conf" "$BAK/" 2>/dev/null || true
for p in app vitrine hooks; do
    [ -e "$ROOT/setup/src/payload/$p" ] && cp -a "$ROOT/setup/src/payload/$p" "$BAK/payload/" || true
done
echo "→ sauvegarde dans _bak/prepare-$STAMP"

# 2. Domaines, sous-domaines et e-mails d'exemple ---------------------------
# L'ordre compte : l'e-mail avant les règles de domaine nues, sinon
# « contact@intervys.fr » devient « contact@<site> » et ne matche plus.
rewrite_values() {
    [ -f "$1" ] || return 0
    sed -i \
        -e "s#admin@Intervys\.local#$CONTACT#g" \
        -e "s#admin@intervys\.local#$CONTACT#g" \
        -e "s#contact@intervys\.fr#$CONTACT#g" \
        -e "s#https://app\.intervys\.fr#https://$APP_DOMAIN#g" \
        -e "s#https://Intervys\.local/app#https://$APP_DOMAIN/app#g" \
        -e "s#https://Intervys\.local#https://$SITE_DOMAIN#g" \
        -e "s#https://intervys\.local#https://$SITE_DOMAIN#g" \
        -e "s#Intervys\.local#$SITE_DOMAIN#g" \
        -e "s#intervys\.local#$SITE_DOMAIN#g" \
        -e "s#intervys\.fr#$SITE_DOMAIN#g" "$1"
}

targets=()
while IFS= read -r -d '' f; do targets+=("$f"); done < <(
    find "$ROOT/vitrine" "$ROOT/setup/src/payload/vitrine" -name '*.html' -print0 2>/dev/null
)
while IFS= read -r -d '' f; do targets+=("$f"); done < <(
    find "$ROOT/app" "$ROOT/setup/src/payload/app" -name '*.js' ! -name '*.min.js' -print0 2>/dev/null
)
for f in "$ROOT"/docker-compose*.yml "$ROOT/nginx.conf" "$ROOT/vitrine/nginx.conf" \
         "$ROOT/pocketbase/hooks/main.pb.js" "$ROOT/setup/src/payload/hooks/main.pb.js" \
         "$ROOT/app/index.html"; do
    [ -f "$f" ] && targets+=("$f")
done
for f in "${targets[@]}"; do rewrite_values "$f"; done
echo "→ domaines et e-mails réécrits (${#targets[@]} fichiers : vitrine, app, compose, hooks)"

# 3. Docker : préfixe des conteneurs et du mailer ----------------------------
prefix_docker() {
    [ -f "$1" ] || return 0
    sed -i -e "s#Intervys_#${PREFIX}_#g" "$1"
}
for f in "$ROOT"/docker-compose*.yml "$ROOT/nginx.conf" "$ROOT/vitrine/nginx.conf" \
         "$ROOT/pocketbase/hooks/main.pb.js" \
         "$ROOT/setup/src/payload/hooks/main.pb.js"; do
    prefix_docker "$f"
done
# L'installeur génère son compose en minuscules : ne toucher QUE les noms de
# conteneurs (intervys_lnk.vbs et intervys_lnk_status.txt doivent rester intacts).
if [ -f "$ROOT/setup/src-tauri/src/main.rs" ]; then
    sed -i -e "s#intervys_app#${PREFIX}_app#g" \
           -e "s#intervys_pocketbase#${PREFIX}_pocketbase#g" \
           "$ROOT/setup/src-tauri/src/main.rs"
fi
echo "→ docker : conteneurs préfixés '${PREFIX}_' (compose, nginx, hooks, installeur)"

# 4. Contrôle : plus aucune valeur d'exemple --------------------------------
leftovers="$(grep -rn "Intervys\.local\|intervys\.local\|intervys\.fr" \
    "$ROOT/vitrine" "$ROOT/app" "$ROOT/pocketbase/hooks" \
    "$ROOT"/docker-compose*.yml "$ROOT/nginx.conf" 2>/dev/null \
    | grep -v "/_bak/" | grep -v "\.bak-" || true)"
if [ -n "$leftovers" ]; then
    echo "⚠ valeurs d'exemple restantes (à vérifier manuellement) :"
    echo "$leftovers" | sed 's/^/    /'
else
    echo "→ contrôle : aucune valeur d'exemple restante"
fi

cat <<TXT

Terminé. Étapes restantes, manuelles :
  1. Copier ce dossier sur le serveur du client (stack Docker à côté du site)
  2. docker compose --project-name $PREFIX up -d
  3. Ouvrir https://$APP_DOMAIN/_/         → créer le superutilisateur PocketBase
  4. Ouvrir https://$APP_DOMAIN/setup.html → assistant d'installation (6 étapes)
  5. Vérifier les textes et mentions légales de la vitrine
TXT
