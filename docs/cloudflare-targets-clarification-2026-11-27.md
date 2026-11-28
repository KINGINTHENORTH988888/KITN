# KITN — Clarification des cibles Cloudflare et état réel des prévisualisations
Date : 27 novembre 2026

## Pourquoi cette note existe

La prévisualisation Cloudflare Worker et la prévisualisation Cloudflare Pages ne doivent pas être confondues. Elles ne servent pas la même application et ne prouvent pas le déploiement de la même version.

## Deux applications dans le dépôt

- **Application active Vite** : racine du dépôt (`index.html`, `src/`, `package.json`). La commande `npm run build` produit `dist/`. Le README identifie cette application comme celle utilisée par `kitn.pages.dev`.
- **Prototype Astro** : sous-répertoire `web/`. Sa commande `npm --prefix web run build` produit `web/dist/`. Le README précise que ce prototype est distinct de l'application Vite racine.

## Worker preview : build réussi, mais cible Astro distincte

Le fichier `wrangler.jsonc` déclare les assets depuis `./web/dist` et un bloc `previews` vide. La configuration de build du Worker observée dans Cloudflare exécute `npm --prefix web install && npm --prefix web run build`.

Cloudflare confirme Build Success et Deployment Success sur le commit `064255a`. Le Worker preview `https://audit-kitn-quality-review-2026-11-kitn.ham-elmidaoui.workers.dev` sert le prototype Astro de `web/` : son accueil utilise l'intitulé « Observatoire analytique • Maroc », et ses pages `/bibliotheque` et `/academy` sont différentes des vues Vite.

**Conclusion :** le Worker preview valide son pipeline de déploiement Astro, mais ne valide pas l'application Vite active ni le site public `kitn.pages.dev`.

## Pages preview : l'application Vite de la branche est déployée

Cloudflare Pages confirme le déploiement réussi du commit `064255a` :
- Preview du commit : `https://d5e3abf6.kitn.pages.dev`.
- URL de prévisualisation de branche : `https://audit-kitn-quality-review-20.kitn.pages.dev`.

Les extractions de pages exécutées après chargement JavaScript montrent :
- `/bibliotheque` ouvre bien la vue Bibliothèque avec les portails institutionnels et les notices documentaires.
- `/etudes-recherche` ouvre la liste des publications scientifiques.
- `/academy` ouvre les ressources de concours indexées.
- `/maroc-en-chiffres` charge les indicateurs nationaux ; le fichier public `data/statistics.json` de cette prévisualisation annonce 853 indicateurs et la collecte du 27 novembre 2026 à 20:01:29 UTC.
- Le jeu `data/regional-statistics.json` publié sur cette branche contient 342 séries régionales HCP (234 EMO + 108 sociales).

## Production : les routes dédiées ne sont pas encore déployées

Le site public reste `https://kitn.pages.dev`. Les extractions des URLs directes `/bibliotheque`, `/maroc-en-chiffres`, `/academy`, `/veille` et `/etudes-recherche` renvoient encore le contenu de l'ancienne page d'accueil au lieu des vues dédiées de la branche. Cette ancienne version expose notamment l'entrée « Administration & contributions » et des compteurs initiaux à zéro.

Les endpoints statistiques publics confirment également un écart de version :
- Production : 845 indicateurs, `generated_at` = `2026-11-27T16:33:58Z`.
- Prévisualisation de branche : 853 indicateurs, `generated_at` = `2026-11-27T20:01:29Z`.

**Interprétation :** les changements Vite sont présents dans la prévisualisation Pages, mais ne sont pas encore en production sur `kitn.pages.dev`. Cela explique l'écart visible entre les deux sites. Aucune fusion dans `main` ni bascule de production n'a été effectuée.

## Contrôle mobile et limites de l'inspection

Les pages publiques ont été lues après rendu JavaScript, ce qui permet de comparer leurs contenus et leurs routes. En revanche, l'outil d'automatisation interactive ne démarre pas dans cette session (portefeuille TinyFish négatif). Les clics réels, les erreurs console/réseau, les interactions des menus, le rendu RTL et les viewports 360–390 px ne sont donc pas certifiés visuellement.

Les correctifs de navigation mobile et de grilles étroites sont couverts par les tests frontend, mais cela ne remplace pas une vérification interactive sur un appareil ou un émulateur.

## Décision avant toute modification supplémentaire

Ne pas remplacer simplement `./web/dist` par `./dist` dans `wrangler.jsonc` : le build Worker actuellement configuré ne produit pas le répertoire Vite racine. Ne pas modifier la commande de build Worker dans le tableau de bord sans déterminer si ce Worker est réellement destiné à servir l'application publique, car ces paramètres peuvent affecter le déploiement Worker de production.

Si le Worker doit un jour servir l'application Vite, il faudra coordonner explicitement :

1. la commande de build qui exécute `npm ci && npm run build` à la racine ;
2. le répertoire d'assets Wrangler `./dist` ;
3. les règles de routage et le domaine effectivement attaché au Worker ;
4. une prévisualisation isolée, puis une validation avant tout changement de production.

En attendant, conserver les deux cibles distinctes et ne présenter aucun test Worker comme une validation de `kitn.pages.dev`.