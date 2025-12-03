
## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  

## Déploiement CDN Pulser SDK

Cette section décrit comment générer et déployer le Pulser SDK sur le CDN. Elle complète la documentation détaillée accessible via le lien ci-dessous.

Pour le document complet, voir: [`docs/CDN_DEPLOYMENT.md`](docs/CDN_DEPLOYMENT.md)

Points essentiels:
- Pré-requis: accès au dépôt et permissions pour publier sur le CDN; Node.js et npm (ou yarn) installés.
- Étapes principales:
  1) Génération et empaquetage: exécuter le script de déploiement (par exemple node scripts/deploy-cdn.js --version vX.Y.Z ou npm run deploy-cdn).
  2) Déploiement sur le CDN: les artefacts versionnés sont placés sous deploy/cdn/ et nommés pulser-sdk.vX.Y.Z.min.js et pulser-sdk.vX.Y.Z.min.js.map; mise à jour de deploy/cdn/latest.json et des métadonnées d'upload.
  3) Vérifications: accéder à l'URL du CDN pour la version déployée et effectuer des tests simples sur test/cdn-test.html.
- Gestion des versions: versionnement sémantique MAJOR.MINOR.PATCH; chaque release doit mettre à jour latest.json et le changelog.
- Bonnes pratiques: ne pas rompre l'API publique; documenter clairement les changements dans le changelog et assurer des messages de commit explicites.
