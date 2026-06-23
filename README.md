# Intervys

**Plateforme de gestion d'interventions pour artisans et prestataires de services.**

Intervys est une solution complète et auto-hébergée qui permet aux artisans de gérer leurs clients, interventions, devis, factures et communications — sans abonnement, sans cloud tiers, avec leurs données chez eux.

---

## Fonctionnalités

- **Gestion des interventions** — suivi en temps réel du statut, priorité, historique
- **Espace client** — portail dédié avec accès par mot de passe, messagerie intégrée
- **Devis & Facturation** — génération PDF, format Factur-X, envoi par email
- **Vitrine personnalisable** — site public adapté à votre métier (plombier, électricien, menuisier, mécanicien…)
- **Multi-thèmes métier** — interface et vocabulaire adaptés automatiquement
- **Envoi d'emails** — via votre propre serveur SMTP, aucun service tiers
- **100 % auto-hébergé** — vos données restent sur votre machine ou votre serveur

---

## Installation

### Windows (recommandé pour les artisans)

1. Télécharger **[Intervys-setup.exe](https://github.com/Intervys/app/releases/latest/download/Intervys-setup.exe)**
2. Lancer l'exécutable et suivre l'assistant d'installation
3. Intervys démarre automatiquement avec Windows

> L'installeur configure PocketBase, le mailer, les raccourcis bureau et le démarrage automatique.

---

### Docker / VPS (pour les hébergements serveur)

**Installation en une commande :**

```bash
curl -fsSL https://github.com/Intervys/app/releases/latest/download/docker-compose.install.yml \
     -o docker-compose.yml && docker compose up -d
```

**Configuration optionnelle (fichier `.env`) :**

```env
PORT=80
MAILER_SECRET=votre-secret
PB_ADMIN_EMAIL=admin@votre-domaine.fr
PB_ADMIN_PASSWORD=votre-mot-de-passe
```

Accessible sur `http://localhost` après le démarrage.

---

## Architecture

```
Intervys/
├── app/                  # Interface admin (SPA vanilla JS + PocketBase)
├── vitrine/              # Site public client (HTML/CSS statique)
├── mailer/               # Service d'envoi d'emails (Node.js)
├── pocketbase/
│   ├── migrations/       # Schéma de base de données
│   └── hooks/            # Logique serveur (JS hooks PocketBase)
├── setup/                # Installeur Windows (Tauri v2 / Rust)
├── docker-compose.yml          # Stack Docker pour serveur existant
└── docker-compose.install.yml  # Stack Docker auto-installante (one-liner)
```

**Stack technique :**
- [PocketBase](https://pocketbase.io) — backend, API REST, base de données SQLite
- [Tauri v2](https://tauri.app) — installeur et contrôleur Windows natif (Rust)
- [Node.js](https://nodejs.org) + [Nodemailer](https://nodemailer.com) — service email
- Nginx — reverse proxy et serveur de fichiers statiques

---

## Déploiement derrière un reverse proxy

La stack Docker expose un seul port HTTP (80 par défaut). Compatible avec **Nginx Proxy Manager**, **Traefik**, **Caddy** ou tout autre reverse proxy.

Exemple avec un réseau externe existant — remplacer dans `docker-compose.yml` :

```yaml
networks:
  Intervys:
    external: true
    name: nginx-proxy-manager_default
```

---

## Licence

MIT — libre d'utilisation, de modification et de redistribution.
