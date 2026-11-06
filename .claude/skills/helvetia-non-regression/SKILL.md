---
name: helvetia-non-regression
description: Garde-fou de non-régression de Helvetia : vérifications, tests à ajouter, niveau de risque.
---

# Non-régression de Helvetia

## Vérifications automatiques
build + tests Vitest (workflow claude-validate.yml). Elles doivent rester vertes.

## Parcours critiques
| Parcours | Tests existants |
|---|---|
| Règles métier (temps, statuts, population) | src/lib (vitest) |
| Banque de questions / score | src/quiz (vitest) |

## Règles
- Un bug corrigé = un test ajouté quand un test existe pour cette zone.
- Ne jamais affaiblir, supprimer ou sauter un test pour faire passer les vérifications.

## Niveau de risque
- **Faible** : texte, couleur, mise en page d'un écran.
- **Moyen** : logique d'un écran, nouveau composant, calcul couvert par un test.
- **Élevé** : données (structure Firestore), authentification, paiements, déploiement, calcul non testé → jamais d'approbation automatique.
