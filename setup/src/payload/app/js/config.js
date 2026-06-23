// ── config.js ──
// URL de l'API PocketBase (adapter si besoin)
const SITE_NAME = 'Intervys';
const PB_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8090'
  : window.location.origin; // Même origine → pas de CORS (app. ou admin.)

// Labels lisibles
const SERVICE_LABELS = {
  depannage:    'Dépannage informatique',
  reseau:       'Réseau & WiFi',
  domotique:    'Domotique',
  serveur:      'Serveur',
  multimedia:   'Multimédia',
  electronique: 'Électronique',
  gaming:       'Gaming & Consoles',
  impression3d: 'Impression 3D',
  gravure:      'Gravure laser',
  flocage:      'Flocage & Sublimation',
  autre:        'Autre',
};

const STATUS_LABELS = {
  nouveau:         { label: 'Nouveau',          color: '#64748b', icon: '' },
  diagnostic:      { label: 'En diagnostic',    color: '#f59e0b', icon: '' },
  en_cours:        { label: 'En cours',         color: '#3b82f6', icon: '' },
  attente_piece:   { label: 'Attente de pièce', color: '#8b5cf6', icon: '' },
  attente_client:  { label: 'Attente client',   color: '#f97316', icon: '' },
  termine:         { label: 'Terminé',          color: '#22c55e', icon: '' },
  annule:          { label: 'Annulé',           color: '#ef4444', icon: '' },
  archive:         { label: 'Archivé',          color: '#475569', icon: '' },
};

// Labels adaptés par métier — superposés sur STATUS_LABELS selon le thème actif
const METIER_STATUS_LABELS = {
  plomberie: {
    diagnostic:    'Diagnostic',
    en_cours:      'Intervention',
  },
  jardinier: {
    diagnostic:    'Devis sur place',
    en_cours:      'En chantier',
    attente_piece: 'Attente matériaux',
    attente_client:'Attente confirmation',
    termine:       'Chantier terminé',
  },
  menuiserie: {
    diagnostic:    'Étude / devis',
    en_cours:      'En atelier',
    attente_piece: 'Attente matériaux',
    attente_client:'Attente feu vert',
  },
  mecanique: {
    nouveau:       'Véhicule déposé',
    en_cours:      'En réparation',
    attente_client:'Attente accord client',
  },
  electricien: {
    diagnostic:    'Visite technique',
    en_cours:      'Travaux en cours',
    attente_piece: 'Attente matériaux',
    attente_client:'Attente validation',
  },
  decorateur: {
    nouveau:       'Nouvelle demande',
    diagnostic:    'Consultation',
    en_cours:      'Organisation',
    attente_piece: 'Attente fournitures',
    attente_client:'Attente confirmation',
    termine:       'Événement terminé',
  },
};

function applyMetierStatusLabels(themeKey) {
  const overrides = METIER_STATUS_LABELS[themeKey];
  if (!overrides) return;
  Object.entries(overrides).forEach(([k, label]) => {
    if (STATUS_LABELS[k]) STATUS_LABELS[k] = { ...STATUS_LABELS[k], label };
  });
}

const PRIORITY_LABELS = {
  basse:    { label: 'Basse',    color: '#64748b' },
  normale:  { label: 'Normale',  color: '#3b82f6' },
  haute:    { label: 'Haute',    color: '#f97316' },
  urgente:  { label: 'Urgente',  color: '#ef4444' },
};

const CARRIER_LABELS = {
  colissimo:     'Colissimo',
  chronopost:    'Chronopost',
  ups:           'UPS',
  dpd:           'DPD',
  fedex:         'FedEx',
  gls:           'GLS',
  mondial_relay: 'Mondial Relay',
  autre:         'Autre',
};
