---
name: helvetia-tech
description: Spécialiste du fonctionnement technique de Helvetia (stack, données, déploiement, zones sensibles).
---

# Technique de Helvetia

## Stack et règles
- Vite + React + TS + zustand ; règles métier pures dans src/lib/, quiz dans src/quiz/.
- Les questions sont tirées des fiches : ajouter une fiche = vérifier que bank.ts la prend.
- Fond OFS : usage non commercial seulement.
- Déploiement : npm run build && firebase deploy --only hosting.

## Zones sensibles (jamais de merge automatique)
Règles Firestore/Storage, firebase.json, vercel.json, .github/, android/, fichiers Gradle, package.json, et tout fichier lié à l'authentification, aux sessions, à l'admin, aux secrets, aux paiements ou aux crédits.
