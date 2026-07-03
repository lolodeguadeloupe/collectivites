# DiagIT Collectivité

Outil de diagnostic du système informatique d'une collectivité.

## Développement local

1. Copier l'exemple d'env : `cp .env.example .env` puis générer un secret : `openssl rand -base64 32` et le placer dans `AUTH_SECRET`.
2. Démarrer Postgres : `docker compose --profile dev up -d db`
3. Installer les dépendances : `npm install`
4. Lancer les migrations : `npx prisma migrate dev`
5. Lancer l'app : `npm run dev`

## Tests

- Unitaires : `npm test`
- End-to-end : `npm run e2e`

## Déploiement Coolify

L'application est prévue pour un déploiement Coolify auto-hébergé.

### Services

1. **PostgreSQL** — provisionner via l'interface Coolify (base `diagit`, utilisateur `diagit`). Activer les sauvegardes automatiques vers un stockage S3-compatible et **tester la restauration**.
2. **Application** — projet Coolify de type *Dockerfile* pointant sur ce dépôt.
   - Build path : `/`
   - Port exposé : `3000`
   - Reconstruction automatique à chaque push sur la branche `main`.

### Variables d'environnement à définir dans Coolify

| Variable      | Exemple / source                                              |
|---------------|---------------------------------------------------------------|
| `DATABASE_URL`| URL fournie par le service Postgres Coolify                   |
| `AUTH_SECRET` | Généré avec `openssl rand -base64 32` — **jamais** dans Git   |
| `AUTH_URL`    | `https://diagit.exemple.fr` (URL publique de l'application)   |
| `NODE_ENV`    | `production`                                                  |

### HTTPS

Coolify délivre automatiquement un certificat Let's Encrypt via Traefik dès que le domaine est associé au service applicatif.

### Migrations

Le `docker-compose.yml` définit un service `migrate` (cible `migrator` du Dockerfile) qui exécute `prisma migrate deploy`. Il est relancé (`restart: on-failure`) jusqu'à ce que la base soit joignable et les migrations appliquées. Le service `app` démarre en parallèle sans attendre la réussite des migrations : un échec de migration ne doit jamais rendre le site totalement indisponible.

> **Note** : si le projet Coolify utilise le build pack *Dockerfile* (et non *Docker Compose*), le service `migrate` n'est pas exécuté. Il faut alors lancer les migrations manuellement après chaque changement de schéma : `npx prisma migrate deploy` (via un terminal Coolify ou une commande post-déploiement).

Le conteneur applicatif (`target runner`) ne lance que `node server.js` : il reste léger et démarre rapidement, sans exposer la chaîne de migration dans le runtime Edge/Node.

### Dépannage — « no available server »

Ce message est renvoyé par le proxy Traefik de Coolify quand **aucun conteneur applicatif sain n'est joignable**. L'image applicative démarre et sert la page d'accueil même si la base de données est injoignable ou si `AUTH_SECRET` manque : ce message indique donc toujours un problème d'infrastructure, pas un crash applicatif. Vérifier dans l'ordre, dans le tableau de bord Coolify :

1. **Le dernier déploiement a-t-il réussi ?** (onglet *Deployments* → logs de build). Un build en échec laisse Traefik sans conteneur cible.
2. **Le conteneur `app` tourne-t-il ?** (onglet *Logs* ou `docker ps` sur le serveur). Avec l'ancien `docker-compose.yml`, un échec du service `migrate` (base injoignable) empêchait `app` de démarrer — corrigé depuis, redéployer avec la version à jour du dépôt.
3. **`DATABASE_URL` pointe-t-elle vers l'hôte interne du Postgres Coolify ?** (ex. `postgresql://diagit:…@<nom-du-conteneur-postgres>:5432/diagit`, pas `localhost`). En build pack *Docker Compose*, activer **« Connect To Predefined Network »** dans les paramètres du service, sinon la stack ne voit pas le Postgres géré par Coolify.
4. **Le port exposé configuré dans Coolify est bien `3000`** (paramètre *Ports Exposes* en build pack Dockerfile) et le domaine est attaché au service applicatif (pas au service `migrate`).
5. **Le conteneur est-il « healthy » ?** Traefik retire du routage un conteneur dont le healthcheck échoue. Tester depuis le serveur : `docker exec <conteneur-app> wget -qO- http://127.0.0.1:3000/api/sante` — doit renvoyer `{"statut":"ok",…}`.
