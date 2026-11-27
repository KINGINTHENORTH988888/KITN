# Audit des sources KITN — 27 novembre 2026

## Méthode

Une source **configurée** existe dans `data/sources.json`. Une source **activée** porte `enabled=true`. Une source **collectée** apparaît dans `data/sources-health.json` après une exécution. Une source **utile** doit en plus produire des notices pertinentes et suffisamment riches. Un statut `ok` ne prouve donc pas à lui seul la qualité éditoriale.

## État du dépôt

- **58 sources configurées**, dont **14 activées** et **44 désactivées**.
- Types : 45 collecteurs HTML génériques, 6 requêtes OpenAlex, 3 flux RSS/Atom, 1 HAL, 1 Crossref, 1 API Banque mondiale et 1 connecteur API BAM.

| Espace | Configurées | Activées | Désactivées |
|---|---:|---:|---:|
| Articles scientifiques | 11 | 8 | 3 |
| Bibliothèque | 15 | 3 | 12 |
| Concours / Academy | 2 | 0 | 2 |
| Maroc en chiffres | 17 | 2 | 15 |
| Veille | 13 | 1 | 12 |
| **Total** | **58** | **14** | **44** |

## Dernière collecte disponible

Le suivi de santé du dépôt date du **27 novembre 2026 à 00:47:35 UTC** : 14 sources interrogées, toutes marquées `ok`, 193 éléments récupérés et 151 acceptés.

| Source | Espace | Récupérés | Acceptés |
|---|---|---:|---:|
| OpenAlex — recherche générale | Science | 25 | 13 |
| OpenAlex — gouvernance | Science | 15 | 14 |
| OpenAlex — économie | Science | 15 | 14 |
| OpenAlex — sécurité | Science | 15 | 14 |
| OpenAlex — social | Science | 15 | 14 |
| OpenAlex — géopolitique | Science | 15 | 15 |
| HAL | Science | 20 | 20 |
| Crossref | Science | 20 | 5 |
| Banque mondiale | Chiffres | 6 | 6 |
| HCP | Chiffres | 15 | 10 |
| Cour des comptes | Bibliothèque | 20 | 19 |
| CESE | Bibliothèque | 3 | 3 |
| IRES | Bibliothèque | 6 | 3 |
| Aujourd'hui le Maroc | Veille | 3 | 1 |

Ces volumes sont des éléments récupérés/acceptés par source, pas nécessairement des nouvelles notices uniques : le pipeline peut fusionner des doublons.

## Vérifications web ponctuelles

Ces tests vérifient l'accessibilité et l'existence de contenu exploitable, mais ne remplacent pas encore un test du collecteur Python en production.

| Source désactivée | Observation | Décision |
|---|---|---|
| Emploi Public | La page française est accessible et expose une rubrique `/fr/concours-liste` ainsi que des liens vers des fiches. Le contenu de la liste est toutefois chargé dynamiquement et l'extraction statique consultée ne restitue pas correctement les fiches. | **P1** — collecteur dédié à tester, ne pas activer le HTML générique en l'état |
| Hespress | Les rubriques `/politique`, `/economie` et `/societe` sont accessibles ; les titres et dates des articles apparaissent dans le contenu extrait. | **P1** — rubriques ciblées et filtres de pertinence arabes/français, puis test du collecteur réel |
| Bank Al-Maghrib | La page officielle des cours de référence affiche les cours du jour et de la veille. | **P1** — étudier le collecteur BAM HTML déjà présent dans le code, afin de ne pas rendre les cours dépendants d'une clé API |
| MAP | La page testée a renvoyé un blocage anti-bot. | **P2** — rechercher un flux/API officiel ou une méthode autorisée |
| Policy Center for the New South | L'URL `/publications` testée a renvoyé 404. | **P2** — retrouver la page exacte avant activation |
| Autres sources désactivées | Pas encore vérifiées individuellement dans cet audit. | Les laisser désactivées jusqu'au contrôle de l'URL, du contenu et du collecteur |

## Diagnostic

### Le déséquilibre de couverture est le problème prioritaire

- **Concours / Academy : 0 source active sur 2.**
- **Veille : 1 source active sur 13.**
- **Chiffres : 2 sources actives sur 17.**

Les 14 sources actives alimentent surtout la recherche scientifique et la bibliothèque documentaire. Il faut combler les espaces sous-alimentés plutôt qu'activer en masse les 44 sources restantes.

### Le collecteur HTML générique ne suffit pas partout

Le collecteur `html_links` extrait surtout les textes des liens et les URL présentes dans le HTML. Il ne garantit pas l'extraction des contenus chargés par JavaScript et ne sait pas interpréter à lui seul les champs métier d'une fiche de concours.

Pour Emploi Public, il faut un test spécifique couvrant : pagination, identifiant, administration, grade, nombre de postes, diplôme, date limite, date d'épreuve et lien officiel. Ne pas publier une annonce si ces informations essentielles ne sont pas fiables.

### Le suivi de santé doit évoluer

À terme, distinguer : configurée, désactivée volontairement, testée et accessible, collecte réussie, collecte vide, erreur technique, contenu rejeté pour pertinence, données effectivement publiées. Le seul statut `ok` est trop limité pour mesurer la qualité réelle.

## Plan d'action

### P1 — Prioritaire
1. **Emploi Public** : concevoir et tester un collecteur dédié ; éviter les notices génériques ou incomplètes.
2. **Hespress** : tester les rubriques politique, économie et société, avec titres, liens, dates et résumés ; appliquer des filtres thématiques.
3. **Bank Al-Maghrib** : tester le collecteur HTML existant sur les cours de référence, puis examiner les pages statistiques mensuelles et MONIA.
4. **HCP** : séparer les notices documentaires des séries chiffrées structurées ; conserver source, unité, période et date de mise à jour.

### P2 — Ensuite
5. Vérifier individuellement SGG, MEF, TGR, AMMC, ministère de l'Intérieur, diplomatie, Parlement et les autres sources institutionnelles.
6. Corriger les URL génériques ou obsolètes et privilégier les pages de publication/listing.
7. Préférer les flux RSS/API disponibles aux pages d'accueil.
8. Évaluer IMIST, arXiv et les sources scientifiques secondaires sans diluer la pertinence Maroc.

## Critères obligatoires avant activation

1. Page ou endpoint de listing stable.
2. Liens d'articles ou de fiches réellement récupérables.
3. Titres et dates cohérents.
4. Pertinence acceptable sur un échantillon.
5. Peu de bruit et de doublons.
6. Affichage correct dans l'espace KITN prévu.

**Conclusion :** le socle de collecte fonctionne, mais la couverture est déséquilibrée. Le prochain chantier concret est Emploi Public, Hespress et les données BAM/HCP. Les sources ne doivent être activées qu'après validation du collecteur et de la qualité des notices.
