# 🏗️ Architecture Interne - Pulser SDK

## Vue d'Ensemble

Le Pulser SDK est un module **Singleton** composé de 7 sous-modules interconnectés.

```
┌─────────────────────────────────────────────────────────────┐
│                      PulserSDK                               │
│                   (Orchestrateur Central)                    │
│                      🔒 Singleton                            │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ErrorHandler  │     │StorageManager│     │ConfigManager │
│  (Fail-safe) │     │ (LocalStorage)│     │  (API+Cache) │
└──────────────┘     └──────────────┘     └──────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│DecisionEngine│     │DataSubmitter │     │NavigationMon.│
│ (Éligibilité)│     │  (POST API)  │     │ (SPA Detect) │
└──────────────┘     └──────────────┘     └──────────────┘
                              │
                              ▼
                     ┌──────────────┐
                     │  UIRenderer  │
                     │ (Shadow DOM) │
                     └──────────────┘
```

---

## 📦 Modules

### 1. **PulserSDK** (Orchestrateur)

**Responsabilités :**
- Initialisation de tous les modules
- Gestion du cycle de vie (init → destroy)
- Coordination entre les modules
- API publique exposée à `window.PulserSDK`
- **Pattern Singleton** : Une seule instance active

**État :**
```javascript
{
  // Configuration
  domain: string,
  language: string,
  specificId: string|null,
  debugMode: boolean,
  position: string, // 'bottom-right' | 'bottom-left' | ...
  pollingInterval: number, // ms

  // Modules
  storageManager: StorageManager,
  configManager: ConfigManager,
  decisionEngine: DecisionEngine,
  dataSubmitter: DataSubmitter,
  navigationMonitor: NavigationMonitor,
  uiRenderer: UIRenderer,

  // État runtime
  isInitialized: boolean,
  campaigns: Array<Campaign>,
  currentCampaign: Campaign|null,
  currentQuestion: Question|null,

  // Protection affichages multiples
  isDisplaying: boolean,        // Bloque déclenchements
  lastTriggerTime: number,      // Timestamp (ms)
  debounceDelay: number         // 500ms par défaut
}
```

**API Publique :**
```javascript
// Initialisation
init(domain, language, specificId, options)

// Affichage
showCampaign(campaignId)
showQuestion(questionId)
hide()
show()

// Métadonnées
setUserInfo(userData)

// Contrôle
refresh()
destroy()
clearData()
getDebugInfo()

// Singleton
static getInstance()
```

---

### 2. **ErrorHandler** (Fail-Safe)

**Responsabilités :**
- Intercepter toutes les erreurs du SDK
- Éviter que les erreurs ne bloquent le site hôte
- Logger les erreurs en mode debug

**Méthode Principale :**
```javascript
ErrorHandler.wrap(fn, context)()
```

**Comportement :**
```javascript
try {
  fn();
} catch (error) {
  if (ErrorHandler.debugMode) {
    console.error(`[PulserSDK:${context}]`, error);
  }
  // N'interrompt jamais l'exécution
}
```

---

### 3. **StorageManager** (Persistence)

**Responsabilités :**
- Gérer les données en `localStorage`
- Stocker métadonnées utilisateur
- Tracker historique des campagnes (shownCount, lastShown, dismissedCount)
- **Tracker les questions répondues** (couples `campaignId:questionId`)
- Cache de configuration

**Clés de Stockage :**
```javascript
{
  userMeta: 'pulser_sdk_user_meta',
  campaignHistory: 'pulser_sdk_campaign_history',
  answeredQuestions: 'pulser_sdk_answered_questions', // ⭐ Nouveau
  configCache: 'pulser_sdk_config_cache',
  configLastFetch: 'pulser_sdk_config_last_fetch'
}
```

**Structure des Données :**

#### `campaignHistory`
```json
{
  "campaign_satisfaction_q4_2024": {
    "shownCount": 3,
    "lastShown": 1701388900000,
    "dismissedCount": 1
  }
}
```

#### `answeredQuestions` ⭐
```json
{
  "campaign_satisfaction_q4_2024:q1_satisfaction": 1701388900000,
  "campaign_satisfaction_q4_2024:q1b_satisfaction_alt": 1701389000000,
  "campaign_nps_2024:q2_nps": 1701389100000
}
```

**API Principale :**
```javascript
// Métadonnées utilisateur
setUserData(userData)
getUserData()
getAllUserData()

// Historique campagnes
canShowCampaign(campaignId, frequencyDays)
markCampaignAsShown(campaignId, questionId)
markCampaignAsAnswered(campaignId, questionId) // ⭐ Modifié
markCampaignAsDismissed(campaignId)

// Questions répondues ⭐
hasAnswered(campaignId, questionId)
_storeAnsweredQuestion(campaignId, questionId)
_getAllAnsweredQuestions()

// Cache config
getCachedConfig()
setCachedConfig(config, ttl)
```

---

### 4. **ConfigManager** (Configuration API)

**Responsabilités :**
- Charger la configuration depuis l'API
- Gérer le cache avec validation conditionnelle (HTTP 304)
- Parser et valider la structure des campagnes

**Endpoint :**
```
GET https://api.{domain}/feedback/config?lang={lang}&id={id}
```

**Headers Envoyés :**
```
X-Last-Fetch-Date: 1701388900000
```

**Réponses :**
- **200** : Nouvelle config (met à jour le cache)
- **304** : Config à jour (utilise le cache)
- **4xx/5xx** : Utilise le cache ou retourne null

**Format Config :**
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
        }
      ]
    }
  ]
}
```

---

### 5. **DecisionEngine** (Logique d'Éligibilité)

**Responsabilités :**
- Évaluer quelle campagne/question afficher
- Appliquer tous les filtres et règles métier

**Processus d'Évaluation :**

```
findEligibleCampaign(campaigns, currentUrl)
  │
  ├─ 1. Filtrer par dates (startDate ≤ now ≤ endDate)
  │      ↓
  ├─ 2. Filtrer par URL (allowListRegex, blockListRegex)
  │      ↓
  ├─ 3. Filtrer par fréquence (frequencyDays via StorageManager)
  │      ↓
  ├─ 4. Trier par priorité (descendant : 1 = haute)
  │      ↓
  └─ 5. Pour chaque campagne (ordre priorité) :
       │
       ├─ A. Tester luckFactor (random ≤ luckFactor ?)
       │    ├─ ❌ Non → Passer à la campagne suivante
       │    └─ ✅ Oui → Continuer
       │
       ├─ B. Sélectionner question non-répondue ⭐
       │    (Filtrer via StorageManager.hasAnswered())
       │    ├─ Question trouvée → RETOURNER {campaign, question}
       │    └─ Toutes répondues → Passer à la campagne suivante
       │
       └─ Aucune éligible → RETOURNER null
```

**Points Clés :**
- ⭐ **Si luckFactor échoue** : Pas de `return`, continue la boucle → Aucun événement enregistré
- ⭐ **Filtre questions répondues** : Garantit qu'une question ne se répète jamais
- ⭐ **Campagne épuisée** : Si toutes questions répondues, passe à la suivante

**API :**
```javascript
findEligibleCampaign(campaigns, url) // → {campaign, question} | null
_filterByDateRange(campaigns)
_filterByURL(campaigns, url)
_filterByFrequency(campaigns)
_selectQuestionFromCampaign(campaign) // ⭐ Filtre questions répondues
_matchesURL(url, allowList, blockList)
```

---

### 6. **DataSubmitter** (Envoi API)

**Responsabilités :**
- Envoyer les réponses utilisateur
- Envoyer les impressions (dismiss)
- Gérer les erreurs réseau

**Endpoints :**

#### Submit Answer
```
POST https://api.{domain}/feedback/submit
```
Body :
```json
{
  "campaignId": "campaign_satisfaction_q4_2024",
  "questionId": "q1_satisfaction",
  "answer": 5,
  "metadata": { "userId": "123", ... },
  "timestamp": 1701388900000,
  "url": "https://example.com/products",
  "userAgent": "Mozilla/5.0..."
}
```

#### Submit Impression
```
POST https://api.{domain}/feedback/impression
```
Body :
```json
{
  "campaignId": "campaign_satisfaction_q4_2024",
  "questionId": "q1_satisfaction",
  "metadata": { "userId": "123", ... },
  "timestamp": 1701388900000,
  "url": "https://example.com/products",
  "userAgent": "Mozilla/5.0..."
}
```

**Comportement :**
- En cas d'échec réseau : Log l'erreur, ne bloque pas l'UX
- Mode debug : Affiche les payloads envoyés

---

### 7. **NavigationMonitor** (Détection SPA)

**Responsabilités :**
- Détecter les changements de page (Multi-page + SPA)
- Appeler le callback à chaque navigation

**Méthodes de Détection :**
1. **Événements natifs** :
   - `popstate` (Boutons back/forward)
   - `pushState` / `replaceState` (SPA)
2. **Polling** (Fallback) :
   - Intervalle configurable (défaut: 2000ms)
   - Compare l'URL actuelle vs précédente

**API :**
```javascript
start(interval) // Démarre la surveillance
stop()          // Arrête la surveillance
checkNow()      // Force une vérification immédiate
```

**Callback :**
```javascript
onNavigationChange(newUrl) {
  // Déclenché à chaque changement d'URL
}
```

---

### 8. **UIRenderer** (Shadow DOM)

**Responsabilités :**
- Créer le widget dans un Shadow DOM (isolation CSS/JS)
- Gérer les animations (show/hide)
- Rendre les questions selon leur type
- Gérer les interactions utilisateur

**Shadow DOM :**
```html
<div id="feedback-widget-root">
  #shadow-root (mode: closed)
    <style>
      /* CSS isolé avec Container Queries */
    </style>
    <div class="feedback-widget">
      <div class="feedback-widget-content">
        <!-- Contenu dynamique -->
      </div>
    </div>
</div>
```

**Types de Questions Supportés :**
- `rating` : Étoiles (1-5)
- `nps` : Échelle 0-10
- `scale` : Échelle personnalisée
- `boolean` : Oui/Non
- `textarea` : Texte libre

**Événements :**
```javascript
onSubmit(questionId, answer)
onDismiss(questionId)
```

**API :**
```javascript
init()
renderQuestion(question)
show()
hide()
destroy()
```

---

## 🔒 Protection Affichages Multiples

### Mécanisme 1 : Singleton

```javascript
class PulserSDK {
  static instance = null;

  constructor() {
    if (PulserSDK.instance) {
      return PulserSDK.instance; // Retourne l'instance existante
    }
    PulserSDK.instance = this;
  }
}
```

**Garantit** : Une seule instance du SDK en mémoire.

---

### Mécanisme 2 : Flag `isDisplaying`

```javascript
_handlePageChange(url) {
  // Vérifier si affichage en cours
  if (this.isDisplaying) {
    console.log('Already displaying, skipping');
    return; // Bloque tout déclenchement
  }

  // Marquer comme en cours
  this.isDisplaying = true;

  // ... Évaluation et affichage ...
}

_handleSubmit() {
  // ... Envoi réponse ...
  
  // Libérer le flag
  this.isDisplaying = false;
}
```

**Garantit** : Aucun déclenchement tant qu'une question est affichée.

---

### Mécanisme 3 : Debounce (500ms)

```javascript
_handlePageChange(url) {
  const now = Date.now();
  
  // Vérifier si dernier déclenchement < 500ms
  if (now - this.lastTriggerTime < this.debounceDelay) {
    console.log('Debounced: Too soon');
    return; // Ignorer
  }

  this.lastTriggerTime = now;
  // ... Suite ...
}
```

**Garantit** : Pas de rafraîchissements multiples rapides.

---

## 🎯 Flow Complet d'une Navigation

```
1. NavigationMonitor détecte changement URL
   ↓
2. PulserSDK._handlePageChange(newUrl)
   ↓
3. ✅ Vérification Debounce (< 500ms ?)
   ├─ ❌ Trop tôt → STOP
   └─ ✅ OK
   ↓
4. ✅ Vérification isDisplaying
   ├─ ❌ Déjà affiché → STOP
   └─ ✅ OK
   ↓
5. isDisplaying = true (bloque futurs déclenchements)
   ↓
6. DecisionEngine.findEligibleCampaign()
   ├─ Filtres dates, URL, fréquence
   ├─ Tri par priorité
   └─ Pour chaque campagne :
       ├─ Test luckFactor
       │  ├─ ❌ Échec → Campagne suivante
       │  └─ ✅ Succès
       ├─ Sélection question non-répondue
       │  ├─ Question trouvée → RETOUR
       │  └─ Toutes répondues → Campagne suivante
       └─ Aucune éligible → RETOUR null
   ↓
7. Si campagne trouvée :
   ├─ UIRenderer.renderQuestion()
   ├─ UIRenderer.show()
   └─ StorageManager.markCampaignAsShown()
   ↓
8. Utilisateur répond ou dismiss
   ↓
9. DataSubmitter envoie à l'API
   ↓
10. StorageManager.markCampaignAsAnswered() // ⭐
    (Stocke campaignId:questionId)
   ↓
11. isDisplaying = false (débloque)
   ↓
12. Prêt pour prochaine navigation
```

---

## 📊 Données Persistées (localStorage)

| Clé | Type | Contenu |
|-----|------|---------|
| `pulser_sdk_user_meta` | Object | Métadonnées utilisateur (userId, email, plan, ...) |
| `pulser_sdk_campaign_history` | Object | Historique affichages par campagne |
| `pulser_sdk_answered_questions` | Object | Couples (campaignId:questionId) répondus ⭐ |
| `pulser_sdk_config_cache` | Object | Configuration des campagnes (cachée) |
| `pulser_sdk_config_last_fetch` | Number | Timestamp dernière récupération config |

---

## 🧪 Points de Test Clés

1. **Singleton** : `new PulserSDK() === new PulserSDK()`
2. **Debounce** : 5 clics rapides → 1 seule question
3. **isDisplaying** : Question visible + nouveau clic → bloqué
4. **Questions répondues** : Répondre à Q1 → Q1 ne revient jamais
5. **LuckFactor** : Échec → Aucun `markAsShown`, aucun événement API
6. **Priorités** : Priority=1 testée avant Priority=2
7. **Campagne épuisée** : Toutes questions répondues → Rien
8. **Affichages forcés** : `show*()` bypass les protections

---

## 🚀 Optimisations Futures Possibles

1. **WebWorker** : Déporter DecisionEngine dans un Worker
2. **IndexedDB** : Migrer de localStorage pour plus de capacité
3. **Service Worker** : Cache config offline
4. **Analytics** : Tracking détaillé des comportements utilisateurs
5. **A/B Testing** : Variantes de questions par campagne
6. **Multi-langue** : Support i18n au niveau SDK
7. **Animations** : Transitions plus fluides (Framer Motion ?)

---

**Développé avec ❤️ en Vanilla JavaScript**
