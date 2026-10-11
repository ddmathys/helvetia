# Helvetia — la Suisse dans le temps

Atlas historique (carte qu'on fait défiler de 15 000 av. J.-C. à 2026) + quiz des 26 cantons.
Cahier des charges : `helvetia-spec.md` · prototype de référence : `helvetia.html`.

```bash
npm install
npm run dev          # http://localhost:5173
npx vitest run       # règles métier + banque de questions
npm run build && firebase deploy --only hosting   # https://helvetia-be8e9.web.app
firebase deploy --only firestore                  # règles Firestore
node scripts/extract-data.mjs <helvetia.html> src/data   # régénère les données depuis le prototype
```

- `src/map/AtlasMap.ts` : moteur D3 de l'atlas (territoires fusionnés, lacs, relief, villes, événements).
- `src/lib/` : règles métier pures (temps déformé, statuts, population).
- `src/quiz/bank.ts` : ~1 200 questions générées depuis les fiches ; `sampler.ts` : modes ; `scoring.ts` : points, rangs, maîtrise, badges.
- `src/state/progress.ts` : progression locale + Firestore (`users`, `leaderboard`, `daily`).
