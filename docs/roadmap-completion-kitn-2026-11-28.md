# KITN — Feuille de route complète jusqu'à finalisation

**État au 28 novembre 2026 — branche `audit/kitn-quality-review-2026-11` — PR #22**

Ce document est le point de reprise global. Une fonctionnalité codée n'est considérée terminée qu'après validation des données, tests, rendu preview et comportement réel. Les cases restent ouvertes tant que la preuve correspondante n'existe pas.

## État déjà réalisé sur la branche

- Pipeline Python multi-sources et workflows GitHub Actions conservés et renforcés.
- OpenAlex : espacement, Retry-After, backoff, pagination, coupe-circuit 429, authentification par secret documentée et tests.
- HCP EMO : extraction nationale, régionale (234 séries) et recueil social 2026 (108 séries régionales), contrôles live PDF.
- BAM CKAN : extraction multi-feuilles XLSX, parsing numérique FR/EN, identifiants de séries renforcés et validation structurelle de 1 048 séries candidates sur 42 jeux.
- MONIA : erreurs diagnostiquées proprement ; le collecteur reçoit toujours HTTP 403 en environnement automatisé, sans contournement ni données inventées.
- Banque mondiale : 14 indicateurs configurés, dont emploi, santé, démographie et éducation ; collecte effective complète encore à confirmer.
- Statistiques : conservation de l'historique, filtres de périodes, tri chronologique, exclusion des observations futures, contrôles de valeurs, séries régionales et avertissements méthodologiques.
- Veille : rapprochement registre/rapport santé, états non vérifiés, fraîcheur du rapport, détails des erreurs.
- Bibliothèque : qualité documentaire, titres/sources/dates manquants, liens sûrs, DOI/URL et doublons potentiels.
- Navigation publique Vite autour des six espaces : Accueil, Maroc en chiffres, Veille, Études & recherche, Bibliothèque, KITN Academy ; vues dédiées, URLs, recherche, pagination et recommandations transversales.
- Academy : parcours DGSN, IRAT, Administrateur, contenus FR/AR, leçons, QCM avec explications, progression locale, tableau de bord, export/import JSON.
- Tests Python/JavaScript ajoutés, Vite mis à niveau, documentation d'audit et inventaire des sources créés.

## Limites confirmées au dernier contrôle

- Tête observée : `1ab12bf748323ea7a7c6cdd6a04c601a0a6b36a5` (28/11/2026 14:13 UTC).
- PR #22 ouverte, en brouillon, non fusionnée ; GitHub indique `mergeable=false`.
- Comparaison avec `main` : 689 commits en avance, 1 en retard. Le diff est très volumineux (80 fichiers ; gros JSON de données). Il faut une revue spécifique avant toute fusion.
- Les workflows Actions consultés ne prouvent pas encore une validation CI sur la tête exacte `1ab12bf`. Les anciens résultats verts ne valent pas validation de ce SHA.
- MONIA reste bloqué en HTTP 403 dans le runner automatisé.
- OpenAlex doit être confirmé en collecte réelle multi-pages avec le secret gratuit `OPENALEX_API_KEY` configuré.
- La production `https://kitn.pages.dev/` est volontairement inchangée. Une preview réussie ne vaut pas publication.
- Le contrôle manuel navigateur complet (console, réseau, interactions, mobile, RTL) reste à certifier.
- `web/` est un prototype Astro séparé ; l'application principale du dépôt est Vite. Ne pas basculer de framework sans décision d'architecture.

## Phases restantes

### A — Stabilisation de la branche et revue du diff
- [ ] Identifier précisément le commit de `main` absent de la branche et comprendre la divergence ; aucune fusion/rebase automatique.
- [ ] Examiner les 80 fichiers et les énormes diffs JSON : distinguer code, données générées, changements utiles et bruit.
- [ ] Contrôler les secrets, fichiers temporaires, données personnelles et fichiers compilés.
- [ ] Examiner les 191 fichiers `node_modules/` suivis par Git et coordonner avec la PR #26 séparée ; ne pas supprimer à l'aveugle.
- [ ] Obtenir tous les workflows verts sur le SHA exact de tête : Python, frontend, build Vite, HCP/BAM et publication.
- [ ] Analyser les logs des échecs/annulations et vérifier qu'aucun workflow PR ne publie de données dans `main` ou en production.

**Sortie attendue :** branche cohérente, diff compris, aucun secret, CI verte sur la tête exacte.

### B — Fiabilité de toutes les sources
- [ ] OpenAlex : configurer la clé gratuite dans GitHub Secrets, exécuter une collecte multi-pages réelle, vérifier les six requêtes, quotas, pagination, cache, doublons et reprise après 429.
- [ ] MONIA : demander à Bank Al-Maghrib un accès ou flux officiel autorisé ; garder le statut bloqué tant qu'aucun accès n'est fourni. Aucun contournement.
- [ ] BAM CKAN : échantillonner les classeurs et les 1 048 séries candidates ; vérifier définition, unité, fréquence, période, feuille/cellule, valeurs aberrantes, doublons sémantiques et ressources non temporelles.
- [ ] HCP EMO : comparer indicateurs nationaux/régionaux aux PDF officiels, conserver la rupture ENE/EMO et les drapeaux de significativité.
- [ ] HCP social 2026 : contrôler les 8 indicateurs nationaux et 108 séries régionales sur les tableaux officiels.
- [ ] Banque mondiale : confirmer la collecte/publication des 14 indicateurs et étiqueter correctement les estimations modélisées OIT.
- [ ] MEF : contrôler les neuf séries, séparer séries statistiques et notices documentaires.
- [ ] Vérifier chaque source activée, les 14 types de collecteurs, calendriers, erreurs réseau, retries, timeouts et fraîcheur.
- [ ] Vérifier que les anciennes données sont conservées en cas de panne et signalées comme anciennes.

**Sortie attendue :** chaque source activée a une provenance, une date, un statut honnête et un comportement d'échec testé.

### C — Contrat de données et traçabilité
- [ ] Définir/versionner le schéma des séries : identifiant, définition, unité, fréquence, période, géographie, valeur, source/URL, date de référence, collecte, statut et notes.
- [ ] Définir migrations et compatibilité des anciens JSON ; sauvegarder avant toute transformation.
- [ ] Distinguer date de publication, observation, référence, collecte et génération.
- [ ] Contrôler la fraîcheur par série, pas uniquement par rapport global.
- [ ] Formaliser valeurs manquantes, non significatives, confidentielles, non applicables et révisées ; jamais les convertir silencieusement en zéro.
- [ ] Journaliser les rejets avec source, feuille/ligne/colonne et raison.
- [ ] Détecter doublons sémantiques, ruptures, changements d'unité/définition/géographie.
- [ ] Vérifier fusion des notices DOI/URL/titres/auteurs et conservation des champs riches.
- [ ] Comparer systématiquement `data/` et `public/data/`.
- [ ] Documenter méthodes, limites, licences et droits de réutilisation.

**Sortie attendue :** tout chiffre est traçable, interprétable et daté.

### D — Finalisation de « Maroc en chiffres »
- [ ] Réconcilier le nombre de séries entre catalogue, JSON, preview et interface.
- [ ] Vérifier pôles, unités, fréquences annuelles/trimestrielles/mensuelles/quotidiennes et filtres de dates.
- [ ] Tester tri chronologique, `latest`/`previous`, périodes futures et séries irrégulières.
- [ ] Tester graphiques avec séries vides, nulles, longues, fréquences et unités différentes.
- [ ] Vérifier comparaisons régionales, milieux urbain/rural/ensemble et notes de significativité.
- [ ] Compléter les fiches indicateurs : définition, méthode, source, unité, date de référence, collecte et historique.
- [ ] Vérifier export/téléchargement, accessibilité et performance des gros JSON sur mobile.

**Sortie attendue :** chiffres exacts, lisibles, datés, comparables seulement lorsque la méthode le permet.

### E — Finalisation des espaces publics
- [ ] Accueil : six espaces visibles, recherche globale, sélection éditoriale équilibrée et pas de surreprésentation d'un concours.
- [ ] Veille : filtres institution/domaine/date, pagination et distinction entre nouvelle publication et contenu réindexé.
- [ ] Études & recherche : auteurs, disciplines, années, DOI, dédoublonnage et liens officiels.
- [ ] Bibliothèque : filtres, catégories, formats, qualité ; ne jamais afficher un lien HTML comme un PDF direct.
- [ ] Fiches de lecture : métadonnées, résumé/analyse identifiés, citation, source/DOI/PDF et respect des licences.
- [ ] Recommandations : pertinence réelle, pas de liens faibles, équilibre inter-espaces.
- [ ] Recherche globale : accents, français/arabe, fautes courantes, pertinence et rapidité.
- [ ] Favoris : persistance/export si nécessaire, sans prétendre à une synchronisation cloud inexistante.
- [ ] Vérifier URL directe, rechargement, retour navigateur, liens partagés et fallback Cloudflare.
- [ ] Harmoniser états vides, erreurs, chargements et textes FR/AR.

**Sortie attendue :** chaque espace est cohérent, utile et complet selon son rôle.

### F — Finalisation de KITN Academy
- [ ] Inventorier les matières, objectifs, leçons, fiches et QCM de DGSN, IRAT et Administrateur.
- [ ] Vérifier exactitude/actualité des cours et corrections ; distinguer sources officielles et conseils.
- [ ] Compléter la couverture matière par matière selon le périmètre pédagogique final.
- [ ] Vérifier les 30 QCM et les explications de chaque option.
- [ ] Tester progression locale, rechargement, langue, reset d'un parcours et conservation des autres.
- [ ] Tester import/export entre appareils, JSON invalide, gros fichier, version future et sauvegarde partielle.
- [ ] Expliquer clairement que la progression est locale à l'appareil, sans compte/synchronisation actuellement.
- [ ] Tester accessibilité clavier/lecteur d'écran, mobile et RTL.
- [ ] Maintenir les contenus et fonctions gratuits, sans API payante.

**Sortie attendue :** parcours complets selon le périmètre validé, fiables, bilingues et sans perte de progression.

### G — UX, accessibilité, sécurité et performance
- [ ] Parcours navigateur complet desktop et largeurs 360/390/768 px.
- [ ] Test FR et AR RTL sur menus, tableaux, graphiques, QCM, modales et pagination.
- [ ] Clavier, focus visible, focus trap/restauration, Escape, labels, ARIA et contrastes.
- [ ] Liens externes, protocoles, nouvelles fenêtres et données importées.
- [ ] XSS/injection HTML, import JSON, taille de fichier, stockage local et erreurs.
- [ ] Mesurer démarrage, navigation, gros jeux de données, images et dépendances.
- [ ] Vérifier console, réseau, 404, requêtes cassées et erreurs runtime.
- [ ] Audit dépendances et traitement des alertes ; aucun service payant sans accord.
- [ ] Politique de confidentialité claire sur les données locales.

**Sortie attendue :** application accessible, sûre et fluide sur les appareils ciblés.

### H — Contributions et administration
- [ ] Décider si les contributions publiques sont nécessaires.
- [ ] Si oui, créer authentification, rôles, validation, modération, anti-spam et journal d'audit.
- [ ] Ne pas présenter les fonctions locales actuelles comme une administration multi-utilisateur sécurisée.
- [ ] Garder outils de pilotage/santé des sources dans un espace interne protégé.
- [ ] Prévoir sauvegarde/restauration et historique éditorial.
- [ ] Ne pas ajouter de coût récurrent sans approbation.

**Sortie attendue :** aucune fonction sensible exposée sans contrôle d'accès.

### I — Cloudflare, preview et production (après autorisation explicite seulement)
- [ ] Vérifier le vrai projet Cloudflare : dépôt, branche production, répertoire racine, commande, sortie et variables.
- [ ] Confirmer que le projet cible bien Vite racine et non le prototype Astro.
- [ ] Déployer sur preview seulement et vérifier le SHA servi.
- [ ] Comparer routes, JSON, compteurs et ressources entre preview et production.
- [ ] Smoke test : accueil, six espaces, publication, statistiques, recherche, Academy, Veille et endpoints JSON.
- [ ] Préparer sauvegarde et rollback.
- [ ] Réconcilier avec `main` après revue du commit divergent et du diff.
- [ ] Fusionner uniquement après autorisation explicite ; publier en production uniquement après autorisation explicite.
- [ ] Après publication, vérifier le domaine réel, les routes, données, workflows et premières collectes.

**Sortie attendue :** version approuvée effectivement servie et retour arrière possible.

### J — Exploitation durable
- [ ] Alertes sur source bloquée, données périmées, chute anormale de volume et échec workflow.
- [ ] Revue régulière des rapports santé et workflows planifiés.
- [ ] Procédure de revue des nouvelles sources et changements de format.
- [ ] Snapshots/versionnage des données et historique de changements.
- [ ] Sauvegardes gratuites et test de restauration.
- [ ] Suivi des quotas : privilégier les services gratuits, aucune souscription sans accord.
- [ ] Maintenir ce document à jour à chaque session.

## Ordre recommandé

1. A — branche, diff et CI.
2. B + C — sources, qualité et traçabilité.
3. D — statistiques.
4. E + F — espaces publics et Academy.
5. G — audit navigateur, sécurité, accessibilité et performance.
6. H — contributions/admin si le besoin est confirmé.
7. I — preview puis production, après accord.
8. J — exploitation continue.

## Consignes de reprise pour chaque nouveau chat

1. Lire ce document avant de modifier le dépôt.
2. Vérifier la tête de branche, le PR #22, le comparatif avec `main` et les derniers workflows.
3. Ne pas refaire les tâches déjà réalisées sans avoir identifié un défaut concret.
4. Continuer sur la branche d'audit, sauf instruction contraire.
5. Ne jamais merger, rebaser, fermer le PR ou déployer en production sans autorisation explicite.
6. Toujours distinguer test unitaire, CI, validation live source, preview et production.
7. Rester sur des solutions gratuites ; demander avant toute dépense.
8. À chaque session, mettre à jour ce document et terminer le compte rendu par toutes les phases encore ouvertes.

**Prochaine reprise technique :** vérifier d'abord le SHA de tête actuel de la branche d'audit et rechercher les workflows associés à ce SHA exact (ne pas supposer que les commits précédents ont déclenché Actions). Ensuite, poursuivre l'audit des données statistiques et de leur schéma. Les commits de correction booléenne régionale sont consignés dans la section 8. La production reste inchangée.


## 6. Mise à jour de l'audit de branche — 28 novembre 2026, après ajout de la feuille de route

### Divergence avec `main` : cause du commit manquant identifiée

Le comparatif GitHub confirme :
- branche d'audit : 690 commits en avance sur `main` ;
- branche `main` : 1 commit en avance sur la base commune ;
- base commune : `08a51613ae4c5c795767ccb8a9cd89a590b58394` ;
- commit présent uniquement sur `main` : `2a134a864fbed7747c78e1cbfa96217e603e7fb6`, intitulé `chore(data): mise à jour automatique de la veille KITN`.

Ce commit ne contient pas de nouvelle logique applicative. Il actualise les fichiers générés :
- `data/index/search-index.json` et sa copie publique ;
- `data/sources-health.json` ;
- `data/statistics.json` et sa copie publique.

La publication du 28 novembre indique 269 notices, 20 sources actives, 1 139 éléments récupérés et 121 acceptés. Les cinq collecteurs OpenAlex apparaissent toujours en HTTP 429 et MONIA en HTTP 403 dans le rapport. Le rapport de branche est plus ancien (27 novembre 16:33 UTC) et indique 662 récupérés / 120 acceptés. Ces données ne doivent pas être fusionnées séparément du jeu statistique associé : relancer la collecte sur la branche après stabilisation est préférable à un cherry-pick aveugle de snapshots.

Le gros fichier `data/statistics.json` dépasse la capacité de lecture du connecteur GitHub dans cette session ; son contenu n'a donc pas été déclaré comparé ou validé. Son diff représente la majeure partie du volume PR et reste un point d'audit obligatoire avec un checkout local ou un artefact CI.

### Inventaire réel du PR

- 81 fichiers modifiés.
- 312 164 ajouts et 265 306 suppressions selon les métadonnées GitHub du PR.
- Aucun chemin `node_modules/` dans la liste exhaustive des 81 fichiers modifiés.
- Cinq caches Python suivis apparaissent supprimés : quatre dans `pipeline/__pycache__/` et un dans `tests/__pycache__/`. Les règles `.gitignore` les excluent déjà.

L'ancienne mention de 191 fichiers `node_modules/` n'est pas confirmée par le PR actuel et ne doit pas être reprise comme un fait.

### Fraîcheur des données de veille

La branche contient encore un rapport de santé et un index datés du 27 novembre à 16:33:58 UTC ; `main` contient la publication du 28 novembre à 04:25:26 UTC. Les copies `data/` et `public/data/` sont synchronisées sur la branche, mais elles sont plus anciennes que le dernier snapshot de `main`. Ne pas remplacer uniquement certains fichiers générés : synchroniser le jeu complet après une collecte cohérente sur la branche.

### Reproductibilité du prototype Astro

Le prototype `web/` déclare `astro: ^4.16.0`, mais ne possède pas de `web/package-lock.json`. Le workflow construit ce prototype avec `npm --prefix web install --no-package-lock`. Le build peut donc résoudre des versions différentes dans le temps. Cette cible est distincte de l'application Vite active et du déploiement Pages ; si le Worker Astro reste nécessaire, ajouter une stratégie de verrouillage reproductible et tester le Worker séparément, sans changer ses assets ou sa destination de production implicitement.

### État CI de la tête courante

Le commit documentaire `9154b6afd9c27386109a5d40b3b260b04089fd78` est la tête de branche au moment du contrôle. Aucun status check ni workflow associé à ce SHA n'a été retourné. Les derniers workflows visibles réussis sont encore rattachés à des SHA antérieurs. La CI complète sur la tête exacte demeure donc non vérifiée.


## 7. Contrôle qualité de l'index documentaire et santé des sources — 28 novembre 2026

Comparaison calculée directement sur les fichiers JSON de la branche et de `main` :

### Index documentaire (269 notices)
- Les deux snapshots contiennent exactement 269 notices et le champ `total` est cohérent.
- Répartition identique : 229 `valide`, 40 `a_verifier`.
- 22 identifiants de source historiques présents dans l'index, pour 20 sources actuellement actives.
- Aucun identifiant de notice dupliqué et aucun DOI dupliqué.
- 24 notices portent une anomalie/date future et restent correctement classées `a_verifier`.
- 113 notices ont un DOI ; 58 n'ont pas d'auteur et 32 n'ont pas de résumé. Ces champs ne sont pas obligatoires pour toutes les sources.
- Trois notices n'ont volontairement pas d'URL externe : les contributions éditoriales internes `manual_studio`, origine `manuel`, sans DOI ni PDF. Ce n'est pas une erreur de source.

### Test de non-régression renforcé
Le test `tests/published-data.test.js` ajoute maintenant une règle explicite :
- une notice avec URL de publication doit utiliser HTTP ou HTTPS ;
- une URL PDF éventuelle doit utiliser HTTP ou HTTPS ;
- une notice sans URL externe n'est admise que pour une contribution manuelle KITN explicitement marquée `source_id=manual_studio` et `origine=manuel`, sans DOI ni PDF fictif.

Contrôle statique du vrai index de branche : 269 notices parcourues, les trois exceptions manuelles identifiées, aucune autre URL absente et aucun protocole non HTTP(S) détecté. Le fichier de test a été compilé en JavaScript après retrait des imports Node pour vérifier sa syntaxe. **La suite Node complète n'a pas été exécutée dans cette session** ; le nouveau test attend donc encore le résultat CI.

### Santé des sources — snapshot le plus récent disponible sur main
Le rapport du 28 novembre à 04:25:26 UTC indique :
- 20 sources actives ;
- 1 139 éléments récupérés, 121 acceptés ;
- 12 sources en état OK, 7 en erreur et 1 en avertissement ;
- les 6 requêtes OpenAlex restent en HTTP 429 ;
- MONIA reste en HTTP 403 ;
- HCP Labour Statistics reste en avertissement : aucun document exploitable détecté.

Le snapshot de la branche est daté du 27 novembre à 16:33:58 UTC (662 récupérés, 120 acceptés), mais conserve la même répartition des statuts. Le commit de données de `main` a amélioré le volume récupéré sans résoudre les erreurs de disponibilité. La clé gratuite `OPENALEX_API_KEY` et le budget/quota fournisseur doivent être vérifiés avant d'attribuer les 429 à un défaut de code.

### Tête de branche après les corrections de documentation et de test
- Dernier correctif de code ajouté : `918c086` — test des URLs et des exceptions de contributions manuelles.
- Vérification syntaxique du test : réussie.
- Contrôle statique des 269 notices : aucune anomalie sur les URLs selon la règle ajoutée.
- CI complète sur la tête actuelle : toujours non confirmée.
- PR #22 : ouverte, brouillon, non fusionnée ; aucune publication production.

## 8. Contrôle des types numériques régionaux — 28 novembre 2026

- Un défaut subtil a été identifié dans `_merge_regional_statistics_series` : en Python, `bool` hérite de `int`, donc `True` et `False` satisfaisaient le contrôle `isinstance(value, (int, float))` et pouvaient être publiés comme observations 1/0.
- Correction : les booléens sont désormais rejetés explicitement avant le contrôle des nombres et des valeurs finies.
- Test de non-régression ajouté pour les deux valeurs booléennes, en complément du test qui rejette déjà les chaînes numériques mal formatées.
- Commits : `0ac0a57d396b04068b40e3bafc3c9638e6fc45c9` (correction) et `17ee00fed104e9e37353d35cd9c87087d3fa141e` (test).
- Validation : modification ciblée du code et ajout du test effectués sur la branche d'audit. La suite Python/Node complète et les workflows CI doivent encore être exécutés sur la nouvelle tête ; aucun résultat CI n'est revendiqué.
- Impact : les observations régionales booléennes ne peuvent plus être converties implicitement en 1/0. Les valeurs numériques finies et les valeurs manquantes explicites `null` restent acceptées.
- Contrôle approfondi complémentaire : les anciennes observations déjà présentes dans l'historique étaient copiées sans validation. Les snapshots historiques pouvaient donc conserver des booléens ou des chaînes numériques invalides, même après le premier correctif.
- Deuxième correction : l'historique repris est désormais assaini avant fusion ; les valeurs booléennes, les chaînes non numériques et les nombres non finis sont écartés, tandis que les valeurs numériques valides et `null` sont conservés.
- Test supplémentaire : un historique antérieur contenant `True` et une chaîne invalide est fusionné avec de nouvelles observations ; seules les observations valides sont conservées.
- Commits complémentaires : `4fc9ae9b8168e714c4f0e3a6d76390c301089dc7` (assainissement de l'historique) et `cef26fd796488fb132905e26064b4a082d8ea50f` (test).

