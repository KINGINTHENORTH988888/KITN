# KITN — Inventaire vérifié des 64 sources
Date de l'audit : 28 novembre 2026  
Branche examinée : `audit/kitn-quality-review-2026-11`  
Fichiers examinés : `data/sources.json`, `data/sources-health.json`, `pipeline/collectors.py`, `pipeline/run_pipeline.py`.

## Résultat exécutif

- **64 sources configurées** dans le registre.
- **22 activées** et **42 désactivées**.
- **20 sources seulement** figurent dans le dernier rapport de santé ; celui-ci date du **27 novembre 2026 à 16:33:58 UTC**.
- Parmi les 20 sources rapportées : **12 OK, 7 en erreur, 1 en avertissement**.
- Deux sources marquées activées ne figurent pas dans ce rapport : `alalam_ar` et `hcp_social_indicators_2026`. Leur absence ne prouve pas qu'elles sont inaccessibles, mais leur exécution n'est pas démontrée par ce rapport.
- Le rapport cumule **662 éléments récupérés et 120 éléments documentaires acceptés**. Ce ratio (18,1 %) décrit cette exécution, pas la qualité définitive de chaque source. Les séries statistiques ont leurs propres compteurs.
- Les 14 types de collecteurs présents dans le registre ont un branchement explicite dans `collect_from_source`. Cela prouve l'existence d'un chemin de code, pas le bon fonctionnement réseau de chaque entrée.

## Incidents et limites observés

1. Les six entrées OpenAlex rapportées ont échoué en HTTP 429. Le coupe-circuit évite les répétitions inutiles, mais ne rétablit pas le service ; la clé/quota et la fréquence doivent être réglés.
2. MONIA de Bank Al-Maghrib a échoué en HTTP 403. Ne pas contourner le refus d'accès ; demander un accès autorisé ou documenter une source alternative officielle.
3. HCP EMO marché du travail a retourné zéro document exploitable dans ce rapport.
4. Le collecteur MEF a remonté 9 séries statistiques, mais zéro document accepté. Les compteurs statistiques et documentaires ne doivent pas être confondus.
5. Le collecteur BAM CKAN a examiné 543 éléments, 34 documents ont été acceptés ; 543 séries sont signalées comme collectées dans le champ statistique. Il faut contrôler la granularité et la validation des séries avant de présenter ce chiffre comme 543 indicateurs publiés.
6. Une source activée sans ligne de santé ne doit jamais être affichée comme « opérationnelle ».

## Inventaire individuel

La colonne « rapport » décrit uniquement le dernier rapport disponible, pas une nouvelle requête réseau lancée pendant cet audit. « Active, sans rapport » signifie que l'entrée est activée dans la configuration mais qu'aucune ligne correspondante n'a été trouvée dans le rapport du 27 novembre.

| Source | ID | Collecteur | Activée | Rapport | Récupérés | Acceptés | Diagnostic |
|---|---|---|---|---|---:|---:|---|
| OpenAlex — Recherche & politiques publiques (Maroc) | `openalex_morocco_policy` | `openalex` | Oui | Erreur | 0 | 0 | HTTP Error 429: Too Many Requests |
| Banque mondiale — Maroc | `banque_mondiale_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Emploi Public — Concours Maroc | `emploi_public_maroc` | `emploi_public` | Oui | OK | 18 | 18 | — |
| Cour des comptes — Maroc | `cour_des_comptes_maroc` | `html_links` | Oui | OK | 20 | 19 | — |
| Haut-Commissariat au Plan (HCP) | `hcp_maroc` | `html_links` | Oui | OK | 15 | 10 | — |
| Bank Al-Maghrib (BAM) | `bank_al_maghrib` | `bank_al_maghrib_api` | Non | Désactivée | — | — | — |
| Conseil économique, social et environnemental (CESE) | `cese_maroc` | `rss_atom` | Oui | OK | 3 | 3 | — |
| Secrétariat Général du Gouvernement (SGG) | `sgg_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Ministère de l'Économie et des Finances | `mef_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Trésorerie Générale du Royaume (TGR) | `tgr_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Autorité Marocaine du Marché des Capitaux (AMMC) | `ammc_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Policy Center for the New South (PCNS) | `ocp_policy_center` | `html_links` | Non | Désactivée | — | — | — |
| Institut Royal des Études Stratégiques (IRES) | `ires_maroc` | `html_links` | Oui | OK | 6 | 3 | — |
| IRCAM — Institut Royal de la Culture Amazighe | `ircam_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Conseil National des Droits de l'Homme (CNDH) | `cnsh_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Instance Nationale de la Probité (INPPLC) | `instance_probite_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Direction Générale de la Sûreté Nationale (DGSN) | `dgsn_portail` | `html_links` | Non | Désactivée | — | — | — |
| Ministère de l'Intérieur — Maroc | `interieur_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Ministère des Affaires Étrangères — Maroc | `affaires_etrangeres_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Ministère de la Transition Numérique & Réforme Admin | `transition_numerique_maroc` | `html_links` | Non | Désactivée | — | — | — |
| MASEN — Agence Marocaine pour l'Énergie Durable | `masen_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Groupe OCP — Rapports & publications | `ocp_group_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Fonds Monétaire International (FMI) — Maroc | `fmi_maroc` | `html_links` | Non | Désactivée | — | — | — |
| OCDE — Études & politiques au Maroc | `ocde_maroc` | `html_links` | Non | Désactivée | — | — | — |
| HAL Archives Ouvertes — Maroc | `hal_science_morocco` | `hal_api` | Oui | OK | 20 | 20 | — |
| arXiv — Recherche liée au Maroc | `arxiv_morocco` | `rss_atom` | Non | Désactivée | — | — | — |
| Agence Marocaine de Presse (MAP) | `map_actualite` | `html_links` | Non | Désactivée | — | — | — |
| Hespress — الرصد الإخباري المغربي | `hespress_ar` | `hespress_news` | Oui | OK | 1 | 1 | — |
| العلم — رصد الشأن العام المغربي | `alalam_ar` | `rss_atom` | Oui | Active, sans rapport | — | — | — |
| Aujourd'hui le Maroc — Actualité stratégique | `aujourdhui_maroc` | `rss_atom` | Oui | OK | 1 | 1 | — |
| Médias24 — Économie & politiques au Maroc | `medias24_maroc` | `html_links` | Non | Désactivée | — | — | — |
| L'Économiste — Maroc | `le_economiste_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Chef du Gouvernement — Maroc | `chefs_gouvernement_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Chambre des Représentants — Maroc | `parlement_chambre_representants` | `html_links` | Non | Désactivée | — | — | — |
| Chambre des Conseillers — Maroc | `parlement_chambre_conseillers` | `html_links` | Non | Désactivée | — | — | — |
| Ministère de l'Éducation Nationale — Maroc | `ministere_education_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Ministère de l'Enseignement Supérieur & Recherche | `ministere_enseignement_sup_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Ministère de la Santé et de la Protection Sociale | `ministere_sante_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Ministère de l'Agriculture & Pêche Maritime | `ministere_agriculture_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Ministère de l'Équipement et de l'Eau | `ministere_equipement_eau_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Ministère de l'Inclusion Économique & Emploi | `ministere_inclusion_emploi_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Ministère de la Justice — Maroc | `ministere_justice_maroc` | `html_links` | Non | Désactivée | — | — | — |
| ANAPEC — Agence Nationale de Promotion de l'Emploi | `anapec_maroc` | `html_links` | Non | Désactivée | — | — | — |
| CNSS — Caisse Nationale de Sécurité Sociale | `cnss_maroc` | `html_links` | Non | Désactivée | — | — | — |
| ONCF — Office National des Chemins de Fer | `oncf_maroc` | `html_links` | Non | Désactivée | — | — | — |
| Tanger Med — Port & Zone Logistique | `tanger_med_port` | `html_links` | Non | Désactivée | — | — | — |
| ADD — Agence de Développement du Digital | `add_maroc` | `html_links` | Non | Désactivée | — | — | — |
| AMDIE — Agence Marocaine de Développement des Investissements | `amdieg_maroc` | `html_links` | Non | Désactivée | — | — | — |
| OMPIC — Office Marocain de la Propriété Industrielle | `ompic_maroc` | `html_links` | Non | Désactivée | — | — | — |
| BNRM — Bibliothèque Nationale du Royaume du Maroc | `bnrm_maroc` | `html_links` | Non | Désactivée | — | — | — |
| IMIST / CNRST — Revues scientifiques marocaines | `imist_cnrst_maroc` | `html_links` | Non | Désactivée | — | — | — |
| UNESCO — Maroc & politique éducative/culturelle | `unesco_morocco` | `html_links` | Non | Désactivée | — | — | — |
| Crossref — Publications scientifiques sur le Maroc | `crossref_maroc` | `crossref` | Oui | OK | 20 | 5 | — |
| Banque mondiale — Indicateurs du Maroc | `world_bank_maroc` | `world_bank_api` | Oui | OK | 6 | 6 | — |
| OpenAlex — Morocco governance public administration | `openalex_morocco_governance` | `openalex` | Oui | Erreur | 0 | 0 | HTTP Error 429: Too Many Requests |
| OpenAlex — Morocco public finance economic policy | `openalex_morocco_economy` | `openalex` | Oui | Erreur | 0 | 0 | HTTP Error 429: Too Many Requests |
| OpenAlex — Morocco public security policing | `openalex_morocco_security` | `openalex` | Oui | Erreur | 0 | 0 | HTTP Error 429: Too Many Requests |
| OpenAlex — Morocco human development social policy | `openalex_morocco_social` | `openalex` | Oui | Erreur | 0 | 0 | HTTP Error 429: Too Many Requests |
| OpenAlex — Morocco international relations diplomacy | `openalex_morocco_geopolitics` | `openalex` | Oui | Erreur | 0 | 0 | HTTP Error 429: Too Many Requests |
| Bank Al-Maghrib — Indice MONIA | `bank_al_maghrib_monia` | `bank_al_maghrib` | Oui | Erreur | 0 | 0 | HTTP Error 403: Forbidden |
| HCP — Indicateurs du marché du travail (EMO) | `hcp_labour_statistics` | `hcp_labour_statistics` | Oui | Avertissement | 0 | 0 | Aucun document exploitable détecté par le collecteur. |
| HCP — Indicateurs sociaux du Maroc, édition 2026 | `hcp_social_indicators_2026` | `hcp_social_indicators_pdf` | Oui | Active, sans rapport | — | — | — |
| Ministère de l'Économie et des Finances — Tableau DSBB | `mef_tand_statistics` | `mef_tand_statistics` | Oui | OK | 9 | 0 | — |
| Bank Al-Maghrib — Données ouvertes (CKAN) | `bank_al_maghrib_ckan` | `bank_al_maghrib_ckan` | Oui | OK | 543 | 34 | — |

## Architecture et déploiement : constat public

Le dépôt contient deux applications :
- Vite à la racine (`index.html`, `src/`, sortie `dist/`) ;
- un prototype Astro dans `web/`, sortie `web/dist/`.

Le fichier `wrangler.jsonc` cible `./web/dist`, donc le Worker décrit par cette configuration sert le prototype Astro, pas le build Vite racine.

Une vérification publique des routes `/maroc-en-chiffres`, `/academy`, `/veille`, `/etudes-recherche` et `/bibliotheque` a renvoyé le même contenu extrait que la racine `/`. Cela ne certifie pas le rendu visuel interactif, mais constitue un signal concret : les routes profondes ne sont pas démontrées comme des pages distinctes sur le site public. À investiguer avec une session navigateur interactive et la configuration Cloudflare Pages avant toute modification de production.

## Sécurité — constat limité

Le workflow a exécuté `npm audit` sur le lockfile et a retourné **0 vulnérabilité connue** à la date du contrôle. Le package racine déclare Vite comme seule dépendance directe de développement ; les dépendances du lockfile sont résolues depuis `registry.npmjs.org` avec des empreintes d'intégrité.

Cela **ne constitue pas une expertise forensique anti-malware**. Le dépôt suit néanmoins 191 fichiers sous `node_modules/` (environ 30,8 Mo), alors que `.gitignore` exclut déjà ce répertoire. Les fichiers examinés incluent des binaires habituels de Vite/esbuild/Rollup. Le nettoyage proposé dans une PR séparée est une mesure d'hygiène du dépôt, pas une preuve qu'un malware a été trouvé. Ne pas fusionner cette PR sans revue indépendante.

## Actions prioritaires

1. Refaire une collecte contrôlée pour les 22 sources activées et expliquer les deux absences du rapport.
2. Corriger OpenAlex (429) et demander un accès officiel pour MONIA (403).
3. Valider les 42 sources désactivées une par une avant de les activer : endpoint, accès, parsing, pertinence, déduplication, conservation et publication.
4. Réconcilier les compteurs documentaires et statistiques, surtout MEF et BAM CKAN.
5. Vérifier les routes publiques dans un vrai navigateur, puis rapprocher la configuration Pages de la bonne application sans modifier la production à l'aveugle.
6. Construire l'interface d'administration privée, encore non démontrée par les validations de ce dépôt.

## Limites de cet audit

Cet inventaire est un audit de configuration, de dispatch du code et du dernier rapport disponible. Il ne prétend pas avoir testé individuellement les 64 endpoints en direct. Les 42 sources désactivées doivent faire l'objet d'une campagne de validation contrôlée avant d'être considérées comme opérationnelles.


## Complément de contrôle public — 28 novembre 2026

Les endpoints de données exposés par `https://kitn.pages.dev` ont également été interrogés en lecture seule :

- `/data/index/search-index.json` répond avec un index de **269 notices**, généré le `2026-11-27T16:33:58Z`.
- `/data/statistics.json` répond avec **845 indicateurs**, générés à la même date.
- `/data/sources-health.json` ne renvoie pas un document JSON dans la réponse publique contrôlée : l'extraction retourne le contenu HTML de la page d'accueil. Le fichier existe bien dans la branche d'audit sous `public/data/sources-health.json`, mais sa présence dans le dépôt ne prouve pas qu'il est publié sur le domaine public.
- La page d'accueil publique présente encore une fiche de révision DGSN mise en avant. Cela donne un poids visuel important à un seul concours, alors que le cahier des charges demande une plateforme transversale et que DGSN/IRAT/Administrateur doivent rester des catégories de KITN Academy.
- Les URL profondes contrôlées (`/maroc-en-chiffres`, `/academy`, `/veille`, `/etudes-recherche`, `/bibliotheque`) ont renvoyé le même texte extrait que la racine. L'automatisation interactive par clic n'a pas pu être lancée dans cette session ; le résultat est donc un signal à confirmer, pas une certification du comportement visuel.

**Écart de version à retenir :** les données publiques reflètent une collecte du 27 novembre, tandis que le rendu des espaces et la publication du rapport de santé doivent encore être validés. Ne pas conclure que le site public sert exactement le dernier build de la branche simplement parce que certains compteurs de données correspondent.
