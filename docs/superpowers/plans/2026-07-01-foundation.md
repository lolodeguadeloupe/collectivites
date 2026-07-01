# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deployable scaffold of *DiagIT Collectivité* — a Next.js 15 (App Router, TypeScript) full-stack app with Prisma + PostgreSQL, email/password auth via Auth.js v5, French UI shell, test infrastructure (Vitest + Playwright), and Docker artifacts ready for Coolify deployment.

**Architecture:** Single Next.js codebase. Server-side data access via Prisma. Auth.js v5 with the Credentials provider (bcrypt-hashed passwords). All UI text in French. Content of the questionnaire lives in YAML files loaded at runtime (schema/loader is built in Plan 2 — this plan only reserves the file location and DB columns that store *responses* + *actions*, referencing question IDs from the YAML).

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma 5, PostgreSQL 16, Auth.js v5 (`next-auth@5`), bcryptjs, Zod, Vitest, Playwright, Docker.

---

## File Structure

Repo layout after this plan:

```
/root/projets/collectivites/
├── prd.md                        # keep as-is (product ref)
├── docs/
│   ├── prd.md                    # symlink or move? (see Task 1)
│   └── superpowers/plans/*.md
├── src/
│   ├── app/
│   │   ├── layout.tsx            # root layout, French lang, header
│   │   ├── page.tsx              # public landing
│   │   ├── (auth)/
│   │   │   ├── inscription/page.tsx   # signup form
│   │   │   └── connexion/page.tsx     # login form
│   │   ├── (app)/
│   │   │   ├── layout.tsx        # protected layout (redirect if !session)
│   │   │   └── tableau-de-bord/page.tsx  # placeholder dashboard
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── inscription/route.ts    # POST create user
│   │       └── sante/route.ts          # health check
│   ├── lib/
│   │   ├── db.ts                 # Prisma client singleton
│   │   ├── auth.ts               # Auth.js config
│   │   ├── password.ts           # bcrypt hash/verify
│   │   └── validators.ts         # Zod schemas for auth
│   └── middleware.ts             # route protection
├── prisma/
│   ├── schema.prisma
│   └── migrations/               # generated
├── tests/
│   ├── unit/                     # Vitest
│   │   └── password.test.ts
│   └── e2e/                      # Playwright
│       └── auth.spec.ts
├── config/                       # (reserved for Plan 2 YAML barème)
├── public/
├── .env.example
├── .env                          # local dev, gitignored
├── Dockerfile
├── docker-compose.yml            # local Postgres + app
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── vitest.config.ts
├── playwright.config.ts
├── package.json
├── .gitignore
└── README.md
```

**Responsibilities:**
- `src/app/` — routes only (RSC by default, client where needed)
- `src/lib/` — pure, testable server modules
- `prisma/schema.prisma` — persisted models only (users, diagnostics, responses, actions, collectivités)
- `tests/unit/` — Vitest, no browser, no DB (pure functions)
- `tests/e2e/` — Playwright against a running app + real Postgres

---

## Task 1: Initialize Next.js project structure

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore`, `docs/prd.md`, `README.md`

- [ ] **Step 1: Move PRD into `docs/` and init git**

The `create-next-app` scaffolder refuses non-empty directories. Move the PRD first.

```bash
cd /root/projets/collectivites
mkdir -p docs
mv prd.md docs/prd.md
git init
git add docs/
git commit -m "chore: initial commit with PRD"
```

- [ ] **Step 2: Scaffold Next.js**

```bash
cd /root/projets/collectivites
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm \
  --no-turbopack \
  --skip-install
```

Expected: files created, no install yet.

- [ ] **Step 3: Set French `lang` and title in root layout**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DiagIT Collectivité",
  description:
    "Outil de diagnostic du système informatique d'une collectivité.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Replace the default landing page**

Replace `src/app/page.tsx` with:

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">DiagIT Collectivité</h1>
      <p className="mt-4 text-lg">
        Outil de diagnostic du système informatique d'une collectivité.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/connexion"
          className="rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
        >
          Se connecter
        </Link>
        <Link
          href="/inscription"
          className="rounded border border-blue-700 px-4 py-2 text-blue-700 hover:bg-blue-50"
        >
          Créer un compte
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Verify dev server boots**

```bash
npm run dev
```

Expected: `Ready in Xms` on `http://localhost:3000`. Kill with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: scaffold Next.js app with French landing page"
```

---

## Task 2: Add testing infrastructure (Vitest)

**Files:**
- Create: `vitest.config.ts`, `tests/unit/smoke.test.ts`
- Modify: `package.json` (scripts, deps)

- [ ] **Step 1: Install Vitest and helpers**

```bash
npm install -D vitest @vitest/coverage-v8
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Add npm scripts**

Edit `package.json` — add under `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:cov": "vitest run --coverage"
```

- [ ] **Step 4: Write a smoke test**

Create `tests/unit/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs the test runner", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

```bash
npm test
```

Expected: `1 passed`.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts tests/ package.json package-lock.json
git commit -m "chore: add Vitest unit test infrastructure"
```

---

## Task 3: Add E2E infrastructure (Playwright)

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/home.spec.ts`
- Modify: `package.json`, `.gitignore`

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 3: Add npm script**

Add to `package.json` scripts:

```json
"e2e": "playwright test"
```

- [ ] **Step 4: Ignore Playwright output**

Append to `.gitignore`:

```
# Playwright
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
```

- [ ] **Step 5: Write a landing-page smoke E2E**

Create `tests/e2e/home.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("landing page shows French title and CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "DiagIT Collectivité" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Se connecter" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Créer un compte" }),
  ).toBeVisible();
});
```

- [ ] **Step 6: Run E2E**

```bash
npm run e2e
```

Expected: `1 passed`. The webServer will boot the dev server, run the test, and exit.

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts tests/e2e/ package.json package-lock.json .gitignore
git commit -m "chore: add Playwright E2E test infrastructure"
```

---

## Task 4: Local Postgres via docker-compose

**Files:**
- Create: `docker-compose.yml`, `.env.example`, `.env`
- Modify: `.gitignore`, `README.md`

- [ ] **Step 1: Add `.env` to gitignore, keep `.env.example` tracked**

Append to `.gitignore`:

```
# Env
.env
.env.local
.env*.local
!.env.example
```

- [ ] **Step 2: Create `.env.example`**

```
# Database
DATABASE_URL="postgresql://diagit:diagit@localhost:5432/diagit?schema=public"

# Auth.js
# Generate with: openssl rand -base64 32
AUTH_SECRET=""
AUTH_URL="http://localhost:3000"

# App
NODE_ENV="development"
```

- [ ] **Step 3: Copy to real `.env` and generate a secret**

```bash
cp .env.example .env
SECRET=$(openssl rand -base64 32)
# Portable replacement (works on GNU + BSD sed)
node -e "const fs=require('fs');const s=fs.readFileSync('.env','utf8').replace('AUTH_SECRET=\"\"','AUTH_SECRET=\"'+process.argv[1]+'\"');fs.writeFileSync('.env',s);" "$SECRET"
cat .env
```

Expected: `.env` has a non-empty `AUTH_SECRET`.

- [ ] **Step 4: Create `docker-compose.yml` (local dev only)**

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: diagit
      POSTGRES_PASSWORD: diagit
      POSTGRES_DB: diagit
    ports:
      - "5432:5432"
    volumes:
      - diagit_pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U diagit -d diagit"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  diagit_pg_data:
```

- [ ] **Step 5: Start Postgres**

```bash
docker compose up -d db
docker compose ps
```

Expected: `db` is `Up ... (healthy)` within ~10s.

- [ ] **Step 6: Verify connection with psql (via container)**

```bash
docker compose exec db psql -U diagit -d diagit -c "SELECT 1;"
```

Expected: `?column?` = 1.

- [ ] **Step 7: Add a README section**

Append to `README.md` (create if missing):

```markdown
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
```

- [ ] **Step 8: Commit**

```bash
git add docker-compose.yml .env.example .gitignore README.md
git commit -m "chore: add local Postgres via docker-compose"
```

---

## Task 5: Prisma setup + database schema

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Prisma**

```bash
npm install prisma --save-dev
npm install @prisma/client
```

- [ ] **Step 2: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma`. It also creates a `.env` — since we already have one, delete the duplicate line if Prisma appended `DATABASE_URL` again (verify only one line).

- [ ] **Step 3: Write the full schema**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---- Domain models ---------------------------------------------------------

enum RoleUtilisateur {
  AGENT
  ACCOMPAGNANT
}

enum StatutDiagnostic {
  EN_COURS
  TERMINE
}

enum PrioriteAction {
  URGENT
  COURT_TERME
  MOYEN_TERME
}

enum EffortAction {
  FAIBLE
  MOYEN
  ELEVE
}

enum StatutAction {
  A_FAIRE
  EN_COURS
  FAIT
}

enum TypeCollectivite {
  MAIRIE
  COMMUNAUTE_DE_COMMUNES
  SYNDICAT
  CCAS
  AUTRE
}

model Collectivite {
  id          String            @id @default(cuid())
  nom         String
  type        TypeCollectivite
  nbAgents    Int?
  contact     String?
  creeLe      DateTime          @default(now())
  majLe       DateTime          @updatedAt

  utilisateurs UtilisateurCollectivite[]
  diagnostics  Diagnostic[]
}

model Utilisateur {
  id              String            @id @default(cuid())
  email           String            @unique
  motDePasseHache String
  role            RoleUtilisateur   @default(AGENT)
  creeLe          DateTime          @default(now())
  majLe           DateTime          @updatedAt

  collectivites   UtilisateurCollectivite[]
}

// Explicit join table so an accompagnant can be linked to N collectivités.
model UtilisateurCollectivite {
  utilisateurId  String
  collectiviteId String
  ajouteLe       DateTime     @default(now())

  utilisateur    Utilisateur  @relation(fields: [utilisateurId], references: [id], onDelete: Cascade)
  collectivite   Collectivite @relation(fields: [collectiviteId], references: [id], onDelete: Cascade)

  @@id([utilisateurId, collectiviteId])
  @@index([collectiviteId])
}

model Diagnostic {
  id             String           @id @default(cuid())
  collectiviteId String
  statut         StatutDiagnostic @default(EN_COURS)
  scoreGlobal    Float?           // 0..100, null tant que non terminé
  bareme         String           // version du barème (ex. "2026.1"), tirée du YAML
  creeLe         DateTime         @default(now())
  majLe          DateTime         @updatedAt
  termineLe      DateTime?

  collectivite   Collectivite     @relation(fields: [collectiviteId], references: [id], onDelete: Cascade)
  reponses       Reponse[]
  actions        Action[]

  @@index([collectiviteId])
}

// A response points at a question by string ID from the YAML barème.
// We store the raw value + the computed points obtained (denormalized on save
// so historical reports remain stable even if the barème evolves).
model Reponse {
  id             String     @id @default(cuid())
  diagnosticId   String
  questionId     String
  domaine        String     // "D1".."D7" — snapshot from barème
  valeur         Json       // shape depends on question type
  pointsObtenus  Float
  pointsMax      Float
  repondueLe     DateTime   @default(now())

  diagnostic     Diagnostic @relation(fields: [diagnosticId], references: [id], onDelete: Cascade)

  @@unique([diagnosticId, questionId])
  @@index([diagnosticId])
}

model Action {
  id           String         @id @default(cuid())
  diagnosticId String
  libelle      String
  domaine      String
  priorite     PrioriteAction
  effort       EffortAction
  budgetMin    Int?           // euros
  budgetMax    Int?
  ressourceUrl String?        // lien vers guide ANSSI / France Num
  statut       StatutAction   @default(A_FAIRE)
  creeLe       DateTime       @default(now())

  diagnostic   Diagnostic     @relation(fields: [diagnosticId], references: [id], onDelete: Cascade)

  @@index([diagnosticId])
}
```

- [ ] **Step 4: Create initial migration**

```bash
npx prisma migrate dev --name init
```

Expected: migration created under `prisma/migrations/*_init/migration.sql`, applied successfully, `Generated Prisma Client` message.

- [ ] **Step 5: Create Prisma client singleton**

Create `src/lib/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 6: Verify Prisma client works**

Create `tests/unit/db.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("prisma client", () => {
  it("imports the singleton without throwing", async () => {
    const { prisma } = await import("@/lib/db");
    expect(prisma).toBeDefined();
  });
});
```

Run:

```bash
npm test
```

Expected: 2 passed (smoke + db import).

- [ ] **Step 7: Commit**

```bash
git add prisma/ src/lib/db.ts tests/unit/db.test.ts package.json package-lock.json
git commit -m "feat(db): add Prisma schema, initial migration, client singleton"
```

---

## Task 6: Password hashing helper (TDD)

**Files:**
- Create: `src/lib/password.ts`, `tests/unit/password.test.ts`

- [ ] **Step 1: Install bcryptjs**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Write failing tests**

Create `tests/unit/password.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password", () => {
  it("hashes a password to a non-empty string different from the input", async () => {
    const hash = await hashPassword("MotDePasse123!");
    expect(hash).toBeTypeOf("string");
    expect(hash.length).toBeGreaterThan(20);
    expect(hash).not.toBe("MotDePasse123!");
  });

  it("verifies a matching password", async () => {
    const hash = await hashPassword("MotDePasse123!");
    await expect(verifyPassword("MotDePasse123!", hash)).resolves.toBe(true);
  });

  it("rejects a non-matching password", async () => {
    const hash = await hashPassword("MotDePasse123!");
    await expect(verifyPassword("MotDePasse456!", hash)).resolves.toBe(false);
  });
});
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module '@/lib/password'`.

- [ ] **Step 4: Implement the module**

Create `src/lib/password.ts`:

```ts
import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/password.ts tests/unit/password.test.ts package.json package-lock.json
git commit -m "feat(auth): bcrypt password hash/verify helpers"
```

---

## Task 7: Auth.js v5 configuration

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/validators.ts`, `src/app/api/auth/[...nextauth]/route.ts`

We use **Credentials provider + JWT session strategy**. With JWT, Auth.js never touches the database beyond our `authorize()` callback, so no `PrismaAdapter` and no extra `Account`/`Session` tables are required. If OAuth providers are added later, the adapter + tables can be introduced in one migration.

- [ ] **Step 1: Install Auth.js v5 and Zod**

```bash
npm install next-auth@^5 zod
```

- [ ] **Step 2: Create Zod validators**

Create `src/lib/validators.ts`:

```ts
import { z } from "zod";

export const inscriptionSchema = z.object({
  email: z
    .string()
    .email("Adresse e-mail invalide")
    .max(200, "Adresse e-mail trop longue"),
  motDePasse: z
    .string()
    .min(12, "Le mot de passe doit contenir au moins 12 caractères")
    .max(200, "Mot de passe trop long"),
});

export type InscriptionInput = z.infer<typeof inscriptionSchema>;

export const connexionSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  motDePasse: z.string().min(1, "Mot de passe requis"),
});

export type ConnexionInput = z.infer<typeof connexionSchema>;
```

- [ ] **Step 3: Configure Auth.js**

Create `src/lib/auth.ts`:

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { connexionSchema } from "@/lib/validators";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
  },
  providers: [
    Credentials({
      name: "Identifiants",
      credentials: {
        email: { label: "E-mail", type: "email" },
        motDePasse: { label: "Mot de passe", type: "password" },
      },
      async authorize(raw) {
        const parsed = connexionSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, motDePasse } = parsed.data;
        const user = await prisma.utilisateur.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) return null;

        const ok = await verifyPassword(motDePasse, user.motDePasseHache);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: null,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        // @ts-expect-error augmented at runtime
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error augmenting session shape
        session.user.id = token.uid as string;
        // @ts-expect-error augmenting session shape
        session.user.role = token.role;
      }
      return session;
    },
  },
});
```

- [ ] **Step 4: Mount the Auth.js route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 5: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors. If Auth.js session augmentation warnings appear, they're behind `@ts-expect-error` and safe.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/lib/validators.ts src/app/api/auth package.json package-lock.json
git commit -m "feat(auth): configure Auth.js v5 with Credentials + JWT"
```

---

## Task 8: Signup route + page (TDD, integration-ish)

**Files:**
- Create: `src/app/api/inscription/route.ts`, `src/app/(auth)/inscription/page.tsx`, `tests/unit/inscription.test.ts`

- [ ] **Step 1: Write failing test for the signup handler logic**

We test the pure part: given a valid input and an empty DB, a user is created with a hashed password. Since Prisma is real (points at local Postgres via `.env`), we clean up before each test.

Create `tests/unit/inscription.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import { creerUtilisateur } from "@/lib/inscription";
import { verifyPassword } from "@/lib/password";

describe("creerUtilisateur", () => {
  beforeEach(async () => {
    await prisma.utilisateur.deleteMany({
      where: { email: { endsWith: "@test.diagit.local" } },
    });
  });

  it("creates a user with a bcrypt-hashed password", async () => {
    const user = await creerUtilisateur({
      email: "nadia@test.diagit.local",
      motDePasse: "MotDePasse-Solide-123",
    });

    expect(user.id).toBeTypeOf("string");
    expect(user.email).toBe("nadia@test.diagit.local");
    expect(user.motDePasseHache).not.toBe("MotDePasse-Solide-123");
    await expect(
      verifyPassword("MotDePasse-Solide-123", user.motDePasseHache),
    ).resolves.toBe(true);
  });

  it("lowercases the stored email", async () => {
    const user = await creerUtilisateur({
      email: "NADIA@test.diagit.local",
      motDePasse: "MotDePasse-Solide-123",
    });
    expect(user.email).toBe("nadia@test.diagit.local");
  });

  it("rejects a duplicate email with EmailDejaUtilise", async () => {
    await creerUtilisateur({
      email: "nadia@test.diagit.local",
      motDePasse: "MotDePasse-Solide-123",
    });
    await expect(
      creerUtilisateur({
        email: "nadia@test.diagit.local",
        motDePasse: "AutreMotDePasse-456",
      }),
    ).rejects.toThrow("EmailDejaUtilise");
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test
```

Expected: FAIL — `Cannot find module '@/lib/inscription'`.

- [ ] **Step 3: Implement the module**

Create `src/lib/inscription.ts`:

```ts
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import type { InscriptionInput } from "@/lib/validators";

export class EmailDejaUtilise extends Error {
  constructor() {
    super("EmailDejaUtilise");
    this.name = "EmailDejaUtilise";
  }
}

export async function creerUtilisateur(input: InscriptionInput) {
  const email = input.email.trim().toLowerCase();
  const existant = await prisma.utilisateur.findUnique({ where: { email } });
  if (existant) throw new EmailDejaUtilise();

  const motDePasseHache = await hashPassword(input.motDePasse);
  return prisma.utilisateur.create({
    data: { email, motDePasseHache },
  });
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Wire the HTTP route**

Create `src/app/api/inscription/route.ts`:

```ts
import { NextResponse } from "next/server";
import { inscriptionSchema } from "@/lib/validators";
import { creerUtilisateur, EmailDejaUtilise } from "@/lib/inscription";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = inscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erreur: "Requête invalide", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const utilisateur = await creerUtilisateur(parsed.data);
    return NextResponse.json({ id: utilisateur.id }, { status: 201 });
  } catch (e) {
    if (e instanceof EmailDejaUtilise) {
      return NextResponse.json(
        { erreur: "Cette adresse e-mail est déjà utilisée." },
        { status: 409 },
      );
    }
    throw e;
  }
}
```

- [ ] **Step 6: Build the signup page**

Create `src/app/(auth)/inscription/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InscriptionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    const res = await fetch("/api/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, motDePasse }),
    });
    setEnCours(false);
    if (res.ok) {
      router.push("/connexion?inscription=ok");
      return;
    }
    const data = await res.json().catch(() => ({}));
    setErreur(data.erreur ?? "Erreur lors de l'inscription.");
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold">Créer un compte</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Adresse e-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-gray-400 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="mdp" className="block text-sm font-medium">
            Mot de passe (12 caractères minimum)
          </label>
          <input
            id="mdp"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="mt-1 w-full rounded border border-gray-400 px-3 py-2"
          />
        </div>
        {erreur && (
          <p role="alert" className="text-sm text-red-700">
            {erreur}
          </p>
        )}
        <button
          type="submit"
          disabled={enCours}
          className="rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {enCours ? "Création..." : "Créer mon compte"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/inscription.ts src/app/api/inscription src/app/\(auth\)/inscription tests/unit/inscription.test.ts
git commit -m "feat(auth): signup route + page with validation"
```

---

## Task 9: Login page + protected layout + middleware

**Files:**
- Create: `src/app/(auth)/connexion/page.tsx`, `src/app/(app)/layout.tsx`, `src/app/(app)/tableau-de-bord/page.tsx`, `src/middleware.ts`

- [ ] **Step 1: Build the login page**

Create `src/app/(auth)/connexion/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function ConnexionPage() {
  const router = useRouter();
  const params = useSearchParams();
  const succesInscription = params.get("inscription") === "ok";

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    const res = await signIn("credentials", {
      email,
      motDePasse,
      redirect: false,
    });
    setEnCours(false);
    if (res?.ok) {
      router.push("/tableau-de-bord");
      router.refresh();
      return;
    }
    setErreur("Identifiants invalides.");
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold">Se connecter</h1>
      {succesInscription && (
        <p role="status" className="mt-4 rounded bg-green-50 p-3 text-green-800">
          Compte créé. Vous pouvez vous connecter.
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Adresse e-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-gray-400 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="mdp" className="block text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="mdp"
            type="password"
            required
            autoComplete="current-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="mt-1 w-full rounded border border-gray-400 px-3 py-2"
          />
        </div>
        {erreur && (
          <p role="alert" className="text-sm text-red-700">
            {erreur}
          </p>
        )}
        <button
          type="submit"
          disabled={enCours}
          className="rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {enCours ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Install the client-side Auth.js React hook**

`signIn` from `next-auth/react` is included with `next-auth@^5`. Verify:

```bash
node -e "console.log(require('next-auth/react'))"
```

Expected: object with `signIn`, `signOut`, `useSession`, etc. If it errors, `npm install next-auth@^5` again.

- [ ] **Step 3: Add the SessionProvider at the root**

Auth.js v5 with App Router still needs a client wrapper for `useSession`. Create `src/app/providers.tsx`:

```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

Modify `src/app/layout.tsx` — wrap `children` in `<Providers>`. Replace the `<body>` block:

```tsx
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
```

And add the import at top:

```tsx
import { Providers } from "./providers";
```

- [ ] **Step 4: Build the protected layout**

Create `src/app/(app)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  return (
    <div className="min-h-screen">
      <header className="border-b bg-gray-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/tableau-de-bord" className="font-semibold">
            DiagIT Collectivité
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span>{session.user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="underline">
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: Placeholder dashboard**

Create `src/app/(app)/tableau-de-bord/page.tsx`:

```tsx
export default function TableauDeBord() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <p className="mt-2 text-gray-700">
        Bienvenue. Le questionnaire et les résultats apparaîtront ici.
      </p>
    </section>
  );
}
```

- [ ] **Step 6: Edge-friendly middleware for coarse protection**

Auth.js v5 exposes `auth` as middleware. Create `src/middleware.ts`:

```ts
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isProtected = req.nextUrl.pathname.startsWith("/tableau-de-bord");
  if (isProtected && !req.auth) {
    const url = new URL("/connexion", req.nextUrl.origin);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/tableau-de-bord/:path*"],
};
```

- [ ] **Step 7: Type check + build**

```bash
npx tsc --noEmit
npm run build
```

Expected: build succeeds. Warnings about `experimental` or edge runtime are fine; errors are not.

- [ ] **Step 8: Commit**

```bash
git add src/
git commit -m "feat(auth): login page, protected layout, middleware"
```

---

## Task 10: E2E test for full signup → login → dashboard flow

**Files:**
- Create: `tests/e2e/auth.spec.ts`, `tests/e2e/utils/reset.ts`

- [ ] **Step 1: Add a DB reset helper for E2E**

Create `tests/e2e/utils/reset.ts`:

```ts
import { PrismaClient } from "@prisma/client";

export async function resetTestUsers() {
  const prisma = new PrismaClient();
  try {
    await prisma.utilisateur.deleteMany({
      where: { email: { endsWith: "@e2e.diagit.local" } },
    });
  } finally {
    await prisma.$disconnect();
  }
}
```

- [ ] **Step 2: Write the E2E spec**

Create `tests/e2e/auth.spec.ts`:

```ts
import { test, expect } from "@playwright/test";
import { resetTestUsers } from "./utils/reset";

test.beforeEach(async () => {
  await resetTestUsers();
});

test("signup then login lands on the dashboard", async ({ page }) => {
  const email = `nadia+${Date.now()}@e2e.diagit.local`;
  const motDePasse = "MotDePasse-Solide-123";

  await page.goto("/inscription");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel(/Mot de passe/).fill(motDePasse);
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(page).toHaveURL(/\/connexion\?inscription=ok/);

  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page).toHaveURL(/\/tableau-de-bord/);
  await expect(
    page.getByRole("heading", { name: "Tableau de bord" }),
  ).toBeVisible();
});

test("visiting the dashboard while logged out redirects to login", async ({
  page,
}) => {
  await page.goto("/tableau-de-bord");
  await expect(page).toHaveURL(/\/connexion/);
});
```

- [ ] **Step 3: Run E2E**

Ensure Postgres is up and migrations are applied.

```bash
docker compose up -d db
npx prisma migrate deploy
npm run e2e
```

Expected: 3 tests pass (2 auth + landing smoke).

- [ ] **Step 4: Commit**

```bash
git add tests/e2e
git commit -m "test(e2e): full signup → login → dashboard flow"
```

---

## Task 11: Health check endpoint

**Files:**
- Create: `src/app/api/sante/route.ts`, `tests/unit/sante.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/sante.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/sante/route";

describe("GET /api/sante", () => {
  it("returns 200 with { statut: 'ok' } when the DB is reachable", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ statut: "ok" });
    expect(typeof body.baseDeDonnees).toBe("boolean");
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/app/api/sante/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  let baseDeDonnees = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    baseDeDonnees = true;
  } catch {
    baseDeDonnees = false;
  }
  return NextResponse.json({ statut: "ok", baseDeDonnees });
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/sante tests/unit/sante.test.ts
git commit -m "feat: /api/sante health check"
```

---

## Task 12: Dockerfile for Next.js production build

**Files:**
- Create: `Dockerfile`, `.dockerignore`
- Modify: `next.config.ts`

- [ ] **Step 1: Enable standalone output**

Edit `next.config.ts` — replace with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
```

- [ ] **Step 2: Create `.dockerignore`**

```
node_modules
.next
.git
tests
playwright-report
test-results
coverage
.env
.env.local
Dockerfile
docker-compose.yml
docs
README.md
```

- [ ] **Step 3: Create `Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000

# Apply pending migrations, then start.
CMD ["sh", "-c", "npx --yes prisma migrate deploy && node server.js"]
```

- [ ] **Step 4: Build the image**

```bash
docker build -t diagit-collectivite:local .
```

Expected: build completes without error. This may take a few minutes on first run.

- [ ] **Step 5: Add `app` service to docker-compose for full-stack local test**

Append to `docker-compose.yml`:

```yaml
  app:
    build: .
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://diagit:diagit@db:5432/diagit?schema=public
      AUTH_SECRET: ${AUTH_SECRET}
      AUTH_URL: http://localhost:3000
      NODE_ENV: production
    ports:
      - "3000:3000"
    profiles: ["prod-like"]
```

The `profiles` key keeps the app container off by default (dev uses `npm run dev`).

- [ ] **Step 6: Smoke-run the container**

```bash
docker compose --profile prod-like up -d --build app
sleep 5
curl -sf http://localhost:3000/api/sante
```

Expected: `{"statut":"ok","baseDeDonnees":true}`. Stop with:

```bash
docker compose --profile prod-like down
```

- [ ] **Step 7: Commit**

```bash
git add Dockerfile .dockerignore next.config.ts docker-compose.yml
git commit -m "chore(deploy): Dockerfile + compose profile for prod-like local run"
```

---

## Task 13: Coolify deployment notes

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document Coolify setup**

Append to `README.md`:

```markdown
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

Le conteneur exécute `prisma migrate deploy` au démarrage : chaque nouveau déploiement applique les migrations en attente avant de servir du trafic.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: Coolify deployment guide"
```

---

## Task 14: Final verification

- [ ] **Step 1: Full check locally**

```bash
docker compose up -d db
npx prisma migrate deploy
npm run build
npm test
npm run e2e
```

Expected: build passes, all unit tests pass, all E2E tests pass.

- [ ] **Step 2: Verify plan-2 landing pad exists**

The `config/` directory should exist as an empty placeholder for Plan 2's YAML barème. Create it and a placeholder:

```bash
mkdir -p config
printf "# Placeholder — le barème sera défini dans le Plan 2.\n" > config/README.md
git add config/
git commit -m "chore: reserve config/ for questionnaire YAML (Plan 2)"
```

- [ ] **Step 3: Tag foundation**

```bash
git tag foundation-mvp
```

---

## Definition of Done — Foundation

- `npm run build` succeeds.
- `npm test` — all unit tests green (password, inscription, DB, health).
- `npm run e2e` — signup + login + dashboard redirect green.
- `docker compose --profile prod-like up` boots the app against Postgres and `/api/sante` returns `{ statut: "ok", baseDeDonnees: true }`.
- README documents local dev and Coolify deployment.
