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
- La page Academy expose les onglets DGSN, IRAT et Concours admin. Le fichier de contenu contient 3 parcours en français et 3 en arabe, avec 5 questions et 2 anciens sujets par parcours. Le passage DGSN → IRAT fonctionne ; le QCM DGSN affiche une correction après sélection de la bonne réponse.
- La page Bibliothèque répond à la recherche « HCP » avec 3 notices correspondantes. Les titres, dates, auteurs et résumés restent lisibles dans les cartes.

### Limite du contrôle mobile sur le dernier déploiement

Une tentative de contrôle mobile sur le déploiement exact du commit `9bfe778` a été exécutée, mais le navigateur de test est resté à une largeur desktop (environ 1280 px). Il ne faut donc pas présenter ce passage comme une validation réelle à 390 px. Les règles CSS du dépôt prévoient bien le menu repliable sous 820 px (`.menu-toggle`, `.nav.is-open`) et plusieurs grilles adaptatives, mais l'ouverture/fermeture du menu et l'absence de débordement à 390 px restent à confirmer dans un vrai viewport mobile.

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

## 8. Vérification du déploiement Pages le plus récent

Le commit `f27bf50`, plus récent que `9bfe778`, a reçu un déploiement Cloudflare Pages réussi sur l'URL de prévisualisation dédiée :

- URL : https://71e1cea2.kitn.pages.dev/
- Les cinq routes ont été revérifiées sur ce déploiement le plus récent et restent accessibles. Le contrôle précédent sur `9bfe778` avait confirmé le titre « Cinq espaces thématiques pour explorer le Maroc ».
- Les cinq routes canoniques ont été ouvertes directement et rendent leur contenu : veille (8 notices), études & recherche (157 publications), Maroc en chiffres, bibliothèque (37 documents) et Academy.
- La vue régionale du taux de chômage strict affiche 12/12 régions couvertes, 12/12 valeurs disponibles et aucune valeur manquante pour T3/2026.
- Le parcours Academy passe correctement de DGSN à IRAT et remplace le titre ainsi que le contenu du QCM.

Cette URL est une prévisualisation de branche, pas le domaine public `kitn.pages.dev`. Sur le commit `f27bf50`, la vue régionale du chômage strict conserve bien 12/12 régions et 12/12 valeurs disponibles.

## 10. Vérification du menu responsive dans le code

La lecture du code confirme le mécanisme prévu :
- sous 820 px, le bouton « Menu » devient visible et la navigation est masquée par défaut ;
- le clic sur ce bouton inverse l'état du menu ;
- sous 760 px, les liens prennent toute la largeur, les sous-menus passent en flux vertical et les grilles d'accueil se réduisent ;
- le clic sur un espace referme le menu.

C'est une vérification statique du code, pas un test réel sur un écran de 390 px. Le test navigateur mobile reste donc ouvert.

## 11. Résultat CI et correction du test de données

Sur le commit audité, le workflow de tests Python a réussi et la validation HCP en direct a réussi. Le workflow de validation PR a toutefois échoué au build frontend parce que le nouveau test attendait déjà 342 séries, alors que le snapshot de la PR utilisé par ce run contenait encore les 234 séries EMO, avant l'ajout automatisé des 108 séries sociales. Le test de structure des valeurs et celui d'Academy ont réussi.

Le test a été corrigé pour accepter les deux états cohérents du pipeline (234 séries EMO avant publication sociale, ou 342 séries après publication sociale complète), tout en refusant un jeu social partiel. Le commit correctif est `40e035c`. Aucun nouveau résultat CI n'est encore disponible pour ce correctif ; il ne faut donc pas annoncer la validation finale comme acquise.

## 9. Contrôles automatisés de données ajoutés

Un nouveau fichier `tests/published-data.test.js` ajoute des contrôles automatisés sur :
- l'inventaire des 342 séries régionales et l'unicité des identifiants ;
- la couverture des six indicateurs EMO et des 12 régions ;
- la présence des sources HTTPS, l'ordre chronologique et la cohérence entre historique et dernière valeur ;
- la conservation explicite des valeurs manquantes ;
- les trois parcours Academy bilingues et la validité des index de réponses.

Le commit contenant ce test a été poussé sur la branche. Le déploiement Pages confirme la compilation du site, mais **ne prouve pas à lui seul que les tests Node ont été exécutés**. Le résultat CI de ce nouveau test reste à confirmer : sur la page Checks de la PR #22, au moment du contrôle du commit `f27bf50`, les entrées `Tests`, `HCP EMO Live Validation` et `KITN Veille Automatisée` étaient encore en attente, tandis que `Cloudflare Pages` était réussi.

**Décision :** continuer le travail sur la branche de revue. Ne pas fusionner ni basculer le domaine public tant que les vérifications fonctionnelles et la stratégie de déploiement ne sont pas terminées.


## 12. Rectification du statut CI et du périmètre Cloudflare

Une vérification ultérieure des exécutions GitHub Actions associées au commit correctif `40e035c46cfc57186321fb9864d7abb68866a00a` précise le statut :

- Le workflow `Tests` a terminé avec succès ; son job `python-tests` confirme les tests Python.
- Le workflow `HCP EMO Live Validation` a terminé avec succès, y compris l'extraction régionale, la publication de l'aperçu social et le build frontend avec les données régionales.
- Le workflow `KITN Veille Automatisée` a été annulé pendant l'étape `Validate HCP 2026 social indicators PDF`. Les étapes de distribution statistique, tests frontend et build Vite de ce run ont donc été ignorées.

**Conclusion CI corrigée :** les tests Python et la validation HCP dédiée sont réussis, mais le workflow principal de validation PR n'a pas terminé. Les tests frontend et le build Vite doivent encore être confirmés sur un run complet après le correctif. La mention antérieure d'une validation complète de la PR ne doit pas être interprétée comme un résultat acquis.

### Clarification Cloudflare

L'arborescence complète de la branche a été inspectée. Elle contient l'application Vite racine et un prototype Astro statique dans `web/`, mais aucun fichier Worker identifiable, aucune configuration Wrangler (`wrangler.toml`, `wrangler.json` ou `wrangler.jsonc`) et aucun workflow GitHub de déploiement Worker. Le code Vite charge les données publiées depuis des fichiers statiques `/data/*.json`.

Cela ne prouve pas que le service Cloudflare Worker externe est inutile : il peut être configuré séparément dans le tableau de bord Cloudflare ou dans un autre dépôt. En revanche, le dépôt KITN actuellement audité ne fournit pas de code ni de configuration permettant d'expliquer ou de réparer son build. Il faut obtenir le journal détaillé du build Worker et identifier le projet Cloudflare concerné avant toute modification. Le déploiement Cloudflare Pages de prévisualisation reste un service distinct.



## 13. Correctifs de revue et validation CI complète

Trois corrections de qualité ont été ajoutées après la revue ciblée :

- Le parseur des indicateurs HCP associe désormais les taux annoncés « respectivement » à l'ordre réel des catégories nommées dans le texte (jeunes/femmes), au lieu de supposer un ordre fixe. Deux tests couvrent l'ordre inversé et le cas où les catégories ne sont pas explicitement identifiées.
- L'extraction des tableaux régionaux HCP exige la couverture exacte des 234 clés attendues. Une pièce jointe complète est maintenant préférée à une pièce jointe partielle de même taille apparente. Un test reproduit le cas d'une extraction de 234 lignes contenant une clé inattendue, suivie d'une extraction réellement complète.
- Le modèle régional sélectionne les métadonnées de collecte disponibles dans les séries, sans dépendre uniquement de la première série nationale.

### Résultats CI obtenus sur le commit de code 04fa659

- **90 tests Python réussis**, dont les deux nouveaux tests de catégories HCP.
- **47 tests frontend réussis, aucun échec.**
- **Build Vite réussi** avec Vite 6.4.6.
- **Validation HCP EMO en direct réussie** : PDF régional extrait, indicateurs sociaux extraits et publiés dans la prévisualisation, données téléversées comme artefact, tests frontend et build réussis avec les données régionales réelles.
- Le workflow principal PR a terminé avec succès : tests Python, validations des deux PDF HCP, rapport de distribution des données, tests frontend et build Vite.
- Le job de collecte automatique est resté ignoré pour la PR, conformément à la configuration.

Exécutions vérifiables :
- [Tests et build de la PR — run 46055863772](https://github.com/KINGINTHENORTH988888/KITN/actions/runs/46055863772)
- [Validation HCP en direct — run 46055863928](https://github.com/KINGINTHENORTH988888/KITN/actions/runs/46055863928)

Après ces validations, le workflow HCP a publié les fichiers JSON vérifiés dans la branche isolée. Le commit de code testé (04fa659) est l'ancêtre direct du dernier commit de données (24516d8). La comparaison entre les deux ne montre que quatre fichiers de données générées : data/regional-statistics.json, data/statistics.json et leurs copies dans public/data/. Aucun code source n'a été modifié par cette publication automatique.

GitHub a ensuite marqué les nouveaux runs déclenchés sur le commit de données comme action_required, sans démarrer de jobs. Les tests et le build du code ont néanmoins bien réussi sur le commit parent, avec le jeu de données réel utilisé avant sa publication dans la branche. Si l'on veut que les checks soient également attachés au SHA le plus récent, les exécutions en attente devront être approuvées dans l'interface GitHub Actions.

**Limites restantes :** le contrôle Cloudflare Workers Build reste non résolu faute de journal détaillé et de configuration Worker dans le dépôt ; le contrôle réel du menu sur un viewport mobile de 360–390 px reste à effectuer. La PR demeure en brouillon et aucune fusion ou publication sur kitn.pages.dev n'a été faite.


## 13. Audit complémentaire des données publiées et stabilisation CI

### Inventaire et qualité des séries régionales

Sur la dernière publication de la branche :
- 342 séries sont présentes, et le champ `series_count` correspond à l'inventaire réel.
- Les 6 indicateurs EMO comportent chacun 39 séries (13 géographies × 3 milieux).
- Les 7 familles sociales couvrent 108 séries au total ; la fécondité comporte 36 séries et les six autres familles 12 chacune.
- Contrôles effectués : aucun identifiant dupliqué, aucune source ou URL HTTPS manquante, aucun historique vide ou désordonné, aucune valeur non finie et aucun libellé manquant.
- Les copies `data/` et `public/data/` ont le même contenu pour le jeu régional, le jeu national, l'index documentaire et Academy.

### Index documentaire

Le dernier index contient 269 notices :
- 167 publications scientifiques ;
- 229 notices marquées « valide » et 40 « à vérifier » ;
- 24 dates futures/anormales, toutes explicitement marquées « à vérifier » ;
- 20 notices sans date et 50 avec date partielle ;
- 58 notices sans auteur et 32 sans résumé. Ces deux champs restent facultatifs dans certaines sources et ne sont pas assimilés automatiquement à des erreurs ;
- 3 contributions manuelles KITN sans URL externe ni DOI. Elles restent des contributions internes et ne doivent pas être traitées comme des liens cassés.

Aucun identifiant ni DOI dupliqué n'a été détecté. Les notices aux dates futures sont conservées pour contrôle, mais leur statut empêche de les présenter comme des dates confirmées.

### Test de non-régression ajouté

`tests/published-data.test.js` contrôle désormais aussi :
- la synchronisation des fichiers publiés entre `data/` et `public/data/` ;
- la cohérence du nombre de notices et l'unicité de leurs identifiants ;
- la présence d'un titre et d'une source pour chaque notice ;
- l'obligation de classer « à vérifier » toute notice avec une anomalie de date.

### Réduction des relances CI inutiles

Le workflow principal filtre maintenant les événements de pull request par chemins pertinents (code, tests, pipeline, scripts et configuration). Les commits qui ne font que publier les JSON générés ne relancent plus l'intégralité des validations. Cela évite les exécutions redondantes lors des mises à jour automatiques du jeu HCP.

Le code applicatif et les validations HCP ont réussi sur le commit parent `1ba5a067` : les trois workflows (Tests, KITN Veille Automatisée et HCP EMO Live Validation) ont terminé avec succès. Les changements plus récents concernent le filtre CI, les données générées et les nouveaux tests d'intégrité ; leur validation complète sur le dernier SHA reste à confirmer.

### Accès Cloudflare nécessaire

Le journal Workers Build reste inaccessible sans session Cloudflare authentifiée. Une demande de connexion sécurisée Cloudflare a été ouverte dans cette conversation. Après connexion, il sera possible d'examiner le build en échec et de déterminer si le projet Worker est mal configuré ou si une dépendance externe manque. Aucun secret ni mot de passe ne doit être partagé dans le chat.


## 14. Corrections de navigation, tests et publication HCP

### Défaut de test corrigé

Le test `navigation.test.js` recherchait la déclaration de `normalizeSearchText` dans `src/main.js`, alors que la fonction a été extraite dans `src/search.js`. Le test vérifie maintenant l'import dans `main.js`, l'export et la normalisation NFD dans `search.js`, ainsi que les deux usages de recherche. Le code de normalisation lui-même n'avait pas besoin d'être modifié.

### Défaut responsive corrigé par inspection CSS

Le bloc `@media (max-width: 820px)` positionnait le menu mobile en absolu avec `top: 100%`. Comme l'en-tête est flexible et que le menu est rendu dans le flux du header, cette position pouvait placer le menu au mauvais endroit sur les écrans étroits. Le menu est désormais replacé dans le flux normal (`position: static`), en troisième ligne de l'en-tête, avec une largeur complète. Un test CSS de non-régression a été ajouté.

**Limite de validation :** l'automatisation du navigateur n'a pas pu émuler réellement 390 × 844. La présence du bouton et le changement de langue ont été observés, et le RTL a été confirmé, mais le comportement visuel mobile à 390 px et l'absence de débordement horizontal ne sont pas certifiés.

### Nettoyage du dépôt

Cinq fichiers Python compilés (`__pycache__/*.pyc`) suivis par Git ont été supprimés. Les règles `.gitignore` existantes les excluent déjà ; ils n'ont pas leur place dans le dépôt source.

### Validation frontend confirmée sur un commit précédent

Sur le commit de revue `1c7a628`, le job HCP a exécuté avec succès :
- les 52 tests frontend ;
- le build Vite de production ;
- les validations des deux publications HCP et la préparation des données d'aperçu.

La première publication finale des données avait échoué à cause d'une mise à jour concurrente de la branche (rejet Git « expected SHA »). Le workflow HCP a été modifié pour récupérer la dernière branche, rebaser son commit de données et réessayer jusqu'à trois fois, sans écraser les changements de code. **Le mécanisme corrigé a ensuite été validé :** sur le commit de code `46e69f0`, les workflows Tests, KITN Veille Automatisée et HCP EMO Live Validation ont tous terminé avec succès, y compris le build Vite et la publication HCP.

Le commit de données HCP qui suit (`9fc42df`) ne contient que les fichiers JSON vérifiés. Les exécutions `action_required` déclenchées après ce commit n'ont créé aucun job, conformément aux gardes ajoutées pour éviter de relancer des validations complètes sur une simple publication de données. Elles ne sont pas des échecs de test.

Le CSS responsive et son test ont été inclus avant la validation réussie sur `46e69f0). La limitation de navigateur demeure : aucun viewport réel de 390 px n'a pu être émule, donc l'absence de débordement à cette largeur reste à confirmer sur un vrai appareil ou émulateur.
