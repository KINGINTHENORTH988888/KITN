# KITN — Clarification des cibles Cloudflare
Date : 27 novembre 2026

## Pourquoi cette note existe

La prévisualisation Cloudflare Worker et la prévisualisation Cloudflare Pages ne doivent pas être confondues. Elles ne prouvent pas le déploiement de la même application.

## Deux applications dans le dépôt

- **Application active Vite** : racine du dépôt (`index.html`, `src/`, `package.json`). La commande `npm run build` produit `dist/`. Le README identifie cette application comme celle utilisée par `kitn.pages.dev`.
- **Prototype Astro** : sous-répertoire `web/`. Sa commande `npm --prefix web run build` produit `web/dist/`. Le README précise que ce prototype est distinct de l'application Vite racine.

## Ce que confirme la prévisualisation Worker

Le fichier `wrangler.jsonc` de cette branche déclare les assets depuis `./web/dist` et un bloc `previews` vide. La configuration de build du Worker observée dans Cloudflare exécute `npm --prefix web install && npm --prefix web run build`.

Le Worker preview `https://audit-kitn-quality-review-2026-11-kitn.ham-elmidaoui.workers.dev` a reçu les statuts Cloudflare **Build Success** et **Deployment Success** pour le commit `08bc6a7`.

**Interprétation correcte :** ce déploiement sert le prototype Astro de `web/`. Il valide le pipeline de prévisualisation de ce Worker et sa configuration d'assets, mais il ne valide pas l'application Vite racine ni le site public `kitn.pages.dev`.

## Prévisualisation Pages et production

- Prévisualisation Pages de la branche : `https://audit-kitn-quality-review-20.kitn.pages.dev`.
- Site public : `https://kitn.pages.dev`.
- Le déploiement Worker `*.workers.dev` est une cible distincte des URLs Pages `*.pages.dev`.

Le présent audit ne déclare pas le site public corrigé. Aucune fusion dans `main`, aucun changement de `main` et aucune bascule de production n'ont été effectués.

## Contrôle navigateur restant

Le test navigateur direct des deux URLs Pages et du Worker n'a pas pu être réalisé dans cette session : l'outil d'automatisation n'a pas démarré, son portefeuille étant négatif. Le lecteur web disponible n'a pas pu ouvrir les URLs Pages. Il faut donc conserver le statut **non vérifié en navigateur dans cette session** pour le rendu fonctionnel et mobile.

## Décision avant toute modification supplémentaire

Ne pas remplacer simplement `./web/dist` par `./dist` dans `wrangler.jsonc` : le build Worker actuellement configuré ne produit pas le répertoire Vite racine. Ne pas modifier la commande de build Worker dans le tableau de bord sans déterminer si ce Worker est réellement destiné à servir l'application publique, car ces paramètres peuvent affecter le déploiement Worker de production.

Si le Worker doit un jour servir l'application Vite, il faudra coordonner explicitement :

1. la commande de build qui exécute `npm ci && npm run build` à la racine ;
2. le répertoire d'assets Wrangler `./dist` ;
3. les règles de routage et le domaine effectivement attaché au Worker ;
4. une prévisualisation isolée, puis une validation avant tout changement de production.

En attendant, conserver les deux cibles distinctes et ne présenter aucun test Worker comme une validation de `kitn.pages.dev`.