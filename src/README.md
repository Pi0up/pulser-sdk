# 🎯 Pulser SDK - User Feedback Module

SDK JavaScript ultra-léger pour intégrer un système de feedback utilisateur sur n'importe quel site web (SPA ou Multi-page).

## ✨ Caractéristiques

- **✅ Vanilla JavaScript** : Zéro dépendance, ES6+
- **🎨 Shadow DOM** : Isolation CSS totale
- **📐 Container Queries** : Responsivité automatique
- **🛡️ Fail-Safe** : Aucune erreur ne bloque le site hôte
- **🔄 Cache Intelligent** : Validation HTTP 304 pour optimiser le réseau
- **🧭 SPA Compatible** : Détection navigation hybride (événements + polling)
- **⚡ Ultra-léger** : < 15 KB gzippé
- **🔒 Singleton** : Une seule instance active garantie
- **🎯 1 événement = 1 question** : Debounce intégré pour éviter les affichages multiples

---

## 🚀 Installation

### Via Script Tag

```html
<script src="https://cdn.example.com/pulser-sdk.js"></script>
<script>
  window.PulserSDK.init('your-domain.com', 'fr', null, {
    debug: false,
    pollingInterval: 2000 // Optionnel, défaut: 2000ms
  });
</script>
```

### Via NPM/Module

```javascript
import PulserSDK from './sdk/index.js';

// Le SDK est un singleton - une seule instance est créée
const sdk = new PulserSDK();
await sdk.init('your-domain.com', 'fr', null, { debug: true });

// Les appels suivants retournent la même instance
const sameSdk = new PulserSDK();
console.log(sdk === sameSdk); // true

// Ou récupérer l'instance directement
const instance = PulserSDK.getInstance();
```

---

## 📖 API Publique

### `init(domain, language, specificId, options)`

Initialise le SDK.

**Paramètres :**
- `domain` (string) : Domaine de votre API (ex: `'example.com'`)
- `language` (string) : Code langue (ex: `'fr'`, `'en'`)
- `specificId` (string|null) : ID spécifique optionnel
- `options` (object) :
  - `debug` (boolean) : Active les logs de debug (défaut: `false`)
  - `pollingInterval` (number) : Intervalle de polling en ms (défaut: `2000`)
  - `position` (string) : Position du widget (défaut: `'bottom-right'`)
    - Valeurs possibles : `'bottom-right'`, `'bottom-left'`, `'bottom-center'`, `'top-right'`, `'top-left'`, `'top-center'`, `'middle-right'`, `'middle-left'`, `'center'`
    - Note : Sur mobile (< 768px), toutes les positions forcent le widget en bas pleine largeur

**Exemple :**
```javascript
await window.PulserSDK.init('example.com', 'fr', null, { 
  debug: true,
  position: 'bottom-center' // Widget centré en bas sur desktop
});
```

---

### `showCampaign(campaignId)`

Force l'affichage d'une campagne spécifique (sélectionne une question aléatoire non-répondue).

**Exemple :**
```javascript
window.PulserSDK.showCampaign('campaign_satisfaction_q4_2024');
```

---

### `showQuestion(questionId)`

Force l'affichage d'une question spécifique (recherche dans toutes les campagnes).

**Exemple :**
```javascript
window.PulserSDK.showQuestion('q1_satisfaction');
```

---

### `setUserInfo(userData)`

Enrichit les métadonnées utilisateur qui seront envoyées avec les réponses.

**Exemple :**
```javascript
window.PulserSDK.setUserInfo({
  userId: '12345',
  email: 'user@example.com',
  plan: 'premium'
});
```

---

### `hide()` / `show()`

Cache ou affiche le widget manuellement.

```javascript
window.PulserSDK.hide();
window.PulserSDK.show();
```

---

### `refresh()`

Force une réévaluation immédiate du moteur de décision.

```javascript
window.PulserSDK.refresh();
```

---

### `clearData()`

Efface toutes les données du SDK (cache, fréquences, métadonnées).

```javascript
window.PulserSDK.clearData();
```

---

### `getDebugInfo()`

Retourne un objet contenant l'état complet du SDK (utile pour le debug).

```javascript
const info = window.PulserSDK.getDebugInfo();
console.log(info);
```

---

### `getConsentStatus()`

Récupère le statut actuel du consentement RGPD.

**Retourne :**
```javascript
{
  enabled: boolean,     // Le consentement est-il activé ?
  required: boolean,    // Le consentement doit-il être demandé ?
  hasConsent: boolean,  // L'utilisateur a-t-il consenti ?
  status: boolean|null  // null=pas demandé, true=accepté, false=refusé
}
```

**Exemple :**
```javascript
const status = window.PulserSDK.getConsentStatus();
console.log('Consentement requis:', status.required);
console.log('Utilisateur a consenti:', status.hasConsent);
```

---

### `setConsent(accepted)`

Enregistre manuellement le consentement de l'utilisateur (utile si vous gérez le consentement ailleurs).

**Paramètres :**
- `accepted` (boolean) : `true` pour accepter, `false` pour refuser

**Exemple :**
```javascript
// Accepter le consentement
window.PulserSDK.setConsent(true);

// Refuser le consentement (efface toutes les données collectées)
window.PulserSDK.setConsent(false);
```

---

### `resetConsent()`

Réinitialise le consentement pour permettre de le redemander à l'utilisateur.

**Exemple :**
```javascript
window.PulserSDK.resetConsent();
// L'écran de consentement sera affiché à nouveau
```

---

## 🔐 Consentement RGPD

Le SDK intègre un système de consentement RGPD complet et personnalisable.

### Fonctionnement

1. **Premier affichage** : Le consentement est demandé avant d'afficher la première question
2. **Stockage local** : La réponse est stockée dans `localStorage` pour toute l'application
3. **Refus** : Si l'utilisateur refuse, aucune donnée n'est collectée et toutes les données existantes sont effacées
4. **Acceptation** : Les questions sont affichées normalement et les réponses sont envoyées à l'API

### Configuration

Le consentement se configure dans la réponse de l'API de configuration :

```json
{
  "consent": {
    "enabled": true,
    "title": "Votre avis nous intéresse",
    "description": "Nous aimerions recueillir vos retours pour améliorer votre expérience.",
    "learnMoreText": "En savoir plus",
    "learnMoreUrl": "https://example.com/feedback-info",
    "dataCollectionInfo": "Nous collectons vos réponses de manière anonyme pour améliorer nos services. Vos données ne seront jamais partagées avec des tiers et sont conformes au RGPD.",
    "acceptLabel": "Oui, j'accepte",
    "declineLabel": "Non merci",
    "privacyPolicyUrl": "https://example.com/privacy"
  },
  "campaigns": [...]
}
```

### Paramètres

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `enabled` | boolean | `true` | Active/désactive le système de consentement |
| `title` | string | `"Votre avis nous intéresse"` | Titre de l'écran de consentement |
| `description` | string | | Phrase courte décrivant le module |
| `learnMoreText` | string | `"En savoir plus"` | Texte du lien "En savoir plus" |
| `learnMoreUrl` | string | `null` | URL vers plus d'informations (optionnel) |
| `dataCollectionInfo` | string | | Description des données collectées |
| `acceptLabel` | string | `"Oui, j'accepte"` | Label du bouton d'acceptation |
| `declineLabel` | string | `"Non merci"` | Label du bouton de refus |
| `privacyPolicyUrl` | string | `null` | Lien vers la politique de confidentialité (optionnel) |

### Désactivation du consentement

Si vous gérez le consentement ailleurs dans votre application :

```json
{
  "consent": {
    "enabled": false
  }
}
```

Puis enregistrez le consentement manuellement :

```javascript
// Après avoir obtenu le consentement dans votre propre UI
window.PulserSDK.setConsent(true);
```

### Gestion manuelle

```javascript
// Vérifier si le consentement est requis
const status = window.PulserSDK.getConsentStatus();
if (status.required) {
  console.log('Le consentement doit être demandé');
}

// Accepter manuellement
window.PulserSDK.setConsent(true);

// Refuser manuellement (efface toutes les données)
window.PulserSDK.setConsent(false);

// Réinitialiser pour redemander
window.PulserSDK.resetConsent();
```

### Conformité RGPD

- ✅ **Consentement explicite** : L'utilisateur doit accepter explicitement
- ✅ **Droit à l'oubli** : Refuser efface toutes les données collectées
- ✅ **Transparence** : Informations claires sur les données collectées
- ✅ **Révocabilité** : L'utilisateur peut réinitialiser son consentement
- ✅ **Pas de collecte par défaut** : Aucune donnée n'est envoyée sans consentement

---

## 📡 Format de Configuration API

### Endpoint : `GET https://api.{domain}/feedback/config?lang={lang}&id={id}`

**Headers attendus (validation conditionnelle) :**
- `X-Last-Fetch-Date` : Timestamp de la dernière récupération

**Réponse 200 (Nouvelle config) :**
```json
{
  "cacheTTL": 86400000,
  "campaigns": [
    {
      "id": "campaign_satisfaction_q4_2024",
      "name": "Satisfaction Q4 2024",
      "startDate": 1701388800000,
      "endDate": 1735689600000,
      "priority": 1,
      "frequencyDays": 7,
      "luckFactor": 0.3,
      "allowListRegex": ["^/products/.*"],
      "blockListRegex": ["^/admin/.*"],
      "questions": [
        {
          "id": "q1_satisfaction",
          "title": "Comment trouvez-vous cette page ?",
          "assistiveText": "Votre avis compte",
          "type": "rating",
          "responseConfig": { "max": 5 }
        },
        {
          "id": "q1b_satisfaction_alt",
          "title": "Êtes-vous satisfait de votre expérience ?",
          "assistiveText": "Donnez-nous une note",
          "type": "rating",
          "responseConfig": { "max": 5 }
        }
      ]
    }
  ]
}
```

**Réponse 304 (Config à jour) :**
Pas de body, le SDK utilise le cache existant.

### 🎯 Architecture des Campagnes

**Campagne** = Conteneur avec métadonnées de ciblage :
- `id`, `name` : Identifiants
- `startDate`, `endDate` : Période d'activité (timestamps)
- `priority` : Priorité (plus haute = plus importante)
- `frequencyDays` : Délai minimum entre deux affichages
- `luckFactor` : Chance d'apparition (0.0 à 1.0)
- `allowListRegex`, `blockListRegex` : Filtres d'URL
- `questions[]` : Tableau de questions (contenu)

**Question** = Contenu uniquement (pas de logique de ciblage) :
- `id`, `title`, `assistiveText`, `type`, `responseConfig`

### 📊 Logique d'évaluation

Plusieurs campagnes peuvent être **actives simultanément**. À chaque navigation :

1. **Filtrer campagnes actives** (dates valides)
2. **Filtrer par URL** (allowList/blockList de chaque campagne)
3. **Filtrer par fréquence** (frequencyDays de chaque campagne)
4. **Trier par priorité** (descendant : 1 = haute priorité)
5. **Pour chaque campagne** (ordre de priorité) :
   - Tester `luckFactor` (ex: 0.3 = 30% de chance)
   - Si ✅ : Sélectionner une question **non-répondue** aléatoirement
   - Si question trouvée : afficher et stopper
   - Si ❌ : passer à la campagne suivante

### 🔒 Tracking des réponses

Le SDK stocke les couples `(campaignId, questionId)` répondus en localStorage.  
Une question déjà répondue **ne sera jamais re-affichée**, même si la campagne est encore active.

---

## 📊 Types de Questions Supportés

### 1. **textarea**
```json
{
  "type": "textarea",
  "responseConfig": {
    "maxChars": 300,
    "placeholder": "Votre réponse..."
  }
}
```

### 2. **rating** (Étoiles)
```json
{
  "type": "rating",
  "responseConfig": {
    "max": 5,
    "labels": {
      "1": "Très mauvais",
      "5": "Excellent"
    }
  }
}
```

### 3. **boolean** (Oui/Non)
```json
{
  "type": "boolean",
  "responseConfig": {
    "yesLabel": "Oui",
    "noLabel": "Non"
  }
}
```

### 4. **nps** (Net Promoter Score 0-10)
```json
{
  "type": "nps",
  "responseConfig": {
    "minLabel": "Pas du tout probable",
    "maxLabel": "Très probable"
  }
}
```

### 5. **scale** (Échelle personnalisée)
```json
{
  "type": "scale",
  "responseConfig": {
    "min": 1,
    "max": 10
  }
}
```

### 6. **select/dropdown** (Liste déroulante)
```json
{
  "type": "select",
  "responseConfig": {
    "placeholder": "Sélectionnez une option...",
    "options": ["Option 1", "Option 2", "Option 3"],
    "allowCustom": true
  }
}
```

---

## ✅ Validation des Réponses

Le SDK supporte un système de validation configurable pour garantir la qualité des réponses utilisateur. Les règles de validation peuvent être définies au niveau de chaque question via le champ `validation`.

### Configuration de la validation

```json
{
  "id": "q_feedback",
  "title": "Vos suggestions",
  "type": "textarea",
  "responseConfig": {
    "maxChars": 300,
    "placeholder": "Écrivez vos suggestions..."
  },
  "validation": {
    "required": true,
    "minLength": 10,
    "maxLength": 300,
    "pattern": "^[a-zA-Z0-9\\s.,!?'-]+$",
    "forbiddenWords": ["spam", "test"],
    "requiredMessage": "Ce champ est obligatoire",
    "minLengthMessage": "Veuillez détailler davantage (minimum 10 caractères)",
    "patternMessage": "Caractères spéciaux non autorisés",
    "forbiddenWordsMessage": "Votre réponse contient des mots interdits"
  }
}
```

### Règles de validation disponibles

#### Pour **textarea** :
- `required` (boolean) : Champ obligatoire (défaut: true)
- `minLength` (number) : Longueur minimale
- `maxLength` (number) : Longueur maximale
- `pattern` (string regex) : Expression régulière de validation
- `forbiddenWords` (string[]) : Liste de mots interdits
- Messages personnalisés : `requiredMessage`, `minLengthMessage`, `maxLengthMessage`, `patternMessage`, `forbiddenWordsMessage`

#### Pour **select/dropdown** :
- `required` (boolean) : Sélection obligatoire
- `forbiddenValues` (any[]) : Valeurs interdites
- Messages personnalisés : `requiredMessage`, `forbiddenValuesMessage`

#### Pour **rating/nps/scale** :
- `required` (boolean) : Sélection obligatoire
- `min` (number) : Valeur minimale
- `max` (number) : Valeur maximale
- `forbiddenValues` (number[]) : Valeurs interdites
- Messages personnalisés : `requiredMessage`, `minMessage`, `maxMessage`, `forbiddenValuesMessage`

#### Pour **boolean** :
- `required` (boolean) : Choix obligatoire
- `mustBeTrue` (boolean) : Force la réponse "Oui" (pour consentements)
- `mustBeFalse` (boolean) : Force la réponse "Non"
- Messages personnalisés : `requiredMessage`, `mustBeTrueMessage`, `mustBeFalseMessage`

### Validation en temps réel

Pour les champs **textarea**, la validation s'effectue en temps réel pendant la saisie, affichant les erreurs instantanément (sauf pour les champs vides qui sont validés uniquement au submit).

### Exemple complet avec validation email

```json
{
  "id": "q_email",
  "title": "Votre email de contact",
  "type": "textarea",
  "responseConfig": {
    "maxChars": 100,
    "placeholder": "votre.email@exemple.com"
  },
  "validation": {
    "required": true,
    "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
    "requiredMessage": "L'email est requis",
    "patternMessage": "Format d'email invalide"
  }
}
```

---

## 🎨 Messages de Remerciement

Le SDK supporte des messages de remerciement personnalisables qui s'affichent après chaque réponse. Les messages peuvent être configurés au niveau de la campagne (appliqué à toutes les questions) ou au niveau de chaque question individuelle.

### Configuration simple

```json
{
  "thankYouMessage": {
    "enabled": true,
    "text": "Merci pour votre réponse ! 🙏",
    "duration": 2000
  }
}
```

### Messages aléatoires

Le champ `text` peut être un tableau de messages - un message sera choisi aléatoirement à chaque soumission :

```json
{
  "thankYouMessage": {
    "enabled": true,
    "text": [
      "Merci pour votre retour ! 🙏",
      "Votre avis compte beaucoup ! ✨",
      "Super, merci ! 🎉"
    ],
    "duration": 2000
  }
}
```

### Paramètres
- `enabled` (boolean) : Active/désactive les messages de remerciement
- `text` (string | string[]) : Message unique ou tableau de messages pour sélection aléatoire
- `duration` (number) : Durée d'affichage en millisecondes (défaut: 2000)

### Priorité
Si défini aux deux niveaux, la configuration au niveau de la **question** a priorité sur celle de la **campagne**.

---

## 📤 Format des Données Envoyées

### Submit Answer : `POST https://api.{domain}/feedback/submit`

```json
{
  "campaignId": "campaign_satisfaction_q4_2024",
  "questionId": "q1_satisfaction",
  "answer": 5,
  "metadata": {
    "userId": "12345",
    "email": "user@example.com",
    "plan": "premium"
  },
  "timestamp": 1701388900000,
  "url": "https://example.com/products",
  "userAgent": "Mozilla/5.0..."
}
```

### Submit Impression : `POST https://api.{domain}/feedback/impression`

```json
{
  "campaignId": "campaign_satisfaction_q4_2024",
  "questionId": "q1_satisfaction",
  "metadata": {
    "userId": "12345"
  },
  "timestamp": 1701388900000,
  "url": "https://example.com/products",
  "userAgent": "Mozilla/5.0..."
}
```

---

## 🎯 Moteur de Décision

Le SDK évalue les **campagnes** éligibles selon cet ordre :

1. **Filtrer par dates** : `startDate` <= now <= `endDate`
2. **Filtrer par URL** : `allowListRegex` et `blockListRegex` (au niveau campagne)
3. **Filtrer par fréquence** : `frequencyDays` de la campagne (via localStorage)
4. **Trier par priorité** : Ordre descendant (1 = haute priorité)
5. **Pour chaque campagne** (ordre de priorité) :
   - Tester `luckFactor` : Si échec, passer à la suivante (**aucun événement enregistré**)
   - Si succès : Sélectionner une question **non-répondue** aléatoirement
   - Si question trouvée : afficher et arrêter
6. **Tracking** : Stocker le couple `(campaignId, questionId)` en localStorage

### 🔑 Comportements clés

- **Plusieurs campagnes simultanées** : Oui, évaluées par ordre de priorité
- **LuckFactor échoue** : Aucun événement, réévaluation à la prochaine navigation
- **Questions répondues** : Filtrées automatiquement, ne sont jamais re-affichées
- **Campagne épuisée** : Si toutes les questions sont répondues, passe à la campagne suivante

---

## 🧪 Mode Debug

Active les logs détaillés dans la console :

```javascript
await window.PulserSDK.init('example.com', 'fr', null, { debug: true });
```

**Logs disponibles :**
- Chargement de la config (cache/fetch)
- Détection de navigation
- Évaluation du moteur de décision
- Envoi des données
- Erreurs interceptées

---

## 🏗️ Architecture Interne

```
PulserSDK (Orchestration - Singleton)
├── ErrorHandler (Fail-safe)
├── StorageManager (LocalStorage)
├── ConfigManager (API + Cache)
├── DecisionEngine (Logique d'éligibilité)
├── DataSubmitter (Envoi API)
├── NavigationMonitor (Détection SPA)
└── UIRenderer (Shadow DOM + CSS)
```

### 🔒 Protection contre affichages multiples

Le SDK implémente plusieurs mécanismes pour garantir **1 événement = 1 question** :

1. **Singleton** : Une seule instance du SDK peut exister
2. **Flag `isDisplaying`** : Bloque les déclenchements tant qu'une question est affichée
3. **Debounce (500ms)** : Ignore les événements trop rapprochés
4. **Libération automatique** : Le flag est libéré après `submit`, `dismiss`, ou `hide()`

---

## 🔒 Sécurité & Confidentialité

- **Aucune donnée PII collectée automatiquement**
- **Pas de cookies tiers**
- **localStorage isolé avec namespace**
- **Shadow DOM pour isolation CSS/JS**
- **Fail-safe : erreurs silencieuses**
- **Protection contre références circulaires** (voir ci-dessous)

### Protection contre les références circulaires

Le SDK nettoie automatiquement toutes les données avant stockage et envoi pour éviter les erreurs `TypeError: Converting circular structure to JSON`.

**Nettoyage automatique dans :**
- ✅ **Métadonnées utilisateur** (`setUserInfo()`)
- ✅ **Cache de configuration** (`localStorage`)
- ✅ **Historique des campagnes** (`markCampaignAsShown()`, `markCampaignAsDismissed()`, `markCampaignAsAnswered()`)
- ✅ **Questions répondues** (`_storeAnsweredQuestion()`)
- ✅ **Envoi de réponses** (`submitAnswer()`)
- ✅ **Envoi d'impressions** (`submitImpression()`)

**Types d'objets gérés :**

| Type d'objet | Traitement |
|--------------|------------|
| Primitives (string, number, boolean) | ✅ Préservés tels quels |
| Objets et tableaux | ✅ Copiés en profondeur |
| Références circulaires | ⚠️ Remplacés par `[Circular Reference]` |
| Éléments DOM | ⚠️ Remplacés par `[DOM Element: NODENAME]` |
| `window` / `document` | ⚠️ Remplacés par `[Window/Document]` |
| Fonctions | 🚫 Ignorées |

**Exemple :**

```javascript
// Ces données sont nettoyées automatiquement
const circularObj = { name: 'test' };
circularObj.self = circularObj; // Référence circulaire

window.PulserSDK.setUserInfo({
  userId: '123',           // ✅ Préservé
  plan: 'premium',         // ✅ Préservé
  circular: circularObj,   // ⚠️ Nettoyé → { name: 'test', self: '[Circular Reference]' }
  domElement: document.body, // ⚠️ Nettoyé → '[DOM Element: BODY]'
  windowRef: window        // ❌ Rejeté avec message d'erreur (détection préventive)
});

// Aucune erreur n'est générée, les données sont automatiquement sécurisées
// Note: window et document sont maintenant détectés et rejetés avant le stockage
```

**Implémentation :**

La méthode `_sanitizeData()` / `_sanitizeValue()` utilise un `WeakSet` pour détecter les références circulaires :

- **Parcours récursif** : Tous les objets et tableaux sont parcourus en profondeur
- **Détection de cycles** : `WeakSet` pour tracker les objets déjà visités
- **Sécurité** : Protection contre les dépassements de pile
- **Performance** : Nettoyage uniquement lors de la sérialisation
- **Protection préventive** : Détection de `window` et `document` avant stockage dans `setUserInfo()`

**100% des appels `JSON.stringify` sont protégés** contre les références circulaires. Voir `/TEST_CIRCULAR_REFS.md` pour les tests de validation.

---

## 🌐 Compatibilité Navigateurs

- ✅ Chrome 105+
- ✅ Firefox 110+
- ✅ Safari 16+
- ✅ Edge 105+

**Prérequis :**
- Shadow DOM (mode: closed)
- Container Queries CSS
- ES6+ (Promises, Classes, Modules)

---

## 📝 Exemple Complet

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mon Site</title>
</head>
<body>
  <h1>Bienvenue sur mon site</h1>
  
  <!-- Charger le SDK -->
  <script type="module">
    import './sdk/index.js';
    
    // Initialiser
    await window.PulserSDK.init('example.com', 'fr', null, {
      debug: true,
      pollingInterval: 2000
    });
    
    // Enrichir avec des métadonnées utilisateur
    window.PulserSDK.setUserInfo({
      userId: 'user-123',
      plan: 'premium'
    });
    
    // Forcer l'affichage d'une question spécifique après 5 secondes
    setTimeout(() => {
      window.PulserSDK.showQuestion('q1_welcome');
    }, 5000);
  </script>
</body>
</html>
```

---

## 🐛 Troubleshooting

### Le widget ne s'affiche pas

1. Vérifier que le SDK est initialisé : `window.PulserSDK.getDebugInfo()`
2. Activer le mode debug : `debug: true`
3. Vérifier les filtres URL (allowList/blockList)
4. Vérifier la fréquence (frequencyDays)
5. Vérifier le luckFactor (0.3 = 30% de chance)

### Effacer les données de test

```javascript
window.PulserSDK.clearData();
```

---

## 📦 Build & Distribution

Le SDK peut être bundlé avec n'importe quel outil moderne :

- **Vite** : `vite build`
- **Webpack** : Compatible ES6 modules
- **Rollup** : Format UMD recommandé

---

## 📄 Licence

MIT License - Utilisation libre pour projets commerciaux et open-source.

---

## 🤝 Support

Pour toute question ou bug, ouvrez une issue sur le repository GitHub.

---

**Développé avec ❤️ en Vanilla JavaScript**
