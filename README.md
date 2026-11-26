# KITN — Centre de veille & de connaissances

Plateforme bilingue (FR / AR, avec prise en charge RTL) dédiée à la veille, à l'indexation et à l'analyse structurée des dynamiques, politiques publiques, enjeux économiques, sécuritaires et travaux de recherche liés au Maroc.

## Architecture du dépôt

- **Racine (`index.html`, `src/main.js`, `src/style.css`, `package.json`)** : application web **Vite** active en production sur Cloudflare Pages (`kitn.pages.dev`), commandée par `npm run build` avec sortie `dist`.
- **`pipeline/`** : moteur Python de collecte, normalisation, scoring de pertinence, classification sur les 6 pôles, vérification d'URL et fusion incrémentale (`run_pipeline.py`, `processors.py`, `collectors.py`, `config.py`).
- **`data/`** : configuration des sources (`sources.json`), archives mensuelles (`publications/YYYY-MM.json`), index de recherche (`index/search-index.json`) et suivi de santé (`index/sources-health.json`).
- **`public/data/`** : copie synchronisée de l'index consommé par le build Vite de production.
- **`web/`** : prototype/interface alternative sous Astro (non déployée par le projet Cloudflare Pages principal).

## Les 6 pôles de classification

1. `institutions_gouvernance` — Institutions & gouvernance
2. `economie_finances_publiques` — Économie & finances publiques
3. `societe_developpement_humain` — Société & développement humain
4. `relations_internationales_geopolitique` — Relations internationales & géopolitique
5. `securite_affaires_interieures` — Sécurité & affaires intérieures
6. `recherche_scientifique` — Recherche scientifique

## Automatisation (GitHub Actions)

Le workflow `.github/workflows/main.yml` s'exécute deux fois par jour (`03:30` et `15:30` UTC) ainsi qu'à la demande (`workflow_dispatch`) :

1. Exécute `python -m pipeline.run_pipeline`.
2. Synchronise `data/index/search-index.json` vers `public/data/index/search-index.json`.
3. Vérifie le build Vite à la racine (`npm run build`).
4. Commit et push uniquement si des changements réels sont détectés dans `data/` ou `public/data/`.

## Lancer le pipeline et les tests en local

```bash
# Lancer la veille
PYTHONPATH=. python -m pipeline.run_pipeline

# Lancer les tests unitaires
python -m unittest discover -s tests -v


## Données statistiques et bibliothèque documentaire

Le pipeline alimente également :

- `data/statistics.json` : six séries historiques marocaines issues de l'API World Development Indicators de la Banque mondiale (PIB nominal, croissance, inflation, chômage estimé OIT, population et IDE).
- `data/index/search-index.json` : notices institutionnelles et documentaires provenant notamment du HCP, de la Cour des comptes, du CESE et de l'IRES.
- `public/data/` : copies publiées consommées par l'application Vite.

Les séries statistiques conservent leur code d'indicateur, leur unité, leurs valeurs historiques, leur année de référence et leur URL source. Les valeurs sont actualisées par le pipeline automatisé ; l'indisponibilité d'une série isolée ne bloque pas les autres indicateurs.
