# 🧪 Guide de Test - Système de Consentement RGPD

Ce guide vous permet de tester complètement le système de consentement RGPD du Feedback SDK.

---

## 📋 Prérequis

1. SDK initialisé avec `debug: true`
2. Accès à la console du navigateur
3. Application de démo en cours d'exécution

---

## 🎯 Scénarios de Test

### Scénario 1 : Premier Affichage du Consentement

**Objectif :** Vérifier que l'écran de consentement s'affiche la première fois.

**Étapes :**

1. **Effacer toutes les données**
   ```javascript
   window.PulserSDK.clearData();
   ```

2. **Recharger la page**
   ```javascript
   location.reload();
   ```

3. **Naviguer vers une page**
   ```javascript
   window.history.pushState({}, '', '/products');
   ```

4. **Vérifier l'affichage**
   - ✅ L'écran de consentement doit s'afficher
   - ✅ Le titre et la description sont visibles
   - ✅ Les deux boutons "Oui, j'accepte" et "Non merci" sont présents
   - ✅ Le lien "En savoir plus" fonctionne (si configuré)

**Console attendue :**
```
[PulserSDK] Page change detected: /products
[PulserSDK] Consent required, showing consent screen
[UIRenderer] Consent screen rendered
[UIRenderer] Widget shown
```

---

### Scénario 2 : Acceptation du Consentement

**Objectif :** Vérifier le comportement après acceptation.

**Étapes :**

1. **Afficher l'écran de consentement** (voir Scénario 1)

2. **Cliquer sur "Oui, j'accepte"**

3. **Vérifier le comportement**
   - ✅ L'écran de consentement disparaît
   - ✅ Une question s'affiche immédiatement
   - ✅ Le consentement est stocké en localStorage

4. **Vérifier dans la console**
   ```javascript
   const status = window.PulserSDK.getConsentStatus();
   console.log(status);
   // → { enabled: true, required: false, hasConsent: true, status: true }
   ```

5. **Vérifier dans localStorage**
   ```javascript
   localStorage.getItem('pulser_sdk_consent');
   // → "true"
   ```

**Console attendue :**
```
[ConsentManager] Consentement accepté
[StorageManager] Consent saved: true
[PulserSDK] Eligible campaign found: {...}
[UIRenderer] Question rendered: q1_satisfaction
```

---

### Scénario 3 : Refus du Consentement

**Objectif :** Vérifier que les données sont effacées en cas de refus.

**Étapes :**

1. **Préparer des données fictives**
   ```javascript
   window.PulserSDK.setUserInfo({ userId: '123', plan: 'premium' });
   ```

2. **Réinitialiser le consentement**
   ```javascript
   window.PulserSDK.resetConsent();
   ```

3. **Naviguer pour afficher le consentement**
   ```javascript
   window.history.pushState({}, '', '/about');
   ```

4. **Cliquer sur "Non merci"**

5. **Vérifier le comportement**
   - ✅ L'écran de consentement disparaît
   - ✅ Aucune question ne s'affiche
   - ✅ Toutes les réponses et impressions sont effacées

6. **Vérifier dans la console**
   ```javascript
   const status = window.PulserSDK.getConsentStatus();
   console.log(status);
   // → { enabled: true, required: false, hasConsent: false, status: false }
   ```

7. **Vérifier que les données sont effacées**
   ```javascript
   localStorage.getItem('pulser_sdk_answered_questions');
   // → null
   
   localStorage.getItem('pulser_sdk_campaign_history');
   // → null
   ```

**Console attendue :**
```
[ConsentManager] Consentement refusé
[StorageManager] Consent saved: false
[StorageManager] All responses cleared
[StorageManager] All impressions cleared
[ConsentManager] Données utilisateur effacées (refus de consentement)
```

---

### Scénario 4 : Consentement Persistant

**Objectif :** Vérifier que le consentement persiste entre les sessions.

**Étapes :**

1. **Accepter le consentement** (voir Scénario 2)

2. **Recharger la page**
   ```javascript
   location.reload();
   ```

3. **Naviguer vers une page**
   ```javascript
   window.history.pushState({}, '', '/products');
   ```

4. **Vérifier le comportement**
   - ✅ L'écran de consentement ne s'affiche PAS
   - ✅ Une question s'affiche directement
   - ✅ Le consentement est toujours stocké

**Console attendue :**
```
[PulserSDK] Page change detected: /products
[PulserSDK] Eligible campaign found: {...}
[UIRenderer] Question rendered: q1_satisfaction
```

---

### Scénario 5 : Réinitialisation du Consentement

**Objectif :** Vérifier que l'utilisateur peut révoquer son consentement.

**Étapes :**

1. **Accepter le consentement** (voir Scénario 2)

2. **Réinitialiser le consentement**
   ```javascript
   window.PulserSDK.resetConsent();
   ```

3. **Vérifier dans la console**
   ```javascript
   const status = window.PulserSDK.getConsentStatus();
   console.log(status);
   // → { enabled: true, required: true, hasConsent: false, status: null }
   ```

4. **Naviguer vers une page**
   ```javascript
   window.history.pushState({}, '', '/about');
   ```

5. **Vérifier le comportement**
   - ✅ L'écran de consentement s'affiche à nouveau
   - ✅ L'utilisateur peut re-donner ou refuser son consentement

**Console attendue :**
```
[ConsentManager] Consentement réinitialisé
[StorageManager] Consent cleared
[PulserSDK] Consent required, showing consent screen
```

---

### Scénario 6 : Consentement Désactivé

**Objectif :** Vérifier que le SDK fonctionne sans consentement si désactivé.

**Étapes :**

1. **Modifier la configuration API pour désactiver le consentement**
   ```javascript
   // Dans MockAPIServer.config
   consent: {
     enabled: false
   }
   ```

2. **Recharger la configuration**
   ```javascript
   await window.PulserSDK.reloadConfig();
   ```

3. **Effacer toutes les données**
   ```javascript
   window.PulserSDK.clearData();
   location.reload();
   ```

4. **Naviguer vers une page**
   ```javascript
   window.history.pushState({}, '', '/products');
   ```

5. **Vérifier le comportement**
   - ✅ Aucun écran de consentement ne s'affiche
   - ✅ Une question s'affiche directement
   - ✅ Les réponses sont enregistrées normalement

6. **Vérifier dans la console**
   ```javascript
   const status = window.PulserSDK.getConsentStatus();
   console.log(status);
   // → { enabled: false, required: false, hasConsent: true, status: null }
   ```

---

### Scénario 7 : Gestion Manuelle du Consentement

**Objectif :** Vérifier que le consentement peut être géré manuellement.

**Étapes :**

1. **Désactiver le consentement dans la config** (voir Scénario 6)

2. **Enregistrer manuellement le consentement**
   ```javascript
   window.PulserSDK.setConsent(true);
   ```

3. **Vérifier dans la console**
   ```javascript
   const status = window.PulserSDK.getConsentStatus();
   console.log(status);
   // → { enabled: false, required: false, hasConsent: true, status: true }
   ```

4. **Naviguer et vérifier**
   ```javascript
   window.history.pushState({}, '', '/products');
   ```
   - ✅ Une question s'affiche
   - ✅ Les réponses sont enregistrées

5. **Refuser manuellement**
   ```javascript
   window.PulserSDK.setConsent(false);
   ```
   - ✅ Toutes les données sont effacées
   - ✅ Plus aucune question ne s'affiche

---

### Scénario 8 : Fermeture de l'Écran de Consentement

**Objectif :** Vérifier le comportement si l'utilisateur ferme sans répondre.

**Étapes :**

1. **Afficher l'écran de consentement** (voir Scénario 1)

2. **Cliquer sur le bouton de fermeture (×)**

3. **Vérifier le comportement**
   - ✅ L'écran de consentement disparaît
   - ✅ Aucune question ne s'affiche
   - ✅ Le consentement reste `null` (pas de réponse)

4. **Vérifier dans la console**
   ```javascript
   const status = window.FeedbackSDK.getConsentStatus();
   console.log(status);
   // → { enabled: true, required: true, hasConsent: false, status: null }
   ```

5. **Naviguer à nouveau**
   ```javascript
   window.history.pushState({}, '', '/about');
   ```
   - ✅ L'écran de consentement s'affiche à nouveau

---

## 🔍 Tests de l'API Publique

### Test `getConsentStatus()`

```javascript
// Cas 1 : Consentement activé, non demandé
window.FeedbackSDK.clearData();
const status1 = window.FeedbackSDK.getConsentStatus();
console.assert(status1.enabled === true, 'Enabled should be true');
console.assert(status1.required === true, 'Required should be true');
console.assert(status1.hasConsent === false, 'hasConsent should be false');
console.assert(status1.status === null, 'Status should be null');

// Cas 2 : Consentement accepté
window.FeedbackSDK.setConsent(true);
const status2 = window.FeedbackSDK.getConsentStatus();
console.assert(status2.required === false, 'Required should be false after consent');
console.assert(status2.hasConsent === true, 'hasConsent should be true');
console.assert(status2.status === true, 'Status should be true');

// Cas 3 : Consentement refusé
window.FeedbackSDK.setConsent(false);
const status3 = window.FeedbackSDK.getConsentStatus();
console.assert(status3.hasConsent === false, 'hasConsent should be false after decline');
console.assert(status3.status === false, 'Status should be false');

console.log('✅ Tous les tests getConsentStatus() passent !');
```

### Test `setConsent()`

```javascript
// Test acceptation
window.FeedbackSDK.setConsent(true);
console.assert(
  localStorage.getItem('feedback_sdk_consent') === 'true',
  'Consent should be stored as "true"'
);

// Test refus
window.FeedbackSDK.setUserInfo({ test: 'data' });
window.FeedbackSDK.setConsent(false);
console.assert(
  localStorage.getItem('feedback_sdk_consent') === 'false',
  'Consent should be stored as "false"'
);
console.assert(
  localStorage.getItem('feedback_sdk_answered_questions') === null,
  'Responses should be cleared'
);

console.log('✅ Tous les tests setConsent() passent !');
```

### Test `resetConsent()`

```javascript
// Accepter puis réinitialiser
window.FeedbackSDK.setConsent(true);
window.FeedbackSDK.resetConsent();
console.assert(
  localStorage.getItem('feedback_sdk_consent') === null,
  'Consent should be null after reset'
);

const status = window.FeedbackSDK.getConsentStatus();
console.assert(status.required === true, 'Consent should be required again');
console.assert(status.status === null, 'Status should be null');

console.log('✅ Tous les tests resetConsent() passent !');
```

---

## 🎨 Tests Visuels

### Vérification de l'UI de Consentement

**Checklist :**

- [ ] Le titre est affiché correctement
- [ ] La description est lisible
- [ ] Le lien "En savoir plus" fonctionne (si configuré)
- [ ] Les informations sur les données collectées sont affichées
- [ ] Les deux boutons sont visibles et cliquables
- [ ] Le lien vers la politique de confidentialité fonctionne (si configuré)
- [ ] Le bouton de fermeture (×) fonctionne
- [ ] Les animations de transition sont fluides
- [ ] Le design est responsive (mobile, tablette, desktop)
- [ ] Le contraste des couleurs est suffisant (accessibilité)
- [ ] Le focus clavier fonctionne correctement (Tab, Enter, Esc)

### Tests Responsifs

**Desktop (> 768px) :**
```javascript
// Tester sur différentes positions
['bottom-right', 'bottom-left', 'bottom-center', 'center'].forEach(position => {
  window.FeedbackSDK.updatePosition(position);
  window.FeedbackSDK.resetConsent();
  window.history.pushState({}, '', '/test');
  // Vérifier visuellement la position
});
```

**Mobile (< 768px) :**
- Redimensionner le navigateur à 375px de large
- Vérifier que l'écran de consentement est en pleine largeur en bas

---

## 🐛 Tests d'Erreurs

### Test avec configuration invalide

```javascript
// Tester avec config null
const sdk = window.FeedbackSDK;
sdk.consentManager.setConfig(null);
const status = sdk.getConsentStatus();
// ✅ Ne devrait pas crasher

// Tester avec config partielle
sdk.consentManager.setConfig({ enabled: true });
// ✅ Les valeurs par défaut doivent être utilisées
```

### Test avec localStorage désactivé

```javascript
// Simuler l'indisponibilité du localStorage
const originalSetItem = localStorage.setItem;
localStorage.setItem = () => { throw new Error('QuotaExceeded'); };

window.FeedbackSDK.setConsent(true);
// ✅ Ne devrait pas crasher

// Restaurer
localStorage.setItem = originalSetItem;
```

---

## 📊 Checklist Complète

### Fonctionnalités

- [ ] L'écran de consentement s'affiche la première fois
- [ ] Accepter le consentement permet d'afficher les questions
- [ ] Refuser efface toutes les données
- [ ] Le consentement persiste entre les sessions
- [ ] Réinitialiser permet de redemander le consentement
- [ ] Fermer sans répondre ne stocke rien
- [ ] La configuration peut désactiver le consentement
- [ ] Le consentement peut être géré manuellement

### API Publique

- [ ] `getConsentStatus()` retourne les bonnes valeurs
- [ ] `setConsent(true)` stocke le consentement
- [ ] `setConsent(false)` efface les données
- [ ] `resetConsent()` permet de redemander

### UI/UX

- [ ] Design conforme à la maquette
- [ ] Responsive sur mobile
- [ ] Animations fluides
- [ ] Accessibilité clavier
- [ ] Contraste suffisant

### Conformité RGPD

- [ ] Consentement explicite requis
- [ ] Informations claires sur les données
- [ ] Refus efface toutes les données
- [ ] Consentement révocable
- [ ] Pas de collecte sans consentement

---

## 🎯 Résultats Attendus

Tous les scénarios doivent passer sans erreur dans la console et le comportement doit être conforme aux spécifications.

**En cas de problème :**
1. Vérifier les logs dans la console (mode debug activé)
2. Vérifier le localStorage (`feedback_sdk_consent`)
3. Vérifier la configuration API (`consent.enabled`)
4. Consulter le code de `ConsentManager.js`

---

**Happy Testing! 🎉**
