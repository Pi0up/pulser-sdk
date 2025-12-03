# Déploiement CDN du Pulser SDK

Cette documentation décrit le processus officiel pour générer, empaqueter et déployer le Pulser SDK sur le CDN, ainsi que les vérifications à effectuer et la gestion des versions.

Note importante: le déploiement est généralement effectué via le script dédié dans le dossier scripts, et les artefacts générés se trouvent dans deploy/cdn.

## Objectifs

- Permettre à toute l'équipe d'accéder rapidement à la dernière version du SDK via le CDN.
- Garantir que chaque version est correctement générée, nommée, et documentée.
- Fournir des vérifications simples pour confirmer que le déploiement a réussi.

## Pré-requis

- Accès au dépôt et permissions pour pousser des artefacts vers le CDN (via le script deploy-cdn.js).
- Node.js et npm installés localement.
- Le fichier package.json doit exposer les scripts de build et de déploiement si vous les utilisez directement.
- Version cible explicite dans le nom du fichier CDN (par exemple pulser-sdk.v0.1.1.min.js).
- Accès réseau pour uploader les artefacts sur le CDN.

## Fichiers générés et leur utilité

- build/sdk/pulser-sdk.min.js et build/sdk/pulser-sdk.min.js.map: artefacts de build du SDK (JavaScript minifié et son map pour le débogage).
- deploy/cdn/pulser-sdk.vX.Y.Z.min.js et deploy/cdn/pulser-sdk.vX.Y.Z.min.js.map: version spécifique du SDK déployée sur le CDN.
- deploy/cdn/latest.json: manifeste indiquant la version actuelle sur le CDN pour le basculement et les vérifications rapides.
- deploy/cdn/uploads/upload-vX.Y.Z.json: métadonnées de l’opération de déploiement pour cette version.
- scripts/deploy-cdn.js: script qui orchestre le build et le déploiement sur le CDN (utilisé par l’équipe).

## Processus de génération

1. Préparer et versionner la release

- Choisir une version sémantique (par exemple v0.1.1).

- Mettre à jour les fichiers de version si nécessaire (par exemple un changelog ou un fichier de version dans deploy/cdn).

- S'assurer que le contenu est prêt pour le déploiement (aucune erreur de type dans le code, tests passés si disponibles).

2. Construire le SDK

- Exécuter le processus de build pour générer les artefacts minifiés.

- Le résultat attendu est le fichier: build/sdk/pulser-sdk.min.js et sa map: build/sdk/pulser-sdk.min.js.map.

3. Préparer les artefacts CDN

- Copier les artefacts dans le dossier deploy/cdn sous le nom de version:

- deploy/cdn/pulser-sdk.v0.1.1.min.js

- deploy/cdn/pulser-sdk.v0.1.1.min.js.map

- Mettre à jour deploy/cdn/latest.json avec la nouvelle version et les chemins.

- Créer les métadonnées upload-v0.1.1.json dans deploy/cdn/uploads.

4. Déployer sur le CDN

- Lancer le script de déploiement

  node scripts/deploy-cdn.js --version v0.1.1

- OU utiliser script npm dédié si présent (par exemple npm run deploy-cdn)

- Attendre que le script finalise et confirme l’upload des artefacts.

## Vérification du déploiement

- Vérifier que les fichiers du CDN existent et sont accessibles publiquement:

  - https://cdn.pulser-sdk.com/pulser-sdk.v0.1.1.min.js

- Vérifier le fichier map:

  - https://cdn.pulser-sdk.com/pulser-sdk.v0.1.1.min.js.map

- Vérifier le dernier manifest:

  - deploy/cdn/latest.json doit refléter v0.1.1.

- Vérifier que l’intégrité du fichier minifié est correcte (par exemple checksum, ou fingerprint si disponible).

## Gestion des versions et des mises à jour

- Versionnage sémantique (MAJOR.MINOR.PATCH). Par exemple: v0.2.0, v0.2.1, v0.2.2, etc.

- Chaque release doit être annoncée dans le changelog et documentée dans le README si nécessaire.

- Le registre latest.json doit être mis à jour à chaque déploiement; les anciennes versions restent disponibles dans le dossier deploy/cdn/uploads.

- Pour les hotfixes, appliquer un increment du patch, et créer une nouvelle version (par exemple v0.1.2).

## Vérifications et assurance qualité

- Vérifier rapidement le chargement sur une page de test (ex: test/cdn-test.html ou test-public)
- Vérifier les erreurs dans les logs du navigateur et la console réseau.
- Vérifier le comportement du SDK via des tests basiques.

## Annexes et liens utiles

- Script de déploiement: [`scripts/deploy-cdn.js`](scripts/deploy-cdn.js)
- Fichiers générés et manifestes: [`deploy/cdn/latest.json`](deploy/cdn/latest.json) et [`deploy/cdn/pulser-sdk.vX.Y.Z.min.js`](deploy/cdn/pulser-sdk.vX.Y.Z.min.js)
- README général: [`README.md`](README.md) pour le processus global et les scripts.

## Points techniques et référence

- Chemins et noms exemples:

  - Pulser SDK CDN (vX.Y.Z)
  - Pulser SDK V0.1.0: deploy/cdn/pulser-sdk.v0.1.0.min.js
  - Latest Manifest: deploy/cdn/latest.json

- Détails techniques et liens

  - Script de déploiement: [`scripts/deploy-cdn.js`](scripts/deploy-cdn.js)
  - Fichiers générés: [`deploy/cdn/latest.json`](deploy/cdn/latest.json) et [`deploy/cdn/pulser-sdk.vX.Y.Z.min.js`](deploy/cdn/pulser-sdk.vX.Y.Z.min.js)
  - README: [`README.md`](README.md) pour le processus global et les scripts.

## Résumé des points clés

- Le SDK est construit et empaqueté en version minifiée pour le CDN.
- Les artefacts sont timestampés par version dans le dossier deploy/cdn et mis à jour dans latest.json.
- Le lien CDN permet d'accéder rapidement à la version déployée et de la tester sur une page.
- Le script deploy-cdn.js orchestre le processus et centralise le déploiement.

## Confirmation

Cette documentation fournit les étapes complètes pour générer et déployer le Pulser SDK sur le CDN et peut être suivie par tout membre de l'équipe.