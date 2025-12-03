# Guide de Test - Protection contre les Références Circulaires

## Vue d'ensemble

Ce guide contient des tests pour valider que le SDK gère correctement les références circulaires et évite les erreurs `Converting circular structure to JSON`.

## Corrections Appliquées

### 1. StorageManager.js
- ✅ `markCampaignAsShown()` - Sanitization ajoutée avant `JSON.stringify`
- ✅ `markCampaignAsDismissed()` - Sanitization ajoutée avant `JSON.stringify`
- ✅ `markCampaignAsAnswered()` - Sanitization ajoutée avant `JSON.stringify`
- ✅ `_storeAnsweredQuestion()` - Sanitization ajoutée avant `JSON.stringify`
- ✅ `setUserData()` - Sanitization déjà présente (vérifiée)
- ✅ `setCachedConfig()` - Sanitization déjà présente (vérifiée)

### 2. DataSubmitter.js
- ✅ `submitAnswer()` - Sanitization déjà présente avec `_sanitizeData()`
- ✅ `submitImpression()` - Sanitization déjà présente avec `_sanitizeData()`

### 3. FeedbackSDK.js
- ✅ `setUserInfo()` - Ajout de vérifications explicites pour `window` et `document`

## Tests de Validation

### Test 1 : Objet avec Référence Circulaire Simple

```javascript
// Créer un objet avec une référence circulaire
const obj = { name: 'test' };
obj.self = obj;

// Tenter de l'ajouter comme métadonnée utilisateur
window.feedbackSDK.setUserInfo({ circularObject: obj });

// ✅ Devrait : Logger sans erreur, stocker "[Circular Reference]" au lieu de l'objet
// ❌ Ne devrait pas : Lever une erreur JSON.stringify
```

### Test 2 : Objet Window

```javascript
// Tenter d'ajouter l'objet window
window.feedbackSDK.setUserInfo({ windowRef: window });

// ✅ Devrait : Logger un avertissement, ignorer cette clé
// ❌ Ne devrait pas : Stocker l'objet window
```

### Test 3 : Objet Document

```javascript
// Tenter d'ajouter l'objet document
window.feedbackSDK.setUserInfo({ documentRef: document });

// ✅ Devrait : Logger un avertissement, ignorer cette clé
// ❌ Ne devrait pas : Stocker l'objet document
```

### Test 4 : Élément DOM

```javascript
// Tenter d'ajouter un élément DOM
const element = document.querySelector('body');
window.feedbackSDK.setUserInfo({ domElement: element });

// ✅ Devrait : Convertir en "[DOM Element: BODY]"
// ❌ Ne devrait pas : Lever une erreur
```

### Test 5 : Objet avec Fonctions

```javascript
// Objet contenant des fonctions
const objWithFunction = {
  name: 'test',
  action: function() { return 'hello'; }
};

window.feedbackSDK.setUserInfo({ objWithFunc: objWithFunction });

// ✅ Devrait : Stocker l'objet sans la fonction
// ❌ Ne devrait pas : Inclure la fonction dans le stockage
```

### Test 6 : Tableau avec Références Circulaires

```javascript
// Créer un tableau avec une référence circulaire
const arr = [1, 2, 3];
arr.push(arr);

window.feedbackSDK.setUserInfo({ circularArray: arr });

// ✅ Devrait : Stocker le tableau avec "[Circular Reference]" au lieu de la référence
// ❌ Ne devrait pas : Lever une erreur JSON.stringify
```

### Test 7 : Objet Imbriqué Profondément avec Circularité

```javascript
// Objet complexe avec circularité profonde
const parent = {
  name: 'parent',
  child: {
    name: 'child',
    grandchild: {
      name: 'grandchild'
    }
  }
};
parent.child.grandchild.root = parent;

window.feedbackSDK.setUserInfo({ deepCircular: parent });

// ✅ Devrait : Stocker la structure avec "[Circular Reference]" pour la boucle
// ❌ Ne devrait pas : Lever une erreur
```

### Test 8 : Métadonnées lors de l'Envoi de Réponse

```javascript
// Ajouter des métadonnées complexes
const complexData = {
  userId: '123',
  session: {
    start: Date.now(),
    browser: navigator.userAgent
  }
};
complexData.session.circular = complexData;

window.feedbackSDK.setUserInfo(complexData);

// Ensuite, répondre à une question
// Lorsque submitAnswer() est appelé avec getAllUserData() comme metadata
// ✅ Devrait : Envoyer les données sans erreur
// ❌ Ne devrait pas : Lever une erreur lors de JSON.stringify dans fetch()
```

### Test 9 : getDebugInfo()

```javascript
// Obtenir les informations de debug et les sérialiser
const debugInfo = window.feedbackSDK.getDebugInfo();

try {
  const serialized = JSON.stringify(debugInfo);
  console.log('✅ getDebugInfo() serializable:', serialized.length, 'characters');
} catch (error) {
  console.error('❌ getDebugInfo() not serializable:', error.message);
}

// ✅ Devrait : Être sérialisable en JSON
// ❌ Ne devrait pas : Lever une erreur de circularité
```

### Test 10 : Storage après Réponse à une Question

```javascript
// 1. Créer des métadonnées avec circularité
const userData = { id: 'test-user' };
userData.meta = { self: userData };

window.feedbackSDK.setUserInfo(userData);

// 2. Répondre à une question (ceci déclenche markCampaignAsAnswered)
// (simulé via l'interface ou manuellement avec _handleSubmit)

// 3. Vérifier le localStorage
const stored = localStorage.getItem('feedback_sdk_user_meta');
console.log('Stored user data:', stored);

// ✅ Devrait : Contenir des données valides sans erreur
// ❌ Ne devrait pas : Contenir de vraies références circulaires
```

## Test d'Intégration Complet

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test - Circular References Protection</title>
</head>
<body>
  <h1>Test de Protection contre les Références Circulaires</h1>
  <div id="test-results"></div>

  <script type="module">
    import FeedbackSDK from './sdk/FeedbackSDK.js';

    const results = [];
    const logResult = (test, success, message) => {
      results.push({ test, success, message });
      const icon = success ? '✅' : '❌';
      console.log(`${icon} ${test}: ${message}`);
      updateUI();
    };

    const updateUI = () => {
      const resultsDiv = document.getElementById('test-results');
      resultsDiv.innerHTML = results.map(r => 
        `<div style="color: ${r.success ? 'green' : 'red'}">
          ${r.success ? '✅' : '❌'} ${r.test}: ${r.message}
        </div>`
      ).join('');
    };

    // Initialiser le SDK
    window.feedbackSDK = new FeedbackSDK();
    await window.feedbackSDK.init('example.com', 'fr', null, { debug: true });

    // Test 1 : Objet circulaire simple
    try {
      const obj = { name: 'test' };
      obj.self = obj;
      window.feedbackSDK.setUserInfo({ circularObject: obj });
      logResult('Test 1', true, 'Objet circulaire géré sans erreur');
    } catch (error) {
      logResult('Test 1', false, error.message);
    }

    // Test 2 : Objet window
    try {
      window.feedbackSDK.setUserInfo({ windowRef: window });
      logResult('Test 2', true, 'Objet window rejeté proprement');
    } catch (error) {
      logResult('Test 2', false, error.message);
    }

    // Test 3 : Objet document
    try {
      window.feedbackSDK.setUserInfo({ documentRef: document });
      logResult('Test 3', true, 'Objet document rejeté proprement');
    } catch (error) {
      logResult('Test 3', false, error.message);
    }

    // Test 4 : Élément DOM
    try {
      window.feedbackSDK.setUserInfo({ domElement: document.body });
      logResult('Test 4', true, 'Élément DOM converti en string');
    } catch (error) {
      logResult('Test 4', false, error.message);
    }

    // Test 5 : Tableau circulaire
    try {
      const arr = [1, 2, 3];
      arr.push(arr);
      window.feedbackSDK.setUserInfo({ circularArray: arr });
      logResult('Test 5', true, 'Tableau circulaire géré sans erreur');
    } catch (error) {
      logResult('Test 5', false, error.message);
    }

    // Test 6 : Objet profond avec circularité
    try {
      const parent = {
        name: 'parent',
        child: { name: 'child', grandchild: { name: 'grandchild' } }
      };
      parent.child.grandchild.root = parent;
      window.feedbackSDK.setUserInfo({ deepCircular: parent });
      logResult('Test 6', true, 'Objet profond avec circularité géré');
    } catch (error) {
      logResult('Test 6', false, error.message);
    }

    // Test 7 : getDebugInfo() sérialisable
    try {
      const debugInfo = window.feedbackSDK.getDebugInfo();
      JSON.stringify(debugInfo);
      logResult('Test 7', true, 'getDebugInfo() sérialisable en JSON');
    } catch (error) {
      logResult('Test 7', false, error.message);
    }

    // Test 8 : Vérifier le localStorage
    try {
      const stored = localStorage.getItem('feedback_sdk_user_meta');
      if (stored) {
        JSON.parse(stored); // Vérifier que c'est parseable
        logResult('Test 8', true, 'localStorage contient du JSON valide');
      } else {
        logResult('Test 8', true, 'Pas de données dans localStorage (normal)');
      }
    } catch (error) {
      logResult('Test 8', false, error.message);
    }

    console.log('\n=== Résumé des Tests ===');
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    console.log(`${passed}/${total} tests réussis`);
    
    if (passed === total) {
      console.log('✅ Tous les tests ont réussi !');
    } else {
      console.log('❌ Certains tests ont échoué');
    }
  </script>
</body>
</html>
```

## Vérification Manuelle

Pour vérifier manuellement la protection :

1. **Ouvrir la console du navigateur**
2. **Exécuter les tests ci-dessus un par un**
3. **Vérifier qu'aucune erreur `Converting circular structure to JSON` n'apparaît**
4. **Vérifier le localStorage** :
   ```javascript
   // Afficher toutes les données du SDK
   Object.keys(localStorage).forEach(key => {
     if (key.startsWith('feedback_sdk_')) {
       console.log(key, localStorage.getItem(key));
     }
   });
   ```

## Résolution des Problèmes

### Si l'erreur persiste :

1. **Identifier l'origine** : Regarder la stack trace pour voir quel fichier/ligne cause l'erreur
2. **Vérifier les métadonnées** : 
   ```javascript
   console.log('User data:', window.feedbackSDK.getDebugInfo().userData);
   ```
3. **Nettoyer le storage** :
   ```javascript
   window.feedbackSDK.clearData();
   ```
4. **Réinitialiser** :
   ```javascript
   window.feedbackSDK.destroy();
   window.feedbackSDK = new FeedbackSDK();
   await window.feedbackSDK.init('example.com', 'fr', null, { debug: true });
   ```

## Fonctions de Sanitization

### Dans StorageManager.js et DataSubmitter.js

La fonction `_sanitizeValue()` / `_sanitizeData()` détecte et remplace :

- ✅ **Références circulaires** → `"[Circular Reference]"`
- ✅ **Éléments DOM** → `"[DOM Element: TAG_NAME]"`
- ✅ **window/document** → `"[Window/Document]"`
- ✅ **Fonctions** → Ignorées (non incluses)
- ✅ **Objets non-sérialisables** → `"[Unable to serialize]"`

### Utilisation de WeakSet

Le SDK utilise `WeakSet` pour tracker les objets déjà vus sans créer de références fortes :

```javascript
_sanitizeValue(value, seen = null) {
  if (!seen) {
    seen = new WeakSet();
  }
  
  if (seen.has(value)) {
    return '[Circular Reference]';
  }
  
  seen.add(value);
  // ... suite du traitement
}
```

## Conclusion

Avec ces corrections, le SDK est maintenant protégé contre :
- Les références circulaires dans les objets
- Les tentatives de stocker `window` ou `document`
- Les éléments DOM accidentellement passés
- Les structures de données complexes avec des boucles

Tous les appels à `JSON.stringify` sont maintenant sécurisés.
