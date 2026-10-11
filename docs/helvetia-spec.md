# Helvetia — la Suisse dans le temps
## Cahier des charges pour Claude Code

> **Version** : 1.0 — 11 octobre 2026 · **Auteur** : David (product owner) · **Statut** : prêt pour le développement du MVP
>
> Ce document contient **tout** ce qu'il faut pour développer l'application : vision, fonctionnalités, règles métier, design, architecture, modèle de données et **l'intégralité des données de contenu** (178 événements, 26 cantons, 41 villes, 22 lacs, 31 fiches de peuples et seigneuries, 32 batailles). Un prototype HTML fonctionnel (`helvetia.html`) l'accompagne : il fait foi pour le comportement et le rendu visuel.

---

## 0. Comment utiliser ce document (consignes pour Claude Code)

1. **Lis tout le document avant d'écrire du code.** Les sections 4 (règles métier) et 8 (données) sont les plus importantes.
2. **Le prototype `helvetia.html` est la référence de comportement.** Ouvre-le dans un navigateur. En cas de doute, reproduis ce qu'il fait. Ne recopie pas son code tel quel : il tient dans un seul fichier, l'application doit être structurée (section 6).
3. **Les données de la section 8 sont la source de vérité.** Copie-les dans `/data/*.json` sans les modifier. Ne reformule aucun texte historique : il a été vérifié.
4. **Travaille par étapes** (section 9). Chaque étape se termine par une version qui tourne, testée sur mobile (390 px) et sur bureau (1280 px).
5. **Langue de l'interface : français.** Typographie française (espaces insécables avant « : ; ? ! », guillemets « », apostrophe typographique ’).
6. **Pose des questions** avant toute décision structurante non couverte ici (choix de librairie lourde, changement du modèle de données, service payant).

---

## 1. Vision produit

**Une carte de la Suisse qu'on fait défiler dans le temps**, de 15 000 av. J.-C. à aujourd'hui. Au fil du curseur :

- les **territoires** se transforment : peuples celtes, provinces romaines, Burgondes et Alamans, seigneuries, puis la Confédération qui s'assemble canton par canton (1291 → 1979) ;
- les **événements** apparaissent à leur date et à leur lieu : batailles, traités, fondations, catastrophes, inventions ;
- la **population** s'affiche en continu ;
- un **clic** ouvre une fiche détaillée : peuple (avec portrait illustré), canton, ville, lac, événement, bataille.

**La promesse :** comprendre d'où vient la Suisse, comment elle a été construite et par qui elle était habitée, en jouant avec une carte.

**Nom de travail :** Helvetia. **Lien avec le projet frère :** « Vingt-Six », un quiz par ville. À terme, chaque fiche d'événement alimentera le quiz (section 9, étape 5).

### Public cible
1. **Grand public romand et français** curieux d'histoire (cible n°1 du MVP).
2. **Candidats à la naturalisation** : l'examen porte sur l'histoire, la géographie et les institutions.
3. **Écoles et enseignants** (secondaire), plus tard.
4. **Touristes** et expatriés qui veulent comprendre le pays.

### Modèle économique envisagé (hors MVP)
- Gratuit : carte nationale et toutes les époques.
- Premium (achat unique ~CHF 9.90–19.90 ou abonnement ~CHF 3.90/mois) : zoom détaillé par canton, quiz, mode « naturalisation », fiches enrichies.
- Licences écoles et partenariats offices du tourisme.

---

## 2. Périmètre du MVP

### Inclus
| Domaine | Contenu |
|---|---|
| Carte | Suisse entière, 26 cantons, 22 lacs, relief stylisé (sommets semés), 7 sommets nommés, 41 villes |
| Temps | Curseur de -15 000 à 2026, 9 époques, lecture automatique |
| Territoires | 5 cartes « avant 1291 » (groupes), puis statut de chaque canton de 1291 à aujourd'hui |
| Événements | 178 événements, dont 32 batailles avec leur guerre |
| Fiches | Peuple/seigneurie (31, avec portrait), canton (26, avec carte d'identité), ville (41), lac (22), événement, bataille |
| Population | Suisse entière (estimations puis recensements), ville de Genève |
| Plateformes | Web responsive, installable (PWA), mobile d'abord |

### Exclu du MVP (prévu ensuite)
- Frontières historiques précises à l'échelle des communes (aujourd'hui : à l'échelle des cantons actuels).
- Population par canton et par commune dans le temps.
- Quiz, comptes utilisateurs, paiement.
- Traduction allemand / italien / anglais.

---

## 3. Fonctionnalités détaillées

### 3.1 Écran principal (unique)
Carte plein écran, fond sombre « atlas de nuit ».

**En-tête flottant (haut)**
- À gauche : petite marque « HELVETIA », **l'année** en grand (police display), le **nom de l'époque** dessous (couleur or).
- À droite : « Habitants », le **nombre d'habitants** en grand, une **pastille de fiabilité** (« estimation, ordre de grandeur » avant l'an 1000, « estimation d'historiens » de 1000 à 1797, « recensement » dès 1798), et « Confédération : **N cantons** » dès 1291.

**Carte (centre)**
- Territoires colorés selon l'époque (section 4.2).
- Lacs, relief, sommets, villes, événements, étiquettes.
- Pan et zoom (pincer / molette), facteur 1 à 10.
- Boutons + / − / « toute la Suisse » en bas à droite.
- Indication « Glisse le temps, touche un canton ou un point » tant qu'aucune fiche n'a été ouverte.
- Mention des sources de fond de carte en petit (masquée sous 640 px).

**Dock du temps (bas)**
- Légende contextuelle (statuts ou note d'époque, icône Bataille, « Frontière actuelle, pour repère »).
- Bouton **Lecture / Pause** rond (or).
- **Curseur** : barre découpée en 9 bandes colorées (une par époque), petites graduations pour chaque événement national, poignée blanche lumineuse.
- Repères d'années sous la barre : -58, 443, 1291, 1515, 1798, 1848, 2026.
- Clavier : espace = lecture/pause, Échap = fermer la fiche, flèches sur le curseur.

**Panneau de fiche**
- Bureau (≥ 900 px) : panneau à droite, 360 px, coins arrondis, glisse depuis la droite.
- Mobile : feuille depuis le bas, 62 % de la hauteur max, coins supérieurs arrondis.
- En-tête : surtitre (or, ex. « En 1602 · Allié »), titre (police display), bouton fermer.
- Le contenu défile à l'intérieur du panneau.
- Quand une fiche est ouverte, la carte zoome sur l'objet en le plaçant dans la zone visible (hors panneau).

### 3.2 Lecture automatique
- Avance d'environ 1,55 % de la barre par seconde (≈ 65 s pour tout parcourir).
- À chaque **événement national** franchi : le curseur s'arrête sur son année **1,3 s** et un **bandeau** apparaît en haut (« 1476 · Grandson et Morat » + canton), pendant 2,6 s.
- Quand un territoire **devient membre** de la Confédération, son contour **s'illumine** (animation 1,6 s).
- Si la lecture démarre à 2026, elle repart de -15 000.

### 3.3 Fiches (contenu exact)

**Fiche canton / territoire** (clic sur une zone de la carte)
- Surtitre : « En {année} · {statut} » (ou le type de peuple avant 1291).
- Titre : le nom de **l'entité qui existe à cette date** (ex. « Habsbourg », « Berne (Pays de Vaud) », « Helvètes »), pas le nom du canton actuel.
- Avant 1291, si une fiche peuple existe : portrait illustré + légende, faits (2 à 4), « Leur vie », « Ce qu'ils croyaient », encadré « Le saviez-vous ? », « À voir aujourd'hui ».
- Faits : « Aujourd'hui : Canton de X » + « Habitants en Suisse » (ou habitants de la ville de Genève).
- « Histoire du territoire de l'actuel canton de X » : frise verticale de tous ses statuts, le statut courant en gras.
- « Le canton de X aujourd'hui » : chef-lieu, habitants, superficie, langues, traditions, à table, figures.
- « Villes du canton » : boutons (population 2020 ou « pas encore » si la ville n'existe pas à la date choisie) → ouvrent la fiche ville.
- « Événements » : tous les événements du canton, chronologiques ; ceux postérieurs à la date choisie sont grisés ; un clic avance le temps jusqu'à l'événement et ouvre sa fiche.
- Sources en bas.

**Fiche ville** : surtitre « Ville · canton de X », titre = nom à la date choisie, faits « Premier nom connu (année) » + « Habitants (2020) » (ou « Site archéologique » / « Petite localité » ; pour Genève : habitants à la date choisie), texte, « Ses noms » (frise), « Ce qui s'est passé ici » (événements à moins de ~5 km), source. La carte zoome sur la ville (facteur 5 mobile, 6 bureau).

**Fiche lac** : surtitre « Lac » ou « Lac artificiel · 1937 », titre = nom à la date (ou « Lac sans nom connu »), faits superficie + profondeur max, texte, « Ses noms à travers le temps ».

**Fiche événement** : surtitre = année, titre, pastille type + canton, texte, « Dans la même région » (autres événements du canton), lien « chercher dans le Dictionnaire historique de la Suisse ».

**Fiche bataille** : comme l'événement + un encadré rouge « guerre » : nom de la guerre, camp A **contre** camp B, « Vainqueur : … », puis « Les autres batailles de cette guerre ».

---

## 4. Règles métier (à respecter exactement)

### 4.1 Échelle du temps (déformée volontairement)
Le curseur va de 0 à 100 %. Chaque époque occupe une part fixe de la barre, interpolation linéaire à l'intérieur :

| Bornes (années) | Part de la barre |
|---|---|
| -15 000 → -800 | 0 → 5 % |
| -800 → -58 | 5 → 12 % |
| -58 → 443 | 12 → 22 % |
| 443 → 1032 | 22 → 30 % |
| 1032 → 1291 | 30 → 38 % |
| 1291 → 1515 | 38 → 58 % |
| 1515 → 1798 | 58 → 74 % |
| 1798 → 1848 | 74 → 86 % |
| 1848 → 2026 | 86 → 100 % |

Données : `BP` (bornes) et `PC` (pourcentages), section 8.1. Affichage des années négatives : « 5 000 av. J.-C. ».

### 4.2 Territoires : n'afficher que ce qui existe
**Règle fondamentale : aucune frontière de canton ne s'affiche avant que le canton n'existe.**

- **Avant 1291** : chaque canton actuel est rattaché à un **groupe** selon l'époque (`PRE`, section 8.2) : peuple, province romaine, peuple germanique ou seigneur. De -15 000 à -800, un seul groupe : tout le territoire sans frontière intérieure.
- **Dès 1291** : chaque canton actuel a une frise de statuts datés (`TL`, section 8.3). Chaque entrée = `[année, statut, maître]`.
- **Fusion** : à une date donnée, on regroupe les cantons actuels qui ont **la même clé** (avant 1291 : groupe ; après : `statut|maître`) et on **fusionne leurs géométries** en une seule forme (`topojson.merge`). Une seule étiquette par entité, placée au centre de sa plus grande partie. Exemples attendus :
  - 1400 : Argovie, Thurgovie et Lucerne-campagne forment un bloc « Habsbourg » ; Obwald + Nidwald = « Unterwald ».
  - 1798–1802 : presque toute la Suisse = une seule « République helvétique ».
  - 1815–1978 : le Jura est fusionné dans « Berne ».
- **Étiquettes** : texte coupé avant « ( » ou « , » (ex. « Fribourg, allié de Berne » → « Fribourg »). Affichée seulement si la surface à l'écran est suffisante (aire × zoom² > 2 600 px² bureau, 9 000 px² mobile).
- **Frontière nationale actuelle** : tracée en pointillés avant 1815 avec la mention « Frontière actuelle, pour repère » dans la légende ; trait plein ensuite.
- **Limite connue (à afficher honnêtement)** : avant 1848, les formes suivent les cantons actuels, pas les vraies limites historiques (ex. tout le Tessin est « sujet » dès 1440). Phase 2 : reconstruire à partir des communes.

### 4.3 Statuts et couleurs (dès 1291)
| Clé | Libellé | Rendu |
|---|---|---|
| `membre` | Membre de la Confédération | rouge `#e2453c`, aplat |
| `allie` | Allié | hachures dorées (`#b07c2a` / `#f0b552`, 45°) |
| `sujet` | Territoire sujet | hachures prune (`#7b4368` / `#b9709f`, 45°) |
| `etranger` | Hors de la Confédération | ardoise `#253446` |
| `helv` | République helvétique | vert `#3f9a6e` |
| `fr` | France | bleu `#4a6fc7` |

Les hachures gardent une finesse constante à l'écran quel que soit le zoom.

### 4.4 Nombre de cantons affiché
Table `COUNT` (section 8.3) : 3 en 1291 … 13 en 1513, « 1 république » en 1798, 19 en 1803, 22 en 1815, « 23 cantons (26 avec les demi-cantons) » en 1979.

### 4.5 Population
- Série `POP` (section 8.4) : points [année, habitants, `est`|`real`]. **Interpolation log-linéaire** entre deux points (exp de l'interpolation linéaire des logarithmes). Au-delà du dernier point : dernière valeur (9 127 100, fin 2025, OFS).
- Format : « 1,2 M » au-dessus d'un million (2 décimales max, virgule), sinon « 815 000 » (arrondi au millier).
- Pastille : voir 3.1.
- Ville de Genève : série `GEPOP` à partir de 1357, même interpolation, arrondi à la dizaine.

### 4.6 Événements
- Chaque événement : année, lat/lon, canton, type, **niveau** (1 = national, 2 = régional), titre, texte.
- **Visible** si `année ≤ année courante` ET (niveau 1 OU zoom ≥ 2,2 OU son canton est sélectionné).
- **Récent** si l'écart sur la barre entre l'événement et l'année courante est < 3,2 % : point plus gros + anneau pulsé. Sinon : point plus petit, opacité 0,55.
- Taille des marques ≈ constante à l'écran : rayon ∝ 1 / zoom^0,85.
- Types et couleurs (`TYPES`, section 8.6) : archéologie, fondation, bataille, politique, religion, catastrophe, culture.
- **Batailles** : icône **épées croisées** (disque rouge sombre `#3a1410`, contour `#ff6a4d`, épées `#ffd9c9`) à la place du point. Données de guerre dans `WAR` (clé = titre de l'événement).

### 4.7 Villes
- Une ville apparaît à la date de son premier nom ; son nom change selon `names` (ex. Turicum → Zurich en 900). Nom `null` = ville abandonnée (Augusta Raurica après 400).
- Étiquettes : seules les grandes villes (liste `MAJOR` dans le prototype) sous un zoom de 1,7 (bureau) ou 2,6 (mobile) ; toutes au-delà.

### 4.8 Lacs
- Toujours dessinés (sauf lacs artificiels avant leur date : Sihlsee 1937, lac de la Gruyère 1948).
- **Le nom n'apparaît qu'à partir de sa première attestation** (`names`) : Lacus Lemannus dès -58 puis Léman dès 1000, lac de Lucerne puis lac des Quatre-Cantons dès 1332, etc. Avant : pas d'étiquette, fiche « Lac sans nom connu ».
- Étiquette : nom (italique) + « 580 km² » dessous. Visible si superficie ≥ 80 km² (bureau) / 200 km² (mobile), ou si zoom² × superficie ≥ 90 (bureau) / 400 (mobile).

### 4.9 Relief
- Environ 520 petits sommets triangulaires (avec calotte enneigée) semés **de façon déterministe** (graine fixe) dans les régions alpines : cantons alpins entiers, et parties sud de Berne (lat < 46,72), Vaud (< 46,45), Fribourg (< 46,62), Lucerne (< 46,95), Schwytz (< 47,06), Saint-Gall (< 47,2), Appenzell RE (< 47,38) ; Tessin au nord de 46,15.
- 7 sommets nommés (`PEAKS`) visibles à partir du zoom 1,6.
- Phase 2 : vrai relief ombré (swissALTI3D) pré-rendu.

---

## 5. Design system

### 5.1 Direction
« Atlas de nuit » : fond bleu-noir, territoires lumineux, typographie éditoriale. Un seul thème, sombre, assumé. Mobile d'abord.

### 5.2 Couleurs
```css
--bg:#0c131b; --bg2:#121c27; --panel:#16212d;
--ink:#eef2f5; --muted:#8b9bac; --line:#26364a;
--membre:#e2453c; --allie:#e8a33d; --sujet:#a35c8c; --etranger:#253446;
--helv:#3f9a6e; --fr:#4a6fc7; --lake:#16324a; --gold:#f2c46d;
```
Couleurs des époques (bandes du curseur) et des groupes d'avant 1291 : données `ERAS` et `PRE`.

### 5.3 Typographie
- **Display** : Instrument Serif (année, compteur, titres de fiches, noms de lacs en italique).
- **Interface** : Manrope 400/600/700/800.
- Chiffres tabulaires pour l'année et le compteur.

### 5.4 Composants
- Pastilles (chip) arrondies, cartes de faits en grille 2 colonnes, frises verticales à pastilles colorées, boutons-liste (année en or + titre), encadré « Le saviez-vous ? » (dégradé or léger), encadré guerre (rouge léger).
- Animations : transitions de couleur 550 ms, apparition des points 500 ms, éclat d'intégration 1,6 s, anneau pulsé 1,8 s. Respecter `prefers-reduced-motion`.

### 5.5 Portraits illustrés
Bustes vectoriels générés à partir de paramètres (`fig` dans `INFO`) : teint, coiffure (`long`, `short`, `braid`, `bun`, `tonsure`), barbe (`none`, `mustache`, `full`, `long`), vêtement (+ motif à carreaux), manteau, fourrure, fibule, torque, collier, boucle de ceinture, croix, couvre-chef (`hood`, `roman`, `spangen`, `mitre`, `coronet`, `headband`), femme (boucles d'oreilles). Fond = couleur du groupe + silhouette de montagnes. **Toujours légender** : « Illustration d'après les découvertes archéologiques ». Phase 2 : remplacer par de vraies illustrations commandées à un illustrateur, même cadrage.

---

## 6. Architecture technique recommandée

### 6.1 Choix
| Besoin | Recommandation | Pourquoi |
|---|---|---|
| Application | **Next.js (App Router) + TypeScript**, export statique, PWA | Stack de David, déploiement Vercel, SEO |
| Carte | **D3 (d3-geo, d3-zoom) + TopoJSON en SVG** | Fusion de géométries à la volée, contrôle total du style, prototype déjà validé |
| État | Zustand (année, sélection, zoom, lecture) | Léger |
| Données | JSON statiques dans `/data` (MVP), Firestore plus tard pour l'édition | Pas de backend nécessaire au MVP |
| Styles | CSS Modules ou Tailwind avec les tokens de 5.2 | — |
| Tests | Vitest (règles métier pures), Playwright (captures mobile/bureau) | — |

Alternative si les performances SVG deviennent limitantes (communes en phase 2) : MapLibre GL avec couches vectorielles.

### 6.2 Arborescence proposée
```
/app
  page.tsx                 écran unique
/components
  MapView.tsx              SVG + d3-zoom, couches
  layers/Entities.tsx      territoires fusionnés
  layers/Lakes.tsx  layers/Relief.tsx  layers/Cities.tsx  layers/Events.tsx
  TimeDock.tsx             curseur, bandes, graduations, lecture
  Header.tsx               année, époque, population
  Panel/                   CantonPanel, PeoplePanel, CityPanel, LakePanel, EventPanel, BattleBox
  Portrait.tsx             buste paramétrique
  Toast.tsx
/lib
  time.ts                  posOf, yearOf, eraOf, formatYear
  territories.ts           statusAt, preAt, entityOf, buildEntities (topojson.merge)
  population.ts            interpLog, formatPop, reliability
  visibility.ts            règles 4.6–4.8
/data
  geo/switzerland.topo.json   (country, cantons, lakes)
  eras.json  pre.json  timelines.json  count.json  population.json
  events.json  wars.json  cities.json  lakes.json  peaks.json  types.json
  peoples.json  cantons.json
/scripts
  build-geo.sh             mapshaper : simplification 40 %, quantization 12000
```

### 6.3 Géodonnées
- **Prototype** : paquet npm `swiss-maps` (données OFS GEOSTAT 2024), licence **non commerciale**. OK pour le développement.
- **Production** : **swissBOUNDARIES3D** de swisstopo (cantons, communes) + lacs, licence ouverte **usage commercial autorisé**, mention « ©swisstopo » obligatoire. Pipeline : téléchargement → `mapshaper -simplify 40% keep-shapes -o format=topojson quantization=12000` → ~40 Ko.
- Identifiants OFS des cantons : 1 ZH … 26 JU (`CODES`). Identifiants OFS des lacs : clés de `LAKES`.
- Phase 2 : frontières historiques = listes de numéros de communes OFS par territoire et par période (voir 7, `Territory.communes`) ; limites historisées OFS disponibles depuis 1850.

### 6.4 Performance
- Recalculer les entités fusionnées seulement quand la **clé de chaque canton** change (mémoïsation par signature), pas à chaque image.
- Pendant la lecture : `requestAnimationFrame`, pas de re-rendu React à chaque image pour la carte (manipuler les couches D3 directement ou limiter à ~30 fps).
- Graine déterministe pour le relief : calculé une fois.

---

## 7. Modèle de données (TypeScript)

```ts
type CantonCode = 'ZH'|'BE'|'LU'|'UR'|'SZ'|'OW'|'NW'|'GL'|'ZG'|'FR'|'SO'|'BS'|'BL'|'SH'|'AR'|'AI'|'SG'|'GR'|'AG'|'TG'|'TI'|'VD'|'VS'|'NE'|'GE'|'JU';
type Status = 'membre'|'allie'|'sujet'|'etranger'|'helv'|'fr';

interface Era { name: string; short: string; color: string }          // ERAS, index = époque
interface PreEra { from: number; to: number; note: string;
  groups: Record<string, [label: string, color: string]>;            // clé 'all' = sans frontières
  map?: Record<CantonCode, string> }                                  // canton -> clé de groupe
type TimelineEntry = [year: number, status: Status, ruler: string];   // TL[code] trié par année

interface HistEvent { id: number; year: number; lat: number; lon: number; code: CantonCode;
  type: 'arch'|'fond'|'bat'|'pol'|'rel'|'cat'|'cult'; lvl: 1|2; title: string; text: string }
type War = [war: string, sideA: string, sideB: string, winner: string]; // WAR[titre de l'événement]

interface City { id: number; code: CantonCode; lat: number; lon: number; pop?: number /*2020*/;
  names: [year: number, name: string|null][]; info: string }
interface Lake { names: [year: number, name: string][]; km2: number; m?: number; note: string; made?: number }
interface PeopleInfo { kind: string; who: string; facts: [string,string][]; life: string; belief: string;
  fact: string; see: string[]; fig: PortraitParams }                  // INFO['<indexEpoque>:<groupe>']
interface CantonInfo { cap: string; pop: number; km2: number; lang: string; trad: string; food: string; people: string }

// Phase 2
interface Territory { id: string; name: string; periods: { from: number; to: number; status: Status; ruler: string; communes: number[] }[] }
```

---

## 8. Données de contenu (source de vérité)

> Copier chaque bloc dans le fichier `/data/…json` indiqué. Les textes sont relus ; ne pas les réécrire.


### 8.1 Cantons, temps et époques

`/data/cantons-codes.json` — identifiants OFS → code, et noms français :
```json
{
 "CODES": {
  "1": "ZH",
  "2": "BE",
  "3": "LU",
  "4": "UR",
  "5": "SZ",
  "6": "OW",
  "7": "NW",
  "8": "GL",
  "9": "ZG",
  "10": "FR",
  "11": "SO",
  "12": "BS",
  "13": "BL",
  "14": "SH",
  "15": "AR",
  "16": "AI",
  "17": "SG",
  "18": "GR",
  "19": "AG",
  "20": "TG",
  "21": "TI",
  "22": "VD",
  "23": "VS",
  "24": "NE",
  "25": "GE",
  "26": "JU"
 },
 "NAMES": {
  "ZH": "Zurich",
  "BE": "Berne",
  "LU": "Lucerne",
  "UR": "Uri",
  "SZ": "Schwytz",
  "OW": "Obwald",
  "NW": "Nidwald",
  "GL": "Glaris",
  "ZG": "Zoug",
  "FR": "Fribourg",
  "SO": "Soleure",
  "BS": "Bâle-Ville",
  "BL": "Bâle-Campagne",
  "SH": "Schaffhouse",
  "AR": "Appenzell Rh.-Ext.",
  "AI": "Appenzell Rh.-Int.",
  "SG": "Saint-Gall",
  "GR": "Grisons",
  "AG": "Argovie",
  "TG": "Thurgovie",
  "TI": "Tessin",
  "VD": "Vaud",
  "VS": "Valais",
  "NE": "Neuchâtel",
  "GE": "Genève",
  "JU": "Jura"
 }
}
```

`/data/eras.json` — bornes du curseur, époques :
```json
{
 "BP": [
  -15000,
  -800,
  -58,
  443,
  1032,
  1291,
  1515,
  1798,
  1848,
  2026
 ],
 "PC": [
  0,
  5,
  12,
  22,
  30,
  38,
  58,
  74,
  86,
  100
 ],
 "ERAS": [
  {
   "name": "Préhistoire",
   "short": "Préhist.",
   "color": "#4b4334"
  },
  {
   "name": "Les peuples celtes",
   "short": "Celtes",
   "color": "#6b5232"
  },
  {
   "name": "L’Helvétie romaine",
   "short": "Rome",
   "color": "#8a3b33"
  },
  {
   "name": "Burgondes et Alamans",
   "short": "Haut Moyen Âge",
   "color": "#5b4a7a"
  },
  {
   "name": "Le temps des seigneurs",
   "short": "Seigneurs",
   "color": "#3d5a7a"
  },
  {
   "name": "Naissance et expansion de la Confédération",
   "short": "1291",
   "color": "#b8372f"
  },
  {
   "name": "Réforme et Ancien Régime",
   "short": "Ancien Régime",
   "color": "#8f4a6e"
  },
  {
   "name": "Révolution, Médiation, Restauration",
   "short": "1798",
   "color": "#2f7f5b"
  },
  {
   "name": "La Suisse moderne",
   "short": "1848",
   "color": "#c58f2f"
  }
 ]
}
```

### 8.2 Territoires avant 1291

`/data/pre.json` — 5 périodes ; `groups` = entités dessinées, `map` = rattachement de chaque canton actuel :
```json
[
 {
  "from": -15000,
  "to": -800,
  "groups": {
   "all": [
    "Chasseurs puis premiers paysans",
    "#4f4738"
   ]
  },
  "note": "Des chasseurs de rennes, puis des villages au bord des lacs dès 5000 av. J.-C."
 },
 {
  "from": -800,
  "to": -58,
  "groups": {
   "helv": [
    "Helvètes",
    "#a7763a"
   ],
   "raur": [
    "Rauraques",
    "#c08f52"
   ],
   "allo": [
    "Allobroges",
    "#8f6a3c"
   ],
   "vs": [
    "Peuples du Valais",
    "#7d5f43"
   ],
   "lep": [
    "Lépontiens",
    "#9a7b56"
   ],
   "rhet": [
    "Rhètes",
    "#6d5a45"
   ],
   "alp": [
    "Hautes vallées alpines",
    "#4f4738"
   ]
  },
  "map": {
   "ZH": "helv",
   "BE": "helv",
   "LU": "helv",
   "ZG": "helv",
   "SO": "helv",
   "AG": "helv",
   "FR": "helv",
   "NE": "helv",
   "VD": "helv",
   "TG": "helv",
   "SH": "helv",
   "BS": "raur",
   "BL": "raur",
   "JU": "raur",
   "GE": "allo",
   "VS": "vs",
   "TI": "lep",
   "GR": "rhet",
   "SG": "rhet",
   "AR": "rhet",
   "AI": "rhet",
   "UR": "alp",
   "SZ": "alp",
   "OW": "alp",
   "NW": "alp",
   "GL": "alp"
  },
  "note": "Le Plateau est le pays des Helvètes, peuple celte. Genève appartient aux Allobroges."
 },
 {
  "from": -58,
  "to": 443,
  "groups": {
   "germ": [
    "Germanie supérieure",
    "#a8463c"
   ],
   "raet": [
    "Rhétie",
    "#6e2f45"
   ],
   "pen": [
    "Alpes pennines",
    "#c7704a"
   ],
   "nar": [
    "Gaule narbonnaise",
    "#d99a6c"
   ],
   "ital": [
    "Italie",
    "#e3b27a"
   ]
  },
  "map": {
   "ZH": "germ",
   "BE": "germ",
   "LU": "germ",
   "ZG": "germ",
   "SO": "germ",
   "AG": "germ",
   "FR": "germ",
   "NE": "germ",
   "VD": "germ",
   "TG": "raet",
   "SH": "germ",
   "BS": "germ",
   "BL": "germ",
   "JU": "germ",
   "GE": "nar",
   "VS": "pen",
   "TI": "ital",
   "GR": "raet",
   "SG": "raet",
   "AR": "raet",
   "AI": "raet",
   "UR": "raet",
   "SZ": "germ",
   "OW": "germ",
   "NW": "germ",
   "GL": "raet"
  },
  "note": "Provinces romaines, d’après leur organisation au IIᵉ siècle."
 },
 {
  "from": 443,
  "to": 1032,
  "groups": {
   "burg": [
    "Burgondes",
    "#6c5a9a"
   ],
   "alam": [
    "Alamans",
    "#4f6a8a"
   ],
   "raet": [
    "Rhétie chrétienne",
    "#5d4f6e"
   ],
   "lomb": [
    "Lombards",
    "#7f5f8f"
   ]
  },
  "map": {
   "GE": "burg",
   "VD": "burg",
   "VS": "burg",
   "FR": "burg",
   "NE": "burg",
   "JU": "burg",
   "ZH": "alam",
   "BE": "alam",
   "LU": "alam",
   "ZG": "alam",
   "SO": "alam",
   "AG": "alam",
   "TG": "alam",
   "SH": "alam",
   "BS": "alam",
   "BL": "alam",
   "UR": "alam",
   "SZ": "alam",
   "OW": "alam",
   "NW": "alam",
   "GL": "alam",
   "SG": "alam",
   "AR": "alam",
   "AI": "alam",
   "GR": "raet",
   "TI": "lomb"
  },
  "note": "Les Burgondes de l’ouest adoptent le latin, les Alamans de l’est gardent leur langue germanique. La frontière des langues naît ici."
 },
 {
  "from": 1032,
  "to": 1291,
  "groups": {
   "sav": [
    "Comtes de Savoie",
    "#4f7aa8"
   ],
   "evge": [
    "Évêque de Genève",
    "#6c6fa0"
   ],
   "evbs": [
    "Prince-évêque de Bâle",
    "#6c6fa0"
   ],
   "evvs": [
    "Évêque de Sion",
    "#7b70a3"
   ],
   "evgr": [
    "Évêque de Coire",
    "#5f6797"
   ],
   "hab": [
    "Habsbourg et Kybourg",
    "#3d5f86"
   ],
   "zah": [
    "Zähringen, puis Kybourg",
    "#5a87a0"
   ],
   "so": [
    "Soleure",
    "#6895ad"
   ],
   "sh": [
    "Schaffhouse",
    "#6895ad"
   ],
   "ne": [
    "Comtes de Neuchâtel",
    "#5f8ea8"
   ],
   "lib": [
    "Vallées libres",
    "#83a7c4"
   ],
   "sg": [
    "Abbé de Saint-Gall",
    "#4c6176"
   ],
   "gl": [
    "Abbaye de Säckingen",
    "#556b80"
   ],
   "mil": [
    "Côme et Milan",
    "#466b8f"
   ]
  },
  "map": {
   "VD": "sav",
   "GE": "evge",
   "BS": "evbs",
   "BL": "evbs",
   "JU": "evbs",
   "VS": "evvs",
   "GR": "evgr",
   "AG": "hab",
   "LU": "hab",
   "ZG": "hab",
   "TG": "hab",
   "ZH": "hab",
   "BE": "zah",
   "FR": "zah",
   "SO": "so",
   "SH": "sh",
   "NE": "ne",
   "UR": "lib",
   "SZ": "lib",
   "OW": "lib",
   "NW": "lib",
   "SG": "sg",
   "AR": "sg",
   "AI": "sg",
   "GL": "gl",
   "TI": "mil"
  },
  "note": "La région appartient au Saint-Empire et se partage entre grandes familles, évêques et abbayes. Les Zähringen fondent Fribourg (1157) et Berne (1191)."
 }
]
```

### 8.3 Statuts des cantons dès 1291

`/data/statuses.json` — libellés et couleurs :
```json
{
 "membre": [
  "Membre de la Confédération",
  "var(--membre)",
  "#e2453c"
 ],
 "allie": [
  "Allié",
  "var(--allie)",
  "#e8a33d"
 ],
 "sujet": [
  "Territoire sujet",
  "var(--sujet)",
  "#a35c8c"
 ],
 "etranger": [
  "Hors de la Confédération",
  "var(--etranger)",
  "#253446"
 ],
 "helv": [
  "République helvétique",
  "var(--helv)",
  "#3f9a6e"
 ],
 "fr": [
  "France",
  "var(--fr)",
  "#4a6fc7"
 ]
}
```

`/data/timelines.json` — `[année, statut, maître]` par canton. Deux cantons voisins avec le même statut **et** le même maître sont fusionnés sur la carte :
```json
{
 "UR": [[1291, "membre", "Uri"], [1798, "helv", "République helvétique"], [1803, "membre", "Uri"]],
 "SZ": [[1291, "membre", "Schwytz"], [1798, "helv", "République helvétique"], [1803, "membre", "Schwytz"]],
 "OW": [[1291, "membre", "Unterwald"], [1798, "helv", "République helvétique"], [1803, "membre", "Obwald"]],
 "NW": [[1291, "membre", "Unterwald"], [1798, "helv", "République helvétique"], [1803, "membre", "Nidwald"]],
 "LU": [[1291, "etranger", "Habsbourg"], [1332, "membre", "Lucerne"], [1798, "helv", "République helvétique"], [1803, "membre", "Lucerne"]],
 "ZH": [[1291, "etranger", "Ville impériale de Zurich"], [1351, "membre", "Zurich"], [1798, "helv", "République helvétique"], [1803, "membre", "Zurich"]],
 "GL": [[1291, "etranger", "Habsbourg"], [1352, "membre", "Glaris"], [1798, "helv", "République helvétique"], [1803, "membre", "Glaris"]],
 "ZG": [[1291, "etranger", "Habsbourg"], [1352, "membre", "Zoug"], [1798, "helv", "République helvétique"], [1803, "membre", "Zoug"]],
 "BE": [[1291, "etranger", "Ville impériale de Berne"], [1353, "membre", "Berne"], [1798, "helv", "République helvétique"], [1803, "membre", "Berne"]],
 "FR": [[1291, "etranger", "Habsbourg, puis Savoie"], [1454, "allie", "Fribourg, allié de Berne"], [1481, "membre", "Fribourg"], [1798, "helv", "République helvétique"], [1803, "membre", "Fribourg"]],
 "SO": [[1291, "etranger", "Ville impériale de Soleure"], [1481, "membre", "Soleure"], [1798, "helv", "République helvétique"], [1803, "membre", "Soleure"]],
 "BS": [[1291, "etranger", "Évêque et ville de Bâle"], [1501, "membre", "Bâle"], [1798, "helv", "République helvétique"], [1803, "membre", "Bâle"], [1833, "membre", "Bâle-Ville, après la séparation"]],
 "BL": [[1291, "etranger", "Prince-évêque de Bâle"], [1501, "membre", "Bâle"], [1798, "helv", "République helvétique"], [1803, "membre", "Bâle"], [1833, "membre", "Bâle-Campagne, après la séparation"]],
 "SH": [[1291, "etranger", "Ville sous les Habsbourg"], [1454, "allie", "Schaffhouse"], [1501, "membre", "Schaffhouse"], [1798, "helv", "République helvétique"], [1803, "membre", "Schaffhouse"]],
 "AR": [[1291, "etranger", "Abbé de Saint-Gall"], [1411, "allie", "Appenzell"], [1513, "membre", "Appenzell"], [1597, "membre", "Appenzell Rhodes-Extérieures (protestant)"], [1798, "helv", "République helvétique"], [1803, "membre", "Appenzell Rhodes-Extérieures"]],
 "AI": [[1291, "etranger", "Abbé de Saint-Gall"], [1411, "allie", "Appenzell"], [1513, "membre", "Appenzell"], [1597, "membre", "Appenzell Rhodes-Intérieures (catholique)"], [1798, "helv", "République helvétique"], [1803, "membre", "Appenzell Rhodes-Intérieures"]],
 "SG": [[1291, "etranger", "Abbé de Saint-Gall"], [1451, "allie", "Abbaye et ville de Saint-Gall"], [1798, "helv", "République helvétique"], [1803, "membre", "Saint-Gall"]],
 "GR": [[1291, "etranger", "Évêque de Coire et seigneurs"], [1497, "allie", "Trois Ligues grisonnes"], [1799, "helv", "République helvétique"], [1803, "membre", "Grisons"]],
 "AG": [[1291, "etranger", "Habsbourg"], [1415, "sujet", "Berne et bailliages communs"], [1798, "helv", "République helvétique"], [1803, "membre", "Argovie"]],
 "TG": [[1291, "etranger", "Habsbourg"], [1460, "sujet", "Bailliage commun des cantons"], [1798, "helv", "République helvétique"], [1803, "membre", "Thurgovie"]],
 "TI": [[1291, "etranger", "Côme et Milan"], [1440, "sujet", "Uri (Léventine), puis bailliages communs"], [1798, "helv", "République helvétique"], [1803, "membre", "Tessin"]],
 "VD": [[1291, "etranger", "Savoie"], [1536, "sujet", "Berne (Pays de Vaud)"], [1798, "helv", "République helvétique"], [1803, "membre", "Vaud"]],
 "VS": [[1291, "etranger", "Évêque de Sion et Savoie"], [1416, "allie", "Valais (les dizains)"], [1798, "helv", "République helvétique"], [1802, "etranger", "République du Valais, indépendante"], [1810, "fr", "France (département du Simplon)"], [1815, "membre", "Valais"]],
 "NE": [[1291, "etranger", "Comtes de Neuchâtel"], [1406, "allie", "Neuchâtel, combourgeois de Berne"], [1707, "allie", "Principauté du roi de Prusse"], [1806, "etranger", "Principauté de Berthier, maréchal de Napoléon"], [1815, "membre", "Neuchâtel (prince : le roi de Prusse)"], [1848, "membre", "République de Neuchâtel"]],
 "GE": [[1291, "etranger", "Évêque de Genève"], [1526, "allie", "Genève, combourgeoise de Berne et Fribourg"], [1536, "allie", "République de Genève"], [1798, "fr", "France (département du Léman)"], [1814, "etranger", "République de Genève restaurée"], [1815, "membre", "Genève"]],
 "JU": [[1291, "etranger", "Prince-évêque de Bâle"], [1579, "allie", "Prince-évêque, allié des cantons catholiques"], [1735, "etranger", "Prince-évêque de Bâle"], [1793, "fr", "France (Mont-Terrible)"], [1815, "membre", "Berne"], [1979, "membre", "République et canton du Jura"]]
}
```

`/data/count.json` — nombre de cantons affiché :
```json
[[1291, "3 cantons"], [1332, "4 cantons"], [1351, "5 cantons"], [1352, "7 cantons"], [1353, "8 cantons"], [1481, "10 cantons"], [1501, "12 cantons"], [1513, "13 cantons"], [1798, "1 république"], [1803, "19 cantons"], [1815, "22 cantons"], [1979, "23 cantons (26 avec les demi-cantons)"]]
```

### 8.4 Population

`/data/population.json` — Suisse (`est` = estimation, `real` = relevé ou recensement) et ville de Genève. Sources : DHS, article « Population » (jusqu'en 2000) ; OFS (9 127 100 au 31.12.2025) ; DHS, « Genève (commune) ».
```json
{"suisse": [[-15000, 1000, "est"], [-4000, 15000, "est"], [-800, 35000, "est"], [-58, 150000, "est"], [150, 190000, "est"], [1000, 500000, "est"], [1300, 775000, "est"], [1600, 900000, "est"], [1700, 1200000, "est"], [1798, 1664832, "real"], [1850, 2392740, "real"], [1900, 3315443, "real"], [1950, 4714992, "real"], [2000, 7288010, "real"], [2025, 9127100, "real"]], "geneveVille": [[1357, 2500], [1580, 17330], [1650, 12250], [1690, 16220], [1798, 24331], [1814, 21812], [1850, 37724], [1900, 97359], [1950, 145473], [2000, 177964]]}
```

### 8.5 Fiches des peuples et seigneuries (avant 1291)

`/data/peoples.json` — clé `"<index de période PRE>:<clé de groupe>"`. `fig` = paramètres du portrait (5.5).
```json
{
 "0:all": {
  "kind": "Préhistoire",
  "who": "Un chasseur de la fin de la glaciation",
  "facts": [
   [
    "Langue",
    "Inconnue, pas d’écriture"
   ],
   [
    "Habitat",
    "Abris sous roche, puis villages sur pilotis"
   ],
   [
    "Population",
    "10 000 à 20 000 au Néolithique, sur le Plateau"
   ]
  ],
  "life": "Après le retrait des glaciers, vers 15 000 av. J.-C., des chasseurs suivent les rennes et les chevaux sauvages. Vers 5500 av. J.-C., l’agriculture arrive : on cultive le blé et l’orge, on élève chèvres, moutons et bœufs, et l’on bâtit des villages au bord des lacs.",
  "belief": "On en sait peu. À Sion, la nécropole du Petit-Chasseur a livré de grandes stèles gravées en forme de personnages, vers 2500 av. J.-C.",
  "fact": "La boue des villages lacustres a conservé des objets rarissimes : pain, tissus de lin, outils en bois. 56 sites suisses sont inscrits à l’UNESCO. Au col du Schnidejoch, la fonte de la glace a révélé en 2003 des objets perdus il y a plus de 6000 ans.",
  "see": [
   "Laténium, Hauterive (NE)",
   "Site du Petit-Chasseur, Sion",
   "Musée national suisse, Zurich"
  ],
  "fig": {
   "skin": "#d9a77f",
   "hair": "long",
   "hairC": "#4a3222",
   "beard": "full",
   "garment": "#7a5a3a",
   "cloak": "#8a6a48",
   "fur": true,
   "necklace": true
  }
 },
 "1:helv": {
  "kind": "Peuple celte",
  "who": "Un noble helvète vers 100 av. J.-C.",
  "facts": [
   [
    "Langue",
    "Gaulois, une langue celte"
   ],
   [
    "Habitat",
    "Fermes, villages et oppida fortifiés"
   ],
   [
    "Population",
    "Un peu moins de 150 000 en 58 av. J.-C."
   ],
   [
    "Grands sites",
    "Mont Vully, presqu’île de l’Enge à Berne"
   ]
  ],
  "life": "Les Helvètes sont paysans et artisans. Ils élèvent bœufs et porcs, cultivent les céréales, travaillent le fer avec talent et frappent leurs propres monnaies. Les hommes portent des braies, une tunique et un manteau de laine fermé par une fibule. Les nobles arborent un torque, collier rigide en or ou en bronze.",
  "belief": "Ils honorent des dieux celtes et déposent armes et objets précieux dans l’eau, comme à La Tène. Les druides, à la fois prêtres et savants, transmettent le savoir oralement.",
  "fact": "En 58 av. J.-C., ils brûlent leurs 12 oppida et 400 villages pour émigrer vers la Gaule. César les bat à Bibracte et les renvoie chez eux. Il raconte avoir trouvé dans leur camp des registres écrits en lettres grecques, qui comptaient chaque émigrant.",
  "see": [
   "Oppidum du Mont Vully (FR)",
   "Laténium, Hauterive (NE)",
   "Musée national suisse, Zurich"
  ],
  "fig": {
   "skin": "#e8c4a0",
   "hair": "long",
   "hairC": "#b8733a",
   "beard": "mustache",
   "garment": "#8f3b2e",
   "pattern": "checks",
   "cloak": "#2f5f7a",
   "fibula": true,
   "torc": "#e0b34a"
  }
 },
 "1:raur": {
  "kind": "Peuple celte",
  "who": "Un artisan rauraque vers 120 av. J.-C.",
  "facts": [
   [
    "Langue",
    "Gaulois"
   ],
   [
    "Lieu principal",
    "Bâle, au coude du Rhin"
   ],
   [
    "Habitat",
    "Grand village artisanal, puis oppidum sur la colline de la cathédrale"
   ]
  ],
  "life": "Voisins des Helvètes, les Rauraques vivent autour du coude du Rhin. Le village de Bâle-Gasfabrik, vers 150 av. J.-C., est un centre d’artisanat et de commerce : on y a trouvé des amphores de vin venu d’Italie.",
  "belief": "Comme les autres Celtes, ils vénèrent des dieux de la nature et pratiquent des offrandes dans des lieux sacrés.",
  "fact": "Ils se joignent à l’émigration des Helvètes en 58 av. J.-C. La colonie romaine fondée ensuite sur leur territoire porte leur nom : Augusta Raurica.",
  "see": [
   "Augusta Raurica, Augst (BL)",
   "Musée d’histoire de Bâle"
  ],
  "fig": {
   "skin": "#e3bb94",
   "hair": "short",
   "hairC": "#6b4428",
   "beard": "full",
   "garment": "#5f6b3a",
   "pattern": "checks",
   "cloak": "#7a3b2a",
   "fibula": true,
   "torc": "#b98a4a"
  }
 },
 "1:allo": {
  "kind": "Peuple celte",
  "who": "Une femme allobroge vers 100 av. J.-C.",
  "facts": [
   [
    "Langue",
    "Gaulois"
   ],
   [
    "Capitale",
    "Vienne, sur le Rhône"
   ],
   [
    "Ici",
    "Genava, ville-frontière avec un pont sur le Rhône"
   ]
  ],
  "life": "Peuple puissant de la vallée du Rhône, entre l’Isère et le Léman. Genève est leur poste le plus au nord, face au pays des Helvètes. Ils élèvent du bétail, commercent avec la Méditerranée et cultivent la vigne.",
  "belief": "Dieux celtes, sources et bois sacrés. Au contact de Rome, ils adoptent peu à peu ses cultes.",
  "fact": "Rome les soumet dès 121 av. J.-C., bien avant les Helvètes. Genève est donc déjà romaine quand César y arrive en 58 av. J.-C. Pline l’Ancien vante un cépage « allobrogique ».",
  "see": [
   "Site archéologique de la cathédrale Saint-Pierre, Genève",
   "Musée d’art et d’histoire, Genève"
  ],
  "fig": {
   "skin": "#efcfae",
   "hair": "braid",
   "hairC": "#7a4a2a",
   "beard": "none",
   "garment": "#3f6a5a",
   "cloak": "#9a5a2a",
   "fibula": true,
   "torc": "#e0b34a",
   "female": true
  }
 },
 "1:vs": {
  "kind": "Peuples celtes",
  "who": "Un montagnard véragre vers 60 av. J.-C.",
  "facts": [
   [
    "Quatre peuples",
    "Nantuates, Véragres, Sédunes, Ubères"
   ],
   [
    "Langue",
    "Celte"
   ],
   [
    "Lieux",
    "Octodurus (Martigny), Sion"
   ]
  ],
  "life": "Ils vivent d’élevage dans la vallée du Rhône et contrôlent les cols, surtout le Grand-Saint-Bernard. Les marchandises qui franchissent les Alpes leur rapportent des péages.",
  "belief": "Dieux celtes des montagnes et des cols. Un sanctuaire celte puis romain se trouvait au sommet du Grand-Saint-Bernard.",
  "fact": "En 57 av. J.-C., ils attaquent le camp de Galba, lieutenant de César, à Octodurus. Les Romains repoussent l’assaut mais quittent la vallée.",
  "see": [
   "Musée d’histoire du Valais, Sion",
   "Amphithéâtre romain de Martigny"
  ],
  "fig": {
   "skin": "#d9a77f",
   "hair": "short",
   "hairC": "#3a2a1e",
   "beard": "full",
   "garment": "#6a5a46",
   "cloak": "#4a3a2e",
   "hat": "hood",
   "hatC": "#5a4636"
  }
 },
 "1:lep": {
  "kind": "Peuple celte des Alpes du Sud",
  "who": "Une Lépontienne vers 300 av. J.-C.",
  "facts": [
   [
    "Langue",
    "Lépontique, une langue celte écrite"
   ],
   [
    "Région",
    "Vallées du Tessin, au sud du Gothard"
   ],
   [
    "Écriture",
    "L’« alphabet de Lugano », d’origine étrusque"
   ]
  ],
  "life": "Peuple des vallées tessinoises, lié à la culture de Golasecca du nord de l’Italie. Ils commercent à travers les cols, entre le monde celte et le monde étrusque.",
  "belief": "Leurs tombes contiennent bijoux, céramiques et objets de bronze qui accompagnent le défunt.",
  "fact": "Les inscriptions lépontiques sont parmi les plus anciens textes connus dans une langue celte, dès le VIᵉ siècle av. J.-C.",
  "see": [
   "Castello Visconteo, Locarno",
   "Musée national suisse, Zurich"
  ],
  "fig": {
   "skin": "#e3b88f",
   "hair": "long",
   "hairC": "#2e1f16",
   "beard": "none",
   "garment": "#7a4f6a",
   "cloak": "#c9a46a",
   "necklace": true,
   "hat": "headband",
   "hatC": "#c9a46a",
   "female": true
  }
 },
 "1:rhet": {
  "kind": "Peuple alpin",
  "who": "Un Rhète vers 100 av. J.-C.",
  "facts": [
   [
    "Langue",
    "Rhétique, apparentée à l’étrusque"
   ],
   [
    "Région",
    "Grisons, Tyrol, nord de l’Italie"
   ],
   [
    "Habitat",
    "Villages de pierre et de bois en altitude"
   ]
  ],
  "life": "Éleveurs et mineurs des hautes vallées de l’est. Ils écrivent avec des alphabets venus d’Italie du Nord.",
  "belief": "Ils brûlent des offrandes sur des places de feu, souvent sur des hauteurs.",
  "fact": "En 15 av. J.-C., les armées de Drusus et de Tibère, beaux-fils d’Auguste, les soumettent en une seule campagne. Le romanche descend du latin parlé ensuite dans leur région.",
  "see": [
   "Musée rhétique, Coire"
  ],
  "fig": {
   "skin": "#d9a77f",
   "hair": "long",
   "hairC": "#2a1e16",
   "beard": "full",
   "garment": "#4a5a6a",
   "cloak": "#6a4a3a",
   "fur": true
  }
 },
 "1:alp": {
  "kind": "Hautes vallées",
  "who": "Un berger d’été dans les Alpes",
  "facts": [
   [
    "Habitants",
    "Très peu, surtout en été"
   ],
   [
    "Activités",
    "Chasse, alpage, passage des cols"
   ]
  ],
  "life": "Les vallées d’Uri, de Schwytz ou de Glaris sont peu habitées. On y trouve des traces de chasseurs et de bergers qui montent l’été avec leurs bêtes, mais aucun grand village connu.",
  "belief": "Rien d’écrit ne nous est parvenu sur leurs croyances.",
  "fact": "Ces vallées vides deviendront plus tard le cœur de la Confédération, grâce à la route du Gothard ouverte vers 1230.",
  "see": [
   "Forum de l’histoire suisse, Schwytz"
  ],
  "fig": {
   "skin": "#d9a77f",
   "hair": "short",
   "hairC": "#4a3222",
   "beard": "full",
   "garment": "#5a4a3a",
   "cloak": "#7a6a50",
   "hat": "hood",
   "hatC": "#6a5a44"
  }
 },
 "2:germ": {
  "kind": "Province romaine",
  "who": "Un Gallo-Romain d’Aventicum vers 150",
  "facts": [
   [
    "Province",
    "Germanie supérieure (vers 90), capitale Mayence"
   ],
   [
    "Ville principale ici",
    "Aventicum, peut-être 20 000 habitants"
   ],
   [
    "Langues",
    "Latin et gaulois"
   ]
  ],
  "life": "Les Helvètes deviennent des Gallo-Romains. On parle latin en ville, on construit des villas avec bains et chauffage par le sol, on boit du vin et on cuisine à l’huile d’olive importée. Des routes relient Genève, Avenches, Windisch et Bâle.",
  "belief": "Dieux romains et celtes se mélangent : Mercure est très populaire. Le christianisme s’installe au IVᵉ siècle.",
  "fact": "En 1939, on a découvert à Avenches un buste en or pur de l’empereur Marc Aurèle, caché dans une canalisation.",
  "see": [
   "Avenches : amphithéâtre et musée romain",
   "Augusta Raurica, Augst",
   "Vindonissa, Brugg"
  ],
  "fig": {
   "skin": "#e8c4a0",
   "hair": "short",
   "hairC": "#3a2a1e",
   "beard": "none",
   "garment": "#e8e0cf",
   "cloak": "#9a3b33",
   "fibula": true
  }
 },
 "2:raet": {
  "kind": "Province romaine",
  "who": "Un légionnaire en Rhétie vers 50",
  "facts": [
   [
    "Province",
    "Rhétie, capitale Augsbourg"
   ],
   [
    "Ici",
    "Curia (Coire), routes des cols du Julier et du Septimer"
   ],
   [
    "Langue",
    "Latin, qui deviendra le romanche"
   ]
  ],
  "life": "Rome fait de la région un passage militaire vers le Danube. Soldats, marchands et fonctionnaires empruntent les cols. Les habitants rhètes se latinisent peu à peu.",
  "belief": "Les soldats apportent leurs dieux : Jupiter, Mars, et des cultes venus d’Orient.",
  "fact": "Le latin parlé en Rhétie a survécu jusqu’à aujourd’hui : c’est l’ancêtre du romanche, quatrième langue nationale.",
  "see": [
   "Musée rhétique, Coire",
   "Site romain du Welschdörfli, Coire"
  ],
  "fig": {
   "skin": "#d9a77f",
   "hair": "short",
   "hairC": "#2a1e16",
   "beard": "none",
   "garment": "#9a3b33",
   "cloak": "#7a2a24",
   "hat": "roman",
   "hatC": "#b8a06a"
  }
 },
 "2:pen": {
  "kind": "Province romaine",
  "who": "Un marchand au col du Grand-Saint-Bernard",
  "facts": [
   [
    "Province",
    "Alpes pennines"
   ],
   [
    "Capitale",
    "Forum Claudii Vallensium (Martigny)"
   ],
   [
    "Col",
    "Summus Poeninus, avec un temple de Jupiter"
   ]
  ],
  "life": "Le Valais vit du passage des Alpes. Muletiers et marchands montent vers le Grand-Saint-Bernard, où les voyageurs laissent des offrandes au temple de Jupiter Poeninus.",
  "belief": "Jupiter Poeninus, dieu du col, reçoit des ex-voto en bronze et des monnaies.",
  "fact": "Martigny avait un amphithéâtre de plusieurs milliers de places. On y organise aujourd’hui des combats de reines.",
  "see": [
   "Amphithéâtre de Martigny",
   "Musée et hospice du Grand-Saint-Bernard"
  ],
  "fig": {
   "skin": "#d9a77f",
   "hair": "short",
   "hairC": "#3a2a1e",
   "beard": "full",
   "garment": "#8a7a5a",
   "cloak": "#5a4a3a",
   "hat": "hood",
   "hatC": "#6a5a46"
  }
 },
 "2:nar": {
  "kind": "Province romaine",
  "who": "Une Genevoise de l’époque romaine",
  "facts": [
   [
    "Province",
    "Gaule narbonnaise"
   ],
   [
    "Statut",
    "Genava dépend de la colonie de Vienne"
   ],
   [
    "Activité",
    "Port sur le lac, pont sur le Rhône"
   ]
  ],
  "life": "Genava est un bourg marchand au bout du lac. Son port reçoit les marchandises qui remontent le Rhône depuis la Méditerranée.",
  "belief": "Les dieux romains, puis le christianisme : un premier sanctuaire chrétien apparaît vers 350 sur la colline de la cathédrale.",
  "fact": "Un incendie catastrophique ravage la colline au Iᵉʳ siècle. La ville est ensuite reconstruite avec un nouveau plan.",
  "see": [
   "Site archéologique de la cathédrale Saint-Pierre, Genève"
  ],
  "fig": {
   "skin": "#efcfae",
   "hair": "bun",
   "hairC": "#4a2e1e",
   "beard": "none",
   "garment": "#c9b38a",
   "cloak": "#6a4a7a",
   "female": true,
   "necklace": true
  }
 },
 "2:ital": {
  "kind": "Province romaine",
  "who": "Un habitant de Muralto vers 100",
  "facts": [
   [
    "Région",
    "Italie, rattachée à Côme"
   ],
   [
    "Langue",
    "Latin"
   ],
   [
    "Lieux",
    "Muralto et Locarno"
   ]
  ],
  "life": "Le Tessin fait partie de l’Italie romaine. On y produit et importe de beaux objets, dont une célèbre verrerie retrouvée dans les tombes de Muralto.",
  "belief": "Dieux romains, puis christianisme.",
  "fact": "Les tombes de Muralto ont livré une des plus riches collections de verre romain de Suisse.",
  "see": [
   "Castello Visconteo, Locarno"
  ],
  "fig": {
   "skin": "#d9a77f",
   "hair": "short",
   "hairC": "#2a1e16",
   "beard": "none",
   "garment": "#e8e0cf",
   "cloak": "#3f6a5a"
  }
 },
 "3:burg": {
  "kind": "Peuple germanique",
  "who": "Un Burgonde vers 500",
  "facts": [
   [
    "Origine",
    "Peuple germanique venu de l’est"
   ],
   [
    "Installation",
    "443, dans la région du Léman"
   ],
   [
    "Langue",
    "Le burgonde, vite abandonné pour le latin"
   ]
  ],
  "life": "Le général romain Aetius installe les Burgondes en Sapaudia en 443. Peu nombreux, ils adoptent le latin des habitants : c’est l’origine du français de Suisse romande. Leur roi Gondebaud fait rédiger la loi Gombette.",
  "belief": "D’abord chrétiens ariens, ils passent au catholicisme. Le roi Sigismond fonde l’abbaye de Saint-Maurice en 515.",
  "fact": "Les Burgondes sont célèbres pour leurs grandes plaques-boucles de ceinture, ornées de motifs incrustés d’argent.",
  "see": [
   "Abbaye de Saint-Maurice (VS)",
   "Musée d’art et d’histoire, Genève"
  ],
  "fig": {
   "skin": "#e8c4a0",
   "hair": "long",
   "hairC": "#a8763a",
   "beard": "mustache",
   "garment": "#5a4a7a",
   "cloak": "#7a3b2e",
   "fibula": true,
   "buckle": true
  }
 },
 "3:alam": {
  "kind": "Peuple germanique",
  "who": "Un Alaman vers 600",
  "facts": [
   [
    "Origine",
    "Confédération de peuples germaniques"
   ],
   [
    "Installation",
    "Plateau oriental, Vᵉ–VIIᵉ siècles"
   ],
   [
    "Langue",
    "L’alémanique, ancêtre du suisse allemand"
   ]
  ],
  "life": "Paysans installés en petits hameaux, ils gardent leur langue germanique. Beaucoup de noms de lieux en -ingen ou -ikon viennent d’eux. Les hommes sont enterrés avec leur épée et leur bouclier.",
  "belief": "Païens au départ, ils sont christianisés au VIIᵉ siècle, notamment par des moines irlandais comme Colomban et Gall.",
  "fact": "La frontière entre Burgondes et Alamans est encore visible aujourd’hui : c’est la frontière entre le français et l’allemand.",
  "see": [
   "Musée national suisse, Zurich"
  ],
  "fig": {
   "skin": "#efcfae",
   "hair": "long",
   "hairC": "#c9a060",
   "beard": "full",
   "garment": "#4f6a5a",
   "cloak": "#5a4632",
   "fibula": true,
   "hat": "spangen",
   "hatC": "#8a8a8a"
  }
 },
 "3:raet": {
  "kind": "Région romane chrétienne",
  "who": "Un moine de Rhétie vers 800",
  "facts": [
   [
    "Langue",
    "Le roman, futur romanche"
   ],
   [
    "Pouvoir",
    "L’évêque de Coire et la famille des Victorides"
   ],
   [
    "Lieu phare",
    "Abbaye de Müstair"
   ]
  ],
  "life": "Isolée dans ses vallées, la Rhétie garde la langue latine et ses traditions romaines plus longtemps que ses voisins.",
  "belief": "Chrétienne très tôt : l’évêché de Coire est l’un des plus anciens au nord des Alpes.",
  "fact": "Le monastère Saint-Jean de Müstair, fondé vers 775, conserve des fresques carolingiennes uniques. Il est inscrit à l’UNESCO.",
  "see": [
   "Couvent Saint-Jean, Müstair (GR)",
   "Cathédrale de Coire"
  ],
  "fig": {
   "skin": "#e3bb94",
   "hair": "tonsure",
   "hairC": "#4a3222",
   "beard": "none",
   "garment": "#3a3a3a",
   "cloak": "#2a2a2a",
   "hat": "hood",
   "hatC": "#2e2e2e",
   "cross": true
  }
 },
 "3:lomb": {
  "kind": "Peuple germanique",
  "who": "Un guerrier lombard vers 650",
  "facts": [
   [
    "Origine",
    "Peuple germanique, arrivé en Italie en 568"
   ],
   [
    "Capitale",
    "Pavie"
   ],
   [
    "Fin",
    "Conquête de Charlemagne en 774"
   ]
  ],
  "life": "Le Tessin fait partie du royaume lombard d’Italie du Nord. Les Lombards adoptent peu à peu le latin et les usages italiens.",
  "belief": "Ariens puis catholiques.",
  "fact": "Leur nom viendrait de « longues barbes » : Langobardi.",
  "see": [
   "Musée national suisse, Zurich"
  ],
  "fig": {
   "skin": "#e8c4a0",
   "hair": "long",
   "hairC": "#6b4428",
   "beard": "long",
   "garment": "#6a3a2a",
   "cloak": "#3f4f6a",
   "fibula": true
  }
 },
 "4:sav": {
  "kind": "Grande famille",
  "who": "Un comte de Savoie au XIIIᵉ siècle",
  "facts": [
   [
    "Personnage clé",
    "Pierre II de Savoie (1203–1268)"
   ],
   [
    "Territoire",
    "Pays de Vaud, Chablais, Bas-Valais"
   ],
   [
    "Symbole",
    "Le château de Chillon"
   ]
  ],
  "life": "Pierre II, surnommé « le petit Charlemagne », étend la Savoie sur le Pays de Vaud. Il construit ou transforme des châteaux sur un même plan carré, comme Yverdon.",
  "belief": "Chrétienté latine. Les comtes fondent couvents et chapelles.",
  "fact": "Le Pays de Vaud restera savoyard jusqu’à la conquête bernoise de 1536.",
  "see": [
   "Château de Chillon, Veytaux",
   "Château d’Yverdon-les-Bains"
  ],
  "fig": {
   "skin": "#e8c4a0",
   "hair": "short",
   "hairC": "#4a3222",
   "beard": "full",
   "garment": "#b8322e",
   "cloak": "#8a1f1c",
   "hat": "coronet",
   "hatC": "#e0b34a",
   "cross": true
  }
 },
 "4:evge": {
  "kind": "Seigneur d’Église",
  "who": "L’évêque-prince de Genève",
  "facts": [
   [
    "Pouvoir",
    "Souverain de la ville depuis le traité de Seyssel (1124)"
   ],
   [
    "Reconnu par",
    "L’empereur Frédéric Barberousse, en 1162"
   ],
   [
    "Grand chantier",
    "Cathédrale Saint-Pierre, vers 1160"
   ]
  ],
  "life": "L’évêque gouverne Genève, mais doit composer avec les comtes de Genève puis de Savoie, et avec des citoyens qui réclament des droits.",
  "belief": "Genève est un siège d’évêché depuis la fin du IVᵉ siècle.",
  "fact": "En 1285, les citoyens forment une première « Commune », ancêtre des institutions genevoises.",
  "see": [
   "Cathédrale Saint-Pierre, Genève"
  ],
  "fig": {
   "skin": "#efcfae",
   "hair": "short",
   "hairC": "#8a8a8a",
   "beard": "none",
   "garment": "#e8e0cf",
   "cloak": "#7a1f3a",
   "hat": "mitre",
   "hatC": "#e8e0cf",
   "cross": true
  }
 },
 "4:evbs": {
  "kind": "Seigneur d’Église",
  "who": "Le prince-évêque de Bâle",
  "facts": [
   [
    "Territoire",
    "Bâle et une grande partie de l’actuel Jura"
   ],
   [
    "Pouvoir",
    "Prince du Saint-Empire"
   ],
   [
    "Siège",
    "Bâle, puis Porrentruy après la Réforme"
   ]
  ],
  "life": "Le prince-évêque règne à la fois sur l’Église et sur des terres. Bâle grandit autour de sa cathédrale et de son pont sur le Rhin.",
  "belief": "Le diocèse est l’un des plus importants de la région.",
  "fact": "Après l’adoption de la Réforme à Bâle en 1529, l’évêque s’installe au château de Porrentruy, qui reste sa résidence jusqu’en 1792.",
  "see": [
   "Cathédrale de Bâle",
   "Château de Porrentruy (JU)"
  ],
  "fig": {
   "skin": "#e8c4a0",
   "hair": "short",
   "hairC": "#6a6a6a",
   "beard": "none",
   "garment": "#e8e0cf",
   "cloak": "#5a2a6a",
   "hat": "mitre",
   "hatC": "#e0b34a",
   "cross": true
  }
 },
 "4:evvs": {
  "kind": "Seigneur d’Église",
  "who": "L’évêque de Sion",
  "facts": [
   [
    "Pouvoir",
    "Comte du Valais depuis 999"
   ],
   [
    "Donné par",
    "Rodolphe III, roi de Bourgogne"
   ],
   [
    "Rival",
    "La Savoie, dans le Bas-Valais"
   ]
  ],
  "life": "L’évêque de Sion est aussi le seigneur temporel du Valais. Il défend son pouvoir contre les comtes de Savoie et les nobles locaux.",
  "belief": "Le Valais chrétien est l’un des plus anciens de Suisse, autour de Saint-Maurice et de Sion.",
  "fact": "La colline de Valère porte une église fortifiée, avec l’un des plus anciens orgues jouables du monde (vers 1435).",
  "see": [
   "Basilique de Valère, Sion"
  ],
  "fig": {
   "skin": "#e3bb94",
   "hair": "short",
   "hairC": "#5a5a5a",
   "beard": "none",
   "garment": "#e8e0cf",
   "cloak": "#2a4a6a",
   "hat": "mitre",
   "hatC": "#e8e0cf",
   "cross": true
  }
 },
 "4:evgr": {
  "kind": "Seigneur d’Église",
  "who": "L’évêque de Coire",
  "facts": [
   [
    "Évêché",
    "Parmi les plus anciens au nord des Alpes"
   ],
   [
    "Atout",
    "Contrôle des cols vers l’Italie"
   ],
   [
    "Langue locale",
    "Le romanche"
   ]
  ],
  "life": "L’évêque de Coire tient les routes des cols, essentielles entre l’Allemagne et l’Italie. Il partage la région avec de nombreux seigneurs.",
  "belief": "Une chrétienté ancienne, avec des monastères comme Disentis et Müstair.",
  "fact": "Pour se protéger des seigneurs, les communautés grisonnes formeront à partir de 1367 les Trois Ligues.",
  "see": [
   "Cathédrale de Coire",
   "Abbaye de Disentis"
  ],
  "fig": {
   "skin": "#e3bb94",
   "hair": "short",
   "hairC": "#4a4a4a",
   "beard": "full",
   "garment": "#e8e0cf",
   "cloak": "#3f5f3a",
   "hat": "mitre",
   "hatC": "#e0b34a",
   "cross": true
  }
 },
 "4:hab": {
  "kind": "Grande famille",
  "who": "Un chevalier des Habsbourg",
  "facts": [
   [
    "Origine",
    "Le château de Habsbourg, en Argovie, vers 1020"
   ],
   [
    "Héritage",
    "Les terres des Kybourg en 1264"
   ],
   [
    "Sommet",
    "Rodolphe Iᵉʳ devient roi en 1273"
   ]
  ],
  "life": "Cette famille d’Argovie bâtit sa puissance en Suisse avant de régner sur l’Autriche et l’Europe. Elle tient de nombreux châteaux, villes et péages.",
  "belief": "Ils fondent l’abbaye de Muri, nécropole familiale.",
  "fact": "La dynastie qui régnera sur l’Autriche jusqu’en 1918 est née d’un petit château argovien, toujours visible près de Brugg.",
  "see": [
   "Château de Habsbourg (AG)",
   "Abbaye de Muri (AG)"
  ],
  "fig": {
   "skin": "#e8c4a0",
   "hair": "short",
   "hairC": "#6b4428",
   "beard": "full",
   "garment": "#d9a43a",
   "cloak": "#8a1f1c",
   "hat": "coronet",
   "hatC": "#c9c9c9"
  }
 },
 "4:zah": {
  "kind": "Grande famille",
  "who": "Un duc de Zähringen",
  "facts": [
   [
    "Villes fondées",
    "Fribourg (1157), Berne (1191)"
   ],
   [
    "Fin",
    "La famille s’éteint en 1218"
   ],
   [
    "Héritiers",
    "Les Kybourg"
   ]
  ],
  "life": "Les ducs de Zähringen fondent des villes pour tenir le pays entre Alpes et Jura. Leurs plans de rues réguliers sont encore lisibles à Berne et à Fribourg.",
  "belief": "Chrétienté latine, fondation d’églises et de couvents.",
  "fact": "Selon la légende, Berne doit son nom au premier animal tué par Berthold V : un ours.",
  "see": [
   "Vieille ville de Berne (UNESCO)",
   "Vieille ville de Fribourg"
  ],
  "fig": {
   "skin": "#e3bb94",
   "hair": "short",
   "hairC": "#3a2a1e",
   "beard": "full",
   "garment": "#3f5f8a",
   "cloak": "#c9a04a",
   "hat": "coronet",
   "hatC": "#e0b34a"
  }
 },
 "4:so": {
  "kind": "Ville",
  "who": "Un bourgeois de Soleure",
  "facts": [
   [
    "Origine",
    "Salodurum, bourg romain"
   ],
   [
    "Statut",
    "Ville impériale"
   ],
   [
    "Saints patrons",
    "Ours et Victor"
   ]
  ],
  "life": "Soleure est l’une des plus anciennes villes de Suisse. Elle vit du commerce sur l’Aar et de son statut de ville libre.",
  "belief": "La ville vénère Ours et Victor, soldats chrétiens martyrisés selon la tradition.",
  "fact": "Le chiffre 11 est partout à Soleure : 11 églises, 11 fontaines… et elle est entrée en 11ᵉ dans la Confédération, en 1481.",
  "see": [
   "Cathédrale Saint-Ours, Soleure"
  ],
  "fig": {
   "skin": "#e8c4a0",
   "hair": "short",
   "hairC": "#4a3222",
   "beard": "none",
   "garment": "#6a3a5a",
   "cloak": "#3a4a6a",
   "hat": "hood",
   "hatC": "#8a2a2a"
  }
 },
 "4:sh": {
  "kind": "Ville",
  "who": "Un batelier de Schaffhouse",
  "facts": [
   [
    "Fondation",
    "Abbaye de Tous-les-Saints, 1049"
   ],
   [
    "Atout",
    "Le transbordement au-dessus des chutes du Rhin"
   ]
  ],
  "life": "Les bateaux ne peuvent pas franchir les chutes du Rhin. On décharge donc les marchandises à Schaffhouse, qui prospère grâce à ce passage obligé.",
  "belief": "L’abbaye de Tous-les-Saints, fondée par les comtes de Nellenburg, domine la ville.",
  "fact": "La forteresse du Munot, construite au XVIᵉ siècle, est devenue le symbole de la ville.",
  "see": [
   "Abbaye de Tous-les-Saints, Schaffhouse",
   "Chutes du Rhin"
  ],
  "fig": {
   "skin": "#d9a77f",
   "hair": "short",
   "hairC": "#3a2a1e",
   "beard": "full",
   "garment": "#4a5a6a",
   "cloak": "#6a5a3a"
  }
 },
 "4:ne": {
  "kind": "Seigneurie",
  "who": "Un comte de Neuchâtel",
  "facts": [
   [
    "Origine",
    "Le « nouveau château », mentionné en 1011"
   ],
   [
    "Monument",
    "La collégiale, XIIᵉ siècle"
   ],
   [
    "Ressource",
    "Vigne et commerce sur le lac"
   ]
  ],
  "life": "Les comtes gouvernent depuis leur château dominant le lac. Le bourg grandit à ses pieds.",
  "belief": "La collégiale, sur la colline du château, est le cœur religieux du comté.",
  "fact": "Neuchâtel passera plus tard au roi de Prusse (1707) avant de devenir canton suisse en 1815.",
  "see": [
   "Château et collégiale de Neuchâtel"
  ],
  "fig": {
   "skin": "#e8c4a0",
   "hair": "short",
   "hairC": "#6b4428",
   "beard": "mustache",
   "garment": "#d9a43a",
   "cloak": "#2a3a6a",
   "hat": "coronet",
   "hatC": "#e0b34a"
  }
 },
 "4:lib": {
  "kind": "Communautés paysannes",
  "who": "Un paysan de Schwytz vers 1250",
  "facts": [
   [
    "Liberté impériale",
    "Uri en 1231, Schwytz en 1240"
   ],
   [
    "Ressource",
    "Bétail exporté vers la Lombardie"
   ],
   [
    "Route",
    "Le Gothard, ouvert vers 1230"
   ]
  ],
  "life": "Ces communautés de paysans ne dépendent que de l’empereur. Elles élèvent du bétail et profitent du trafic du Gothard.",
  "belief": "Une foi catholique solide, qui restera fidèle à Rome lors de la Réforme.",
  "fact": "C’est pour défendre ces libertés qu’Uri, Schwytz et Unterwald concluront le pacte de 1291.",
  "see": [
   "Musée des chartes fédérales, Schwytz",
   "Prairie du Grütli"
  ],
  "fig": {
   "skin": "#d9a77f",
   "hair": "short",
   "hairC": "#4a3222",
   "beard": "full",
   "garment": "#7a5a3a",
   "cloak": "#4a5a3a",
   "hat": "hood",
   "hatC": "#5a4a3a"
  }
 },
 "4:sg": {
  "kind": "Seigneur d’Église",
  "who": "Un moine de l’abbaye de Saint-Gall",
  "facts": [
   [
    "Fondation",
    "Sur la tombe de l’ermite Gall (612)"
   ],
   [
    "Trésor",
    "Une bibliothèque de manuscrits célèbre"
   ],
   [
    "Puissance",
    "Grand propriétaire de terres"
   ]
  ],
  "life": "L’abbaye est un centre européen de savoir : on y copie et enlumine des manuscrits. Son abbé est aussi un seigneur puissant.",
  "belief": "Moines bénédictins, vie de prière et d’étude.",
  "fact": "Le plan de Saint-Gall, dessiné vers 820, est le plus ancien plan d’architecture conservé du Moyen Âge.",
  "see": [
   "Bibliothèque abbatiale de Saint-Gall (UNESCO)"
  ],
  "fig": {
   "skin": "#e3bb94",
   "hair": "tonsure",
   "hairC": "#4a3222",
   "beard": "none",
   "garment": "#2e2e2e",
   "cloak": "#1f1f1f",
   "cross": true
  }
 },
 "4:gl": {
  "kind": "Seigneur d’Église",
  "who": "Un paysan glaronais vers 1250",
  "facts": [
   [
    "Seigneur",
    "L’abbaye de Säckingen, sur le Rhin"
   ],
   [
    "Saint patron",
    "Fridolin"
   ]
  ],
  "life": "Le pays de Glaris appartient à une abbaye de femmes, installée loin de là, sur le Rhin.",
  "belief": "Saint Fridolin, missionnaire, est vénéré comme fondateur.",
  "fact": "Saint Fridolin figure toujours sur le drapeau du canton de Glaris.",
  "see": [
   "Freulerpalast, Näfels"
  ],
  "fig": {
   "skin": "#d9a77f",
   "hair": "short",
   "hairC": "#3a2a1e",
   "beard": "full",
   "garment": "#6a5a46",
   "cloak": "#3f4f3a",
   "hat": "hood",
   "hatC": "#4a3a2e"
  }
 },
 "4:mil": {
  "kind": "Domination italienne",
  "who": "Un marchand de Côme",
  "facts": [
   [
    "Seigneurs",
    "L’évêque de Côme, puis Milan"
   ],
   [
    "Commerce",
    "Routes du Gothard et du Lukmanier"
   ]
  ],
  "life": "Le Tessin regarde vers l’Italie. Ses villes vivent du commerce entre la Lombardie et le nord des Alpes.",
  "belief": "Églises romanes et fresques, comme à Giornico.",
  "fact": "Les châteaux de Bellinzona, qui verrouillent la vallée, deviendront l’un des grands enjeux des guerres avec Milan.",
  "see": [
   "Châteaux de Bellinzona (UNESCO)",
   "Église San Nicolao, Giornico"
  ],
  "fig": {
   "skin": "#d9a77f",
   "hair": "short",
   "hairC": "#2a1e16",
   "beard": "none",
   "garment": "#3f6a5a",
   "cloak": "#8a3b2e",
   "hat": "hood",
   "hatC": "#7a2a24"
  }
 }
}
```

### 8.6 Événements

`/data/types.json` :
```json
{
 "arch": [
  "Archéologie",
  "#d6b27a"
 ],
 "fond": [
  "Fondation",
  "#eef2f5"
 ],
 "bat": [
  "Bataille",
  "#ff6a4d"
 ],
 "pol": [
  "Politique et traités",
  "#f2c46d"
 ],
 "rel": [
  "Religion",
  "#b48cff"
 ],
 "cat": [
  "Catastrophe",
  "#ff9f43"
 ],
 "cult": [
  "Culture et science",
  "#5fd0e0"
 ]
}
```

`/data/events.json` — **178 événements**, triés par année. Champs : `id, year, lat, lon, code, type, lvl, title, text`.
```json
[
{"id": 0, "year": -13400, "lat": 46.17, "lon": 6.18, "code": "GE", "type": "arch", "lvl": 2, "title": "Chasseurs de rennes à Veyrier", "text": "À la fin de la dernière glaciation, des chasseurs magdaléniens s’abritent sous les blocs de rocher de Veyrier, au pied du Salève."},
{"id": 1, "year": -5000, "lat": 47.07, "lon": 7.2, "code": "BE", "type": "arch", "lvl": 1, "title": "Les villages sur pilotis", "text": "Dès 5000 av. J.-C., des paysans construisent des villages au bord des lacs. Les palafittes de Suisse et des pays voisins sont inscrits à l’UNESCO."},
{"id": 2, "year": -4000, "lat": 47.17, "lon": 8.5, "code": "ZG", "type": "arch", "lvl": 2, "title": "Les villages lacustres du lac de Zoug", "text": "Une cinquantaine de villages sur pilotis se succèdent sur ses rives au Néolithique."},
{"id": 3, "year": -500, "lat": 47.19, "lon": 8.52, "code": "ZG", "type": "arch", "lvl": 2, "title": "Le prince celte de la Baarburg", "text": "Sur cette colline, les fouilles ont révélé une résidence de l’âge du Fer avec des céramiques grecques et des vases étrusques."},
{"id": 4, "year": -450, "lat": 47.007, "lon": 7.016, "code": "NE", "type": "arch", "lvl": 1, "title": "La Tène", "text": "Sur la rive du lac de Neuchâtel, un site si riche en armes et objets celtes qu’il a donné son nom à toute une époque : le second âge du Fer, dit « de La Tène »."},
{"id": 5, "year": -58, "lat": 46.204, "lon": 6.15, "code": "GE", "type": "bat", "lvl": 1, "title": "César arrête les Helvètes", "text": "Les Helvètes veulent émigrer vers la Gaule. César fait détruire le pont du Rhône à Genève, puis les bat à Bibracte et les renvoie chez eux. C’est la première mention écrite de Genève."},
{"id": 6, "year": -44, "lat": 47.533, "lon": 7.721, "code": "BL", "type": "fond", "lvl": 1, "title": "Fondation d’Augusta Raurica", "text": "Colonie romaine fondée près de Bâle. Son théâtre et ses rues se visitent encore à Augst."},
{"id": 7, "year": -15, "lat": 46.85, "lon": 9.531, "code": "GR", "type": "bat", "lvl": 2, "title": "Rome conquiert les Alpes", "text": "Les armées d’Auguste soumettent les peuples alpins. La Rhétie devient une province romaine."},
{"id": 8, "year": 15, "lat": 47.481, "lon": 8.212, "code": "AG", "type": "fond", "lvl": 1, "title": "Le camp de Vindonissa", "text": "Un camp de légionnaires s’installe à Windisch. Jusqu’à 6000 soldats y vivent, au confluent de l’Aar, de la Reuss et de la Limmat."},
{"id": 9, "year": 72, "lat": 46.881, "lon": 7.043, "code": "VD", "type": "fond", "lvl": 1, "title": "Aventicum, capitale des Helvètes", "text": "Devenue colonie romaine sous Vespasien, Avenches compte peut-être 20 000 habitants. Son amphithéâtre est toujours debout."},
{"id": 10, "year": 260, "lat": 46.881, "lon": 7.06, "code": "VD", "type": "cat", "lvl": 2, "title": "Les raids alamans", "text": "Vers 260–275, les Alamans franchissent le limes. Plusieurs villes romaines sont ravagées et se replient derrière des murailles."},
{"id": 11, "year": 443, "lat": 46.2, "lon": 6.14, "code": "GE", "type": "pol", "lvl": 1, "title": "Genève, capitale des Burgondes", "text": "Les Burgondes s’installent dans la région du Léman et font de Genève leur capitale. Ils adoptent le latin, à l’origine du français de Suisse romande."},
{"id": 12, "year": 515, "lat": 46.218, "lon": 7.003, "code": "VS", "type": "rel", "lvl": 1, "title": "L’abbaye de Saint-Maurice", "text": "Fondée par le roi burgonde Sigismond, c’est le plus ancien monastère d’Occident en activité continue."},
{"id": 13, "year": 563, "lat": 46.39, "lon": 6.89, "code": "VS", "type": "cat", "lvl": 1, "title": "Le tsunami du Léman", "text": "Un éboulement du Tauredunum, près de l’embouchure du Rhône, soulève une vague qui traverse le lac et ravage Genève."},
{"id": 14, "year": 612, "lat": 47.424, "lon": 9.377, "code": "SG", "type": "rel", "lvl": 1, "title": "L’ermite Gall", "text": "Le moine irlandais Gall s’installe dans la vallée de la Steinach. L’abbaye fondée sur sa tombe deviendra un centre majeur du savoir européen."},
{"id": 15, "year": 750, "lat": 47.052, "lon": 8.31, "code": "LU", "type": "rel", "lvl": 2, "title": "Le monastère de Lucerne", "text": "L’abbaye alsacienne de Murbach fonde un monastère au bord de la Reuss. La ville grandit autour."},
{"id": 16, "year": 853, "lat": 47.37, "lon": 8.541, "code": "ZH", "type": "rel", "lvl": 2, "title": "Le Fraumünster", "text": "Le roi Louis le Germanique fonde une abbaye de femmes à Zurich et lui donne de vastes terres, dont la vallée d’Uri."},
{"id": 17, "year": 948, "lat": 47.127, "lon": 8.752, "code": "SZ", "type": "rel", "lvl": 1, "title": "L’abbaye d’Einsiedeln", "text": "L’abbaye est consacrée sur le lieu où l’ermite Meinrad a été assassiné. Sa Vierge noire attire des pèlerins depuis des siècles."},
{"id": 18, "year": 999, "lat": 47.281, "lon": 7.372, "code": "JU", "type": "pol", "lvl": 2, "title": "Le Jura donné à l’évêque de Bâle", "text": "Le roi de Bourgogne donne l’abbaye de Moutier-Grandval et ses terres à l’évêque de Bâle. C’est l’origine de la principauté."},
{"id": 19, "year": 1019, "lat": 47.556, "lon": 7.592, "code": "BS", "type": "rel", "lvl": 2, "title": "La cathédrale de Bâle", "text": "L’empereur Henri II fait bâtir une nouvelle cathédrale sur la colline. Elle sera reconstruite après le séisme de 1356."},
{"id": 20, "year": 1020, "lat": 47.466, "lon": 8.184, "code": "AG", "type": "fond", "lvl": 2, "title": "Le château de Habsbourg", "text": "Vers 1020, un comte fait bâtir ce château sur une colline argovienne. La famille qui en prend le nom régnera sur l’Autriche jusqu’en 1918."},
{"id": 21, "year": 1027, "lat": 47.274, "lon": 8.341, "code": "AG", "type": "rel", "lvl": 2, "title": "L’abbaye de Muri", "text": "Les Habsbourg fondent l’abbaye de Muri, longtemps leur lieu de mémoire familial."},
{"id": 22, "year": 1049, "lat": 47.695, "lon": 8.636, "code": "SH", "type": "rel", "lvl": 2, "title": "L’abbaye de Tous-les-Saints", "text": "Le comte Eberhard de Nellenburg fonde l’abbaye autour de laquelle grandit Schaffhouse."},
{"id": 23, "year": 1157, "lat": 46.806, "lon": 7.161, "code": "FR", "type": "fond", "lvl": 1, "title": "Fondation de Fribourg", "text": "Le duc Berthold IV de Zähringen fonde Fribourg sur une boucle de la Sarine."},
{"id": 24, "year": 1191, "lat": 46.948, "lon": 7.447, "code": "BE", "type": "fond", "lvl": 1, "title": "Fondation de Berne", "text": "Berthold V de Zähringen fonde Berne dans une boucle de l’Aar. La légende dit qu’elle doit son nom au premier animal chassé : un ours."},
{"id": 25, "year": 1191, "lat": 46.624, "lon": 8.034, "code": "BE", "type": "bat", "lvl": 2, "title": "Grindelwald", "text": "Les barons de l’Oberland se révoltent contre Berthold V de Zähringen et sont battus à Grindelwald, l’année même de la fondation de Berne."},
{"id": 26, "year": 1225, "lat": 47.56, "lon": 7.59, "code": "BS", "type": "cult", "lvl": 2, "title": "Le premier pont sur le Rhin", "text": "L’évêque fait construire un pont sur le Rhin. Le Petit-Bâle grandit sur l’autre rive."},
{"id": 27, "year": 1230, "lat": 46.65, "lon": 8.59, "code": "UR", "type": "cult", "lvl": 1, "title": "Le passage des Schöllenen", "text": "Vers 1230, un pont franchit les gorges des Schöllenen. La route du Gothard s’ouvre, et Uri gagne en importance."},
{"id": 28, "year": 1231, "lat": 46.881, "lon": 8.644, "code": "UR", "type": "pol", "lvl": 1, "title": "Uri, libre sous l’Empire", "text": "Le roi Henri VII accorde à Uri l’immédiateté impériale : la vallée ne dépend plus que de l’empereur."},
{"id": 29, "year": 1275, "lat": 46.523, "lon": 6.635, "code": "VD", "type": "rel", "lvl": 2, "title": "La cathédrale de Lausanne consacrée", "text": "Le pape Grégoire X consacre la cathédrale en présence de Rodolphe de Habsbourg."},
{"id": 30, "year": 1291, "lat": 46.97, "lon": 8.59, "code": "UR", "type": "pol", "lvl": 1, "title": "Le Pacte fédéral", "text": "Début août, Uri, Schwytz et Unterwald s’engagent à se soutenir mutuellement. Le parchemin est conservé à Schwytz. La légende du serment du Grütli s’y rattache plus tard."},
{"id": 31, "year": 1315, "lat": 47.1, "lon": 8.63, "code": "ZG", "type": "bat", "lvl": 1, "title": "Morgarten", "text": "Les Schwytzois battent une armée des Habsbourg en tendant une embuscade au bord du lac d’Égeri."},
{"id": 32, "year": 1315, "lat": 46.998, "lon": 8.605, "code": "SZ", "type": "pol", "lvl": 2, "title": "Le pacte de Brunnen", "text": "Le 9 décembre, après Morgarten, les trois cantons renouvellent leur alliance, rédigée en allemand. Elle devient une véritable confédération."},
{"id": 33, "year": 1332, "lat": 47.05, "lon": 8.309, "code": "LU", "type": "pol", "lvl": 1, "title": "Lucerne rejoint les Waldstätten", "text": "Première ville à entrer dans l’alliance."},
{"id": 34, "year": 1336, "lat": 47.372, "lon": 8.543, "code": "ZH", "type": "pol", "lvl": 2, "title": "La révolution de Rudolf Brun", "text": "Le chevalier Rudolf Brun renverse le conseil de Zurich et donne le pouvoir aux corporations d’artisans, qui le garderont jusqu’en 1798."},
{"id": 35, "year": 1339, "lat": 46.9, "lon": 7.24, "code": "BE", "type": "bat", "lvl": 2, "title": "Laupen", "text": "Berne, aidée des Waldstätten, bat une coalition de la noblesse régionale."},
{"id": 36, "year": 1349, "lat": 47.558, "lon": 7.588, "code": "BS", "type": "cat", "lvl": 1, "title": "La peste noire", "text": "L’épidémie frappe les villes. À Bâle, la communauté juive, accusée à tort, est massacrée en janvier 1349."},
{"id": 37, "year": 1351, "lat": 47.373, "lon": 8.54, "code": "ZH", "type": "pol", "lvl": 1, "title": "Zurich entre dans l’alliance", "text": "Zurich rejoint les Confédérés. Glaris et Zoug suivent en 1352."},
{"id": 38, "year": 1353, "lat": 46.948, "lon": 7.447, "code": "BE", "type": "pol", "lvl": 1, "title": "Berne entre dans l’alliance", "text": "On parle désormais des « huit cantons ». Cette alliance durera jusqu’en 1481."},
{"id": 39, "year": 1356, "lat": 47.558, "lon": 7.6, "code": "BS", "type": "cat", "lvl": 1, "title": "Le tremblement de terre de Bâle", "text": "Le 18 octobre 1356, le plus fort séisme connu d’Europe centrale détruit Bâle, puis un incendie ravage la ville."},
{"id": 40, "year": 1367, "lat": 46.852, "lon": 9.53, "code": "GR", "type": "pol", "lvl": 2, "title": "La Ligue de la Maison-Dieu", "text": "Les communautés autour de Coire s’unissent pour limiter le pouvoir de l’évêque."},
{"id": 41, "year": 1376, "lat": 47.557, "lon": 7.586, "code": "BS", "type": "pol", "lvl": 2, "title": "La « méchante Fasnacht »", "text": "Pendant le carnaval, une émeute éclate contre les chevaliers du duc d’Autriche. Plusieurs sont tués."},
{"id": 42, "year": 1384, "lat": 46.24, "lon": 7.32, "code": "VS", "type": "pol", "lvl": 2, "title": "La frontière de la Morge", "text": "La Morge, juste en aval de Sion, devient la limite entre le Bas-Valais savoyard et le Haut-Valais de l’évêque."},
{"id": 43, "year": 1386, "lat": 47.13, "lon": 8.19, "code": "LU", "type": "bat", "lvl": 1, "title": "Sempach", "text": "Les Confédérés battent le duc Léopold III d’Autriche, tué dans la bataille. La légende de Winkelried naît de ce combat."},
{"id": 44, "year": 1387, "lat": 47.04, "lon": 9.068, "code": "GL", "type": "pol", "lvl": 2, "title": "La première Landsgemeinde", "text": "Première mention de l’assemblée des citoyens de Glaris, qui se réunit toujours chaque année en plein air."},
{"id": 45, "year": 1388, "lat": 47.1, "lon": 9.06, "code": "GL", "type": "bat", "lvl": 2, "title": "Näfels", "text": "Les Glaronais repoussent les Habsbourg. On célèbre encore la « Näfelser Fahrt » chaque année."},
{"id": 46, "year": 1388, "lat": 46.294, "lon": 7.88, "code": "VS", "type": "bat", "lvl": 2, "title": "Viège", "text": "Les hommes des dizains du Haut-Valais mettent en déroute l’évêque, le comte de Savoie et leurs nobles."},
{"id": 47, "year": 1395, "lat": 46.743, "lon": 8.99, "code": "GR", "type": "pol", "lvl": 2, "title": "La Ligue grise", "text": "Les communautés du Rhin antérieur fondent la Ligue grise, qui donnera son nom aux Grisons."},
{"id": 48, "year": 1403, "lat": 47.41, "lon": 9.44, "code": "AR", "type": "bat", "lvl": 2, "title": "Vögelinsegg", "text": "Les Appenzellois, aidés des Confédérés, battent l’armée de l’abbé de Saint-Gall et des villes souabes près de Speicher."},
{"id": 49, "year": 1405, "lat": 46.948, "lon": 7.452, "code": "BE", "type": "cat", "lvl": 2, "title": "Le grand incendie de Berne", "text": "Le 14 mai, le feu détruit une grande partie de la ville, bâtie en bois. Berne est reconstruite en pierre, d’où son aspect actuel."},
{"id": 50, "year": 1405, "lat": 47.424, "lon": 9.38, "code": "SG", "type": "pol", "lvl": 2, "title": "Saint-Gall s’émancipe de son abbé", "text": "La ville se libère de l’autorité de l’abbé, qui perd au même moment le contrôle d’Appenzell."},
{"id": 51, "year": 1405, "lat": 47.358, "lon": 9.48, "code": "AI", "type": "bat", "lvl": 2, "title": "Le Stoss", "text": "Les Appenzellois battent les Habsbourg au col du Stoss, à la frontière d’Appenzell."},
{"id": 52, "year": 1410, "lat": 46.637, "lon": 8.594, "code": "UR", "type": "pol", "lvl": 2, "title": "Uri prend la vallée d’Urseren", "text": "La vallée d’Andermatt rejoint Uri, qui contrôle désormais toute la route du Gothard côté nord."},
{"id": 53, "year": 1415, "lat": 47.473, "lon": 8.307, "code": "AG", "type": "bat", "lvl": 1, "title": "Conquête de l’Argovie", "text": "Sur ordre de l’empereur, les Confédérés prennent l’Argovie aux Habsbourg. Elle devient leur premier territoire sujet."},
{"id": 54, "year": 1418, "lat": 47.697, "lon": 8.633, "code": "SH", "type": "pol", "lvl": 2, "title": "Schaffhouse rachète sa liberté", "text": "La ville paie les Habsbourg, ruinés et mis au ban de l’Empire, pour redevenir libre."},
{"id": 55, "year": 1422, "lat": 46.215, "lon": 9.04, "code": "TI", "type": "bat", "lvl": 2, "title": "Arbedo", "text": "Près de Bellinzona, l’armée du duc de Milan écrase les Confédérés, surtout Uri et Lucerne. Le Tessin reste milanais pour plusieurs décennies."},
{"id": 56, "year": 1428, "lat": 46.3, "lon": 7.6, "code": "VS", "type": "cat", "lvl": 2, "title": "Les procès de sorcellerie du Valais", "text": "Au moins 367 personnes sont exécutées : l’une des premières chasses aux sorcières d’Europe."},
{"id": 57, "year": 1431, "lat": 47.556, "lon": 7.594, "code": "BS", "type": "rel", "lvl": 1, "title": "Le concile de Bâle", "text": "Pendant dix-huit ans, Bâle est le centre de la chrétienté occidentale. Le concile y élit même un antipape, Félix V, en 1439."},
{"id": 58, "year": 1443, "lat": 47.36, "lon": 8.52, "code": "ZH", "type": "bat", "lvl": 2, "title": "Saint-Jacques sur la Sihl", "text": "Pendant l’ancienne guerre de Zurich, les Confédérés battent les Zurichois, alliés à l’Autriche, aux portes de la ville."},
{"id": 59, "year": 1444, "lat": 47.54, "lon": 7.61, "code": "BS", "type": "bat", "lvl": 2, "title": "Saint-Jacques sur la Birse", "text": "1500 Confédérés affrontent une armée française bien plus nombreuse. Presque tous meurent, mais leur résistance impressionne le dauphin."},
{"id": 60, "year": 1460, "lat": 47.558, "lon": 7.58, "code": "BS", "type": "cult", "lvl": 1, "title": "La première université suisse", "text": "Le pape Pie II, ancien participant du concile de Bâle, fonde l’université de Bâle."},
{"id": 61, "year": 1467, "lat": 46.825, "lon": 8.25, "code": "OW", "type": "rel", "lvl": 2, "title": "Nicolas de Flue, l’ermite du Ranft", "text": "Le paysan et magistrat Nicolas de Flue quitte sa famille pour vivre en ermite au Ranft. Il deviendra le saint patron de la Suisse."},
{"id": 62, "year": 1468, "lat": 47.32, "lon": 9.08, "code": "SG", "type": "pol", "lvl": 2, "title": "L’abbé achète le Toggenburg", "text": "L’abbaye de Saint-Gall agrandit ses terres en achetant le comté du Toggenburg."},
{"id": 63, "year": 1476, "lat": 46.93, "lon": 7.12, "code": "FR", "type": "bat", "lvl": 1, "title": "Grandson et Morat", "text": "Les Confédérés battent deux fois Charles le Téméraire, duc de Bourgogne : à Grandson en mars, à Morat en juin. Le butin de Bourgogne fascine l’Europe."},
{"id": 64, "year": 1478, "lat": 46.402, "lon": 8.873, "code": "TI", "type": "bat", "lvl": 2, "title": "Giornico", "text": "Quelques centaines de Confédérés battent une armée milanaise bien plus nombreuse, en partie en faisant rouler des pierres depuis les pentes. La Léventine reste à Uri."},
{"id": 65, "year": 1478, "lat": 46.95, "lon": 8.02, "code": "LU", "type": "pol", "lvl": 2, "title": "L’affaire Amstalden", "text": "L’aubergiste Peter Amstalden, de l’Entlebuch, complote contre la ville de Lucerne. Il est exécuté. L’affaire mène au compromis de Stans."},
{"id": 66, "year": 1481, "lat": 46.957, "lon": 8.366, "code": "NW", "type": "pol", "lvl": 1, "title": "Le compromis de Stans", "text": "Les cantons sont au bord de la guerre civile. Le conseil de l’ermite Nicolas de Flue permet un accord : Fribourg et Soleure entrent dans la Confédération."},
{"id": 67, "year": 1499, "lat": 46.62, "lon": 10.45, "code": "GR", "type": "bat", "lvl": 2, "title": "Calven", "text": "Dans le Val Müstair, les Ligues grisonnes battent les troupes des Habsbourg pendant la guerre de Souabe."},
{"id": 68, "year": 1499, "lat": 47.48, "lon": 7.62, "code": "SO", "type": "bat", "lvl": 1, "title": "Dornach et la guerre de Souabe", "text": "Victoire sur l’empereur Maximilien. Les Confédérés s’éloignent de fait du Saint-Empire."},
{"id": 69, "year": 1500, "lat": 46.193, "lon": 9.02, "code": "TI", "type": "pol", "lvl": 2, "title": "Les Confédérés prennent Bellinzona", "text": "Uri, Schwytz et Nidwald s’emparent de Bellinzona et renforcent ses trois châteaux."},
{"id": 70, "year": 1501, "lat": 47.558, "lon": 7.588, "code": "BS", "type": "pol", "lvl": 1, "title": "Bâle et Schaffhouse entrent", "text": "Bâle apporte une grande ville universitaire et un pont sur le Rhin. Appenzell suivra en 1513 : on compte alors 13 cantons."},
{"id": 71, "year": 1506, "lat": 47.041, "lon": 9.07, "code": "GL", "type": "rel", "lvl": 2, "title": "Zwingli, curé de Glaris", "text": "Avant de devenir le réformateur de Zurich, Zwingli est curé de Glaris pendant dix ans."},
{"id": 72, "year": 1512, "lat": 46.25, "lon": 9.9, "code": "GR", "type": "pol", "lvl": 2, "title": "Les Grisons prennent la Valteline", "text": "Les Trois Ligues conquièrent la Valteline, Bormio et Chiavenna, qu’elles gouverneront jusqu’en 1797."},
{"id": 73, "year": 1512, "lat": 46.006, "lon": 8.953, "code": "TI", "type": "pol", "lvl": 2, "title": "Lugano et Locarno deviennent suisses", "text": "Les Confédérés annexent Lugano, Locarno, le val Maggia et Mendrisio, gouvernés comme bailliages communs."},
{"id": 74, "year": 1515, "lat": 46.004, "lon": 8.951, "code": "TI", "type": "bat", "lvl": 1, "title": "Marignan", "text": "En Lombardie, au sud du Tessin, les Confédérés sont vaincus par François Iᵉʳ. C’est la fin de leur expansion. La paix perpétuelle avec la France suit en 1516."},
{"id": 75, "year": 1516, "lat": 47.558, "lon": 7.583, "code": "BS", "type": "cult", "lvl": 2, "title": "Érasme chez Froben", "text": "Chez l’imprimeur Froben, Érasme publie le Nouveau Testament en grec. Bâle devient une capitale européenne du livre."},
{"id": 76, "year": 1519, "lat": 47.37, "lon": 8.544, "code": "ZH", "type": "rel", "lvl": 1, "title": "Zwingli à Zurich", "text": "Ulrich Zwingli commence à prêcher au Grossmünster. La Réforme zurichoise est adoptée en 1525."},
{"id": 77, "year": 1524, "lat": 47.588, "lon": 8.88, "code": "TG", "type": "rel", "lvl": 2, "title": "L’assaut de la chartreuse d’Ittingen", "text": "Des paysans occupent la chartreuse, chassent les moines, détruisent les archives et pillent la cave à vin."},
{"id": 78, "year": 1525, "lat": 47.373, "lon": 8.545, "code": "ZH", "type": "rel", "lvl": 2, "title": "Les premiers anabaptistes", "text": "Le 21 janvier, des disciples radicaux de Zwingli se baptisent entre adultes. Persécutés, ils fondent le mouvement anabaptiste. Felix Manz est noyé dans la Limmat en 1527."},
{"id": 79, "year": 1526, "lat": 46.2, "lon": 6.15, "code": "GE", "type": "pol", "lvl": 2, "title": "Genève s’allie à Berne et Fribourg", "text": "La combourgeoisie, votée le 25 février, éloigne Genève de la Savoie."},
{"id": 80, "year": 1528, "lat": 46.947, "lon": 7.451, "code": "BE", "type": "rel", "lvl": 1, "title": "Berne adopte la Réforme", "text": "Après une grande dispute théologique, Berne passe à la Réforme. Son poids entraîne une grande partie de la Suisse occidentale."},
{"id": 81, "year": 1530, "lat": 47.208, "lon": 7.537, "code": "SO", "type": "pol", "lvl": 2, "title": "La ville des ambassadeurs", "text": "De 1530 à 1792, l’ambassadeur du roi de France auprès des Suisses réside à Soleure. La ville en garde ses palais baroques."},
{"id": 82, "year": 1530, "lat": 46.414, "lon": 6.927, "code": "VD", "type": "pol", "lvl": 2, "title": "Le prisonnier de Chillon", "text": "François Bonivard, opposant à la Savoie, est enchaîné à Chillon jusqu’à la conquête bernoise de 1536. Lord Byron en fera un poème célèbre en 1816."},
{"id": 83, "year": 1530, "lat": 46.991, "lon": 6.929, "code": "NE", "type": "rel", "lvl": 2, "title": "Farel apporte la Réforme", "text": "Le prédicateur Guillaume Farel convertit Neuchâtel à la Réforme."},
{"id": 84, "year": 1531, "lat": 47.23, "lon": 8.53, "code": "ZH", "type": "bat", "lvl": 1, "title": "Kappel", "text": "Les cantons catholiques battent Zurich. Zwingli est tué sur le champ de bataille. Chaque canton garde sa religion."},
{"id": 85, "year": 1536, "lat": 46.519, "lon": 6.633, "code": "VD", "type": "bat", "lvl": 1, "title": "Berne conquiert le Pays de Vaud", "text": "En quelques semaines, Berne prend le Pays de Vaud à la Savoie et y impose la Réforme."},
{"id": 86, "year": 1536, "lat": 46.201, "lon": 6.148, "code": "GE", "type": "rel", "lvl": 1, "title": "Genève adopte la Réforme", "text": "Le 21 mai, les citoyens votent la Réforme, avec l’école obligatoire. Guillaume Farel convainc Jean Calvin de rester la même année."},
{"id": 87, "year": 1536, "lat": 47.559, "lon": 7.585, "code": "BS", "type": "rel", "lvl": 2, "title": "L’Institution de Calvin", "text": "La première édition du grand livre de Calvin, l’Institution de la religion chrétienne, est imprimée à Bâle."},
{"id": 88, "year": 1553, "lat": 46.199, "lon": 6.156, "code": "GE", "type": "rel", "lvl": 2, "title": "Michel Servet sur le bûcher", "text": "Le médecin et théologien espagnol est brûlé pour hérésie à Champel, avec l’accord de Calvin."},
{"id": 89, "year": 1555, "lat": 46.583, "lon": 7.083, "code": "FR", "type": "pol", "lvl": 2, "title": "La fin du comté de Gruyère", "text": "Ruiné, le dernier comte de Gruyère voit ses terres partagées entre Fribourg et Berne."},
{"id": 90, "year": 1559, "lat": 46.198, "lon": 6.146, "code": "GE", "type": "cult", "lvl": 2, "title": "L’Académie de Genève", "text": "Calvin fonde l’Académie, ancêtre de l’Université. Elle forme des pasteurs venus de toute l’Europe."},
{"id": 91, "year": 1580, "lat": 46.807, "lon": 7.159, "code": "FR", "type": "rel", "lvl": 2, "title": "Pierre Canisius à Fribourg", "text": "Le jésuite Pierre Canisius s’installe à Fribourg et y fonde le collège Saint-Michel. Fribourg devient un bastion catholique."},
{"id": 92, "year": 1597, "lat": 47.331, "lon": 9.409, "code": "AI", "type": "rel", "lvl": 2, "title": "Appenzell se divise", "text": "Pour des raisons religieuses, Appenzell se sépare en Rhodes-Intérieures (catholique) et Rhodes-Extérieures (protestant)."},
{"id": 93, "year": 1599, "lat": 45.955, "lon": 8.97, "code": "TI", "type": "cult", "lvl": 2, "title": "Naissance de Borromini", "text": "Le grand architecte baroque Francesco Borromini naît à Bissone, au bord du lac de Lugano. Il bâtira à Rome."},
{"id": 94, "year": 1602, "lat": 46.196, "lon": 6.142, "code": "GE", "type": "bat", "lvl": 1, "title": "L’Escalade", "text": "Dans la nuit du 11 au 12 décembre (21–22 dans notre calendrier), les troupes de Savoie escaladent les remparts. Isaac Mercier abaisse la herse de la porte Neuve. Une centaine de morts, dont 17 Genevois."},
{"id": 95, "year": 1603, "lat": 46.143, "lon": 6.081, "code": "GE", "type": "pol", "lvl": 2, "title": "La paix de Saint-Julien", "text": "La Savoie reconnaît implicitement l’indépendance de Genève."},
{"id": 96, "year": 1620, "lat": 46.22, "lon": 10.17, "code": "GR", "type": "cat", "lvl": 2, "title": "Le massacre de la Valteline", "text": "En juillet, des rebelles catholiques massacrent des centaines de protestants dans la Valteline, sujette des Grisons."},
{"id": 97, "year": 1639, "lat": 46.849, "lon": 9.533, "code": "GR", "type": "pol", "lvl": 2, "title": "L’assassinat de Jürg Jenatsch", "text": "Le chef grison Jürg Jenatsch est tué en plein carnaval à Coire, par un homme déguisé en ours."},
{"id": 98, "year": 1648, "lat": 47.56, "lon": 7.592, "code": "BS", "type": "pol", "lvl": 1, "title": "Les traités de Westphalie", "text": "Le maire de Bâle Johann Rudolf Wettstein obtient que la Confédération soit reconnue comme indépendante du Saint-Empire."},
{"id": 99, "year": 1653, "lat": 46.99, "lon": 8.06, "code": "LU", "type": "bat", "lvl": 1, "title": "La guerre des Paysans", "text": "Dans l’Entlebuch et l’Emmental, les paysans se révoltent contre les villes. Leur chef Niklaus Leuenberger est exécuté."},
{"id": 100, "year": 1656, "lat": 47.35, "lon": 8.24, "code": "AG", "type": "bat", "lvl": 2, "title": "Première bataille de Villmergen", "text": "Les catholiques battent Berne et Zurich."},
{"id": 101, "year": 1693, "lat": 46.66, "lon": 7.55, "code": "BE", "type": "rel", "lvl": 2, "title": "Naissance des Amish", "text": "Jakob Ammann, anabaptiste du Simmental bernois, provoque un schisme. Ses fidèles émigreront en Amérique : ce sont les Amish."},
{"id": 102, "year": 1707, "lat": 47.558, "lon": 7.59, "code": "BS", "type": "cult", "lvl": 2, "title": "Naissance de Leonhard Euler", "text": "L’un des plus grands mathématiciens de l’histoire naît à Bâle, ville de la famille Bernoulli."},
{"id": 103, "year": 1707, "lat": 46.989, "lon": 6.933, "code": "NE", "type": "pol", "lvl": 1, "title": "Neuchâtel choisit le roi de Prusse", "text": "Les Neuchâtelois préfèrent un prince protestant lointain aux prétendants français : le roi de Prusse devient leur souverain."},
{"id": 104, "year": 1712, "lat": 47.36, "lon": 8.25, "code": "AG", "type": "bat", "lvl": 2, "title": "Seconde bataille de Villmergen", "text": "Cette fois, les protestants l’emportent. L’équilibre entre cantons bascule en faveur de Zurich et Berne."},
{"id": 105, "year": 1712, "lat": 46.204, "lon": 6.146, "code": "GE", "type": "cult", "lvl": 2, "title": "Naissance de Rousseau", "text": "Jean-Jacques Rousseau naît le 28 juin dans la Grand-Rue. Il signera « citoyen de Genève »."},
{"id": 106, "year": 1723, "lat": 46.519, "lon": 6.6, "code": "VD", "type": "pol", "lvl": 2, "title": "Le major Davel", "text": "Le major Davel tente de libérer le Pays de Vaud de Berne. Il est décapité à Vidy, et devient un héros vaudois."},
{"id": 107, "year": 1755, "lat": 46.45, "lon": 8.75, "code": "TI", "type": "pol", "lvl": 2, "title": "La révolte de la Léventine", "text": "Les habitants de la Léventine se révoltent contre Uri. La révolte est écrasée et ses chefs exécutés."},
{"id": 108, "year": 1774, "lat": 47.52, "lon": 8.33, "code": "AG", "type": "rel", "lvl": 2, "title": "Endingen et Lengnau", "text": "Les Juifs de Suisse ne peuvent plus vivre que dans ces deux villages argoviens. Leurs synagogues et leur cimetière commun en témoignent."},
{"id": 109, "year": 1792, "lat": 47.416, "lon": 7.077, "code": "JU", "type": "pol", "lvl": 2, "title": "La République rauracienne", "text": "Après la fuite du prince-évêque, une république est proclamée à Porrentruy, avant l’annexion à la France en 1793."},
{"id": 110, "year": 1794, "lat": 47.1, "lon": 6.828, "code": "NE", "type": "cat", "lvl": 2, "title": "L’incendie de La Chaux-de-Fonds", "text": "Le village brûle. Il est reconstruit en damier, avec des façades orientées pour donner la lumière aux horlogers."},
{"id": 111, "year": 1797, "lat": 46.461, "lon": 6.843, "code": "VD", "type": "cult", "lvl": 2, "title": "La Fête des Vignerons", "text": "Vevey organise la première Fête des Vignerons moderne. Elle revient environ tous les vingt-cinq ans ; la dernière a eu lieu en 2019."},
{"id": 112, "year": 1798, "lat": 46.908, "lon": 7.312, "code": "BE", "type": "bat", "lvl": 2, "title": "Neuenegg", "text": "Le même jour que la défaite du Grauholz, les Bernois battent les Français à Neuenegg. Trop tard : Berne capitule."},
{"id": 113, "year": 1798, "lat": 46.958, "lon": 8.366, "code": "NW", "type": "bat", "lvl": 2, "title": "Le soulèvement de Nidwald", "text": "En septembre, Nidwald refuse la constitution helvétique. Les troupes françaises écrasent la révolte ; plusieurs centaines d’habitants sont tués."},
{"id": 114, "year": 1798, "lat": 47, "lon": 7.5, "code": "BE", "type": "bat", "lvl": 1, "title": "L’invasion française", "text": "Le 5 mars, les Bernois sont battus au Grauholz. L’Ancien Régime s’effondre. La République helvétique, une et indivisible, est proclamée à Aarau le 12 avril."},
{"id": 115, "year": 1798, "lat": 46.204, "lon": 6.143, "code": "GE", "type": "pol", "lvl": 2, "title": "Genève devient française", "text": "La France annexe Genève, qui devient chef-lieu du département du Léman."},
{"id": 116, "year": 1798, "lat": 47.423, "lon": 9.375, "code": "SG", "type": "rel", "lvl": 2, "title": "Fin de la principauté abbatiale", "text": "Le 17 septembre, l’abbaye est sécularisée. Le prince-abbé Pankraz Vorster s’enfuit à Vienne."},
{"id": 117, "year": 1798, "lat": 47.051, "lon": 8.307, "code": "LU", "type": "pol", "lvl": 2, "title": "Lucerne, capitale helvétique", "text": "Le gouvernement de la République helvétique siège un temps à Lucerne, avant de partir pour Berne."},
{"id": 118, "year": 1798, "lat": 47.1, "lon": 8.68, "code": "SZ", "type": "bat", "lvl": 2, "title": "Rothenthurm", "text": "Les Schwytzois d’Alois von Reding résistent aux troupes françaises, avant de devoir capituler."},
{"id": 119, "year": 1798, "lat": 46.002, "lon": 8.949, "code": "TI", "type": "pol", "lvl": 2, "title": "« Liberi e Svizzeri »", "text": "En février, les volontaires de Lugano repoussent une tentative d’annexion par la République cisalpine. Ils veulent rester suisses."},
{"id": 120, "year": 1798, "lat": 46.522, "lon": 6.63, "code": "VD", "type": "pol", "lvl": 1, "title": "L’indépendance vaudoise", "text": "Le 24 janvier, les Vaudois chassent le bailli bernois et proclament la République lémanique. C’est encore le jour de fête du canton."},
{"id": 121, "year": 1799, "lat": 47.39, "lon": 8.56, "code": "ZH", "type": "bat", "lvl": 1, "title": "Les batailles de Zurich", "text": "En juin puis en septembre, Français, Autrichiens et Russes s’affrontent autour de Zurich. Le général Masséna l’emporte en septembre."},
{"id": 122, "year": 1799, "lat": 46.65, "lon": 8.59, "code": "UR", "type": "bat", "lvl": 1, "title": "Souvorov dans les Alpes", "text": "Les armées russes du général Souvorov traversent le Gothard et se battent au pont du Diable. La Suisse est devenue un champ de bataille européen."},
{"id": 123, "year": 1802, "lat": 46.6, "lon": 6.6, "code": "VD", "type": "pol", "lvl": 2, "title": "Les Bourla-Papey", "text": "Des paysans vaudois brûlent les archives des droits féodaux. Leur nom veut dire « brûle-papiers »."},
{"id": 124, "year": 1803, "lat": 46.948, "lon": 7.447, "code": "BE", "type": "pol", "lvl": 1, "title": "L’Acte de médiation", "text": "Napoléon rend aux Suisses une confédération de 19 cantons. Saint-Gall, Grisons, Argovie, Thurgovie, Tessin et Vaud deviennent des cantons."},
{"id": 125, "year": 1803, "lat": 47.51, "lon": 8.01, "code": "AG", "type": "pol", "lvl": 2, "title": "Le Fricktal devient suisse", "text": "Autrichien jusqu’en 1801, le Fricktal est rattaché au nouveau canton d’Argovie."},
{"id": 126, "year": 1806, "lat": 47.557, "lon": 8.898, "code": "TG", "type": "cult", "lvl": 2, "title": "La vaccination obligatoire", "text": "La Thurgovie est le premier État au monde à rendre obligatoire la vaccination contre la variole."},
{"id": 127, "year": 1815, "lat": 46.204, "lon": 6.143, "code": "GE", "type": "pol", "lvl": 1, "title": "Valais, Neuchâtel et Genève entrent", "text": "Après la chute de Napoléon, le congrès de Vienne reconnaît la neutralité suisse. La Suisse compte 22 cantons."},
{"id": 128, "year": 1815, "lat": 46.82, "lon": 8.407, "code": "OW", "type": "rel", "lvl": 2, "title": "Engelberg rejoint Obwald", "text": "L’abbaye d’Engelberg et sa vallée sont rattachées au canton d’Obwald."},
{"id": 129, "year": 1816, "lat": 46.18, "lon": 6.07, "code": "GE", "type": "pol", "lvl": 2, "title": "Le traité de Turin", "text": "Des communes savoyardes rejoignent Genève, qui obtient un territoire d’un seul tenant."},
{"id": 130, "year": 1817, "lat": 47.672, "lon": 9.088, "code": "TG", "type": "pol", "lvl": 2, "title": "Le futur Napoléon III à Arenenberg", "text": "La reine Hortense achète le château d’Arenenberg, au bord du lac de Constance. Son fils Louis-Napoléon y passe sa jeunesse."},
{"id": 131, "year": 1830, "lat": 47.209, "lon": 7.54, "code": "SO", "type": "pol", "lvl": 2, "title": "La révolution libérale soleuroise", "text": "Les Soleurois renversent le régime aristocratique. Le canton devient libéral et démocratique."},
{"id": 132, "year": 1833, "lat": 47.484, "lon": 7.734, "code": "BL", "type": "pol", "lvl": 1, "title": "Bâle se divise", "text": "Après des combats entre la ville et la campagne, Bâle se sépare en deux demi-cantons."},
{"id": 133, "year": 1834, "lat": 46.806, "lon": 7.166, "code": "FR", "type": "cult", "lvl": 2, "title": "Le Grand Pont suspendu", "text": "Fribourg inaugure le plus long pont suspendu du monde, 273 mètres au-dessus de la Sarine."},
{"id": 134, "year": 1845, "lat": 47.042, "lon": 9.066, "code": "GL", "type": "pol", "lvl": 2, "title": "New Glarus", "text": "Poussés par la misère, des Glaronais émigrent au Wisconsin et fondent New Glarus, aux États-Unis."},
{"id": 135, "year": 1847, "lat": 47.12, "lon": 8.4, "code": "LU", "type": "bat", "lvl": 1, "title": "La guerre du Sonderbund", "text": "Le général Dufour bat en moins d’un mois les cantons catholiques alliés. Moins de 100 morts : la dernière guerre en Suisse."},
{"id": 136, "year": 1847, "lat": 47.473, "lon": 8.3, "code": "AG", "type": "cult", "lvl": 2, "title": "Le premier train suisse", "text": "Le 9 août, la ligne Zurich–Baden ouvre. On la surnomme « Spanisch-Brötli-Bahn », d’après les petits pains de Baden qu’elle permettait de livrer frais à Zurich."},
{"id": 137, "year": 1848, "lat": 46.946, "lon": 7.444, "code": "BE", "type": "pol", "lvl": 1, "title": "La Constitution fédérale", "text": "La Suisse devient un État fédéral. Berne est choisie comme ville fédérale."},
{"id": 138, "year": 1848, "lat": 46.992, "lon": 6.93, "code": "NE", "type": "pol", "lvl": 2, "title": "La révolution neuchâteloise", "text": "Le 1ᵉʳ mars, les républicains descendent des Montagnes et proclament la République, sans effusion de sang."},
{"id": 139, "year": 1855, "lat": 47.376, "lon": 8.548, "code": "ZH", "type": "cult", "lvl": 2, "title": "L’École polytechnique fédérale", "text": "La Confédération fonde à Zurich son école polytechnique, l’actuelle ETH. Einstein y étudiera."},
{"id": 140, "year": 1856, "lat": 47.37, "lon": 8.539, "code": "ZH", "type": "pol", "lvl": 2, "title": "Alfred Escher et le Crédit Suisse", "text": "L’entrepreneur Alfred Escher fonde une grande banque pour financer les chemins de fer. Il lancera ensuite le tunnel du Gothard."},
{"id": 141, "year": 1856, "lat": 46.99, "lon": 6.935, "code": "NE", "type": "pol", "lvl": 2, "title": "L’affaire de Neuchâtel", "text": "Des royalistes tentent un coup de force. La Prusse menace la Suisse de guerre, puis renonce à Neuchâtel en 1857."},
{"id": 142, "year": 1861, "lat": 47.039, "lon": 9.071, "code": "GL", "type": "cat", "lvl": 2, "title": "Le grand incendie de Glaris", "text": "Le 10 mai, poussé par le foehn, le feu détruit les deux tiers du chef-lieu."},
{"id": 143, "year": 1863, "lat": 46.2, "lon": 6.15, "code": "GE", "type": "cult", "lvl": 1, "title": "Naissance de la Croix-Rouge", "text": "Henry Dunant et quatre Genevois fondent le Comité international. La première Convention de Genève est signée en 1864."},
{"id": 144, "year": 1864, "lat": 46.497, "lon": 9.838, "code": "GR", "type": "cult", "lvl": 2, "title": "L’invention du tourisme d’hiver", "text": "À Saint-Moritz, l’hôtelier Johannes Badrutt convainc des clients anglais de passer l’hiver chez lui."},
{"id": 145, "year": 1865, "lat": 45.976, "lon": 7.659, "code": "VS", "type": "cult", "lvl": 1, "title": "La première ascension du Cervin", "text": "Le 14 juillet, Edward Whymper et ses compagnons atteignent le sommet. Quatre d’entre eux meurent à la descente."},
{"id": 146, "year": 1878, "lat": 47.101, "lon": 6.825, "code": "NE", "type": "cult", "lvl": 2, "title": "Naissance de Louis Chevrolet", "text": "Le futur fondateur de la marque automobile américaine naît à La Chaux-de-Fonds."},
{"id": 147, "year": 1882, "lat": 46.66, "lon": 8.59, "code": "UR", "type": "cult", "lvl": 1, "title": "Le tunnel du Gothard", "text": "Le tunnel ferroviaire de 15 km est ouvert. Des centaines d’ouvriers, surtout italiens, sont morts pendant sa construction."},
{"id": 148, "year": 1889, "lat": 46.806, "lon": 7.155, "code": "FR", "type": "cult", "lvl": 2, "title": "L’Université de Fribourg", "text": "Fondation d’une université catholique, aujourd’hui la seule université bilingue de Suisse."},
{"id": 149, "year": 1897, "lat": 47.558, "lon": 7.596, "code": "BS", "type": "pol", "lvl": 1, "title": "Le premier congrès sioniste", "text": "Du 29 au 31 août, Theodor Herzl réunit à Bâle le premier congrès sioniste mondial. La ville en accueillera dix."},
{"id": 150, "year": 1897, "lat": 47.256, "lon": 7.003, "code": "JU", "type": "cult", "lvl": 2, "title": "Le Marché-Concours de Saignelégier", "text": "Première édition de la grande fête du cheval des Franches-Montagnes, qui a lieu chaque mois d’août."},
{"id": 151, "year": 1915, "lat": 47.166, "lon": 8.516, "code": "ZG", "type": "cult", "lvl": 2, "title": "La tourte au kirsch de Zoug", "text": "Le confiseur Heinrich Höhn invente la Zuger Kirschtorte, imbibée d’eau-de-vie de cerise."},
{"id": 152, "year": 1916, "lat": 47.371, "lon": 8.544, "code": "ZH", "type": "cult", "lvl": 2, "title": "Dada au Cabaret Voltaire", "text": "Des artistes réfugiés de la guerre inventent à Zurich un art absurde et provocateur : le dadaïsme."},
{"id": 153, "year": 1918, "lat": 47.373, "lon": 8.54, "code": "ZH", "type": "pol", "lvl": 1, "title": "La grève générale", "text": "Du 12 au 14 novembre, environ 250 000 grévistes paralysent le pays. L’armée intervient. Plusieurs revendications seront adoptées plus tard, comme l’AVS."},
{"id": 154, "year": 1920, "lat": 46.226, "lon": 6.14, "code": "GE", "type": "pol", "lvl": 1, "title": "La Société des Nations", "text": "La SDN s’installe à Genève, qui devient une capitale internationale."},
{"id": 155, "year": 1925, "lat": 46.168, "lon": 8.795, "code": "TI", "type": "pol", "lvl": 2, "title": "Les accords de Locarno", "text": "L’Allemagne, la France, la Belgique, le Royaume-Uni et l’Italie s’y engagent à respecter les frontières de l’Ouest."},
{"id": 156, "year": 1928, "lat": 46.873, "lon": 8.65, "code": "UR", "type": "pol", "lvl": 2, "title": "La dernière Landsgemeinde d’Uri", "text": "Le 6 mai, les Uranais tiennent leur dernière assemblée en plein air, à Bötzlingen."},
{"id": 157, "year": 1932, "lat": 46.194, "lon": 6.14, "code": "GE", "type": "pol", "lvl": 2, "title": "La fusillade du 9 novembre", "text": "À Plainpalais, l’armée tire sur une manifestation antifasciste. Treize morts."},
{"id": 158, "year": 1938, "lat": 47.57, "lon": 7.58, "code": "BS", "type": "cult", "lvl": 2, "title": "Le LSD", "text": "Le chimiste Albert Hofmann synthétise le LSD dans les laboratoires Sandoz. Il en découvrira les effets en 1943."},
{"id": 159, "year": 1938, "lat": 46.85, "lon": 9.535, "code": "GR", "type": "pol", "lvl": 1, "title": "Le romanche, langue nationale", "text": "Le 20 février, le peuple reconnaît le romanche comme quatrième langue nationale, face aux revendications de l’Italie fasciste."},
{"id": 160, "year": 1939, "lat": 47.355, "lon": 8.545, "code": "ZH", "type": "cult", "lvl": 2, "title": "La Landi", "text": "L’Exposition nationale de Zurich exalte l’esprit de défense du pays, à quelques mois de la guerre."},
{"id": 161, "year": 1940, "lat": 46.97, "lon": 8.59, "code": "UR", "type": "pol", "lvl": 1, "title": "Le rapport du Grütli", "text": "Le 25 juillet, le général Guisan réunit ses officiers sur la prairie du Grütli et annonce la défense du réduit alpin."},
{"id": 162, "year": 1944, "lat": 47.696, "lon": 8.638, "code": "SH", "type": "cat", "lvl": 1, "title": "Le bombardement de Schaffhouse", "text": "Le 1ᵉʳ avril, des bombardiers américains lâchent leurs bombes par erreur sur la ville. Une quarantaine de personnes sont tuées."},
{"id": 163, "year": 1947, "lat": 47.366, "lon": 7.345, "code": "JU", "type": "pol", "lvl": 2, "title": "L’affaire Moeckli", "text": "Le gouvernement bernois refuse un département au francophone Georges Moeckli. L’indignation relance le combat pour un canton du Jura."},
{"id": 164, "year": 1954, "lat": 46.234, "lon": 6.055, "code": "GE", "type": "cult", "lvl": 1, "title": "Le CERN", "text": "Fondation du laboratoire européen de physique des particules à Meyrin. Le Web y sera inventé en 1989."},
{"id": 165, "year": 1971, "lat": 46.946, "lon": 7.444, "code": "BE", "type": "pol", "lvl": 1, "title": "Le vote des femmes", "text": "Le 7 février, les hommes acceptent le droit de vote fédéral des femmes. Appenzell Rhodes-Intérieures ne l’accordera au niveau cantonal qu’en 1990, forcé par le Tribunal fédéral."},
{"id": 166, "year": 1974, "lat": 47.364, "lon": 7.341, "code": "JU", "type": "pol", "lvl": 2, "title": "Le plébiscite jurassien", "text": "Le 23 juin, les districts du nord du Jura votent pour la création d’un nouveau canton."},
{"id": 167, "year": 1979, "lat": 47.365, "lon": 7.343, "code": "JU", "type": "pol", "lvl": 1, "title": "Le canton du Jura", "text": "Après des décennies de lutte, le Jura se sépare de Berne et devient le 23ᵉ canton."},
{"id": 168, "year": 1986, "lat": 47.533, "lon": 7.68, "code": "BL", "type": "cat", "lvl": 1, "title": "Schweizerhalle", "text": "Le 1ᵉʳ novembre, un entrepôt chimique brûle près de Bâle. L’eau d’extinction polluée colore le Rhin en rouge et tue des tonnes de poissons."},
{"id": 169, "year": 1989, "lat": 46.234, "lon": 6.055, "code": "GE", "type": "cult", "lvl": 2, "title": "Le Web au CERN", "text": "Tim Berners-Lee propose le World Wide Web pour partager les documents des physiciens."},
{"id": 170, "year": 1990, "lat": 47.331, "lon": 9.412, "code": "AI", "type": "pol", "lvl": 2, "title": "Le vote des Appenzelloises", "text": "Le 27 novembre, le Tribunal fédéral oblige Appenzell Rhodes-Intérieures à accorder le droit de vote cantonal aux femmes."},
{"id": 171, "year": 1992, "lat": 46.946, "lon": 7.444, "code": "BE", "type": "pol", "lvl": 1, "title": "Non à l’EEE", "text": "Le 6 décembre, le peuple refuse l’Espace économique européen. La Suisse choisira la voie des accords bilatéraux."},
{"id": 172, "year": 1994, "lat": 47.42, "lon": 7.5, "code": "BL", "type": "pol", "lvl": 2, "title": "Le Laufonnais rejoint Bâle-Campagne", "text": "Après un vote en 1980, le district de Laufon quitte Berne et rejoint Bâle-Campagne le 1ᵉʳ janvier 1994."},
{"id": 173, "year": 1997, "lat": 46.958, "lon": 8.368, "code": "NW", "type": "pol", "lvl": 2, "title": "Fin de la Landsgemeinde de Nidwald", "text": "Les citoyens de Nidwald votent l’abolition de leur assemblée en plein air. Obwald suit en 1998."},
{"id": 174, "year": 2007, "lat": 47.04, "lon": 9.065, "code": "GL", "type": "pol", "lvl": 2, "title": "Le vote à 16 ans", "text": "La Landsgemeinde fait de Glaris le premier canton suisse à accorder le droit de vote dès 16 ans."},
{"id": 175, "year": 2007, "lat": 46.49, "lon": 6.74, "code": "VD", "type": "cult", "lvl": 2, "title": "Lavaux à l’UNESCO", "text": "Les vignobles en terrasses de Lavaux sont inscrits au patrimoine mondial."},
{"id": 176, "year": 2016, "lat": 46.82, "lon": 8.65, "code": "UR", "type": "cult", "lvl": 1, "title": "Le tunnel de base du Gothard", "text": "57 km : le plus long tunnel ferroviaire du monde, entre Erstfeld et Bodio."},
{"id": 177, "year": 2026, "lat": 47.281, "lon": 7.372, "code": "JU", "type": "pol", "lvl": 1, "title": "Moutier rejoint le Jura", "text": "Après deux votes, la ville de Moutier quitte Berne et devient jurassienne le 1ᵉʳ janvier 2026."}
]
```

### 8.7 Guerres et batailles

`/data/wars.json` — clé = `title` de l'événement de type `bat` ; valeur = `[guerre, camp A, camp B, vainqueur]`. Les batailles d'une même guerre sont liées entre elles dans la fiche.
```json
{
 "César arrête les Helvètes": ["Guerre des Gaules", "Helvètes", "Rome (Jules César)", "Rome"],
 "Rome conquiert les Alpes": ["Conquête des Alpes", "Rome (Drusus et Tibère)", "Rhètes et peuples alpins", "Rome"],
 "Morgarten": ["Guerres contre les Habsbourg", "Schwytz et Uri", "Habsbourg (duc Léopold Iᵉʳ)", "Confédérés"],
 "Laupen": ["Guerre de Laupen", "Berne et Waldstätten", "Noblesse régionale et Fribourg", "Berne"],
 "Sempach": ["Guerres contre les Habsbourg", "Confédérés", "Léopold III d’Autriche", "Confédérés"],
 "Näfels": ["Guerres contre les Habsbourg", "Glaris, aidé de Schwytz", "Habsbourg", "Glaris"],
 "Conquête de l’Argovie": ["Conquête de l’Argovie", "Confédérés", "Habsbourg", "Confédérés"],
 "Arbedo": ["Guerres transalpines", "Uri, Lucerne et alliés", "Duché de Milan", "Milan"],
 "Saint-Jacques sur la Birse": ["Ancienne guerre de Zurich (1436–1450)", "Confédérés", "Armée française du dauphin", "France, qui renonce pourtant à avancer"],
 "Grandson et Morat": ["Guerres de Bourgogne (1474–1477)", "Confédérés et alliés", "Charles le Téméraire", "Confédérés"],
 "Giornico": ["Guerres transalpines", "Uri et Confédérés", "Duché de Milan", "Confédérés"],
 "Calven": ["Guerre de Souabe (1499)", "Ligues grisonnes", "Habsbourg", "Grisons"],
 "Dornach et la guerre de Souabe": ["Guerre de Souabe (1499)", "Confédérés", "Maximilien Iᵉʳ et la Ligue de Souabe", "Confédérés"],
 "Marignan": ["Guerres d’Italie", "Confédérés", "France de François Iᵉʳ et Venise", "France"],
 "Kappel": ["Guerres de Kappel (1529–1531)", "Zurich protestante", "Cantons catholiques", "Cantons catholiques"],
 "Berne conquiert le Pays de Vaud": ["Conquête du Pays de Vaud", "Berne", "Savoie", "Berne"],
 "L’Escalade": ["Guerres contre la Savoie", "Genève", "Savoie (Charles-Emmanuel Iᵉʳ)", "Genève"],
 "La guerre des Paysans": ["Guerre des Paysans (1653)", "Paysans de Lucerne, Berne, Soleure et Bâle", "Villes souveraines", "Villes souveraines"],
 "Première bataille de Villmergen": ["Guerres de Villmergen", "Cantons catholiques", "Berne et Zurich", "Cantons catholiques"],
 "Seconde bataille de Villmergen": ["Guerres de Villmergen", "Berne et Zurich", "Cantons catholiques", "Berne et Zurich"],
 "L’invasion française": ["Invasion française (1798)", "Berne", "France", "France"],
 "Neuenegg": ["Invasion française (1798)", "Berne", "France", "Berne, sans effet sur la guerre"],
 "Le soulèvement de Nidwald": ["Invasion française (1798)", "Nidwald", "France", "France"],
 "Souvorov dans les Alpes": ["Guerre de la deuxième coalition", "Russie et Autriche", "France", "Aucun : Souvorov se retire"],
 "Les batailles de Zurich": ["Guerre de la deuxième coalition", "France (Masséna)", "Autriche et Russie", "France, en septembre"],
 "La guerre du Sonderbund": ["Guerre du Sonderbund (1847)", "Armée fédérale (général Dufour)", "Sonderbund, cantons catholiques", "Armée fédérale"],
 "Saint-Jacques sur la Sihl": ["Ancienne guerre de Zurich (1436–1450)", "Confédérés", "Zurich et l’Autriche", "Confédérés"],
 "Grindelwald": ["Révolte des barons de l’Oberland", "Berthold V de Zähringen", "Barons de l’Oberland", "Zähringen"],
 "Vögelinsegg": ["Guerres d’Appenzell (1401–1429)", "Appenzellois et Confédérés", "Abbé de Saint-Gall et villes souabes", "Appenzellois"],
 "Le Stoss": ["Guerres d’Appenzell (1401–1429)", "Appenzellois", "Habsbourg", "Appenzellois"],
 "Rothenthurm": ["Invasion française (1798)", "Schwytz", "France", "Schwytz, avant de capituler"],
 "Viège": ["Luttes du Haut-Valais", "Dizains du Haut-Valais", "Savoie, évêque et nobles", "Haut-Valais"]
}
```

### 8.8 Villes

`/data/cities.json` — 41 villes. `pop` = population 2020 (OFS, via la liste Wikipédia des villes suisses) ; `names` = noms successifs avec l'année d'apparition ; `null` = ville abandonnée.
```json
[
{"code": "GE", "lat": 46.204, "lon": 6.143, "pop": 203856, "names": [[-121, "Genava"], [500, "Genève"]], "info": "Ville des Allobroges puis des Romains, capitale burgonde, « Rome protestante » au temps de Calvin. Elle accueille aujourd’hui la Croix-Rouge et le siège européen de l’ONU.", "id": 0},
{"code": "VD", "lat": 46.519, "lon": 6.633, "pop": 140202, "names": [[-15, "Lousonna"], [600, "Lausanne"]], "info": "Le bourg romain de Lousonna était au bord du lac, à Vidy. La ville s’est ensuite installée sur la colline, autour de la cathédrale. Le CIO y a son siège depuis 1915.", "id": 1},
{"code": "VD", "lat": 46.383, "lon": 6.239, "pop": 21718, "names": [[-45, "Colonia Julia Equestris"], [900, "Nyon"]], "info": "Fondée par César vers 45 av. J.-C. pour d’anciens cavaliers de son armée. C’est l’une des premières villes romaines de Suisse. L’UEFA y a son siège.", "id": 2},
{"code": "VD", "lat": 46.778, "lon": 6.641, "pop": 29955, "names": [[-15, "Eburodunum"], [1260, "Yverdon"]], "info": "Bourg celte puis romain au bout du lac de Neuchâtel. Pierre II de Savoie y bâtit un château vers 1260. Le pédagogue Pestalozzi y dirige un institut célèbre de 1805 à 1825.", "id": 3},
{"code": "VD", "lat": 46.881, "lon": 7.043, "names": [[-15, "Aventicum"], [500, "Avenches"]], "info": "Capitale des Helvètes à l’époque romaine, avec un amphithéâtre, un théâtre et une enceinte de 5,5 km. Elle comptait peut-être 20 000 habitants.", "id": 4},
{"code": "VS", "lat": 46.231, "lon": 7.359, "pop": 34978, "names": [[-15, "Sedunum"], [600, "Sion"]], "info": "Ancien lieu des Sédunes, siège de l’évêque du Valais depuis la fin du VIᵉ siècle. Ses deux collines portent Valère et Tourbillon.", "id": 5},
{"code": "VS", "lat": 46.102, "lon": 7.072, "pop": 18291, "names": [[-15, "Octodurus"], [600, "Martigny"]], "info": "Chef-lieu romain du Valais, au pied du Grand-Saint-Bernard. Son amphithéâtre accueille aujourd’hui des combats de reines.", "id": 6},
{"code": "VS", "lat": 46.218, "lon": 7.003, "names": [[-15, "Acaunus"], [515, "Saint-Maurice"]], "info": "Poste de péage romain dans un étroit passage du Rhône, puis abbaye fondée en 515, la plus ancienne d’Occident encore en activité.", "id": 7},
{"code": "FR", "lat": 46.806, "lon": 7.161, "pop": 38039, "names": [[1157, "Fribourg"]], "info": "Fondée par les Zähringen en 1157 sur une boucle de la Sarine. Ville bilingue, elle entre dans la Confédération en 1481.", "id": 8},
{"code": "NE", "lat": 46.99, "lon": 6.931, "pop": 33455, "names": [[1011, "Neuchâtel"]], "info": "Le « nouveau château » est mentionné en 1011. Ville de pierre jaune, elle appartient au roi de Prusse de 1707 à 1848.", "id": 9},
{"code": "NE", "lat": 47.1, "lon": 6.826, "pop": 36915, "names": [[1656, "La Chaux-de-Fonds"]], "info": "Village devenu ville horlogère, reconstruit en damier après l’incendie de 1794. Inscrite à l’UNESCO avec Le Locle. Le Corbusier y est né.", "id": 10},
{"code": "JU", "lat": 47.365, "lon": 7.343, "pop": 12618, "names": [[1131, "Delémont"]], "info": "Les princes-évêques de Bâle y avaient un château. Delémont est la capitale du canton du Jura depuis 1979.", "id": 11},
{"code": "JU", "lat": 47.416, "lon": 7.075, "pop": 6434, "names": [[1283, "Porrentruy"]], "info": "Résidence des princes-évêques de Bâle après la Réforme, jusqu’en 1792. Son château domine la vieille ville.", "id": 12},
{"code": "BE", "lat": 46.948, "lon": 7.447, "pop": 134794, "names": [[1191, "Berne"]], "info": "Fondée en 1191 par Berthold V de Zähringen. Sa vieille ville à arcades est inscrite à l’UNESCO. Ville fédérale depuis 1848.", "id": 13},
{"code": "BE", "lat": 47.137, "lon": 7.247, "pop": 55206, "names": [[1220, "Bienne"]], "info": "Ville bilingue fondée par l’évêque de Bâle. C’est aujourd’hui la capitale suisse de l’horlogerie.", "id": 14},
{"code": "BE", "lat": 46.758, "lon": 7.628, "pop": 43476, "names": [[1190, "Thoune"]], "info": "Les Zähringen y bâtissent un château vers 1190, à la sortie du lac. C’est la porte de l’Oberland bernois.", "id": 15},
{"code": "SO", "lat": 47.208, "lon": 7.537, "pop": 16802, "names": [[-15, "Salodurum"], [600, "Soleure"]], "info": "Bourg romain sur l’Aar. La plus belle ville baroque de Suisse, obsédée par le chiffre 11.", "id": 16},
{"code": "BS", "lat": 47.558, "lon": 7.588, "pop": 178120, "names": [[374, "Basilia"], [1000, "Bâle"]], "info": "Première université de Suisse (1460), port sur le Rhin et capitale de la chimie et de la pharmacie.", "id": 17},
{"code": "BL", "lat": 47.533, "lon": 7.721, "names": [[-44, "Augusta Raurica"], [400, null]], "info": "Colonie romaine fondée vers 44 av. J.-C. Son théâtre est le mieux conservé au nord des Alpes.", "id": 18},
{"code": "BL", "lat": 47.484, "lon": 7.734, "pop": 14963, "names": [[1189, "Liestal"]], "info": "Petite ville de la campagne bâloise, devenue chef-lieu de Bâle-Campagne après la séparation de 1833.", "id": 19},
{"code": "AG", "lat": 47.392, "lon": 8.044, "pop": 21726, "names": [[1240, "Aarau"]], "info": "Fondée par les Kybourg vers 1240. En 1798, elle est la première capitale de la République helvétique.", "id": 20},
{"code": "AG", "lat": 47.473, "lon": 8.307, "pop": 19621, "names": [[-15, "Aquae Helveticae"], [600, "Baden"]], "info": "Station thermale déjà fréquentée par les Romains. Les cantons y tiennent leurs diètes pendant des siècles.", "id": 21},
{"code": "AG", "lat": 47.481, "lon": 8.212, "names": [[15, "Vindonissa"], [400, "Windisch"]], "info": "Le seul camp de légionnaires de Suisse, au confluent de l’Aar, de la Reuss et de la Limmat.", "id": 22},
{"code": "ZH", "lat": 47.373, "lon": 8.54, "pop": 421878, "names": [[-15, "Turicum"], [900, "Zurich"]], "info": "Poste de douane romain sur la Limmat, ville de la Réforme de Zwingli, aujourd’hui première ville et grande place financière du pays.", "id": 23},
{"code": "ZH", "lat": 47.5, "lon": 8.724, "pop": 114220, "names": [[-15, "Vitudurum"], [1180, "Winterthur"]], "info": "Bourg romain, puis ville des Kybourg, devenue grande ville industrielle au XIXᵉ siècle.", "id": 24},
{"code": "SH", "lat": 47.696, "lon": 8.635, "pop": 36952, "names": [[1045, "Schaffhouse"]], "info": "Née du transbordement des marchandises au-dessus des chutes du Rhin. La forteresse du Munot domine la ville.", "id": 25},
{"code": "TG", "lat": 47.557, "lon": 8.898, "pop": 25974, "names": [[1246, "Frauenfeld"]], "info": "Fondée par les Kybourg. Pendant des siècles, les baillis des cantons qui gouvernaient la Thurgovie y résident.", "id": 26},
{"code": "SG", "lat": 47.424, "lon": 9.377, "pop": 76213, "names": [[612, "Saint-Gall"]], "info": "Née autour de l’abbaye fondée sur la tombe de l’ermite Gall. Célèbre pour sa bibliothèque et sa broderie.", "id": 27},
{"code": "AR", "lat": 47.386, "lon": 9.279, "pop": 15649, "names": [[837, "Herisau"]], "info": "Chef-lieu des Rhodes-Extérieures, protestantes depuis la séparation de 1597.", "id": 28},
{"code": "AI", "lat": 47.331, "lon": 9.409, "pop": 5793, "names": [[1071, "Appenzell"]], "info": "Chaque printemps, les citoyens y votent à main levée sur la place, lors de la Landsgemeinde.", "id": 29},
{"code": "GL", "lat": 47.04, "lon": 9.068, "pop": 12539, "names": [[1100, "Glaris"]], "info": "Reconstruite en damier après le grand incendie de 1861. Le canton tient encore sa Landsgemeinde.", "id": 30},
{"code": "UR", "lat": 46.881, "lon": 8.644, "pop": 9565, "names": [[1223, "Altdorf"]], "info": "Selon la légende, Guillaume Tell y tira la flèche sur la pomme posée sur la tête de son fils.", "id": 31},
{"code": "SZ", "lat": 47.021, "lon": 8.653, "pop": 15435, "names": [[972, "Schwytz"]], "info": "Elle a donné son nom et son drapeau à la Suisse. Le Pacte fédéral de 1291 y est conservé.", "id": 32},
{"code": "OW", "lat": 46.896, "lon": 8.245, "pop": 10514, "names": [[1100, "Sarnen"]], "info": "Le « Livre blanc de Sarnen », écrit vers 1470, raconte pour la première fois la légende de Tell.", "id": 33},
{"code": "NW", "lat": 46.957, "lon": 8.366, "pop": 8171, "names": [[1100, "Stans"]], "info": "En 1481, le compromis de Stans y évite une guerre civile entre cantons. Un monument honore Winkelried.", "id": 34},
{"code": "ZG", "lat": 47.166, "lon": 8.516, "pop": 30934, "names": [[1240, "Zoug"]], "info": "Petite ville médiévale au bord du lac, devenue un centre mondial du négoce et des cryptomonnaies.", "id": 35},
{"code": "LU", "lat": 47.05, "lon": 8.309, "pop": 82620, "names": [[1178, "Lucerne"]], "info": "Ville du pont de la Chapelle, première ville à rejoindre les Waldstätten, en 1332.", "id": 36},
{"code": "TI", "lat": 46.192, "lon": 9.017, "pop": 43360, "names": [[590, "Bellinzona"]], "info": "Ses trois châteaux verrouillent la route du Gothard. Inscrits à l’UNESCO, ils sont le symbole du Tessin, dont elle est la capitale.", "id": 37},
{"code": "TI", "lat": 46.004, "lon": 8.951, "pop": 62315, "names": [[1000, "Lugano"]], "info": "La plus grande ville du Tessin, au bord du lac de Lugano.", "id": 38},
{"code": "TI", "lat": 46.168, "lon": 8.795, "pop": 15728, "names": [[1000, "Locarno"]], "info": "En 1925, les accords de Locarno y rapprochent l’Allemagne et ses voisins après la Grande Guerre. Festival du film depuis 1946.", "id": 39},
{"code": "GR", "lat": 46.85, "lon": 9.531, "pop": 36336, "names": [[-15, "Curia"], [800, "Coire"]], "info": "Habitée depuis environ 5000 ans, siège d’un évêché depuis le Vᵉ siècle. La porte des cols vers l’Italie.", "id": 40}
]
```

### 8.9 Lacs

`/data/lakes.json` — clé = identifiant OFS du lac dans la géodonnée. `km2` superficie, `m` profondeur max, `made` = année de création (lacs artificiels).
```json
{
 "9040": {"names": [[1032, "Greifensee"]], "km2": 8.5, "note": "Petit lac de l’Oberland zurichois."},
 "9050": {"names": [[1032, "Lac de Zurich"]], "km2": 88, "m": 136, "note": "Nommé d’après la ville riveraine. Des villages sur pilotis occupaient déjà ses rives au Néolithique."},
 "9073": {"names": [[1032, "Lac de Thoune"]], "km2": 48, "m": 217, "note": "Avec le lac de Brienz, il formait un seul lac après la dernière glaciation. Les alluvions ont créé entre eux la plaine d’Interlaken."},
 "9089": {"names": [[1032, "Lac de Brienz"]], "km2": 30, "m": 260, "note": "Lac glaciaire à l’eau turquoise, séparé du lac de Thoune par la plaine d’Interlaken."},
 "9148": {"names": [[1032, "Lac de Bienne"]], "km2": 39, "m": 74, "note": "Sur l’île Saint-Pierre, Rousseau a vécu en 1765 un séjour qu’il décrit comme le plus heureux de sa vie."},
 "9151": {"names": [[1011, "Lac de Neuchâtel"]], "km2": 218, "m": 152, "note": "Le plus grand lac entièrement suisse. Il prend le nom de la ville neuve (Novum Castellum) mentionnée en 1011. Le site de La Tène est sur sa rive."},
 "9157": {"names": [[1032, "Lac de Baldegg"]], "km2": 5, "note": "Petit lac du Seetal lucernois."},
 "9163": {"names": [[1032, "Lac de Sempach"]], "km2": 14, "note": "La bataille de Sempach (1386) a eu lieu sur les hauteurs au-dessus de sa rive."},
 "9172": {"names": [[1032, "Lac de Hallwil"]], "km2": 10, "note": "Le château d’eau de Hallwyl se dresse à sa sortie."},
 "9175": {"names": [[1032, "Lac de Zoug"]], "km2": 38, "m": 198, "note": "Nommé d’après la ville de Zoug, sur sa rive nord."},
 "9179": {"names": [[1032, "Lac de Lucerne"], [1332, "Lac des Quatre-Cantons"]], "km2": 114, "m": 214, "note": "Son nom rappelle les quatre cantons riverains, Uri, Schwytz, Unterwald et Lucerne, alliés dès 1332. Le Grütli est sur sa rive."},
 "9216": {"made": 1937, "names": [[1937, "Sihlsee"]], "km2": 11, "note": "Lac artificiel créé en 1937 pour la centrale électrique de l’Etzel. Des familles ont dû quitter leurs fermes, noyées par la retenue."},
 "9239": {"names": [[1032, "Lac de Sarnen"]], "km2": 7.5, "note": "Lac d’Obwald, au pied du col du Brünig."},
 "9267": {"names": [[1032, "Walensee"]], "km2": 24, "m": 151, "note": "Son nom vient de « Walen », le mot germanique pour les habitants romans : le lac marquait la limite avec la Rhétie de langue latine."},
 "9270": {"names": [[1032, "Lac d’Égeri"]], "km2": 7, "note": "La bataille de Morgarten (1315) s’est déroulée sur sa rive sud."},
 "9276": {"made": 1948, "names": [[1948, "Lac de la Gruyère"]], "km2": 9.6, "note": "Lac artificiel créé en 1948 par le barrage de Rossens, sur la Sarine."},
 "9294": {"names": [[1032, "Lac de Morat"]], "km2": 23, "m": 45, "note": "En 1476, de nombreux soldats de Charles le Téméraire se noient dans le lac en fuyant la bataille de Morat."},
 "9326": {"names": [[77, "Lacus Brigantinus"], [900, "Lac de Constance"]], "km2": 536, "m": 251, "note": "Pline l’Ancien le nomme d’après Brigantium, l’actuelle Bregenz. Le nom allemand Bodensee vient du palais carolingien de Bodman. La Suisse, l’Allemagne et l’Autriche ne se sont jamais accordées sur une frontière au milieu du lac."},
 "9710": {"names": [[1032, "Lac de Lugano"]], "km2": 49, "m": 288, "note": "On l’appelle aussi Ceresio. Il est partagé entre la Suisse et l’Italie."},
 "9711": {"names": [[-15, "Lacus Verbanus"], [1000, "Lac Majeur"]], "km2": 212, "m": 372, "note": "Connu des Romains sous le nom de Verbanus. Sa plus grande partie est italienne. C’est le point le plus bas de Suisse, à 193 m."},
 "9751": {"names": [[1032, "Lac de Joux"]], "km2": 9, "note": "Le plus grand lac du massif du Jura, au cœur de la vallée horlogère."},
 "9757": {"names": [[-58, "Lacus Lemannus"], [1000, "Léman"]], "km2": 580, "m": 310, "note": "César le nomme Lacus Lemannus en 58 av. J.-C. C’est le plus grand lac d’Europe occidentale. Environ 60 % de sa surface est suisse, le reste français."}
}
```

### 8.10 Sommets

`/data/peaks.json` — `[lat, lon, nom, altitude]` :
```json
[[45.937, 7.867, "Pointe Dufour", "4634 m"], [45.976, 7.659, "Cervin", "4478 m"], [46.537, 7.962, "Jungfrau", "4158 m"], [46.382, 9.908, "Piz Bernina", "4049 m"], [46.772, 8.437, "Titlis", "3238 m"], [47.249, 9.343, "Säntis", "2502 m"], [46.979, 8.255, "Pilatus", "2128 m"]]
```

### 8.11 Carte d'identité des cantons aujourd'hui

`/data/cantons.json` — population : tableau Wikipédia « Cantons of Switzerland » d'après l'OFS (**année de référence à confirmer, à remplacer par le dernier chiffre OFS**).
```json
{
 "ZH": {"cap": "Zurich", "pop": 1553423, "km2": 1729, "lang": "Allemand", "trad": "Sechseläuten, Knabenschiessen, Street Parade", "food": "Émincé à la zurichoise", "people": "Ulrich Zwingli, Alfred Escher, Gottfried Keller"},
 "BE": {"cap": "Berne", "pop": 1043132, "km2": 5960, "lang": "Allemand, français", "trad": "Zibelemärit, le marché aux oignons de novembre", "food": "Emmental, plat bernois", "people": "Albert Einstein, Jeremias Gotthelf, Paul Klee"},
 "LU": {"cap": "Lucerne", "pop": 416347, "km2": 1494, "lang": "Allemand", "trad": "La Fasnacht de Lucerne et ses Guggenmusik", "food": "Chügelipastete, vol-au-vent lucernois", "people": "Peter Amstalden, les vainqueurs de Sempach"},
 "UR": {"cap": "Altdorf", "pop": 36819, "km2": 1077, "lang": "Allemand", "trad": "Landsgemeinde jusqu’en 1928, la tête de taureau des armoiries", "food": "Älplermagronen, macaronis de l’alpage", "people": "Guillaume Tell (légende)"},
 "SZ": {"cap": "Schwytz", "pop": 162157, "km2": 908, "lang": "Allemand", "trad": "Pèlerinage d’Einsiedeln et sa Vierge noire", "food": "Fromages et kirsch", "people": "Saint Meinrad, Alois von Reding"},
 "OW": {"cap": "Sarnen", "pop": 38108, "km2": 491, "lang": "Allemand", "trad": "Pèlerinage au Ranft, Landsgemeinde jusqu’en 1998", "food": "Fromages d’alpage", "people": "Nicolas de Flue, saint patron de la Suisse"},
 "NW": {"cap": "Stans", "pop": 43520, "km2": 276, "lang": "Allemand", "trad": "Yodel, musique populaire, Landsgemeinde jusqu’en 1997", "food": "Fromages d’alpage", "people": "Arnold Winkelried (légende de Sempach)"},
 "GL": {"cap": "Glaris", "pop": 40851, "km2": 685, "lang": "Allemand", "trad": "Landsgemeinde chaque premier dimanche de mai, Näfelser Fahrt", "food": "Schabziger, fromage vert au trèfle", "people": "Saint Fridolin, Ulrich Zwingli (curé)"},
 "ZG": {"cap": "Zoug", "pop": 128794, "km2": 239, "lang": "Allemand", "trad": "Les cerisiers en fleur, le kirsch", "food": "Tourte au kirsch de Zoug", "people": "—"},
 "FR": {"cap": "Fribourg", "pop": 325496, "km2": 1671, "lang": "Français, allemand", "trad": "La Bénichon, fête des récoltes", "food": "Fondue moitié-moitié, gruyère, cuchaule", "people": "Pierre Canisius, Jean Tinguely"},
 "SO": {"cap": "Soleure", "pop": 277462, "km2": 790, "lang": "Allemand", "trad": "Le chiffre 11, la Fasnacht soleuroise", "food": "Tourte de Soleure", "people": "Les ambassadeurs de France"},
 "BS": {"cap": "Bâle", "pop": 201156, "km2": 37, "lang": "Allemand", "trad": "Fasnacht et son Morgestraich à 4 h", "food": "Läckerli de Bâle", "people": "Érasme, Hans Holbein, Leonhard Euler"},
 "BL": {"cap": "Liestal", "pop": 292955, "km2": 518, "lang": "Allemand", "trad": "Chienbäse, les fagots enflammés de Liestal", "food": "Cerises et kirsch du Baselbiet", "people": "—"},
 "SH": {"cap": "Schaffhouse", "pop": 83107, "km2": 298, "lang": "Allemand", "trad": "La cloche du Munot, sonnée chaque soir", "food": "Tarte aux oignons, pinot noir", "people": "—"},
 "AR": {"cap": "Herisau", "pop": 55309, "km2": 243, "lang": "Allemand", "trad": "Les Silvesterchläuse d’Urnäsch", "food": "Biber d’Appenzell", "people": "—"},
 "AI": {"cap": "Appenzell", "pop": 16293, "km2": 172, "lang": "Allemand", "trad": "Landsgemeinde le dernier dimanche d’avril", "food": "Fromage d’Appenzell", "people": "—"},
 "SG": {"cap": "Saint-Gall", "pop": 514504, "km2": 2031, "lang": "Allemand", "trad": "L’Olma, grande foire agricole", "food": "Bratwurst de Saint-Gall, sans moutarde", "people": "Gall, Notker"},
 "GR": {"cap": "Coire", "pop": 200096, "km2": 7105, "lang": "Allemand, romanche, italien", "trad": "Chalandamarz, on chasse l’hiver avec des cloches", "food": "Capuns, tourte aux noix, viande des Grisons", "people": "Jürg Jenatsch, Johannes Badrutt"},
 "AG": {"cap": "Aarau", "pop": 694072, "km2": 1404, "lang": "Allemand", "trad": "Pays des châteaux : Habsbourg, Lenzbourg, Hallwyl", "food": "Tourte aux carottes argovienne", "people": "Les Habsbourg"},
 "TG": {"cap": "Frauenfeld", "pop": 282909, "km2": 992, "lang": "Allemand", "trad": "Vergers à perte de vue : on la surnomme « Mostindien »", "food": "Cidre et pommes", "people": "Louis-Napoléon (futur Napoléon III)"},
 "TI": {"cap": "Bellinzona", "pop": 350986, "km2": 2812, "lang": "Italien", "trad": "Carnaval Rabadan, processions de Mendrisio (UNESCO)", "food": "Polenta, risotto, merlot, grotto", "people": "Francesco Borromini, Mario Botta"},
 "VD": {"cap": "Lausanne", "pop": 814762, "km2": 3212, "lang": "Français", "trad": "Fête des Vignerons de Vevey", "food": "Papet vaudois, taillé aux greubons, carac", "people": "Major Davel, Frédéric-César de La Harpe, Charles Ferdinand Ramuz"},
 "VS": {"cap": "Sion", "pop": 348503, "km2": 5224, "lang": "Français, allemand", "trad": "Combats de reines, désalpes", "food": "Raclette, brisolée, abricots, fendant", "people": "César Ritz, Ulrich Ruffiner"},
 "NE": {"cap": "Neuchâtel", "pop": 175894, "km2": 802, "lang": "Français", "trad": "Horlogerie des Montagnes, Fête des vendanges", "food": "Absinthe, vins du lac, tripes", "people": "Le Corbusier, Louis Chevrolet"},
 "GE": {"cap": "Genève", "pop": 506343, "km2": 282, "lang": "Français", "trad": "L’Escalade et sa marmite en chocolat", "food": "Longeole, cardon épineux", "people": "Jean Calvin, Jean-Jacques Rousseau, Henry Dunant"},
 "JU": {"cap": "Delémont", "pop": 73709, "km2": 839, "lang": "Français", "trad": "Saint-Martin en Ajoie, Marché-Concours de Saignelégier", "food": "Damassine, Tête de Moine, totché", "people": "Les militants du Rassemblement jurassien"}
}
```


---

## 9. Étapes de développement et critères d'acceptation

### Étape 1 — Socle et carte
- Projet Next.js + TS, tokens de design, polices, PWA.
- Script géo, chargement TopoJSON, projection Mercator ajustée à l'écran (marge haute réservée à l'en-tête).
- Pan/zoom, boutons, lacs, relief, sommets.
- ✅ La carte s'affiche sans décalage à 390 px et 1280 px ; zoom fluide ; pas de défilement horizontal.

### Étape 2 — Temps et territoires
- Curseur déformé (4.1), époques, en-tête (année, époque, population, nombre de cantons).
- Territoires avant/après 1291 avec **fusion** (4.2), hachures, légende, frontière en pointillés avant 1815.
- Lecture automatique + bandeaux + éclat d'intégration.
- ✅ En -5000 : un seul territoire, aucune frontière intérieure. En 1400 : bloc « Habsbourg » unique. En 1800 : une seule « République helvétique ». En 1900 : Jura fusionné dans « Berne ». En 2026 : 26 cantons, « 23 cantons (26 avec les demi-cantons) ».
- ✅ Tests unitaires de `posOf`/`yearOf` (aller-retour), `statusAt`, `entityOf`, `interpLog`.

### Étape 3 — Points et fiches
- Villes (noms dans le temps), lacs (noms datés, lacs artificiels), événements (visibilité, récence, épées pour les batailles).
- Toutes les fiches de 3.3, portraits paramétriques, zoom sur l'objet ouvert.
- ✅ Clic sur les Helvètes en -100 : portrait + toutes les rubriques. Clic sur « Grandson et Morat » : encadré guerre + autres batailles des guerres de Bourgogne. Clic sur le Léman en -100 : « Lacus Lemannus ». Sihlsee absent en 1930, présent en 1940.

### Étape 4 — Finition
- Accessibilité : focus visible, éléments de carte activables au clavier (Entrée), `aria-label` sur les points, `prefers-reduced-motion`.
- Performance : 60 fps en lecture sur un iPhone récent, chargement initial < 300 Ko hors polices.
- Partage : URL avec l'année et l'objet ouvert (ex. `/?y=1602&e=escalade`), image de partage.
- ✅ Lighthouse ≥ 90 (performance, accessibilité) sur mobile.

### Étape 5 — Après le MVP
1. Frontières historiques par communes (Phase 2), en commençant par la Romandie.
2. Population par canton et par commune dès 1850 (OFS).
3. Quiz « Vingt-Six » relié aux fiches (chaque fiche → 2-3 questions), mode « place l'événement sur la carte et dans le temps » (score km + années).
4. Versions DE / IT / EN.
5. Back-office de contenu (Firestore) et bouton « Signaler une erreur ».
6. Premium et paiement (Stripe ou achats intégrés).

---

## 10. Sources, licences et points ouverts

### Sources du contenu
- **Dictionnaire historique de la Suisse (DHS)**, hls-dhs-dss.ch : textes sous **CC BY-SA 4.0**, usage commercial autorisé avec mention de l'auteur ; listes d'articles en données ouvertes (CC0). Images de tiers exclues.
- **Wikipédia** (articles des cantons, de Bâle, chronologie de Genève, liste des villes) : CC BY-SA. Les faits tirés de Wikipédia sont à **relire contre le DHS** avant publication.
- **OFS** : population de la Suisse au 31.12.2025 (9 127 100).
- **swisstopo** : géodonnées ouvertes, usage commercial autorisé, mention « ©swisstopo ».
- **Carte de Marco Zanoli** (Wikimedia, CC BY-SA 4.0) : référence pour l'expansion territoriale 1291–1797.

### Points ouverts
- [ ] Remplacer le fond OFS GEOSTAT (non commercial) par swissBOUNDARIES3D avant toute mise en ligne publique.
- [ ] Confirmer l'année de référence des populations cantonales et mettre à jour avec l'OFS.
- [ ] Relecture historique complète (priorité : Genève et Romandie).
- [ ] Moutier : la géodonnée 2024 place encore Moutier dans Berne ; utiliser une géodonnée 2026 pour l'état actuel.
- [ ] Décider du nom définitif (Helvetia / Vingt-Six) et du nom de domaine.
- [ ] Mentions légales et attribution CC BY-SA visibles dans l'app (écran « À propos »).

---

## 11. Prompt de démarrage pour Claude Code

```
Lis entièrement docs/helvetia-spec.md et ouvre docs/helvetia.html (prototype de référence).
Puis :
1. Propose-moi un plan court de l'étape 1 (section 9) et les dépendances exactes que tu vas installer.
2. Après mon accord, crée le projet Next.js + TypeScript, copie les données de la section 8
   dans /data sans les modifier, et implémente l'étape 1.
3. Termine chaque étape par : captures Playwright à 390 px et 1280 px, tests Vitest des fonctions
   de /lib, et un résumé de ce qui reste.
Ne change pas les textes historiques. Pose-moi une question avant toute décision non couverte par la spec.
```
