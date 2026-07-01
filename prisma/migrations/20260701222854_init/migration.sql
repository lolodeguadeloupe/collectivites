-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('AGENT', 'ACCOMPAGNANT');

-- CreateEnum
CREATE TYPE "StatutDiagnostic" AS ENUM ('EN_COURS', 'TERMINE');

-- CreateEnum
CREATE TYPE "PrioriteAction" AS ENUM ('URGENT', 'COURT_TERME', 'MOYEN_TERME');

-- CreateEnum
CREATE TYPE "EffortAction" AS ENUM ('FAIBLE', 'MOYEN', 'ELEVE');

-- CreateEnum
CREATE TYPE "StatutAction" AS ENUM ('A_FAIRE', 'EN_COURS', 'FAIT');

-- CreateEnum
CREATE TYPE "TypeCollectivite" AS ENUM ('MAIRIE', 'COMMUNAUTE_DE_COMMUNES', 'SYNDICAT', 'CCAS', 'AUTRE');

-- CreateTable
CREATE TABLE "Collectivite" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeCollectivite" NOT NULL,
    "nbAgents" INTEGER,
    "contact" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collectivite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasseHache" TEXT NOT NULL,
    "role" "RoleUtilisateur" NOT NULL DEFAULT 'AGENT',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilisateurCollectivite" (
    "utilisateurId" TEXT NOT NULL,
    "collectiviteId" TEXT NOT NULL,
    "ajouteLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UtilisateurCollectivite_pkey" PRIMARY KEY ("utilisateurId","collectiviteId")
);

-- CreateTable
CREATE TABLE "Diagnostic" (
    "id" TEXT NOT NULL,
    "collectiviteId" TEXT NOT NULL,
    "statut" "StatutDiagnostic" NOT NULL DEFAULT 'EN_COURS',
    "scoreGlobal" DOUBLE PRECISION,
    "bareme" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,
    "termineLe" TIMESTAMP(3),

    CONSTRAINT "Diagnostic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reponse" (
    "id" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "domaine" TEXT NOT NULL,
    "valeur" JSONB NOT NULL,
    "pointsObtenus" DOUBLE PRECISION NOT NULL,
    "pointsMax" DOUBLE PRECISION NOT NULL,
    "repondueLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "domaine" TEXT NOT NULL,
    "priorite" "PrioriteAction" NOT NULL,
    "effort" "EffortAction" NOT NULL,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "ressourceUrl" TEXT,
    "statut" "StatutAction" NOT NULL DEFAULT 'A_FAIRE',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE INDEX "UtilisateurCollectivite_collectiviteId_idx" ON "UtilisateurCollectivite"("collectiviteId");

-- CreateIndex
CREATE INDEX "Diagnostic_collectiviteId_idx" ON "Diagnostic"("collectiviteId");

-- CreateIndex
CREATE INDEX "Reponse_diagnosticId_idx" ON "Reponse"("diagnosticId");

-- CreateIndex
CREATE UNIQUE INDEX "Reponse_diagnosticId_questionId_key" ON "Reponse"("diagnosticId", "questionId");

-- CreateIndex
CREATE INDEX "Action_diagnosticId_idx" ON "Action"("diagnosticId");

-- AddForeignKey
ALTER TABLE "UtilisateurCollectivite" ADD CONSTRAINT "UtilisateurCollectivite_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilisateurCollectivite" ADD CONSTRAINT "UtilisateurCollectivite_collectiviteId_fkey" FOREIGN KEY ("collectiviteId") REFERENCES "Collectivite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnostic" ADD CONSTRAINT "Diagnostic_collectiviteId_fkey" FOREIGN KEY ("collectiviteId") REFERENCES "Collectivite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reponse" ADD CONSTRAINT "Reponse_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "Diagnostic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "Diagnostic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
