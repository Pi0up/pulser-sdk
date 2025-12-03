# 🧪 Guide de Tests - Pulser SDK

## Tests de Validation Singleton & Protection Affichages Multiples

---

## 🎯 Objectifs

Valider que :
1. ✅ Une seule instance du SDK existe (Singleton)
2. ✅ Un événement = une question maximum (Debounce + Flag)
3. ✅ Les questions répondues ne sont jamais re-affichées
4. ✅ Le LuckFactor échoue sans polluer les données

---

## 🔧 Préparation

1. **Ouvrir la console du navigateur** (F12)
2. **Activer le mode debug** : Le SDK est déjà initialisé avec `debug: true`
3. **Effacer les données** : Cliquer sur "🗑️ Effacer données"

---

## 📝 Test 1 : Singleton Pattern

### Objectif
Vérifier qu'une seule instance du SDK peut exister.

### Étapes

1. Ouvrir la console (F12)
2. Taper :
```javascript
const sdk1 = window.PulserSDK;
const sdk2 = new sdk1.constructor();
console.log('Same instance?', sdk1 === sdk2);
console.log('getInstance?', sdk1.constructor.getInstance() === sdk1);
```

### Résultat Attendu
```
Same instance? true
getInstance? true
```

### ✅ Validation
- Les deux instances sont identiques
- `getInstance()` retourne l'instance active

---

## 📝 Test 2 : Debounce (Protection Rafraîchissements Rapides)

### Objectif
Vérifier qu'on ne peut pas déclencher plusieurs questions en moins de 500ms.

### Étapes

1. Effacer les données : "🗑️ Effacer données"
2. Cliquer **rapidement 5 fois** sur "🎯 Satisfaction Q4" (< 500ms entre clics)
3. Observer la console

### Résultat Attendu
Console affiche :
```
[PulserSDK] Debounced: Too soon after last trigger (x4)
```

### ✅ Validation
- Une seule question s'affiche
- Les 4 autres déclenchements sont ignorés (debounce)

---

## 📝 Test 3 : Flag isDisplaying (Question Déjà Visible)

### Objectif
Vérifier qu'on ne peut pas afficher une deuxième question si une est déjà visible.

### Étapes

1. Effacer les données : "🗑️ Effacer données"
2. Cliquer sur "🎯 Satisfaction Q4" → Une question s'affiche
3. **SANS FERMER** la question, cliquer sur "📊 NPS 2024"
4. Observer la console

### Résultat Attendu
Console affiche :
```
[PulserSDK] Already displaying a question, skipping
```

### ✅ Validation
- La deuxième question n'apparaît PAS
- Le widget affiche toujours la première question
- Cliquer sur "🐛 Debug Info" → `isDisplaying: true`

---

## 📝 Test 4 : Libération du Flag après Interaction

### Objectif
Vérifier que le flag `isDisplaying` est libéré après réponse/dismiss.

### Étapes

1. Effacer les données : "🗑️ Effacer données"
2. Cliquer sur "🎯 Satisfaction Q4"
3. Cliquer sur "🐛 Debug Info" → Noter `isDisplaying: true`
4. Répondre à la question (cliquer sur une étoile + Envoyer)
5. Cliquer sur "🐛 Debug Info" → Noter `isDisplaying: false`
6. Cliquer sur "📊 NPS 2024" → Une nouvelle question s'affiche

### Résultat Attendu
- Avant réponse : `isDisplaying: true`
- Après réponse : `isDisplaying: false`
- Nouvelle question peut s'afficher

### ✅ Validation
- Le flag est correctement libéré
- Une nouvelle question peut être affichée

---

## 📝 Test 5 : Questions Répondues (Tracking)

### Objectif
Vérifier qu'une question répondue ne s'affiche plus jamais.

### Étapes

1. Effacer les données : "🗑️ Effacer données"
2. Cliquer sur "🎯 Satisfaction Q4"
3. Noter l'ID de la question affichée (ex: "q1_satisfaction")
4. Répondre (cliquer étoile + Envoyer)
5. Cliquer **10 fois** sur "🎯 Satisfaction Q4"
6. Observer quelle question s'affiche

### Résultat Attendu
Console affiche :
```
[DecisionEngine] Question already answered, skipping: 
  { campaignId: "campaign_satisfaction_q4_2024", questionId: "q1_satisfaction" }
```

La campagne a 2 questions :
- `q1_satisfaction` → Ne s'affiche PLUS
- `q1b_satisfaction_alt` → S'affiche maintenant

### ✅ Validation
- La question répondue n'apparaît plus
- L'autre question de la campagne s'affiche

---

## 📝 Test 6 : Campagne Épuisée

### Objectif
Vérifier qu'une campagne dont toutes les questions sont répondues ne s'affiche plus.

### Étapes

1. Effacer les données : "🗑️ Effacer données"
2. Cliquer sur "🎯 Satisfaction Q4" → Répondre
3. Cliquer sur "🎯 Satisfaction Q4" → Répondre
4. Cliquer sur "🎯 Satisfaction Q4" (3ème fois)
5. Observer la console

### Résultat Attendu
Console affiche :
```
[DecisionEngine] All questions answered for campaign: campaign_satisfaction_q4_2024
[PulserSDK] No eligible campaign for this page
```

### ✅ Validation
- Aucune question ne s'affiche
- La campagne est marquée comme épuisée

---

## 📝 Test 7 : LuckFactor Sans Pollution

### Objectif
Vérifier que si le luckFactor échoue, aucun événement n'est enregistré.

### Configuration Préalable
Modifier temporairement une campagne pour avoir `luckFactor: 0.1` (10% de chance).

### Étapes

1. Effacer les données : "🗑️ Effacer données"
2. Cliquer sur "🐛 Debug Info" → Noter `userData` avant
3. Cliquer **10 fois** sur "Refresh" (navigation)
4. Observer la console pour les échecs luckFactor
5. Cliquer sur "🐛 Debug Info" → Vérifier `userData` après

### Résultat Attendu
Console affiche :
```
[DecisionEngine] Testing campaign luck: 
  { campaignId: "...", luckFactor: 0.1, random: 0.532, passes: false }
[DecisionEngine] No campaign passed luck factor
```

- Environ 9/10 échecs (statistiquement)
- **Aucun** `markCampaignAsShown` appelé lors des échecs
- Les données localStorage ne sont pas polluées

### ✅ Validation
- Les échecs luckFactor n'enregistrent rien
- Le compteur `shownCount` ne bouge pas lors des échecs

---

## 📝 Test 8 : Priorités entre Campagnes

### Objectif
Vérifier que la campagne avec la plus haute priorité est évaluée en premier.

### Étapes

1. Effacer les données : "🗑️ Effacer données"
2. Observer les priorités des campagnes (console debug ou code) :
   - Satisfaction Q4 : priority 1
   - NPS 2024 : priority 2
   - Feedback Général : priority 3
3. Cliquer **plusieurs fois** sur "Refresh"
4. Observer quelle campagne s'affiche en premier

### Résultat Attendu
Console affiche :
```
[DecisionEngine] Sorted campaigns by priority: 
  [
    { id: "campaign_satisfaction_q4_2024", priority: 1 },
    { id: "campaign_nps_2024", priority: 2 },
    ...
  ]
```

Si toutes passent le luckFactor, la campagne priority=1 s'affiche.

### ✅ Validation
- Tri correct par priorité (plus haute = plus importante)
- Campagne prioritaire affichée en premier

---

## 📝 Test 9 : Filtrage URL (allowList/blockList)

### Objectif
Vérifier que les campagnes respectent les filtres d'URL.

### Étapes

1. Modifier manuellement une campagne pour avoir :
```javascript
allowListRegex: ['^/products/.*']
blockListRegex: []
```
2. Effacer les données : "🗑️ Effacer données"
3. Forcer l'affichage de la campagne
4. Observer si elle s'affiche (devrait échouer car URL actuelle != /products/)

### Résultat Attendu
Console affiche :
```
[DecisionEngine] Campaign excluded by URL filters: ...
```

### ✅ Validation
- La campagne ne s'affiche pas (URL ne matche pas)

---

## 📝 Test 10 : Affichage Forcé (Bypass Protections)

### Objectif
Vérifier que `showCampaign()` et `showQuestion()` bypass les protections.

### Étapes

1. Afficher une question via bouton "🎯 Satisfaction Q4"
2. **SANS FERMER**, cliquer sur "📊 NPS 2024" (avec debounce actif)
3. Observer qu'elle ne s'affiche pas (protection)
4. Fermer la question (X)
5. Taper en console :
```javascript
window.PulserSDK.showQuestion('q2_nps');
```
6. Observer que la question s'affiche immédiatement

### Résultat Attendu
- Les méthodes `show*()` réinitialisent le flag `isDisplaying`
- L'affichage forcé fonctionne toujours

### ✅ Validation
- Les affichages forcés bypass les protections
- Utile pour tests et démos

---

## 📊 Tableau Récapitulatif

| Test | Objectif | État |
|------|----------|------|
| 1. Singleton | Une seule instance | ✅ |
| 2. Debounce | Pas de rafraîchissements rapides | ✅ |
| 3. Flag isDisplaying | Bloque affichages multiples | ✅ |
| 4. Libération Flag | Débloque après interaction | ✅ |
| 5. Questions Répondues | Ne se répètent jamais | ✅ |
| 6. Campagne Épuisée | Pas d'affichage si toutes répondues | ✅ |
| 7. LuckFactor | Pas de pollution si échec | ✅ |
| 8. Priorités | Évaluation par ordre | ✅ |
| 9. Filtrage URL | Respect des regex | ✅ |
| 10. Affichage Forcé | Bypass protections | ✅ |

---

## 🐛 Debugging

### Commandes Console Utiles

```javascript
// État complet
window.PulserSDK.getDebugInfo();

// Forcer affichage
window.PulserSDK.showCampaign('campaign_satisfaction_q4_2024');
window.PulserSDK.showQuestion('q1_satisfaction');

// Vérifier singleton
window.PulserSDK.constructor.getInstance();

// Effacer données
window.PulserSDK.clearData();

// Vérifier localStorage
console.log('Answered:', localStorage.getItem('pulser_sdk_answered_questions'));
console.log('History:', localStorage.getItem('pulser_sdk_campaign_history'));
```

---

## ✅ Critères de Succès

Le SDK est validé si :

1. ✅ Aucune question multiple sur un événement
2. ✅ Une seule instance du SDK existe
3. ✅ Les questions répondues ne se répètent jamais
4. ✅ LuckFactor échoue sans enregistrer d'événement
5. ✅ Le debounce fonctionne (500ms)
6. ✅ Le flag `isDisplaying` est libéré après interaction
7. ✅ Les priorités sont respectées
8. ✅ Les affichages forcés fonctionnent toujours

---

**Bonne chance pour les tests ! 🚀**
