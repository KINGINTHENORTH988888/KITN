# KITN — Architecture cible et refonte UX

> Document de conception évolutif — première implémentation UI en cours. Il ne vaut pas validation définitive de l'architecture.

## 1. Principe directeur

KITN est une plateforme de connaissance sur le Maroc. L'interface doit rester sobre et lumineuse tandis que la profondeur fonctionnelle se trouve dans les espaces dédiés. L'accueil oriente ; il ne cherche pas à tout afficher.

## 2. Navigation principale

L'en-tête public comporte six entrées, sans afficher les outils internes d'administration :

1. **Accueil** — présentation de KITN, accès aux espaces et une sélection limitée de publications.
2. **Maroc en chiffres** — pilier statistique : indicateurs nationaux, économie et finances publiques, société et développement humain, données régionales, séries historiques, comparaisons, graphiques et méthodologies.
3. **Veille** — actualités et suivi institutionnel, classés par domaines et par institutions.
4. **Études & recherche** — publications scientifiques, études sectorielles, auteurs, disciplines, années et DOI.
5. **Bibliothèque** — rapports, documents institutionnels, textes de référence, ressources téléchargeables et notices documentaires.
6. **KITN Academy** — espace pédagogique séparé : concours, parcours, QCM, fiches et documents fournis par le propriétaire du projet.

Les menus déroulants donnent accès à des sous-espaces utiles sans multiplier les liens dans l'en-tête. Le menu mobile reprend la même hiérarchie sous forme verticale.

## 3. Domaines de classement transversaux

Les six pôles servent à classer les ressources, pas à remplacer les espaces de navigation :

- institutions_gouvernance
- economie_finances_publiques
- societe_developpement_humain
- relations_internationales_geopolitique
- securite_affaires_interieures
- recherche_scientifique

Un même domaine peut alimenter plusieurs espaces. Exemple : une publication du HCP relève du pôle « société & développement humain » et peut apparaître dans « Maroc en chiffres », « Veille » ou « Bibliothèque » selon sa nature.

## 4. Rôle des fonctions techniques existantes

| Fonction existante | Destination UX |
|---|---|
| Collecte multi-sources et index de publications | Veille, Études & recherche, Bibliothèque |
| Statistiques nationales World Bank / institutions | Maroc en chiffres |
| Séries régionales HCP | Maroc en chiffres > Comparaison régionale |
| Santé des sources et contrôles | Espace interne de pilotage, pas dans le menu public |
| Contributions manuelles | Outil éditorial privé, pas une rubrique publique |
| Favoris et recherche documentaire | Fonctionnalités transversales |
| QCM et parcours concours | KITN Academy |

## 5. Identité visuelle

- Fond principal blanc ou blanc cassé très léger.
- Texte bleu nuit / anthracite pour le contraste.
- Bleu institutionnel comme couleur de structure.
- Vert pétrole discret pour les actions et données positives.
- Ambre réservé aux alertes ou aux éléments à vérifier.
- Couleurs secondaires limitées et cohérentes par espace.
- Typographie sans empattement lisible, titres courts, paragraphes aérés, largeur de lecture maîtrisée.
- Cartes éditoriales sobres ; éviter les tableaux de bord surchargés sur l'accueil.

## 6. Accueil

L'accueil doit contenir uniquement : une promesse claire et courte ; un accès visible à la recherche globale ; six accès aux espaces ; trois publications ou informations mises en avant au maximum ; éventuellement quelques indicateurs vérifiés et datés, uniquement s'ils apportent une vraie valeur.

Les QCM, grands tableaux statistiques, filtres avancés et listes complètes restent dans leurs espaces respectifs.

## 7. Pages internes

Chaque espace dispose de son propre titre, d'une introduction brève, de ses outils et de ses filtres. La première implémentation utilise des URL propres (`/maroc-en-chiffres`, `/veille`, `/etudes-recherche`, `/bibliotheque`, `/academy`) avec retour navigateur et fallback Cloudflare Pages. L'application reste techniquement une SPA Vite : les vues sont distinctes et adressables, mais ce ne sont pas encore des documents HTML autonomes.

Les publications mises en avant depuis l'accueil ouvrent désormais une page de lecture interne (`/publication/<id>`), avec métadonnées, résumé disponible, éventuelle analyse, citation et liens vers la source/DOI/PDF. Le texte intégral n'est pas inventé ni aspiré automatiquement : il ne sera reproduit que lorsque les droits ou la licence le permettent ; sinon KITN affiche une synthèse ou le résumé disponible et renvoie vers la source.

## 8. Administration et contributions

Ces fonctions ne sont pas des espaces publics. L'administration sert au pilotage technique et à la qualité des sources/données. Les contributions servent à saisir ou enrichir des ressources. Elles doivent être déplacées vers un espace éditorial privé ou un outil de gestion, protégées par authentification avant toute ouverture publique.

## 9. Séquence d'implémentation

1. Navigation par espaces, URL propres et accueil allégé (première version implémentée sur la branche de travail).
2. Pages internes avec sous-navigation et filtres spécifiques.
3. Pages de lecture des publications et règles de droits.
4. Refonte visuelle détaillée de Maroc en chiffres.
5. Intégration de la bibliothèque et de KITN Academy.
6. Tests desktop/mobile, français/arabe RTL, accessibilité, performance et non-régression.
7. Publication uniquement après revue du rendu et validation des données.

## 10. État et limites

Cette architecture est une proposition de travail. L'interface existante est une application Vite avec rendu côté client ; la première étape transforme la navigation et la composition des vues sans remplacer le pipeline de collecte. La migration vers de véritables routes multi-pages côté serveur pourra être envisagée après stabilisation, si elle apporte un bénéfice réel.