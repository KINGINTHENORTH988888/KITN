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

**Prochaine reprise technique :** commencer par la Phase A et valider la tête `1ab12bf748323ea7a7c6cdd6a04c601a0a6b36a5`. Le dernier commit ajoute un test de tri chronologique ; il faut obtenir la suite frontend complète sur cette tête. La production reste inchangée.
