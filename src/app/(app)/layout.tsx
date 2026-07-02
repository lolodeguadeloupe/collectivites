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
