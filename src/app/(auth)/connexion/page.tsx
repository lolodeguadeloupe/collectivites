"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function ConnexionForm() {
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

export default function ConnexionPage() {
  return (
    <Suspense>
      <ConnexionForm />
    </Suspense>
  );
}
