# DiagIT Collectivité

Outil de diagnostic du système informatique d'une collectivité.

## Développement local

1. Copier l'exemple d'env : `cp .env.example .env` puis générer un secret : `openssl rand -base64 32` et le placer dans `AUTH_SECRET`.
2. Démarrer Postgres : `docker compose up -d db`
3. Installer les dépendances : `npm install`
4. Lancer les migrations : `npx prisma migrate dev`
5. Lancer l'app : `npm run dev`

## Tests

- Unitaires : `npm test`
- End-to-end : `npm run e2e`
