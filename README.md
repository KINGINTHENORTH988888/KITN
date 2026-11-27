# KITN — Centre de veille & de connaissances

Plateforme bilingue français/arabe (avec prise en charge RTL) consacrée à la veille, à l'indexation documentaire, aux données publiques, à la recherche et à la préparation aux concours liés au Maroc.

## Architecture du dépôt

- **Application web active** — index.html, src/, package.json : application Vite construite avec npm run build, sortie dist/. Le dépôt identifie cette application comme celle utilisée par le projet Cloudflare Pages kitn.pages.dev.
- **Pipeline Python** — pipeline/ : collecte, extraction, normalisation, contrôle de pertinence, classification, fusion des historiques et génération des fichiers publiés.
- **Configuration des sources** — data/sources.json.
- **Données générées** — data/index/search-index.json, data/statistics.json, data/regional-statistics.json (lorsqu'une collecte régionale a pu être produite), data/sources-health.json et archives mensuelles dans data/publications/.
- **Données consommées par Vite** — copies synchronisées dans public/data/.
- **Prototype Astro** — web/ : interface alternative expérimentale. Elle est distincte de l'application Vite racine et n'est pas construite par le workflow principal décrit ci-dessous.

Les six pôles de classification sont des catégories de données. Ils ne doivent pas être confondus avec les espaces de navigation de l'application.

## Les six pôles de classification

1. institutions_gouvernance — Institutions & gouvernance
2. economie_finances_publiques — Économie & finances publiques
3. societe_developpement_humain — Société & développement humain
4. relations_internationales_geopolitique — Relations internationales & géopolitique
5. securite_affaires_interieures — Sécurité & affaires intérieures
6. recherche_scientifique — Recherche scientifique

## Données et provenance

### Index documentaire

data/index/search-index.json contient les notices documentaires collectées et normalisées. Les archives mensuelles sont conservées dans data/publications/YYYY-MM.json. Les notices peuvent contenir notamment un titre, une source, une URL canonique, une date de publication, un résumé, un type documentaire, un pôle et des métadonnées de collecte.

Une notice indexée n'implique pas que le texte intégral soit hébergé par KITN. Les pages de l'éditeur, les résumés, les DOI et les fichiers PDF doivent être distingués.

### Séries statistiques nationales

data/statistics.json regroupe les séries statistiques nationales provenant des sources institutionnelles configurées, notamment Bank Al-Maghrib, la Banque mondiale et le Ministère de l'Économie et des Finances. Le nombre de séries varie selon les collectes et les contrôles de validation : il ne doit donc pas être considéré comme un chiffre fixe.

Chaque série doit conserver, dans la mesure où la source les fournit, son code, son libellé, son unité, son historique, sa période de référence, sa provenance et ses informations de collecte. La date de génération du fichier n'est pas nécessairement la date de la dernière observation de chaque indicateur.

### Séries régionales HCP — EMO

data/regional-statistics.json est un flux distinct consacré aux tableaux régionaux de l'Enquête sur la main-d'œuvre du HCP. Il ne doit pas être mélangé aux indicateurs nationaux de statistics.json.

Les valeurs supprimées, non disponibles ou insuffisamment significatives doivent conserver leur statut de qualité. Elles ne doivent jamais être transformées en zéros. Les résultats EMO 2026 doivent également porter l'avertissement de rupture méthodologique avec les anciennes séries ENE.

Le fichier régional est généré par le pipeline. Son existence et sa fraîcheur doivent être vérifiées après une collecte complète ; la présence du parseur ou la réussite d'un test sur PDF ne prouvent pas, à elles seules, que le fichier publié a été actualisé.

### Santé des sources

data/sources-health.json décrit le résultat des collectes. Il faut distinguer les ressources découvertes, les documents acceptés, les séries statistiques extraites, les séries validées et les données conservées depuis une collecte antérieure.

## Automatisation GitHub Actions

Le workflow principal est défini dans .github/workflows/main.yml.

- Il est planifié à 03:30 et 15:30 UTC et peut être lancé manuellement depuis GitHub Actions.
- Les événements de pull request exécutent les tests Python, les contrôles de données et les tests/build frontend sans lancer la collecte ni pousser de données.
- Les exécutions planifiées ou manuelles lancent le pipeline Python, synchronisent les fichiers générés vers public/data/, vérifient les tests frontend et le build Vite, puis ne poussent que les fichiers de données explicitement autorisés lorsqu'ils ont changé.
- Les tests Python indépendants sont également définis dans .github/workflows/tests.yml.
- Le contrôle réseau spécifique du PDF régional HCP est séparé dans .github/workflows/hcp-live-validation.yml et doit être lancé manuellement.

Une exécution réussie des tests ne signifie pas nécessairement que les collecteurs externes ont été exécutés : il faut vérifier le type de déclenchement et les jobs réellement lancés.

## Lancer les vérifications en local

Installer les dépendances Python de requirements.txt, puis les dépendances Node avec npm ci.

```bash
# Tests Python
PYTHONPATH=. python -m unittest discover -s tests -v

# Tests frontend
npm run test:frontend

# Build de l'application Vite
npm run build

# Exécution complète du pipeline (peut interroger des sources externes
# et modifier les fichiers de données générés)
PYTHONPATH=. python -m pipeline.run_pipeline
```

## Connecteur Bank Al-Maghrib

Le connecteur bank_al_maghrib_api utilise la variable d'environnement BKAM_API_KEY, transmise au workflow par le secret GitHub Actions du même nom. Ne jamais inscrire cette clé dans le dépôt, dans un fichier versionné ou dans les journaux.

## Enrichissement académique par DOI

Les notices scientifiques incomplètes disposant d'un DOI peuvent être enrichies à partir de la fiche Crossref correspondante. Le traitement est limité à 12 tentatives par exécution (paramétrable avec KITN_DOI_ENRICHMENT_LIMIT) et une même notice n'est pas retentée pendant sept jours. Les champs déjà renseignés sont préservés ; les dates incohérentes restent signalées et les résumés ne sont pas générés artificiellement.

## Couverture des publications scientifiques

La veille académique combine HAL, Crossref et OpenAlex, avec des recherches thématiques distinctes : gouvernance et administration, économie et finances publiques, sécurité, développement humain, relations internationales et géopolitique. Les résultats restent soumis aux contrôles de pertinence Maroc et de dédoublonnage (DOI canonique, puis titre/date et URL lorsque le DOI manque).

## Environnements et déploiement

La branche main est la branche de référence de production. Les audits et corrections doivent être réalisés sur une branche isolée, puis validés par tests et prévisualisation avant toute fusion. Le dépôt contient à la fois une application Vite et un prototype Astro : toute modification de la configuration Cloudflare doit donc préciser explicitement le projet, la branche, la commande de build et le répertoire de sortie concernés.
