# KITN — Audit de l'interface publique en production

**Date :** 27 novembre 2026  
**URL contrôlée :** https://kitn.pages.dev/  
**Environnement :** site public Cloudflare Pages, distinct de la prévisualisation de la branche de revue.  
**Nature du contrôle :** navigation et lecture en direct, sans connexion, sans modification de contenu et sans publication.

## 1. Résultat général

Le site public est une application monopage (SPA). Le contenu est chargé et plusieurs espaces disposent déjà de données et de filtres utiles. L'audit confirme toutefois un écart entre l'interface publique actuelle et l'architecture cible décrite dans `architecture-cible-ux-2026-11.md`.

## 2. Espaces réellement observés

| Espace affiché en production | Résultat observé |
|---|---|
| Actualité & veille | 8 notices chargées. Recherche, dates, pôles, types, confiance, langue, tri, favoris et export JSON visibles. |
| Articles scientifiques | 157 notices visibles. Le panneau qualité annonce 181 publications indexées, 24 dates futures exclues, 29 sans résumé et 2 sans auteur. Filtres auteur, discipline et année visibles. |
| Maroc en chiffres | 21 indicateurs chargés. Catégories, périodes et tableaux historiques visibles. |
| Concours & Academy | 21 notices. Parcours DGSN, IRAT et Concours admin présents ; fiche DGSN et QCM de cinq questions observés. |
| Bibliothèque | 37 notices affichées, cartes documentaires et filtres complets. Cinq cartes de sources institutionnelles observées : Cour des comptes, CESE, IRES, HCP et Banque mondiale. |
| Administration & contributions | Entrée présente dans la navigation de production, mais aucune interface publique exploitable observée lors de l'ouverture. L'espace ne doit pas être exposé comme une rubrique publique sans authentification et véritable persistance. |

Les volumes sont des instantanés de l'interface au moment du contrôle ; ils peuvent évoluer après les collectes.

## 3. Tests d'interaction

- **Navigation entre espaces :** les vues s'ouvrent dans la SPA ; l'URL est restée à la racine pendant les changements d'espace observés.
- **Arabe :** le bouton de langue fonctionne. Les libellés d'interface, filtres et commandes passent en arabe RTL ; les titres et résumés des documents restent dans leur langue source, ce qui est normal pour des métadonnées documentaires.
- **Recherche :** la saisie de « Maroc » a été acceptée et la grille de résultats s'est actualisée. Ce contrôle confirme le déclenchement de la recherche, mais ne constitue pas à lui seul une validation exhaustive de la pertinence des résultats.
- **Fiches et sources :** les cartes documentaires exposent des actions de consultation de source, de fiche détaillée, de favoris et, selon disponibilité, DOI/PDF.

## 4. Écarts et priorités

### Priorité 1 — Navigation publique
La production présente encore une entrée « Administration & contributions » qui ne fournit pas d'espace public exploitable. L'architecture cible prévoit de garder l'administration et les outils éditoriaux hors de la navigation publique. La branche de revue retire cette entrée des espaces publics et redirige les anciennes sessions vers l'accueil.

La production utilise également une navigation SPA sans URL propre pour chaque espace. La branche de revue introduit des chemins dédiés (`/veille`, `/etudes-recherche`, `/maroc-en-chiffres`, `/bibliotheque`, `/academy`), la gestion de l'historique navigateur et le fallback Cloudflare Pages. Ces routes doivent encore être vérifiées dans le véritable déploiement avant publication.

### Priorité 2 — Qualité et transparence des notices
Les indicateurs de qualité scientifique sont utiles, mais les notices sans résumé, sans auteur ou à date à vérifier doivent rester identifiables. Il faut éviter de présenter les notices indexées comme autant de textes intégraux disponibles.

### Priorité 3 — Maroc en chiffres
Les 21 indicateurs nationaux observés ne suffisent pas à eux seuls à démontrer la couverture statistique attendue. La branche de revue ajoute les séries régionales HCP et les indicateurs sociaux, avec une séparation entre séries nationales et régionales. Les valeurs, périodes, unités, sources et limites doivent être vérifiées dans l'interface avant toute publication.

### Priorité 4 — KITN Academy
Les trois parcours DGSN, IRAT et concours administratifs sont visibles. Le contrôle de ce passage a confirmé la présence des onglets et du parcours DGSN, mais n'a pas encore vérifié chaque question, chaque réponse et chaque parcours de bout en bout.

### Priorité 5 — Bibliothèque
La bibliothèque contient des notices et un répertoire de sources institutionnelles. Il reste à contrôler les liens externes, la cohérence entre type de document et espace, la disponibilité réelle des PDF et la qualité des métadonnées sur un échantillon plus large.

## 5. Ce qui n'a pas été validé

- Le comportement mobile et les petits écrans.
- La totalité des liens externes et des fichiers PDF.
- La pertinence de chaque résultat de recherche.
- Tous les QCM et toutes les réponses des parcours Academy.
- La configuration Cloudflare Worker, distincte du déploiement Cloudflare Pages.
- Le déploiement de la branche de revue sur le domaine public.

## 6. Décision de publication

Aucune fusion dans `main` ni aucun déploiement en production n'a été effectué dans le cadre de cet audit. La branche `audit/kitn-quality-review-2026-11` reste l'environnement de travail. Avant publication, il faut tester les routes propres, les données statistiques régionales, les parcours Academy, l'affichage mobile et le retour arrière dans le véritable environnement Cloudflare Pages.

**Conclusion :** la production possède déjà un contenu substantiel. Le chantier prioritaire n'est pas de la remplacer, mais de corriger l'architecture de navigation, clarifier les espaces publics/privés, renforcer la transparence des données et vérifier la prévisualisation contre le site réel avant toute bascule.
