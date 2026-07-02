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

Le `docker-compose.yml` définit un service `migrate` (cible `migrator` du Dockerfile) qui exécute `prisma migrate deploy`. Le service `app` en dépend via `service_completed_successfully` : Coolify lance `migrate` en premier, et `app` ne démarre qu'une fois les migrations appliquées avec succès.

Le conteneur applicatif (`target runner`) ne lance que `node server.js` : il reste léger et démarre rapidement, sans exposer la chaîne de migration dans le runtime Edge/Node.
