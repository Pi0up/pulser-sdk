# 📋 Changelog - Pulser SDK

Toutes les modifications notables du projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

---

## [1.4.0] - 2024-12-03 15:30

### ♻️ Refactoring - Renommage "Pulser SDK"

**Changement :** Renommage complet du SDK de "Feedback SDK" vers "Pulser SDK" pour une identité de marque plus moderne et distinctive.

#### Modifications appliquées

**Fichiers SDK**
- ✅ `/sdk/PulserSDK.js` (anciennement FeedbackSDK.js)
- ✅ Classe `PulserSDK` (anciennement FeedbackSDK)
- ✅ Mise à jour de tous les imports et exports
- ✅ Mise à jour des messages console `[PulserSDK]`

**Fichiers de support**
- ✅ `/sdk/index.js` : Exposition `window.PulserSDK`
- ✅ `/sdk/StorageManager.js` : Préfixe localStorage `pulser_sdk_`
- ✅ `/sdk/UIRenderer.js` : ID host `feedback-sdk-host` → `pulser-sdk-host`
- ✅ `/sdk/ErrorHandler.js` : Messages d'erreur mis à jour

**Documentation**
- ✅ `/README.md` : Titre et tous les exemples de code mis à jour
- ✅ `/CHANGELOG.md` : Titre et références historiques mises à jour
- ✅ `/App.tsx` : Démo et exemples d'intégration mis à jour

#### Impact sur l'intégration

**Ancien code :**
```javascript
window.PulserSDK.init('domain.com', 'fr');
```

**Nouveau code :**
```javascript
window.PulserSDK.init('domain.com', 'fr');
```

**Note :** Les données stockées en localStorage utilisent maintenant le préfixe `pulser_sdk_` au lieu de `feedback_sdk_`. Les utilisateurs existants devront réinitialiser leurs données ou migrer manuellement.

---

## [1.3.0] - 2024-12-03 14:00

### 🐛 Correction - Références Circulaires JSON

**Problème résolu :** Erreur `TypeError: Converting circular structure to JSON` lors de la sérialisation d'objets contenant des références circulaires (window, document, DOM elements).

#### Corrections appliquées

**StorageManager.js**
- ✅ Ajout `_sanitizeValue()` avant `JSON.stringify` dans `markCampaignAsShown()` (ligne 169)
- ✅ Ajout `_sanitizeValue()` avant `JSON.stringify` dans `markCampaignAsDismissed()` (ligne 192)
- ✅ Ajout `_sanitizeValue()` avant `JSON.stringify` dans `markCampaignAsAnswered()` (ligne 216)
- ✅ Ajout `_sanitizeValue()` avant `JSON.stringify` dans `_storeAnsweredQuestion()` (ligne 293)

**PulserSDK.js**
- ✅ Vérification explicite pour `window` et `document` dans `setUserInfo()`
- ✅ Protection au niveau des valeurs individuelles avec messages d'erreur clairs

#### Protection complète

| Type d'objet | Détection | Remplacement |
|--------------|-----------|--------------|
| Références circulaires | ✅ | `"[Circular Reference]"` |
| `window` | ✅ | `"[Window/Document]"` |
| `document` | ✅ | `"[Window/Document]"` |
| Éléments DOM | ✅ | `"[DOM Element: TAG_NAME]"` |
| Fonctions | ✅ | Ignorées |
| Objets non-sérialisables | ✅ | `"[Unable to serialize]"` |

#### Points de sérialisation protégés

**StorageManager.js**
- ✅ `setUserData()` → via `_sanitizeValue()`
- ✅ `markCampaignAsShown()` → via `_sanitizeValue()`
- ✅ `markCampaignAsDismissed()` → via `_sanitizeValue()`
- ✅ `markCampaignAsAnswered()` → via `_sanitizeValue()`
- ✅ `_storeAnsweredQuestion()` → via `_sanitizeValue()`
- ✅ `setCachedConfig()` → via `_sanitizeValue()`

**DataSubmitter.js**
- ✅ `submitAnswer()` → via `_sanitizeData()`
- ✅ `submitImpression()` → via `_sanitizeData()`

**PulserSDK.js**
- ✅ `setUserInfo()` → vérifications explicites + sanitization dans StorageManager

#### Impact

**Avant :**
- ❌ Erreurs `Converting circular structure to JSON` possibles
- ❌ Crash du SDK si `window` ou `document` passé dans `setUserInfo()`
- ❌ Problèmes avec objets complexes contenant des boucles

**Après :**
- ✅ Aucune erreur JSON.stringify
- ✅ Gestion gracieuse de tous les types d'objets problématiques
- ✅ Messages d'erreur clairs pour les cas invalides
- ✅ Stockage sécurisé dans localStorage
- ✅ Envoi sécurisé vers l'API

#### Fichiers modifiés

```
/sdk/StorageManager.js          ← 4 corrections
/sdk/PulserSDK.js              ← 1 correction (setUserInfo)
/TEST_CIRCULAR_REFS.md         ← Nouveau (guide de test)
/CHANGELOG_CIRCULAR_REFS_FIX.md ← Archivé
```

---

## [1.2.0] - 2024-12-02 16:00

### ✅ Amélioration - Singleton & Protection Affichages Multiples

**Problèmes résolus :**
1. Plusieurs questions s'affichaient lors d'un seul événement de navigation
2. Possibilité de créer plusieurs instances du SDK

#### Modifications techniques

**PulserSDK.js - Pattern Singleton**

```javascript
class PulserSDK {
  static instance = null;

  constructor() {
    // Retourner l'instance existante si déjà créée
    if (PulserSDK.instance) {
      return PulserSDK.instance;
    }
    
    // Stocker la nouvelle instance
    PulserSDK.instance = this;
  }

  // Méthode statique pour récupérer l'instance
  static getInstance() {
    return PulserSDK.instance;
  }
}
```

**PulserSDK.js - Protection affichages multiples**

```javascript
// Nouveaux flags dans le constructor
this.isDisplaying = false;        // Bloque affichages simultanés
this.lastTriggerTime = 0;         // Timestamp dernier déclenchement
this.debounceDelay = 500;         // Délai minimum (ms)
```

**Mécanisme de debounce dans `_handlePageChange()`**

```javascript
// 1. Vérifier le debounce
const now = Date.now();
if (now - this.lastTriggerTime < this.debounceDelay) {
  return; // Ignorer si trop tôt
}

// 2. Vérifier si affichage en cours
if (this.isDisplaying) {
  return; // Bloquer si déjà affiché
}

// 3. Marquer comme en cours
this.isDisplaying = true;
this.lastTriggerTime = now;
```

**StorageManager.js - Tracking questions répondues**

```javascript
// Nouvelle clé de stockage
answeredQuestions: `${this.prefix}answered_questions`

// Stockage couple (campaignId:questionId)
_storeAnsweredQuestion(campaignId, questionId) {
  const answered = this._getAllAnsweredQuestions();
  const key = `${campaignId}:${questionId}`;
  answered[key] = Date.now();
  localStorage.setItem(this.keys.answeredQuestions, JSON.stringify(answered));
}

// Vérification si répondu
hasAnswered(campaignId, questionId) {
  const answered = this._getAllAnsweredQuestions();
  const key = `${campaignId}:${questionId}`;
  return answered[key] !== undefined;
}
```

**DecisionEngine.js - Filtrage questions répondues**

```javascript
_selectQuestionFromCampaign(campaign) {
  // Filtrer les questions non-répondues
  const unansweredQuestions = campaign.questions.filter(question => {
    return !this.storageManager.hasAnswered(campaign.id, question.id);
  });

  if (unansweredQuestions.length === 0) {
    return null; // Campagne épuisée
  }

  // Sélection aléatoire parmi questions disponibles
  const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
  return unansweredQuestions[randomIndex];
}
```

#### Garanties

1. **1 événement = 1 question maximum**
   - Debounce 500ms
   - Flag `isDisplaying`
   - Libération après interaction

2. **1 instance unique du SDK**
   - Pattern Singleton
   - `getInstance()` statique

3. **Questions non répétées**
   - Tracking `(campaignId:questionId)` en localStorage
   - Filtrage automatique lors de la sélection

4. **LuckFactor sans pollution**
   - Si échec : aucun événement enregistré
   - Réévaluation à la prochaine navigation

#### Nouveaux champs debug

```json
{
  "isDisplaying": false,           // Flag affichage en cours
  "lastTriggerTime": 1701388900000, // Timestamp dernier déclenchement
  "isInitialized": true,
  "campaignsCount": 4,
  "currentCampaign": { ... },
  "currentQuestion": { ... }
}
```

#### Bénéfices

1. **Performance** : Moins d'évaluations inutiles grâce au debounce
2. **Fiabilité** : Garantie d'une seule instance active
3. **UX** : Pas d'affichages multiples irritants
4. **Data** : Tracking précis sans doublons (LuckFactor)
5. **Évolutivité** : Questions réutilisables entre campagnes

#### Fichiers modifiés

```
/sdk/FeedbackSDK.js        ← Pattern Singleton + protection affichages
/sdk/StorageManager.js     ← Tracking questions répondues
/sdk/DecisionEngine.js     ← Filtrage questions répondues
/App.tsx                   ← Amélioration interface debug
/CHANGELOG_SINGLETON.md    ← Archivé
```

---

## [1.1.0] - 2024-12-02 10:00

### 🎯 Correction - Positionnement Center

**Problème résolu :** Sur desktop, le widget en position `bottom-center` (et autres positions centrées) était aligné par son **coin bas-gauche** au lieu de son **centre-bas**.

#### Solution implémentée

**1. Ajout de largeur sur le container**

```css
#feedback-container {
  position: fixed;
  ${posConfig.css}
  z-index: 999999;
  width: auto;           /* ← AJOUTÉ */
  max-width: 100vw;      /* ← AJOUTÉ : Évite débordement */
}
```

**2. Largeur adaptée au contenu sur desktop**

```css
@media (min-width: 769px) {
  #feedback-container {
    width: max-content;  /* ← AJOUTÉ : Prend la largeur du widget */
  }
}
```

#### Explication technique

- `width: max-content` force le container à prendre **exactement** la largeur de son contenu (le widget)
- Le widget fait 380px (max-width définie)
- Le container fait donc 380px
- `left: 50%` + `transform: translate(-50%, 0)` = décalage de 190px (50% de 380px)
- **Résultat : Centrage parfait !**

#### Positions affectées

| Position | Avant | Après |
|----------|-------|-------|
| `bottom-center` | ❌ Décalé à droite | ✅ Parfaitement centré |
| `top-center` | ❌ Décalé à droite | ✅ Parfaitement centré |
| `center` | ❌ Décalé en bas-droite | ✅ Parfaitement centré |

**Les autres positions** (coins, côtés) n'étaient pas affectées car elles utilisent `right/left` fixes sans transform horizontal.

#### Comportement mobile (inchangé)

Sur mobile (< 768px), le comportement reste identique :
- **Toutes les positions** forcent le widget en bas pleine largeur
- Le `width: max-content` est écrasé par `left: 0; right: 0;`

#### Mesures précises

**Desktop (écran 1920px de largeur)**

Avant le fix (hypothétique largeur 100%) :
```
Container width: 1920px
left: 960px (50%)
transform: translate(-960px, 0) (-50%)
→ Position finale: left = 0px
→ ❌ Widget collé au bord gauche
```

Après le fix :
```
Container width: 380px (max-content)
left: 960px (50%)
transform: translate(-190px, 0) (-50% de 380px)
→ Position finale: left = 770px
→ ✅ Widget centré (770 + 190 = 960 = centre)
```

#### Bénéfices

1. **UX améliorée** : Widget parfaitement centré sur positions centrées
2. **Cohérence visuelle** : Alignement symétrique
3. **Responsive** : Fonctionne sur toutes les tailles d'écran
4. **Pas de régression** : Les autres positions fonctionnent toujours parfaitement
5. **Pas de débordement** : `max-width: 100vw` évite le scroll horizontal

#### Fichiers modifiés

```
/sdk/UIRenderer.js              ← Lignes ~529-537 et ~594-599
/TEST_POSITIONING.md            ← Nouveau (guide de test)
/POSITIONING_GUIDE.md           ← Nouveau (documentation positions)
/public/test-positions.html     ← Nouveau (page de test)
/README.md                      ← Section API positionnement
/CHANGELOG_POSITIONING_FIX.md   ← Archivé
```

---

## [1.0.0] - 2024-12-01 15:00

### 🔐 Nouveauté - Système de Consentement RGPD & Protection Données

**Version initiale** : Implémentation d'un système de consentement RGPD complet et configurable.

#### Nouvelles fonctionnalités

**1. Système de consentement RGPD**

- ✅ Écran de consentement personnalisable
- ✅ Stockage du consentement en localStorage
- ✅ Affichage avant la première question
- ✅ Effacement automatique des données en cas de refus
- ✅ Configuration flexible (peut être désactivé)
- ✅ API publique : `getConsentStatus()`, `setConsent()`, `resetConsent()`

**Configuration API :**

```json
{
  "consent": {
    "enabled": true,
    "title": "Votre avis nous intéresse",
    "description": "Nous aimerions recueillir vos retours...",
    "learnMoreText": "En savoir plus",
    "learnMoreUrl": "https://example.com/info",
    "dataCollectionInfo": "Nous collectons vos réponses...",
    "acceptLabel": "Oui, j'accepte",
    "declineLabel": "Non merci",
    "privacyPolicyUrl": "https://example.com/privacy"
  }
}
```

**API Publique :**

```javascript
// Récupérer le statut du consentement
const status = window.FeedbackSDK.getConsentStatus();
// → { enabled: true, required: false, hasConsent: true, status: true }

// Enregistrer manuellement le consentement
window.FeedbackSDK.setConsent(true);

// Réinitialiser le consentement
window.FeedbackSDK.resetConsent();
```

**2. Protection contre les références circulaires**

- ✅ Détection automatique des références circulaires avec `WeakSet`
- ✅ Nettoyage des éléments DOM (`document.body` → `[DOM Element: BODY]`)
- ✅ Nettoyage des références globales (`window` → `[Window/Document]`)
- ✅ Parcours récursif en profondeur des objets et tableaux
- ✅ Protection contre les dépassements de pile

**Types gérés :**

| Type | Traitement |
|------|------------|
| `string`, `number`, `boolean`, `null` | Préservés |
| `Object`, `Array` | Copiés en profondeur |
| Références circulaires | `[Circular Reference]` |
| Éléments DOM | `[DOM Element: NODENAME]` |
| `window`/`document` | `[Window/Document]` |
| `function` | Ignorées |

**Points d'application :**
- ✅ `setUserInfo()` : Métadonnées utilisateur
- ✅ `submitAnswer()` : Envoi de réponses
- ✅ `submitImpression()` : Envoi d'impressions
- ✅ `setCachedConfig()` : Cache de configuration

#### Implémentation technique

**ConsentManager.js (nouveau)**

```javascript
class ConsentManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.config = null;
  }

  isConsentRequired() {
    // Vérifie si le consentement doit être demandé
    if (!this.config?.enabled) return false;
    return this.storageManager.getConsent() === null;
  }

  hasConsent() {
    // Vérifie si l'utilisateur a consenti
    if (!this.config?.enabled) return true;
    return this.storageManager.getConsent() === true;
  }

  saveConsent(accepted) {
    // Enregistre le consentement
    this.storageManager.setConsent(accepted);
    
    // Si refusé, effacer les données
    if (!accepted) {
      this.storageManager.clearAllResponses();
      this.storageManager.clearAllImpressions();
    }
  }
}
```

**Méthode _sanitizeData()**

```javascript
_sanitizeData(obj, seen = null) {
  if (!seen) seen = new WeakSet();
  
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Éléments DOM
  if (obj instanceof Element || obj instanceof Node) {
    return `[DOM Element: ${obj.nodeName}]`;
  }
  
  // Window/Document
  if (obj === window || obj === document) {
    return '[Window/Document]';
  }
  
  // Références circulaires
  if (seen.has(obj)) {
    return '[Circular Reference]';
  }
  
  seen.add(obj);
  
  // Tableaux
  if (Array.isArray(obj)) {
    return obj.map(item => this._sanitizeData(item, seen));
  }
  
  // Objets
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'function') continue;
      sanitized[key] = this._sanitizeData(obj[key], seen);
    }
  }
  
  return sanitized;
}
```

#### Conformité RGPD

- ✅ **Consentement explicite** : L'utilisateur doit accepter explicitement
- ✅ **Droit à l'oubli** : Refuser efface toutes les données
- ✅ **Transparence** : Informations claires sur les données collectées
- ✅ **Révocabilité** : L'utilisateur peut révoquer son consentement
- ✅ **Pas de collecte par défaut** : Aucune donnée sans consentement

#### Migration

**Aucune action requise pour les intégrations existantes.**

Le système de consentement est **activé par défaut** mais peut être désactivé :

```json
{
  "consent": {
    "enabled": false
  }
}
```

Si vous gérez déjà le consentement dans votre application :

```javascript
// Désactiver dans la config API, puis enregistrer manuellement
window.FeedbackSDK.setConsent(true);
```

#### Fichiers ajoutés/modifiés

**Fichiers ajoutés :**
- `sdk/ConsentManager.js` (155 lignes)
- `CHANGELOG_CONSENT_AND_CIRCULAR_REFS.md` (archivé)

**Fichiers modifiés :**
- `sdk/FeedbackSDK.js` : +150 lignes (intégration ConsentManager + API publique)
- `sdk/StorageManager.js` : +80 lignes (méthodes consentement + _sanitizeValue)
- `sdk/UIRenderer.js` : +120 lignes (renderConsent + _generateConsentHTML)
- `sdk/DataSubmitter.js` : +80 lignes (_sanitizeData)
- `README.md` : +200 lignes (documentation RGPD + références circulaires)
- `App.tsx` : +50 lignes (tests consentement + démonstrations)

**Total :** ~835 lignes ajoutées

---

## Format du Changelog

### Types de changements

- **Ajout** pour les nouvelles fonctionnalités
- **Modification** pour les changements aux fonctionnalités existantes
- **Dépréciation** pour les fonctionnalités bientôt retirées
- **Suppression** pour les fonctionnalités retirées
- **Correction** pour les corrections de bugs
- **Sécurité** pour les vulnérabilités corrigées

---

**Développé avec ❤️ en Vanilla JavaScript sans dépendances**