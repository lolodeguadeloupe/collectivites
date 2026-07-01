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
