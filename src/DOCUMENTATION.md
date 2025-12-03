# 📚 Pulser SDK - Documentation Complète

> **Note** : Cette documentation couvre le SDK côté client. Pour l'API backend, consultez [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Table des Matières

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Configuration Rapide](#configuration-rapide)
4. [Configuration Avancée](#configuration-avancée)
5. [Types de Questions](#types-de-questions)
6. [Système de Validation](#système-de-validation)
7. [Consentement RGPD](#consentement-rgpd)
8. [API Reference](#api-reference)
9. [Ciblage et Triggers](#ciblage-et-triggers)
10. [Personnalisation](#personnalisation)
11. [Exemples d'Usage](#exemples-dusage)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

**Pulser SDK** est un SDK JavaScript ultra-léger pour collecter du feedback utilisateur en temps réel sur votre site web.

### ✨ Caractéristiques Principales

- 🪶 **Ultra-léger** : Vanilla JS sans dépendances
- 🔒 **Isolation parfaite** : Utilise le Shadow DOM
- 📱 **Responsive** : Container Queries pour une adaptation automatique
- 🎯 **Ciblage intelligent** : Par URL, métadonnées utilisateur, fréquence
- 🌍 **i18n ready** : Support multilingue intégré
- ✅ **RGPD compliant** : Système de consentement intégré
- 🎨 **Personnalisable** : 9 positions, styles personnalisables
- 📊 **6 types de questions** : Rating, NPS, Boolean, Textarea, Select, Scale

### 🏗️ Architecture

Le SDK utilise une architecture modulaire avec :
- **Pattern Singleton** : Une seule instance active
- **Shadow DOM** : Isolation CSS et DOM parfaite
- **Container Queries** : Responsive sans media queries
- **LocalStorage** : Persistance des données côté client

---

## Installation

### Option 1 : Import ES6 Module

```javascript
import PulserSDK from './sdk/index.js';

const pulser = new PulserSDK();
await pulser.init('votre-domaine.com', 'fr', userMeta, options);
```

### Option 2 : Script tag

```html
<script type="module">
  import PulserSDK from 'https://cdn.example.com/pulser-sdk/v1/index.js';
  
  window.PulserSDK = new PulserSDK();
  window.PulserSDK.init('votre-domaine.com', 'fr');
</script>
```

### Pré-requis

- Navigateur moderne supportant ES6 modules
- Support du Shadow DOM (tous navigateurs modernes)
- Support de Container Queries (Chrome 105+, Safari 16+, Firefox 110+)

---

## Configuration Rapide

### Initialisation Minimale

```javascript
import PulserSDK from './sdk/index.js';

// Créer et initialiser
const pulser = new PulserSDK();
await pulser.init('example.com', 'fr');

// Le SDK est maintenant actif et va :
// 1. Récupérer la configuration depuis votre serveur
// 2. Surveiller la navigation
// 3. Afficher les questions selon les règles définies
```

### Avec Métadonnées Utilisateur

```javascript
const userMeta = {
  userId: 'user_123',
  email: 'user@example.com',
  plan: 'premium',
  signupDate: '2024-01-15'
};

await pulser.init('example.com', 'fr', userMeta);
```

---

## Configuration Avancée

### Options Complètes

```javascript
const options = {
  // Position du widget
  position: 'bottom-right', // 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  
  // Intervalle de polling de configuration (ms)
  pollingInterval: 300000, // 5 minutes par défaut
  
  // Mode debug
  debug: false,
  
  // Consentement RGPD
  requireConsent: true,
  
  // Configuration locale (skip serveur)
  localConfig: {
    campaigns: [...],
    consent: {...}
  }
};

await pulser.init('example.com', 'fr', userMeta, options);
```

### Configuration des Campagnes

Les campagnes sont configurées côté serveur et récupérées automatiquement. Structure JSON :

```javascript
{
  "campaigns": [
    {
      "id": "campaign_nps_2024",
      "name": "NPS Survey Q1 2024",
      "active": true,
      "priority": 10,
      "trigger": {
        "type": "navigation",
        "urlPatterns": ["/products/*", "/pricing"],
        "excludePatterns": ["/admin/*"]
      },
      "frequency": {
        "maxPerSession": 1,
        "cooldownDays": 30
      },
      "questions": [
        {
          "id": "q1_nps",
          "type": "nps",
          "question": "Recommanderiez-vous notre produit ?",
          "scale": { "min": 0, "max": 10 },
          "labels": { "min": "Pas du tout", "max": "Absolument" },
          "validation": {
            "required": true,
            "errorMessages": {
              "required": "Veuillez sélectionner une note"
            }
          },
          "thankYouMessage": "Merci pour votre feedback !"
        }
      ]
    }
  ],
  "consent": {
    "required": true,
    "title": "Aidez-nous à améliorer votre expérience",
    "description": "Nous collectons vos retours pour améliorer nos services.",
    "learnMoreUrl": "https://example.com/privacy",
    "dataCollected": [
      "Vos réponses aux questions",
      "URL des pages visitées",
      "Horodatage des interactions"
    ]
  }
}
```

---

## Types de Questions

### 1. Rating (Étoiles)

```javascript
{
  "type": "rating",
  "question": "Comment évaluez-vous notre service ?",
  "scale": { "min": 1, "max": 5 },
  "labels": { "min": "Très mauvais", "max": "Excellent" },
  "validation": {
    "required": true,
    "errorMessages": {
      "required": "Veuillez sélectionner une note"
    }
  }
}
```

**Rendu** : ⭐⭐⭐⭐⭐ (étoiles cliquables)

---

### 2. NPS (Net Promoter Score)

```javascript
{
  "type": "nps",
  "question": "Recommanderiez-vous notre produit ?",
  "scale": { "min": 0, "max": 10 },
  "labels": { "min": "Pas du tout", "max": "Absolument" },
  "validation": {
    "required": true
  }
}
```

**Rendu** : Échelle numérique de 0 à 10

---

### 3. Boolean (Oui/Non)

```javascript
{
  "type": "boolean",
  "question": "Avez-vous trouvé ce que vous cherchiez ?",
  "labels": { "true": "Oui", "false": "Non" },
  "validation": {
    "required": true,
    "errorMessages": {
      "required": "Veuillez faire un choix"
    }
  }
}
```

**Rendu** : Deux boutons "Oui" / "Non"

---

### 4. Textarea (Texte libre)

```javascript
{
  "type": "textarea",
  "question": "Partagez vos suggestions d'amélioration",
  "placeholder": "Vos idées sont précieuses...",
  "validation": {
    "required": true,
    "minLength": 10,
    "maxLength": 500,
    "forbiddenWords": ["spam", "test"],
    "errorMessages": {
      "required": "Veuillez partager votre avis",
      "minLength": "Minimum 10 caractères requis",
      "maxLength": "Maximum 500 caractères",
      "forbiddenWords": "Votre message contient des mots interdits"
    }
  }
}
```

**Rendu** : Zone de texte multiligne avec compteur de caractères

---

### 5. Select (Liste déroulante)

```javascript
{
  "type": "select",
  "question": "Quelle est votre fonctionnalité préférée ?",
  "options": [
    { "value": "feature_a", "label": "Fonctionnalité A" },
    { "value": "feature_b", "label": "Fonctionnalité B" },
    { "value": "feature_c", "label": "Fonctionnalité C" },
    { "value": "other", "label": "Autre" }
  ],
  "placeholder": "Choisissez une option",
  "validation": {
    "required": true,
    "errorMessages": {
      "required": "Veuillez sélectionner une option"
    }
  }
}
```

**Rendu** : Menu déroulant stylisé

---

### 6. Scale (Échelle linéaire)

```javascript
{
  "type": "scale",
  "question": "À quel point êtes-vous satisfait ?",
  "scale": { "min": 1, "max": 7 },
  "labels": { 
    "min": "Pas du tout satisfait", 
    "max": "Totalement satisfait" 
  },
  "validation": {
    "required": true
  }
}
```

**Rendu** : Échelle numérique avec labels

---

## Système de Validation

### Règles de Validation Disponibles

#### 1. `required`

```javascript
"validation": {
  "required": true,
  "errorMessages": {
    "required": "Ce champ est obligatoire"
  }
}
```

---

#### 2. `minLength` / `maxLength` (Textarea)

```javascript
"validation": {
  "minLength": 10,
  "maxLength": 500,
  "errorMessages": {
    "minLength": "Minimum 10 caractères",
    "maxLength": "Maximum 500 caractères"
  }
}
```

---

#### 3. `pattern` (Regex)

```javascript
"validation": {
  "pattern": "^[a-zA-Z0-9]+$",
  "errorMessages": {
    "pattern": "Seuls les caractères alphanumériques sont autorisés"
  }
}
```

---

#### 4. `forbiddenWords` (Liste noire)

```javascript
"validation": {
  "forbiddenWords": ["spam", "test", "fake"],
  "errorMessages": {
    "forbiddenWords": "Votre message contient des mots interdits"
  }
}
```

---

#### 5. `custom` (Fonction personnalisée)

```javascript
"validation": {
  "custom": "(value) => value.includes('@') ? null : 'Email invalide'",
  "errorMessages": {
    "custom": "Validation personnalisée échouée"
  }
}
```

⚠️ **Note** : Les fonctions custom sont évaluées avec `new Function()` côté client.

---

### Affichage des Erreurs

Les erreurs s'affichent en temps réel sous le champ :

```
┌─────────────────────────────────┐
│ Question...                     │
│ ┌─────────────────────────────┐ │
│ │ [Input invalide]            │ │
│ └─────────────────────────────┘ │
│ ⚠️ Message d'erreur personnalisé│
└─────────────────────────────────┘
```

---

## Consentement RGPD

### Configuration du Consentement

```javascript
{
  "consent": {
    "required": true,
    "title": "Aidez-nous à améliorer votre expérience",
    "description": "Nous aimerions recueillir vos retours pour améliorer nos services.",
    "learnMoreUrl": "https://example.com/privacy",
    "dataCollected": [
      "Vos réponses aux questions de feedback",
      "URL des pages que vous consultez",
      "Horodatage de vos interactions"
    ],
    "acceptLabel": "J'accepte",
    "declineLabel": "Je refuse"
  }
}
```

---

### Flux de Consentement

```
1. Première visite
   ↓
2. Question éligible détectée
   ↓
3. Affichage de l'écran de consentement
   ↓
4. Utilisateur accepte ──→ Questions affichées normalement
   │
   └──→ Utilisateur refuse ──→ Aucune question, données effacées
```

---

### API de Consentement

#### Vérifier le statut

```javascript
const status = window.PulserSDK.getConsentStatus();
console.log(status);
// {
//   enabled: true,
//   required: true,
//   hasConsent: false,
//   status: null
// }
```

---

#### Définir manuellement

```javascript
// Accepter
window.PulserSDK.setConsent(true);

// Refuser
window.PulserSDK.setConsent(false);
```

---

#### Réinitialiser

```javascript
window.PulserSDK.resetConsent();
// Efface le consentement → l'écran réapparaîtra
```

---

### Stockage Local

```javascript
// Consentement stocké dans localStorage
localStorage.getItem('pulser_sdk_consent');
// → "true" | "false" | null

// Réponses (effacées si refus)
localStorage.getItem('pulser_sdk_answered_questions');
localStorage.getItem('pulser_sdk_campaign_history');
```

---

## API Reference

### Méthodes Publiques

#### `init(domain, language, userMeta, options)`

Initialise le SDK.

```javascript
await pulser.init(
  'example.com',      // Domain
  'fr',               // Language code
  {                   // User metadata (optionnel)
    userId: '123',
    plan: 'premium'
  },
  {                   // Options (optionnel)
    position: 'bottom-right',
    debug: true
  }
);
```

**Retour** : `Promise<void>`

---

#### `destroy()`

Détruit l'instance du SDK.

```javascript
window.PulserSDK.destroy();
// ✅ Widget supprimé du DOM
// ✅ Listeners nettoyés
// ✅ Singleton réinitialisé
```

---

#### `setUserInfo(metadata)`

Met à jour les métadonnées utilisateur.

```javascript
window.PulserSDK.setUserInfo({
  userId: 'user_456',
  plan: 'enterprise',
  customField: 'value'
});
```

---

#### `showCampaign(campaignId)`

Force l'affichage d'une campagne (debug).

```javascript
window.PulserSDK.showCampaign('campaign_nps_2024');
```

---

#### `showQuestion(questionId)`

Force l'affichage d'une question (debug).

```javascript
window.PulserSDK.showQuestion('q1_satisfaction');
```

---

#### `hide()`

Masque le widget actuel.

```javascript
window.PulserSDK.hide();
```

---

#### `clearData()`

Efface toutes les données locales.

```javascript
window.PulserSDK.clearData();
// ✅ localStorage nettoyé
// ✅ Historique effacé
// ✅ Réponses supprimées
```

---

#### `getDebugInfo()`

Récupère les informations de debug.

```javascript
const info = window.PulserSDK.getDebugInfo();
console.log(info);
// {
//   isInitialized: true,
//   currentUrl: "https://example.com/products",
//   campaigns: [...],
//   userMeta: {...},
//   isDisplaying: false,
//   position: "bottom-right"
// }
```

---

#### `reloadConfig()`

Recharge la configuration depuis le serveur.

```javascript
await window.PulserSDK.reloadConfig();
```

---

#### `updatePosition(position)`

Change la position du widget.

```javascript
window.PulserSDK.updatePosition('top-center');
// ✅ Widget repositionné instantanément
```

**Positions disponibles** :
- `top-left`, `top-center`, `top-right`
- `center-left`, `center`, `center-right`
- `bottom-left`, `bottom-center`, `bottom-right`

---

### Événements

Le SDK émet des événements personnalisés :

```javascript
// Écouter les réponses
document.addEventListener('pulser:response', (event) => {
  console.log('Réponse soumise:', event.detail);
  // {
  //   campaignId: 'campaign_nps_2024',
  //   questionId: 'q1_nps',
  //   answer: 9,
  //   timestamp: 1234567890
  // }
});

// Écouter l'affichage
document.addEventListener('pulser:shown', (event) => {
  console.log('Question affichée:', event.detail);
});

// Écouter la fermeture
document.addEventListener('pulser:closed', (event) => {
  console.log('Widget fermé:', event.detail);
});
```

---

## Ciblage et Triggers

### Trigger par Navigation

```javascript
{
  "trigger": {
    "type": "navigation",
    "urlPatterns": [
      "/products/*",      // Wildcard
      "/pricing",         // Exact
      "/blog/*/comments"  // Multiple wildcards
    ],
    "excludePatterns": [
      "/admin/*",
      "/api/*"
    ]
  }
}
```

---

### Ciblage par Métadonnées

```javascript
{
  "targeting": {
    "userMeta": {
      "plan": ["premium", "enterprise"], // OR
      "signupDate": ">2024-01-01"       // Comparaison
    }
  }
}
```

---

### Fréquence et Cooldown

```javascript
{
  "frequency": {
    "maxPerSession": 1,      // Max 1 fois par session
    "cooldownDays": 30,      // Attendre 30 jours avant réaffichage
    "maxPerCampaign": 1      // Max 1 fois pour cette campagne
  }
}
```

---

### Priorités

Les campagnes avec `priority` plus élevée sont affichées en premier :

```javascript
{
  "campaigns": [
    { "id": "urgent", "priority": 100 },  // Affiché en premier
    { "id": "normal", "priority": 10 },
    { "id": "low", "priority": 1 }
  ]
}
```

---

## Personnalisation

### Styles CSS

Le SDK utilise des CSS variables personnalisables :

```javascript
// Dans votre configuration
{
  "styles": {
    "--pulser-primary-color": "#4F46E5",
    "--pulser-background": "#FFFFFF",
    "--pulser-text-color": "#1F2937",
    "--pulser-border-radius": "12px",
    "--pulser-shadow": "0 10px 40px rgba(0,0,0,0.1)"
  }
}
```

---

### Positions Prédéfinies

```
┌─────────────────────────────┐
│ TL      TC          TR      │  TL = top-left
│                             │  TC = top-center
│                             │  TR = top-right
│ CL      C           CR      │  CL = center-left
│                             │  C  = center
│                             │  CR = center-right
│ BL      BC          BR      │  BL = bottom-left
└─────────────────────────────┘  BC = bottom-center
                                 BR = bottom-right
```

---

### Container Queries

Le widget s'adapte automatiquement à sa taille :

```css
/* < 400px de large */
@container (max-width: 400px) {
  .pulser-widget {
    font-size: 14px;
    padding: 12px;
  }
}

/* > 600px de large */
@container (min-width: 600px) {
  .pulser-widget {
    font-size: 16px;
    padding: 24px;
  }
}
```

---

## Exemples d'Usage

### Exemple 1 : E-commerce

```javascript
// Initialisation
const pulser = new PulserSDK();
await pulser.init('shop.example.com', 'fr', {
  userId: getCurrentUserId(),
  cartValue: getCartTotal(),
  hasOrdered: hasUserOrdered()
}, {
  position: 'bottom-right'
});

// Configuration serveur
{
  "campaigns": [
    {
      "id": "post_checkout_satisfaction",
      "trigger": {
        "type": "navigation",
        "urlPatterns": ["/checkout/success"]
      },
      "questions": [{
        "type": "rating",
        "question": "Comment s'est passé votre achat ?",
        "scale": { "min": 1, "max": 5 }
      }]
    }
  ]
}
```

---

### Exemple 2 : SaaS Dashboard

```javascript
// Initialisation
await pulser.init('app.example.com', 'en', {
  userId: user.id,
  plan: user.subscription.plan,
  accountAge: user.createdAt
}, {
  position: 'top-right',
  requireConsent: true
});

// Configuration serveur
{
  "campaigns": [
    {
      "id": "feature_feedback",
      "trigger": {
        "type": "navigation",
        "urlPatterns": ["/dashboard/analytics"]
      },
      "targeting": {
        "userMeta": {
          "plan": ["premium", "enterprise"]
        }
      },
      "questions": [{
        "type": "nps",
        "question": "How likely are you to recommend our analytics feature?"
      }]
    }
  ]
}
```

---

### Exemple 3 : Blog / Contenu

```javascript
// Initialisation
await pulser.init('blog.example.com', 'fr', {
  articleId: getCurrentArticleId(),
  category: getCurrentCategory(),
  isSubscribed: isUserSubscribed()
}, {
  position: 'bottom-center'
});

// Configuration serveur
{
  "campaigns": [
    {
      "id": "article_feedback",
      "trigger": {
        "type": "navigation",
        "urlPatterns": ["/blog/*"]
      },
      "questions": [{
        "type": "boolean",
        "question": "Cet article vous a-t-il été utile ?",
        "labels": { "true": "Oui", "false": "Non" }
      }, {
        "type": "textarea",
        "question": "Que pourrions-nous améliorer ?",
        "validation": { "minLength": 10 }
      }]
    }
  ]
}
```

---

## Troubleshooting

### Le widget n'apparaît pas

**1. Vérifier l'initialisation**

```javascript
const info = window.PulserSDK.getDebugInfo();
console.log('Initialized:', info.isInitialized);
console.log('Campaigns:', info.campaigns);
```

**2. Activer le mode debug**

```javascript
await pulser.init('example.com', 'fr', null, { debug: true });
// → Logs détaillés dans la console
```

**3. Vérifier les règles de ciblage**

```javascript
// Forcer l'affichage pour tester
window.PulserSDK.showQuestion('q1_test');
```

---

### Les réponses ne sont pas sauvegardées

**1. Vérifier le consentement**

```javascript
const status = window.PulserSDK.getConsentStatus();
console.log('Has consent:', status.hasConsent);
```

**2. Vérifier localStorage**

```javascript
console.log('Responses:', localStorage.getItem('pulser_sdk_answered_questions'));
```

---

### Conflit CSS avec le site

Le SDK utilise le **Shadow DOM** pour éviter les conflits CSS. Si vous rencontrez des problèmes :

```javascript
// Inspecter le Shadow DOM
const host = document.getElementById('pulser-sdk-host');
console.log('Shadow root:', host.shadowRoot);
```

---

### Questions affichées trop souvent

**1. Vérifier les règles de fréquence**

```javascript
{
  "frequency": {
    "maxPerSession": 1,      // ⚠️ Limiter à 1 par session
    "cooldownDays": 30       // ⚠️ Attendre 30 jours
  }
}
```

**2. Effacer l'historique (test uniquement)**

```javascript
window.PulserSDK.clearData();
```

---

### Erreur de validation personnalisée

**1. Vérifier la syntaxe de la fonction**

```javascript
// ❌ Incorrect
"custom": "value.length > 5"

// ✅ Correct
"custom": "(value) => value.length > 5 ? null : 'Trop court'"
```

**2. Tester la fonction**

```javascript
const validator = new Function('value', 'return ' + validationString);
console.log(validator('test'));
```

---

## Support et Contribution

### Rapporter un Bug

Créez une issue sur GitHub avec :
- Version du SDK
- Navigateur et version
- Configuration (anonymisée)
- Console logs avec `debug: true`

### Demander une Fonctionnalité

Décrivez votre use case et les bénéfices attendus.

### Documentation

- [API Backend Documentation](./API_DOCUMENTATION.md)
- [Architecture Interne](./ARCHITECTURE.md)
- [Guide de Tests](./TEST_GUIDE.md)
- [Guide de Positionnement](./POSITIONING_GUIDE.md)
- [Tests de Consentement](./TEST_CONSENT.md)
- [Changelog](./CHANGELOG.md)

---

## License

MIT License - Voir [LICENSE](./LICENSE) pour plus de détails.

---

**Pulser SDK** - Collectez du feedback de qualité, simplement.
