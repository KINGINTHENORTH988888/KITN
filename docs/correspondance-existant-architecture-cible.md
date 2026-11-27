# KITN — Correspondance entre l'existant et l'architecture cible

**Document de travail — 27 novembre 2026**  
Objectif : déplacer les fonctionnalités existantes vers la nouvelle architecture sans perdre leur comportement ni leurs données.

## 1. Règle générale

La refonte doit déplacer les fonctions, pas les réinventer. Chaque fonctionnalité existante reçoit :
- une destination cible ;
- une règle de conservation ;
- une amélioration éventuelle ;
- un test de non-régression.

Les identifiants historiques, les DOI, les URL canoniques, les archives et les codes d'indicateurs doivent rester stables.

## 2. Correspondance des espaces

| Fonction actuelle | Destination cible | Décision |
|---|---|---|
| Portail / vue globale | Accueil | Garder les accès rapides et les derniers contenus, sans faire de l'accueil un catalogue entier |
| Actualité & veille | Veille | Garder les filtres et les fiches ; ajouter une page de lecture éditoriale |
| Articles scientifiques | Études & recherche | Garder auteurs, DOI, revue, année, résumé, langue et statut d'accès |
| Maroc en chiffres | Maroc en chiffres | En faire un véritable espace de données avec pages autonomes par indicateur |
| Concours & Academy | KITN Academy | Déplacer les concours, fiches et QCM vers un espace pédagogique indépendant |
| Bibliothèque | Bibliothèque | Garder les rapports, documents, archives et liens vers les originaux |
| Administration & contributions | Administration privée + formulaire public | Séparer les propositions des opérations éditoriales privées |

## 3. Fonctionnalités à préserver

### Index documentaire et dédoublonnage
À conserver :
- fusion des notices manuelles et automatiques ;
- identifiants stables ;
- dédoublonnage par identifiant, DOI, URL et titre/date ;
- conservation des champs riches lorsqu'une nouvelle collecte est moins complète ;
- archives mensuelles.

À améliorer :
- historiser les changements importants ;
- garder la provenance de chaque champ enrichi ;
- exposer les conflits de fusion dans un journal d'administration.

### Filtres documentaires
À conserver :
- espace ;
- pôle ;
- type de document ;
- langue ;
- confiance de classification ;
- dates ;
- auteur et discipline pour les publications scientifiques ;
- tri par date et score ;
- favoris ;
- export JSON.

À ajouter progressivement :
- institution/source ;
- période de référence ;
- disponibilité réelle du texte intégral ;
- statut d'accès ;
- région/territoire lorsqu'une donnée territoriale existe ;
- dossier thématique associé.

### Fiches documentaires
À conserver :
- titre ;
- auteurs ;
- revue/institution ;
- date ;
- résumé ;
- mots-clés ;
- DOI ;
- URL de la source ;
- PDF lorsqu'il est réellement disponible ;
- date de collecte et de mise à jour ;
- statut éditorial.

À corriger :
- ne pas transformer un lien DOI en promesse de texte intégral ;
- distinguer « page de l'éditeur », « résumé disponible », « texte intégral ouvert » et « fichier hébergé par KITN » ;
- afficher les dates anormales comme à vérifier.

### Maroc en chiffres
À conserver :
- chargement de `data/statistics.json` ;
- filtres par catégorie et période ;
- historique ;
- comparaison avec la période précédente ;
- graphiques et tableaux historiques ;
- source affichée.

À développer :
- fiches indicateurs indépendantes ;
- définition et méthode ;
- unité, échelle et fréquence ;
- période de référence ;
- date de dernière observation ;
- date de collecte ;
- fraîcheur de la série ;
- historique des révisions ;
- comparaison régionale uniquement si les séries sont comparables ;
- téléchargement CSV/XLSX après validation.

Le tableau actuel se limite à deux catégories et à un choix de période (5 ans, 10 ans, toute la série). Il ne suffit pas à couvrir tous les secteurs attendus.

### KITN Academy
À préserver avant déplacement :
- les parcours DGSN, IRAT et concours administratifs ;
- les fiches et méthodologies ;
- les anciens sujets ;
- les QCM, propositions, réponses et explications ;
- la navigation entre questions.

À améliorer :
- séparer les questions des composants de page ;
- conserver les réponses et explications dans des fichiers de contenu structurés ;
- ajouter score et progression uniquement si le stockage est défini ;
- afficher les dates de concours uniquement lorsqu'elles viennent d'une source officielle ;
- distinguer contenu pédagogique éditorial et annonce de concours.

### Contributions et modération
À conserver :
- possibilité de proposer une ressource ;
- import/export JSON pour les opérations de maintenance ;
- statut de validation ;
- archivage.

À changer :
- le stockage navigateur ne doit pas être présenté comme une base partagée ;
- une proposition publique doit rester en attente de modération ;
- l'administration doit être privée ;
- toute décision éditoriale doit être persistée et historisée.

## 4. Contrats de données à stabiliser

Les fichiers générés doivent avoir une version de schéma et des dates cohérentes.

### Index documentaire
Champs indispensables :
- `schema_version`
- `generated_at`
- `total`
- `items[]`
- identifiant stable
- titre
- source
- URL canonique
- type documentaire
- espace
- pôle
- date de publication et son statut
- date de collecte
- date de mise à jour

### Séries statistiques
Champs indispensables :
- `schema_version`
- `indicator_code`
- libellé et définition ;
- unité et échelle ;
- fréquence ;
- catégorie ;
- source institutionnelle ;
- URL de provenance ;
- historique d'observations ;
- dernière période observée ;
- date de collecte réussie ;
- fraîcheur ;
- statut de validation ;
- notes méthodologiques.

Une observation doit contenir au minimum période, valeur, unité (ou référence à l'unité de la série) et éventuellement statut de révision.

### Academy
Champs indispensables :
- identifiant du parcours ;
- titre FR/AR ;
- niveau ;
- domaine ;
- modules ;
- ressources ;
- questions ;
- propositions ;
- réponse attendue ;
- explication ;
- source ou statut éditorial.

## 5. Ordre de migration sans rupture

1. Écrire et valider les contrats de données.
2. Ajouter des tests qui lisent les vrais fichiers produits par le pipeline.
3. Séparer les données Academy du rendu JavaScript.
4. Construire une couche de lecture commune pour le frontend.
5. Créer les pages cibles en parallèle, sans retirer les pages actuelles.
6. Comparer les nombres de notices, les codes statistiques et les QCM entre ancienne et nouvelle version.
7. Tester les pages sur mobile, desktop et en arabe RTL.
8. Faire une prévisualisation non publique.
9. Basculer le déploiement uniquement après validation et avec une possibilité de retour arrière.

## 6. Contrôles de non-régression

Avant chaque étape de migration, comparer :
- nombre total de notices et répartition par espace ;
- ensemble des identifiants ;
- ensemble des DOI ;
- ensemble des codes d'indicateurs ;
- nombre de points historiques par série ;
- liens PDF et DOI ;
- nombre de parcours, modules et questions Academy ;
- favoris et contributions locales exportées ;
- langue, dates, filtres et liens des fiches.

Une différence n'est pas automatiquement une erreur, mais elle doit être expliquée avant de poursuivre.
