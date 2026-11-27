# KITN — Audit comparatif production / prévisualisation

**Date :** 27 novembre 2026  
**Production :** https://kitn.pages.dev/  
**Prévisualisation de la branche de revue :** https://audit-kitn-quality-review-20.kitn.pages.dev/  
**Branche de revue :** `audit/kitn-quality-review-2026-11`

## 1. Conclusion essentielle

La production et la prévisualisation ne présentent pas la même interface. La production expose encore l'ancienne organisation du portail, tandis que la prévisualisation contient la nouvelle navigation en cinq espaces thématiques, sans espace d'administration public. La prévisualisation ne doit donc pas être confondue avec la version actuellement utilisée par les visiteurs.

Aucune fusion dans `main` ni aucun déploiement sur le domaine public n'a été effectué.

## 2. Production — observations directes

Le contrôle navigateur à environ 390 px de largeur a observé :

- Une navigation héritée avec les entrées « Portail & Vue globale », « Actualité & veille », « Articles scientifiques », « Maroc en chiffres », « Concours & Academy », « Bibliothèque » et « Administration & contributions ».
- Une interface supérieure comprenant des accès « Thématiques », « KITN Academy », « Méthode » et « Espaces & Index ».
- Le sélecteur de langue français/arabe fonctionne et la direction RTL est correctement appliquée.
- Le contenu Academy et le QCM restent lisibles et s'empilent correctement.
- Un débordement horizontal est visible sur mobile.

### Problèmes mobiles confirmés sur la production

1. La barre des espaces héritée dépasse la largeur de l'écran ; plusieurs onglets ne sont visibles qu'après défilement horizontal.
2. La barre de filtres (recherche, dates et listes déroulantes) est trop large pour un écran d'environ 390 px.
3. Les boutons d'action des cartes documentaires (source, PDF/texte intégral, fiche, favoris) provoquent également un débordement.
4. Les cartes et textes principaux restent généralement lisibles, mais les commandes sont moins accessibles.

Le contrôle mobile est un constat visuel/navigationnel ; les dimensions exactes, les tailles de cibles tactiles et les appareils physiques ne sont pas mesurés.

## 3. Prévisualisation — observations directes

La prévisualisation présente une navigation plus resserrée : Accueil et cinq espaces thématiques, sans entrée publique « Administration & contributions ».

Les cinq routes canoniques ont été appelées directement et ont renvoyé leur contenu :

| Route | Contenu observé |
|---|---|
| `/veille` | 8 notices indexées ; 5 validées et 3 à vérifier |
| `/etudes-recherche` | Publications scientifiques et résumés chargés |
| `/maroc-en-chiffres` | Indicateurs nationaux et contenus HCP ; certaines fiches signalent encore des séries en attente de collecte |
| `/bibliotheque` | Répertoire de sources institutionnelles et notices documentaires |
| `/academy` | Ressources de concours et parcours DGSN / IRAT / concours administratifs |

Le contrôle mobile de la prévisualisation a observé un rendu plus propre que la production : navigation et cartes lisibles, pas de débordement horizontal majeur détecté dans le parcours testé, et bascule arabe RTL fonctionnelle. Les menus déroulants sur mobile et les tailles exactes des zones tactiles restent à tester plus finement.

### Tests fonctionnels complémentaires sur la prévisualisation

- La vue nationale affiche 853 indicateurs, 80 186 observations historiques et 5 sources identifiées. Le filtre « Économie & finances publiques » fonctionne et ramène la liste à 842 indicateurs.
- La vue régionale a été activée depuis le bouton « Comparaison régionale ». Le titre, le sélecteur d'indicateur, le tableau des régions et les périodes T1/2026, T2/2026 et T3/2026 sont apparus. Pour le taux de chômage strict sélectionné, l'interface affiche 12/12 régions couvertes et 12/12 valeurs disponibles.
- La page Academy expose les onglets DGSN, IRAT et Concours admin ainsi qu'un QCM de cinq questions. La présence est confirmée ; le changement de parcours et le retour de correction après réponse restent à valider par interaction.
- La page Bibliothèque et ses commandes de recherche/filtrage sont présentes. Le test de recherche ciblé est encore en cours.

### Données régionales vérifiées dans le dépôt de la branche

- 342 séries régionales : 234 séries EMO (6 indicateurs × 13 géographies × 3 milieux) et 108 séries sociales.
- 12 régions sont couvertes pour les séries sociales ; les séries EMO comprennent aussi l'agrégat national, soit 13 géographies.
- Les séries sociales couvrent notamment la pauvreté monétaire sur 2001, 2014 et 2022, ainsi que la fécondité par milieu.
- Les valeurs non disponibles sont conservées comme manquantes : 25 séries EMO n'ont pas de dernière valeur disponible et 79 valeurs historiques sont nulles. Elles ne sont pas converties artificiellement en zéro.
- Les 234 séries EMO portent un avertissement de rupture méthodologique entre l'ENE et l'EMO 2026.

## 4. Différences structurantes

| Sujet | Production | Prévisualisation |
|---|---|---|
| Navigation publique | Ancienne navigation à 7 entrées, dont administration | Accueil + 5 espaces thématiques |
| Administration | Exposée dans les onglets publics | Retirée de la navigation publique |
| URL par espace | Pas de routes propres confirmées lors du contrôle mobile | Routes dédiées vérifiées |
| Mobile | Débordements sur onglets, filtres et actions de cartes | Amélioration visible ; pas de débordement majeur observé lors du parcours testé |
| Données régionales HCP | Pas de validation équivalente effectuée ici | Jeu régional et vue de comparaison présents dans la branche de revue |

La nouvelle interface de prévisualisation n'est pas encore la production. Les visiteurs de `kitn.pages.dev` continuent donc de voir l'ancienne interface tant qu'aucune publication contrôlée n'a lieu.

## 5. Correction effectuée sur la branche

Le contrôle mobile a relevé que le titre de l'accueil annonçait « Six espaces » alors que cinq cartes thématiques étaient affichées. Le sixième élément de navigation est l'accueil, pas un espace thématique. Le titre a donc été corrigé en français et en arabe pour annoncer cinq espaces thématiques.

## 6. Contrôles techniques

- Le workflow de validation de la PR a réussi après le dernier changement de code : tests Python, validations HCP EMO et HCP social, vérification des distributions statistiques, tests frontend et build Vite.
- Le workflow de validation HCP régional a réussi : extraction du PDF EMO, publication des indicateurs sociaux dans la prévisualisation, vérification du frontend et build avec les données régionales.
- Le workflow de collecte automatique a été ignoré pour ce contrôle de PR, comme prévu ; aucune collecte ni écriture automatique dans `main` n'a été lancée.
- Le problème de build Cloudflare Worker reste distinct du déploiement Pages et n'est pas déclaré résolu.

## 7. Étapes restantes avant toute publication

1. Corriger ou remplacer les composants mobiles de l'ancienne production uniquement via la nouvelle interface, après comparaison fonctionnelle.
2. Tester en profondeur les filtres statistiques, les valeurs des 12 régions, les périodes, les unités et les avertissements méthodologiques.
3. Parcourir tous les parcours Academy et vérifier la pertinence de chaque question/réponse.
4. Vérifier les liens externes, PDF et fiches documentaires.
5. Tester les menus déroulants et les cibles tactiles à 360–390 px.
6. Résoudre ou documenter précisément le build Cloudflare Worker si ce service est toujours requis.
7. Faire une revue finale des différences de données et de fonctionnalités, puis préparer une publication avec procédure de retour arrière.

**Décision :** continuer le travail sur la branche de revue. Ne pas fusionner ni basculer le domaine public tant que les vérifications fonctionnelles et la stratégie de déploiement ne sont pas terminées.
