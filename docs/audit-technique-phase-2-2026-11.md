# KITN — Audit technique approfondi (phase 2)

**Date de l'audit :** 27 novembre 2026  
**Périmètre :** branche `main`, lecture du code et des fichiers de configuration  
**Statut :** audit documentaire uniquement — aucun code de production modifié, aucun déploiement effectué.

## 1. Résumé exécutif

KITN dispose déjà d'un socle réel : un pipeline Python, un index documentaire, des collecteurs institutionnels et académiques, des séries statistiques, une interface Vite, une interface Astro expérimentale et une automatisation GitHub Actions.

Le principal risque n'est pas l'absence de fonctionnalités. C'est l'écart entre :
- ce que le système collecte ;
- ce qu'il accepte et normalise ;
- ce qu'il considère comme une donnée statistique ;
- ce que l'interface présente à l'utilisateur comme récent, fiable ou vérifié.

La prochaine évolution doit donc commencer par la qualité et la traçabilité des données, puis seulement par la migration de l'interface.

## 2. Architecture réellement présente

### Application publiée selon la documentation du dépôt

Le README du dépôt décrit l'application racine comme l'application Vite de production, avec sortie `dist`. Le workflow principal exécute `npm run build` à la racine.

### Application Astro

Le dossier `web/` contient une seconde application Astro 4, avec ses propres pages et son propre modèle de données. Le README la décrit comme un prototype alternatif, non déployé par le projet Cloudflare Pages principal.

**Conséquence :** il ne faut pas commencer par remplacer Vite par Astro. Il faut d'abord vérifier les paramètres réels du projet Cloudflare Pages (répertoire racine, commande de build, répertoire de sortie, branche de production et variables). Le dépôt seul ne donne pas accès à la configuration du tableau de bord Cloudflare.

### Pipeline

Le pipeline est séparé en collecteurs, processeurs et orchestration :
- `pipeline/collectors.py` : récupération et extraction des données ;
- `pipeline/processors.py` : nettoyage, pertinence, classification, normalisation ;
- `pipeline/run_pipeline.py` : fusion, indexation, santé des sources, séries statistiques et synchronisation vers `public/data/`.

### Automatisation

`.github/workflows/main.yml` :
- déclenchement programmé deux fois par jour, à 03:30 et 15:30 UTC ;
- déclenchement manuel ;
- tests Python et build Vite à la racine ;
- exécution du pipeline ;
- copie de certains fichiers Academy vers `public/data/` ;
- commit automatique limité à une liste de fichiers de données générés.

Le workflow ne construit pas l'application Astro.

Le dépôt possède également un second workflow, `.github/workflows/tests.yml`, qui exécute les tests Python sur les changements de `pipeline/**`, `tests/**` et `data/sources.json`. Il ne construit pas le frontend. Les deux workflows ont donc des rôles distincts : tests Python seuls dans `Tests`, puis tests Python + build Vite dans le workflow principal selon ses déclencheurs.

Au moment de cet audit, les deux dernières exécutions liées au commit du 27 novembre à 02:15 sont réussies : le workflow principal (run #198) et le workflow `Tests` (run #50). Le dernier fichier de santé des sources disponible reste daté de 02:15:39 UTC. La liste des exécutions consultée ne montrait pas encore de nouvelle exécution planifiée le 27 novembre à 03:30 UTC ; cela mérite une vérification opérationnelle, sans conclure à une désactivation du planificateur (les exécutions programmées peuvent être retardées).

## 3. Constats techniques importants

### 3.1 OpenAlex — six sources séparées, toutes en erreur 429

Les six entrées OpenAlex sont activées séparément dans `data/sources.json`. Le dernier état de santé consulté les montre toutes en erreur HTTP 429.

Dans `pipeline/run_pipeline.py`, les sources actives sont parcourues dans une boucle. Dans `pipeline/collectors.py`, la fonction de récupération HTTP réessaie certaines erreurs temporaires, dont 429, trois fois, avec un délai court ou le délai fourni par le serveur.

**Risque :** les six requêtes thématiques peuvent continuer à échouer ensemble, et les relances actuelles ne constituent pas une vraie stratégie de limitation globale.

**Correction recommandée, sans supprimer les six thèmes :**
1. centraliser les appels OpenAlex dans un client commun ;
2. respecter strictement `Retry-After` ;
3. appliquer un backoff exponentiel avec jitter et un plafond de tentatives ;
4. mutualiser le cache par URL/requête et éviter de redemander les mêmes résultats ;
5. conserver les derniers résultats, mais afficher clairement leur date de fraîcheur ;
6. limiter le nombre de requêtes simultanées et ajouter un délai partagé entre les sources OpenAlex.

Ne pas désactiver ou supprimer les six sources avant d'avoir testé ce mécanisme sur une branche isolée.

Une première mesure a été ajoutée sur la branche de revue : espacement minimal de trois secondes entre les appels OpenAlex, quatre tentatives au maximum, prise en compte de `Retry-After` en secondes ou en date HTTP, délai exponentiel avec variation aléatoire et arrêt propre si le fournisseur demande une attente supérieure à deux minutes. Des tests simulent les réponses 429/503. Cela améliore la robustesse, mais ne prouve pas encore que le quota OpenAlex est rétabli : il faudra vérifier une collecte réelle lorsque l'exécution complète du pipeline sera autorisée.

### 3.2 HCP EMO — collecteur spécialisé trop dépendant de la forme de la page

La source `hcp_labour_statistics` est configurée sur les pages de l'actualité du marché du travail, en version mobile et classique. Le dernier état de santé indique qu'aucun document exploitable n'a été détecté.

Le collecteur :
- recherche un titre ou un slug contenant « marché du travail », « trimestre » et une année ;
- trie les candidats par trimestre ;
- extrait les chiffres avec plusieurs expressions régulières très précises ;
- ne conserve que le dernier trimestre détecté.

Les tests unitaires couvrent un exemple HTML bien déterminé et huit indicateurs attendus. Ils ne prouvent pas que toutes les variantes réelles de pages HCP sont prises en charge.

**Risque :** un changement du titre, de la structure HTML, de la formulation des paragraphes ou de l'ordre des chiffres peut faire échouer toute l'extraction sans erreur explicite.

**Correction recommandée :**
1. enregistrer un échantillon HTML anonymisé/figé de chaque variante de page ;
2. tester séparément la découverte des liens, la détection du trimestre et l'extraction de chaque indicateur ;
3. ajouter des expressions alternatives avec validation du contexte ;
4. produire un avertissement par indicateur absent, au lieu de retourner silencieusement une liste vide ;
5. conserver la page officielle, la date de publication et le libellé exact de la période comme provenance.

Ne jamais déduire un chiffre qui n'est pas explicitement présent dans la publication.

### 3.2 bis HCP EMO — publication officielle retrouvée et rupture méthodologique

La [page officielle HCP du troisième trimestre 2026](https://www.hcp.ma/Situation-du-marche-du-travail-au-Maroc-au-troisieme-trimestre-2026-selon-l-enquete-sur-la-main-d-oeuvre-EMO2026_a4364.html) existe bien et apparaît dans les deux pages de liste (mobile et classique). Elle porte une date de publication du 3 novembre 2026. Le contenu publié contient les valeurs nationales et les taux par catégories que le collecteur cherche à extraire. La nouvelle enquête EMO remplace l'ancienne ENE et introduit des changements conceptuels importants ; le HCP précise dans sa [note méthodologique du deuxième trimestre 2026](https://www.hcp.ma/Situation-du-marche-du-travail-au-Maroc-au-deuxieme-trimestre-de-2026-a-partir-de-la-nouvelle-enquete-sur-la-main-d_a4342.html) que les résultats EMO 2026 ne sont pas directement comparables aux anciennes séries ENE. Cette rupture doit être conservée dans les métadonnées et dans toute future visualisation historique.

Sur la base de la structure HTML observée, un test de régression a été ajouté : lien de liste libellé « Lire la suite », URL réelle du troisième trimestre 2026, titre Open Graph et paragraphes contenant les résultats. Le test confirme que le parseur extrait les huit indicateurs nationaux attendus à partir de cette structure.

Le collecteur a aussi été rendu plus explicite :
- les erreurs de lecture des pages de liste sont remontées dans l'état de santé ;
- les erreurs de lecture de la page détaillée sont distinguées d'un échec d'extraction ;
- les indicateurs manquants sont signalés individuellement ;
- si la page est détectée mais qu'aucune valeur n'est extraite, le collecteur renvoie une erreur diagnostiquable plutôt qu'une liste vide silencieuse.

Le test de régression confirme le comportement sur une fixture fidèle à la publication officielle. Il ne remplace pas encore une exécution réelle du collecteur avec les requêtes réseau du pipeline GitHub Actions.

### 3.3 MEF — séries statistiques et notices documentaires sont deux flux différents

Le collecteur MEF renvoie des objets portant `statistics_series`. L'orchestrateur les compte et les place dans le fichier statistique avant le traitement des notices documentaires.

Le dernier bilan indique neuf séries collectées et zéro notice documentaire acceptée. Ce n'est pas nécessairement une panne : une série statistique peut être exploitable sans être une publication de bibliothèque.

**Amélioration nécessaire :**
- séparer les métriques « séries extraites », « séries validées », « séries publiées » et « notices documentaires acceptées » ;
- documenter l'unité, la période, la définition et la méthode de chaque indicateur ;
- vérifier les unités et les formats de période ;
- rendre visible la date de référence, distincte de la date de collecte.

### 3.4 BAM CKAN — volume extrait ne signifie pas volume validé

Le collecteur CKAN récupère un grand nombre de ressources, notamment des classeurs XLSX. L'état de santé compte les objets statistiques extraits avant le filtrage final. Le pipeline applique ensuite un filtre dédié aux séries BAM CKAN, notamment sur certaines unités et années futures.

**Risque de compréhension :** un chiffre élevé dans le tableau de santé peut être interprété comme autant de séries prêtes à être publiées, alors qu'il s'agit d'objets extraits et non nécessairement validés.

**Correction recommandée :** distinguer explicitement :
- ressources découvertes ;
- fichiers téléchargés ;
- tableaux analysés ;
- séries candidates extraites ;
- séries rejetées, avec motif ;
- séries validées et publiables.

Ajouter des tests sur les unités, les dates, les doublons, les valeurs manquantes, les séries mensuelles/trimestrielles/annuelles et les classeurs mal formés. Conserver le fichier source et l'URL de la ressource pour audit.

Une première validation plus stricte a été ajoutée sur la branche de revue : les séries BAM CKAN portant une unité absente ou indéterminée, une valeur non finie (NaN/infini), une période invalide ou future, ou moins de deux périodes distinctes sont écartées du tableau statistique. Les autres sources statistiques ne sont pas concernées par ce filtre. Les tests vérifient ces cas limites ; le volume réel de séries retenues devra être comparé après une collecte complète.

### 3.5 Fraîcheur statistique — risque de présenter une ancienne valeur comme actuelle

Le pipeline conserve les anciennes séries statistiques lorsqu'une source ne fournit pas de nouvelle série : les séries précédentes sont réintroduites avec `setdefault` si leur code n'a pas été collecté pendant l'exécution courante.

C'est utile pour éviter de perdre l'historique. Mais le schéma doit distinguer la date de génération du fichier de la date de dernière observation de chaque indicateur.

**Risque :** le fichier global peut être régénéré aujourd'hui alors qu'une série conservée date d'une collecte antérieure. Une interface qui affiche seulement la date de génération peut donner une impression trompeuse de fraîcheur.

**Correction recommandée :**
- conserver `last_observation_period` ;
- conserver `last_successful_collection_at` ;
- ajouter `freshness_status` : `fresh`, `stale`, `unknown` ;
- ajouter `last_source_status` ;
- afficher « dernière valeur disponible » et sa période, sans la présenter comme une valeur du jour ;
- ne jamais supprimer l'historique lorsqu'une source échoue.

### 3.6 Interface d'administration — les modifications actuelles sont locales au navigateur

Dans `src/main.js`, les favoris, contributions manuelles et certains statuts sont gérés via `localStorage`. Les contributions peuvent être exportées/importées en JSON pour synchronisation manuelle avec le dépôt.

Les statuts modifiés pour les notices distantes sont gardés dans un objet JavaScript en mémoire ; ils ne constituent pas un système de validation centralisé et persistant.

**Conséquence :** l'espace « Administration & contributions » visible dans l'application ne doit pas être considéré comme un véritable back-office sécurisé. Les modifications d'un visiteur ne deviennent pas automatiquement des changements partagés dans la base.

**Correction recommandée :**
- retirer l'administration de la navigation publique ;
- conserver les contributions publiques comme propositions soumises à modération ;
- mettre en place une interface privée séparée ;
- stocker les décisions éditoriales dans une source persistante avec auteur, date, motif et historique ;
- réserver l'import/export JSON aux opérations de migration ou de secours.

### 3.7 Prototype Astro — écart de contrat de données à corriger avant toute bascule

Dans `web/src/lib/data.ts`, l'interface attend notamment `updated_at`, tandis que le pipeline documente et génère `generated_at` pour l'index. Le code Astro lit `parsed.updated_at` et peut donc afficher une date de secours au lieu de la vraie date de génération.

Le prototype Astro ne doit pas devenir la base de production avant :
- harmonisation du schéma ;
- tests de lecture de tous les fichiers générés ;
- contrôle des archives mensuelles ;
- tests de navigation et des pages de détail ;
- validation de la sortie statique et de l'hébergement.

### 3.8 Tableau statistique — filtres de catégorie et périodes mal adaptés aux fréquences

Deux comportements ressortent du rapprochement entre `src/main.js` et les collecteurs :

**Filtre de catégorie :** le tableau propose seulement les catégories `economie_finances_publiques` et `societe_developpement_humain`, puis compare ces valeurs directement à `indicator.category`. Or le collecteur BAM générique crée des séries avec `category: "Monétaire et financier"`. Certaines séries BAM CKAN utilisent également des libellés de catégorie descriptifs. Elles peuvent donc apparaître dans « Tous les indicateurs » mais disparaître lorsqu'un utilisateur sélectionne « Économie & finances publiques ». Le champ `pole` est plus cohérent pour filtrer les grands domaines ; la catégorie détaillée doit rester un niveau secondaire.

**Période historique :** les boutons sont libellés « 5 ans » et « 10 ans », mais le code applique `history.slice(-5)` ou `history.slice(-10)`. Cela signifie cinq ou dix observations, pas cinq ou dix années. Pour une série annuelle, le résultat peut sembler correct ; pour une série mensuelle, il ne montre que cinq ou dix mois ; pour MONIA, il peut ne montrer que cinq ou dix jours.

**Correction recommandée :**
1. filtrer les grands domaines à partir d'un code stable (`pole` ou `category_code`) et non d'un libellé libre ;
2. garder les catégories descriptives comme métadonnées ;
3. calculer les bornes temporelles à partir des périodes réelles, en tenant compte de la fréquence ;
4. nommer les contrôles « 5 dernières observations / 10 dernières observations » si la logique reste fondée sur le nombre de points ;
5. ajouter des tests spécifiques pour séries annuelles, trimestrielles, mensuelles et quotidiennes.

### 3.8 bis Tri chronologique des séries anciennes — correction complémentaire

Une revue des fonctions de fusion a révélé que le tri des périodes reconnaissait les dates et années à partir de 2000, alors que le filtre qualité BAM CKAN autorise aussi des observations à partir de 1900. Une série historique commençant avant 2000 pouvait donc être mal triée : des observations anciennes étaient placées après des années récentes et pouvaient devenir la valeur `latest`.

Le parseur de périodes de fusion a été élargi aux années 1900–2099, pour les formats annuels, mensuels, quotidiens et trimestriels. Deux tests de non-régression couvrent le tri chronologique et la fusion d'une série commençant en 1998.

### 3.9 Premières corrections réalisées sur la branche de revue

Les corrections suivantes ont été développées sur `audit/kitn-quality-review-2026-11`, sans fusion dans `main` :

- Le filtre des grands domaines utilise désormais le code stable `pole` (avec compatibilité pour les anciennes catégories codées), au lieu de comparer un libellé descriptif tel que « Monétaire et financier ».
- Les fenêtres « 5 ans » et « 10 ans » sont calculées à partir des périodes calendaires réelles. Les formats annuels, mensuels, trimestriels, quotidiens, ainsi que « Aujourd'hui » et « Veille », sont pris en charge. Les observations futures sont exclues.
- Le pipeline fusionne maintenant l'historique déjà publié avec les nouvelles observations : les périodes anciennes sont conservées et une valeur entrante remplace la valeur existante si la source révise la même période.
- Chaque série collectée reçoit `last_successful_collection_at` et `collection_status=collected`. Une série conservée faute de nouvelle collecte reçoit `collection_status=carried_forward` et garde sa date de collecte connue.
- L'interface distingue la date de génération du fichier statistique de la date de collecte individuelle lorsqu'elle est disponible.

Les changements statistiques, OpenAlex, HCP, BAM CKAN, navigation publique, Vite 6.4.6 et la configuration sociale World Bank ont été validés par GitHub Actions sur le commit `d02a89d` : 61 tests Python, 9 tests JavaScript, build Vite 6.4.6 réussi et zéro vulnérabilité npm. Les mises à jour documentaires suivantes ne modifient pas le code applicatif. Le déploiement Cloudflare de prévisualisation est distinct du site de production ; aucune fusion ou publication en production n'a été effectuée.

### 3.10 Navigation publique et dépendances frontend

- L'espace « Administration & contributions » a été retiré de la navigation publique en français et en arabe. Les anciennes sessions qui pointaient vers cet espace reviennent à l'accueil. Les fonctions de contribution locales restent dans le code pour préserver le travail existant, mais elles ne sont plus exposées comme un espace public ; elles devront être remplacées par un vrai circuit de proposition et de modération.
- La navigation publique comporte maintenant six espaces. Trois tests JavaScript vérifient le nombre d'espaces, l'absence de l'administration et le comportement des anciennes sessions.
- L'audit npm a identifié deux vulnérabilités dans Vite 5.4.21 et son esbuild associé (une modérée, une élevée). La migration vers Vite 6.4.6 a été testée sur la branche : tests frontend et build réussis, `npm audit` ne signale plus aucune vulnérabilité. Les fichiers `package.json` et `package-lock.json` ont été mis à jour sur cette branche uniquement.
- Le comptage automatisé du fichier statistique de production donne 845 séries : 842 en économie et finances publiques, 3 en société et développement humain, aucune sans code de domaine. Les trois séries sociales existantes sont : chômage (estimation OIT) et population totale via la Banque mondiale, plus population via le tableau de bord DSBB du MEF. Le problème de couverture sociale est donc confirmé : elle est très faible, mais pas inexistante.
- L'index documentaire contient 265 notices. Le rapport CI identifie 24 notices avec une date future/anormale, ce qui donne 241 notices attendues après cette exclusion. La prévisualisation navigateur a affiché 240 ; un écart d'une notice reste à réconcilier (filtre d'espace ou notice incomplète).

### 3.11 Extension contrôlée des indicateurs sociaux — Banque mondiale

La vérification directe de l'API World Development Indicators pour le Maroc confirme des observations récentes pour huit séries supplémentaires. Elles ont été ajoutées à la source `world_bank_maroc`, toutes classées dans `societe_developpement_humain` :

- Emploi : taux d'activité (`SL.TLF.CACT.ZS`), chômage des jeunes de 15–24 ans (`SL.UEM.1524.ZS`), ratio emploi-population (`SL.EMP.TOTL.SP.ZS`).
- Santé : espérance de vie (`SP.DYN.LE00.IN`), mortalité des moins de cinq ans (`SH.DYN.MORT`).
- Démographie : population urbaine (`SP.URB.TOTL.IN.ZS`).
- Éducation : taux brut de scolarisation primaire (`SE.PRM.ENRR`) et secondaire (`SE.SEC.ENRR`).

La source compte maintenant 14 indicateurs configurés et demande jusqu'à 25 observations annuelles par indicateur, au lieu des 12 observations codées en dur auparavant. Le collecteur utilise désormais le paramètre `history_points` configurable et plafonné à 100.

Les séries d'emploi reposent sur des estimations modélisées de l'OIT diffusées par la Banque mondiale ; elles ne doivent pas être présentées comme des mesures directes de l'enquête HCP. Les métadonnées et les sources doivent rester visibles.

**Important :** ces huit séries sont configurées et leur disponibilité API a été vérifiée, mais elles ne sont pas encore présentes dans le fichier statistique publié. Leur intégration effective doit être confirmée par une collecte complète après validation de la branche.

## 4. État de la couverture de tests

Le workflow exécute `python -m unittest discover -s tests -v`. Le fichier `tests/test_pipeline.py` couvre déjà de nombreux scénarios : pertinence Maroc, DOI, dates, HCP, MEF, MONIA, Banque mondiale, HAL, Crossref, concours, fusion de notices et CKAN.

Cela constitue une base utile, mais le niveau de couverture ne doit pas être confondu avec la validation des sources en direct.

### Tests à ajouter avant la refonte

| Domaine | Tests prioritaires |
|---|---|
| OpenAlex | 429 avec Retry-After, 429 sans en-tête, reprise après échec, cache et absence de doublons |
| HCP EMO | variantes desktop/mobile, titre « Lire la suite », trimestre manquant, formulations alternatives, chiffres absents |
| MEF | séparateurs français, unités, périodes, séries sans notices documentaires |
| BAM CKAN | classeur invalide, unité inconnue, dates futures, séries vides, doublons, historique conservé |
| Fraîcheur | source indisponible, série ancienne conservée et affichée comme ancienne |
| Index | doublons DOI/URL/titre, fusion sans perte des champs riches |
| Frontend | absence de données, JSON invalide, liens externes sûrs, mobile, RTL |
| Contributions | import invalide, doublon, export, séparation des données locales et données publiées |

L'audit initial était une lecture du code. Depuis, les tests Python et JavaScript ont été exécutés par GitHub Actions sur la branche de revue ; les résultats sont précisés dans la section 3.9. Les tests en direct des sources externes restent distincts des tests unitaires.

## 5. Décisions d'architecture recommandées

### Ne pas faire maintenant
- ne pas remplacer Vite par Astro ;
- ne pas réécrire le pipeline ;
- ne pas supprimer de source ou d'archive ;
- ne pas afficher de chiffres CKAN non validés ;
- ne pas présenter le stockage local comme une administration multi-utilisateur ;
- ne pas fusionner les six pôles de classification avec les espaces de navigation.

### Faire dans cet ordre

**Phase A — Fiabilité des données**
1. contrat de données statistique versionné ;
2. statut de fraîcheur par série ;
3. journal détaillé des rejets CKAN ;
4. robustesse HCP EMO ;
5. limitation et cache OpenAlex.

**Phase B — Préparation du frontend**
1. cartographie des fonctions Vite existantes ;
2. contrat commun pour l'index, les statistiques et Academy ;
3. tests de non-régression sur les données réelles ;
4. vérification de la configuration Cloudflare ;
5. prototype isolé des six espaces publics.

**Phase C — Migration progressive**
1. créer les pages publiques indépendantes ;
2. déplacer les QCM dans Academy sans perdre le contenu ;
3. ajouter les fiches indicateurs ;
4. construire la recherche transversale ;
5. relier les dossiers thématiques aux ressources existantes ;
6. faire une prévisualisation privée ;
7. publier uniquement après validation.

## 6. Critères de passage en production

Une évolution ne sera considérée prête que si :
- le pipeline existant passe ses tests ;
- les collecteurs existants ne sont pas supprimés ;
- les archives et identifiants historiques sont conservés ;
- les séries statistiques sont traçables jusqu'à leur source ;
- les séries anciennes sont clairement signalées ;
- les contenus sans texte intégral ne sont pas présentés comme des PDF disponibles ;
- les six espaces sont accessibles sur mobile et ordinateur ;
- la navigation française/arabe et le RTL sont testés ;
- le build de production est vérifié dans le véritable environnement de déploiement ;
- un retour arrière vers la version précédente est possible.

## 7. Conclusion

KITN n'a pas besoin d'une réécriture totale. Il a besoin d'une séparation plus nette entre collecte, validation, publication et présentation. Le meilleur chemin est une modernisation progressive, guidée par la qualité des données et protégée par des tests de non-régression.

**Des corrections applicatives ciblées ont été réalisées uniquement sur la branche de revue. Aucun fichier de données de production n'a été remplacé, aucune modification n'a été fusionnée dans `main` et aucun déploiement en production n'a été effectué.**
