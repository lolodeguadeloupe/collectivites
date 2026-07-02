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
