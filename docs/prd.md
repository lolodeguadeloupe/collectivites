# PRD — Outil de diagnostic du système informatique d'une collectivité

**Nom de code du produit :** *DiagIT Collectivité* (provisoire)
**Version du document :** 1.0
**Statut :** Proposition initiale
**Date :** Juillet 2026

---

## 1. Contexte et problème

Les petites et moyennes collectivités (mairies, communautés de communes, syndicats intercommunaux, CCAS) disposent rarement d'un service informatique dédié. Leur système d'information s'est souvent construit par empilement au fil des années, sans cartographie ni politique de sécurité formalisée. Résultat :

- des systèmes d'exploitation en fin de support toujours en production ;
- des sauvegardes non testées, voire inexistantes ;
- une exposition croissante aux rançongiciels (les collectivités sont une cible privilégiée) ;
- une conformité RGPD partielle et non documentée ;
- une dépendance forte à un prestataire unique, sans visibilité interne.

Le plus souvent, l'élu ou l'agent référent **ne sait pas par où commencer** ni **où sont les urgences réelles**. Un audit par un prestataire externe coûte cher et intervient trop tard.

**Le problème à résoudre :** offrir un moyen simple, non intrusif et pédagogique de dresser un état des lieux du système informatique, d'identifier les risques prioritaires et de générer un plan d'action concret — sans compétence technique avancée.

---

## 2. Objectifs

### Objectifs produit
- Permettre à un agent non-technicien de réaliser une auto-évaluation complète en moins de 45 minutes.
- Produire un **score de maturité numérique** clair, décomposé par domaine.
- Générer automatiquement un **plan d'action priorisé** (urgences, court terme, moyen terme).
- Exporter un rapport présentable en conseil municipal ou à un prestataire.

### Objectifs de succès (mesurables)
- Un questionnaire complété à 100 % en une session dans 80 % des cas.
- Un rapport jugé « utile et compréhensible » par au moins 4 utilisateurs pilotes sur 5.
- Au moins 3 actions correctives engagées dans les 3 mois suivant le diagnostic (mesuré sur les pilotes).

### Hors périmètre (non-objectifs, v1)
- Le scan technique automatisé du réseau (Nmap, sondes, agents installés). La v1 repose sur du déclaratif.
- La télé-remédiation ou l'application automatique de correctifs.
- La gestion de tickets ou le suivi de projet dans la durée.
- Le multi-tenant à grande échelle (v1 = usage par une collectivité à la fois, ou un accompagnant qui saisit pour elles).

---

## 3. Utilisateurs cibles (personas)

**Persona 1 — Nadia, secrétaire de mairie (utilisatrice principale)**
Non-technicienne, polyvalente, peu de temps. A besoin d'un langage clair, sans jargon, avec des explications à chaque question. C'est elle qui remplit le questionnaire.

**Persona 2 — L'élu référent numérique**
Consomme le rapport final. Veut une vision synthétique, des chiffres, une note globale et un budget d'action estimé pour arbitrer.

**Persona 3 — Le conseiller / accompagnant (ex. agent d'une intercommunalité, conseiller numérique France Services)**
Peut réaliser le diagnostic pour le compte de plusieurs collectivités. A besoin de comparer et de reprendre des diagnostics existants.

---

## 4. Périmètre fonctionnel — les domaines de diagnostic

L'outil s'articule autour de **7 domaines**, chacun composé de questions pondérées.

### D1 — Inventaire et parc matériel
- Nombre et âge des postes de travail, serveurs, équipements réseau.
- Systèmes d'exploitation utilisés et leur statut de support (détection des OS obsolètes).
- Logiciels métier critiques (état civil, urbanisme, comptabilité, paie).

### D2 — Sécurité et protection
- Antivirus / EDR présent et à jour.
- Politique de mots de passe et authentification à deux facteurs.
- Gestion des correctifs (mises à jour appliquées régulièrement ?).
- Exposition sur internet (services accessibles depuis l'extérieur).
- Sensibilisation des agents au phishing.

### D3 — Sauvegarde et continuité
- Existence de sauvegardes.
- Fréquence et externalisation (règle 3-2-1).
- **Test de restauration** déjà réalisé (question clé).
- Existence d'un Plan de Reprise / Continuité d'Activité (PRA/PCA).

### D4 — Réseau et infrastructure
- Cartographie du réseau existante ou non.
- Segmentation (Wi-Fi public isolé du réseau administratif ?).
- Qualité et redondance de la connexion internet.

### D5 — Conformité RGPD et données
- Registre des traitements tenu à jour.
- Désignation d'un DPO (mutualisé ou non).
- Localisation et hébergement des données (souveraineté, sous-traitants).
- Gestion des droits d'accès et des départs d'agents.

### D6 — Gouvernance et organisation
- Existence d'une personne référente identifiée.
- Contrats de maintenance et niveau de dépendance prestataire.
- Budget informatique formalisé.
- Documentation existante.

### D7 — Usages et pratiques des agents
- Niveau de maturité numérique des agents.
- Formation et accompagnement.
- Usage d'outils non maîtrisés (« shadow IT », clés USB personnelles, etc.).

---

## 5. Méthodologie de scoring

### Principe
Chaque question a :
- un **type de réponse** (oui/non, échelle 1–4, choix multiple) ;
- un **poids** (impact sur le risque, de 1 à 5) ;
- un **niveau de criticité** déclenchant une alerte si la réponse révèle un risque majeur (ex. « aucune sauvegarde testée » = alerte rouge, quel que soit le reste).

### Calcul
- Chaque domaine reçoit un score de **0 à 100 %** = (somme des points obtenus / somme des points possibles).
- Le **score global** est une moyenne pondérée des domaines (la sécurité et la sauvegarde pèsent davantage).
- Un système de **paliers** traduit le score en niveau lisible :
  - 0–39 % : **Critique** (rouge)
  - 40–59 % : **Fragile** (orange)
  - 60–79 % : **En progression** (jaune)
  - 80–100 % : **Solide** (vert)

### Règle des « points bloquants »
Indépendamment du score chiffré, certaines réponses génèrent une **alerte prioritaire** affichée en tête de rapport (ex. OS en fin de support en production, aucune sauvegarde, service exposé sans protection). L'objectif est d'éviter qu'un bon score moyen masque une faille majeure.

---

## 6. Génération du plan d'action

À partir des réponses, l'outil produit une liste d'actions correctives, chacune avec :
- un **libellé clair** (« Mettre en place une sauvegarde externalisée testée ») ;
- une **priorité** (urgent / court terme / moyen terme) ;
- un **domaine** rattaché ;
- une **estimation d'effort** (faible / moyen / élevé) ;
- optionnellement, une **fourchette budgétaire indicative** et une ressource/lien (ex. guide ANSSI, dispositif France Num).

Les actions sont triées : d'abord les points bloquants, puis par priorité et par ratio impact/effort.

---

## 7. Exigences fonctionnelles détaillées

| Réf | Exigence | Priorité |
|-----|----------|----------|
| F1 | L'utilisateur peut créer un diagnostic et le reprendre plus tard (sauvegarde de l'état). | Must |
| F2 | Le questionnaire est découpé par domaine, avec une barre de progression. | Must |
| F3 | Chaque question propose une aide contextuelle (info-bulle en langage clair). | Must |
| F4 | Les questions non pertinentes sont masquées par logique conditionnelle (ex. pas de serveur → on saute les questions serveur). | Should |
| F5 | Un tableau de bord affiche le score global, le score par domaine et les alertes. | Must |
| F6 | Le plan d'action est généré automatiquement et priorisé. | Must |
| F7 | Export du rapport en PDF. | Must |
| F8 | Possibilité de comparer deux diagnostics dans le temps (évolution du score). | Could |
| F9 | Un accompagnant peut gérer plusieurs collectivités (liste de diagnostics). | Should |
| F10 | Authentification simple (email + mot de passe). | Must |

---

## 8. Exigences non-fonctionnelles

- **Simplicité :** interface utilisable par un non-technicien, langage sans jargon, responsive (tablette/PC).
- **Accessibilité :** conformité RGAA visée (contraste, navigation clavier, labels).
- **Souveraineté des données :** hébergement en France/UE, données du diagnostic non partagées à des tiers.
- **Sécurité :** chiffrement des données au repos et en transit (HTTPS), mots de passe hachés, principe du moindre privilège.
- **Performance :** chargement des pages < 2 s, questionnaire fluide.
- **Portabilité :** application conteneurisée, déployable de façon reproductible.
- **RGPD by design :** minimisation des données collectées, possibilité d'export et de suppression du diagnostic.

---

## 9. Architecture technique proposée

### Vue d'ensemble
Application web classique en trois couches, entièrement conteneurisée pour un déploiement auto-hébergé maîtrisé.

```
[ Navigateur ]  ->  [ Frontend web ]  ->  [ API backend ]  ->  [ Base de données ]
                                              |
                                        [ Génération PDF ]
```

### Stack recommandée (à titre indicatif, adaptable)
- **Frontend :** framework moderne (ex. Next.js / React ou SvelteKit), rendu responsive, composants accessibles.
- **Backend :** API REST ou serveur intégré (Node.js, ou Python/FastAPI selon préférence). Le questionnaire et le barème sont définis dans une **structure de données versionnée (JSON/YAML)** pour pouvoir évoluer sans redéployer le code.
- **Base de données :** PostgreSQL (diagnostics, réponses, utilisateurs, collectivités).
- **Génération de rapport :** rendu HTML converti en PDF côté serveur.
- **Authentification :** solution intégrée simple (sessions ou JWT), option d'ajout d'un fournisseur d'identité plus tard.

### Déploiement et hébergement — Coolify
L'application est **auto-hébergée via Coolify**, ce qui correspond au besoin de souveraineté et de maîtrise :

- Chaque composant (frontend, backend, base PostgreSQL) est défini comme un service dans Coolify, ou via un `docker-compose` importé.
- **Déploiement continu** depuis le dépôt Git : à chaque push sur la branche de production, Coolify reconstruit et redéploie automatiquement.
- **Base de données PostgreSQL** provisionnée directement par Coolify, avec ses sauvegardes automatiques planifiées (essentiel — l'outil qui prêche la sauvegarde doit être exemplaire).
- **Certificats HTTPS** gérés automatiquement par Coolify (Let's Encrypt) via son reverse proxy intégré (Traefik).
- **Variables d'environnement et secrets** (identifiants base, clés) gérés dans l'interface Coolify, jamais dans le code.
- **Sauvegardes** : configurer les backups automatiques de la base dans Coolify vers un stockage externe (S3-compatible), et les tester.

Cette approche permet un hébergement sur un simple VPS ou un serveur de la collectivité/intercommunalité, sans dépendre d'un cloud propriétaire.

---

## 10. Modèle de données (simplifié)

- **Collectivité** : id, nom, type, taille (nb d'agents), contact.
- **Utilisateur** : id, email, mot de passe (haché), rôle (agent / accompagnant), collectivité(s) rattachée(s).
- **Diagnostic** : id, collectivité, date, statut (en cours / terminé), score global.
- **Réponse** : id, diagnostic, question, valeur, points obtenus.
- **Question / Barème** : versionné hors base (fichier de configuration) — id, domaine, libellé, type, options, poids, règles de criticité, logique conditionnelle.
- **Action** (générée) : id, diagnostic, libellé, priorité, domaine, effort, statut.

---

## 11. Parcours utilisateur (écrans clés)

1. **Accueil / connexion** — présentation de l'outil, création de compte.
2. **Fiche collectivité** — quelques infos de contexte (taille, type) pour adapter le questionnaire.
3. **Questionnaire par domaine** — progression visible, aide contextuelle, sauvegarde automatique.
4. **Tableau de bord de résultats** — jauge de score global, radar par domaine, alertes en rouge en tête.
5. **Plan d'action** — liste triée par priorité, filtrable par domaine, cases à cocher de suivi.
6. **Export** — génération et téléchargement du rapport PDF.
7. **(Accompagnant)** — liste des collectivités et de leurs diagnostics.

---

## 12. Feuille de route (phasage)

### Phase 1 — MVP (cœur de valeur)
- Questionnaire complet des 7 domaines (déclaratif).
- Scoring + alertes bloquantes.
- Tableau de bord de résultats.
- Plan d'action généré.
- Export PDF.
- Auth simple, sauvegarde/reprise d'un diagnostic.
- Déploiement Coolify opérationnel.

### Phase 2 — Confort et suivi
- Logique conditionnelle avancée (masquage de questions).
- Comparaison de diagnostics dans le temps.
- Gestion multi-collectivités pour accompagnants.
- Bibliothèque de ressources/liens par action.

### Phase 3 — Approfondissement (optionnel)
- Module de scan technique léger et non intrusif (déclaratif assisté ou import d'inventaire GLPI).
- Modèles de plans d'action budgétés.
- Tableau de bord agrégé à l'échelle d'une intercommunalité.

---

## 13. Indicateurs de succès (KPIs)

- Taux de complétion des diagnostics.
- Temps moyen de réalisation.
- Nombre d'actions marquées « engagées » par les utilisateurs.
- Score de satisfaction (échelle simple en fin de parcours).
- Évolution du score de maturité entre deux diagnostics d'une même collectivité.

---

## 14. Risques et points de vigilance

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Biais du déclaratif (réponses inexactes ou optimistes) | Diagnostic faussé | Questions formulées factuellement, aide contextuelle, mention que le résultat dépend de la sincérité des réponses. |
| Questionnaire jugé trop long | Abandon | Découpage par domaine, sauvegarde/reprise, logique conditionnelle. |
| Jargon technique rebutant | Non-adoption | Relecture par des non-techniciens, glossaire, info-bulles systématiques. |
| Sécurité de l'outil lui-même | Perte de crédibilité | HTTPS, hachage, sauvegardes testées, moindre privilège — l'outil doit être exemplaire. |
| Obsolescence du barème | Rapport inexact | Barème versionné dans un fichier de config, mis à jour indépendamment du code. |
| Dépendance à une personne pour la maintenance | Continuité | Documentation, conteneurisation, déploiement reproductible via Coolify. |

---

## 15. Questions ouvertes

- Faut-il prévoir un mode « accompagné » où un conseiller réalise le diagnostic en atelier avec la collectivité ?
- Le barème doit-il s'aligner sur un référentiel existant (guide ANSSI collectivités, référentiel France Num) pour crédibilité et réutilisation ?
- Souhaite-t-on à terme mutualiser les données (anonymisées) pour produire des statistiques territoriales ?

---

*Fin du document.*