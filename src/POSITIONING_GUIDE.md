# 📐 Guide de Positionnement du Widget

## 🎯 Positions Disponibles

Le SDK supporte **9 positions** différentes sur desktop, avec un comportement automatique pleine largeur sur mobile.

---

## 🖥️ Desktop (> 768px)

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  top-left          top-center           top-right            │
│    ╔══╗              ╔══╗                 ╔══╗              │
│    ║  ║              ║  ║                 ║  ║              │
│    ╚══╝              ╚══╝                 ╚══╝              │
│                                                               │
│                                                               │
│  ╔══╗                                            ╔══╗        │
│  ║  ║                                            ║  ║        │
│  ╚══╝                                            ╚══╝        │
│ middle-left                              middle-right        │
│                                                               │
│                       ╔══╗                                   │
│                       ║  ║                                   │
│                       ╚══╝                                   │
│                      center                                  │
│                                                               │
│  ╔══╗                                            ╔══╗        │
│  ║  ║              ╔══╗                          ║  ║        │
│  ╚══╝              ║  ║                          ╚══╝        │
│ bottom-left        ╚══╝                      bottom-right    │
│                 bottom-center                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile (< 768px)

**Toutes les positions** forcent le widget en **bas pleine largeur** :

```
┌─────────────────────────┐
│                         │
│                         │
│                         │
│      Contenu Site       │
│                         │
│                         │
│                         │
├─────────────────────────┤
│  ╔═══════════════════╗  │ ← Pleine largeur
│  ║     Widget        ║  │   avec padding 12px
│  ╚═══════════════════╝  │
└─────────────────────────┘
```

---

## 🎨 Configuration CSS par Position

### 1. `bottom-right` (défaut)

**Desktop :**
- Ancré en bas à droite
- Marges : 20px du bas, 20px de la droite

**CSS appliqué :**
```css
position: fixed;
bottom: 20px;
right: 20px;
transform: translateY(0) scale(1);
```

**Cas d'usage :**
- E-commerce (n'interfère pas avec le panier)
- Sites avec navigation droite
- Comportement standard des chatbots

---

### 2. `bottom-left`

**Desktop :**
- Ancré en bas à gauche
- Marges : 20px du bas, 20px de la gauche

**CSS appliqué :**
```css
position: fixed;
bottom: 20px;
left: 20px;
transform: translateY(0) scale(1);
```

**Cas d'usage :**
- Sites avec sidebar droite importante
- Interfaces RTL (right-to-left)

---

### 3. `bottom-center` ⭐

**Desktop :**
- **Centré horizontalement** en bas
- Marge : 20px du bas
- **Point d'ancrage : centre bas du widget**

**CSS appliqué :**
```css
position: fixed;
bottom: 20px;
left: 50%;
width: max-content;
transform: translate(-50%, 0) scale(1);
```

**Cas d'usage :**
- Blogs et articles (centré sous le contenu)
- Landing pages épurées
- Sites avec beaucoup d'espace horizontal

**Note :** Le fix récent garantit que le widget est **parfaitement centré** (pas aligné par son coin gauche).

---

### 4. `top-right`

**Desktop :**
- Ancré en haut à droite
- Marges : 20px du haut, 20px de la droite

**CSS appliqué :**
```css
position: fixed;
top: 20px;
right: 20px;
transform: translateY(0) scale(1);
```

**Cas d'usage :**
- Dashboards (proche des notifications)
- Interfaces avec footer important

---

### 5. `top-left`

**Desktop :**
- Ancré en haut à gauche
- Marges : 20px du haut, 20px de la gauche

**CSS appliqué :**
```css
position: fixed;
top: 20px;
left: 20px;
transform: translateY(0) scale(1);
```

**Cas d'usage :**
- Sites avec header fixe à droite
- Interfaces avec contenu défilant

---

### 6. `top-center` ⭐

**Desktop :**
- **Centré horizontalement** en haut
- Marge : 20px du haut
- **Point d'ancrage : centre haut du widget**

**CSS appliqué :**
```css
position: fixed;
top: 20px;
left: 50%;
width: max-content;
transform: translate(-50%, 0) scale(1);
```

**Cas d'usage :**
- Bannières de feedback
- Annonces importantes
- Maximum de visibilité

---

### 7. `middle-right`

**Desktop :**
- Ancré au **milieu vertical**, droite
- Marge : 20px de la droite
- **Point d'ancrage : milieu droit du widget**

**CSS appliqué :**
```css
position: fixed;
top: 50%;
right: 20px;
transform: translate(0, -50%) scale(1);
```

**Cas d'usage :**
- Navigation latérale
- Maximum de visibilité sans cacher le contenu

---

### 8. `middle-left`

**Desktop :**
- Ancré au **milieu vertical**, gauche
- Marge : 20px de la gauche
- **Point d'ancrage : milieu gauche du widget**

**CSS appliqué :**
```css
position: fixed;
top: 50%;
left: 20px;
transform: translate(0, -50%) scale(1);
```

**Cas d'usage :**
- Interfaces avec sidebar droite
- Interfaces RTL

---

### 9. `center` ⭐

**Desktop :**
- **Centré horizontalement ET verticalement**
- **Point d'ancrage : centre du widget**

**CSS appliqué :**
```css
position: fixed;
top: 50%;
left: 50%;
width: max-content;
transform: translate(-50%, -50%) scale(1);
```

**Cas d'usage :**
- Modales de feedback critiques
- Landing pages (maximum de visibilité)
- Interruption intentionnelle

---

## 🎬 Animations

### État Caché → Visible

Chaque position a une animation d'entrée optimisée :

| Position | Animation |
|----------|-----------|
| `bottom-*` | Glisse du bas (`translateY(20px)` → `translateY(0)`) + Scale 0.95 → 1 |
| `top-*` | Glisse du haut (`translateY(-20px)` → `translateY(0)`) + Scale 0.95 → 1 |
| `middle-right` | Glisse de la droite (`translate(20px, -50%)` → `translate(0, -50%)`) + Scale |
| `middle-left` | Glisse de la gauche (`translate(-20px, -50%)` → `translate(0, -50%)`) + Scale |
| `center` | Scale uniquement (`translate(-50%, -45%)` → `translate(-50%, -50%)`) |

**Durée :** 300ms avec `ease`

---

## 📐 Dimensions

### Desktop

| Breakpoint | max-width |
|------------|-----------|
| > 1024px   | 380px     |
| 769-1024px | 340px     |

### Mobile

| Breakpoint | width |
|------------|-------|
| < 768px    | 100% (avec padding 12px) |

---

## 🔧 Exemples d'Utilisation

### Exemple 1 : E-commerce Standard

```javascript
window.PulserSDK.init('shop.example.com', 'fr', null, {
  position: 'bottom-right' // Défaut, n'interfère pas avec le panier
});
```

---

### Exemple 2 : Blog Centré

```javascript
window.PulserSDK.init('blog.example.com', 'fr', null, {
  position: 'bottom-center' // Discret, centré sous l'article
});
```

---

### Exemple 3 : Dashboard Analytics

```javascript
window.PulserSDK.init('dashboard.example.com', 'en', null, {
  position: 'top-right' // Proche des notifications
});
```

---

### Exemple 4 : Landing Page Impactante

```javascript
window.PulserSDK.init('landing.example.com', 'en', null, {
  position: 'center' // Maximum de visibilité
});
```

---

## ⚙️ Changement Dynamique de Position

Actuellement, la position est définie à l'initialisation. Pour changer la position :

```javascript
// Détruire l'instance actuelle
window.PulserSDK.destroy();

// Réinitialiser avec nouvelle position
await window.PulserSDK.init('example.com', 'fr', null, {
  position: 'top-center'
});
```

---

## 🐛 Debugging Positionnement

### Vérifier la position appliquée

```javascript
const debugInfo = window.PulserSDK.getDebugInfo();
console.log('Position configurée:', debugInfo.position || 'bottom-right (défaut)');
```

### Inspecter le Shadow DOM

```javascript
const host = document.getElementById('pulser-sdk-host');
const container = host.shadowRoot.getElementById('feedback-container');
const computed = window.getComputedStyle(container);

console.log({
  position: computed.position,
  top: computed.top,
  bottom: computed.bottom,
  left: computed.left,
  right: computed.right,
  width: computed.width,
  transform: computed.transform
});
```

### Vérifier le centrage (pour positions centrées)

```javascript
const rect = container.getBoundingClientRect();
const screenCenterX = window.innerWidth / 2;
const widgetCenterX = rect.left + rect.width / 2;
const offsetX = Math.abs(screenCenterX - widgetCenterX);

console.log('Centrage horizontal:', offsetX < 1 ? '✅ Parfait' : `⚠️ Offset de ${offsetX}px`);
```

---

## 📊 Matrice de Recommandations

| Type de Site | Position Desktop | Raison |
|--------------|------------------|--------|
| **E-commerce** | `bottom-right` | N'interfère pas avec panier/checkout |
| **Blog/Article** | `bottom-center` | Centré, discret sous le contenu |
| **Dashboard** | `top-right` | Proche des autres notifications |
| **Landing Page** | `center` ou `bottom-center` | Maximum de visibilité |
| **Documentation** | `bottom-right` ou `middle-right` | Accessible sans cacher le contenu |
| **App Mobile-first** | N'importe | Force mobile layout de toute façon |
| **SaaS B2B** | `bottom-right` | Standard professionnel |
| **Site Vitrine** | `bottom-center` | Élégant et moderne |

---

## ✅ Checklist de Test

Pour valider le positionnement :

- [ ] **Desktop (> 768px)** : Le widget est à la position attendue avec marges correctes
- [ ] **Centrage (positions `*-center`)** : Le centre du widget = centre de l'écran
- [ ] **Mobile (< 768px)** : Toutes positions → Pleine largeur en bas
- [ ] **Tablet (769-1024px)** : Largeur réduite (340px) mais positionnement identique
- [ ] **Animations** : Entrée/sortie fluide selon la position
- [ ] **Pas de débordement** : Aucun scroll horizontal créé
- [ ] **Z-index** : Le widget est au-dessus du contenu (z-index: 999999)

---

## 🔮 Futures Améliorations Possibles

1. **Position dynamique** : Changer la position sans détruire le SDK
2. **Position adaptative** : Détecter automatiquement la meilleure position selon le layout
3. **Collision detection** : Éviter les éléments fixes du site (header, footer, etc.)
4. **Position par campagne** : Définir une position spécifique par campagne
5. **Animations personnalisées** : Configurer les transitions d'entrée/sortie

---

**Le widget est maintenant parfaitement positionné ! 🎯**
