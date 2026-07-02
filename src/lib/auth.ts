import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { connexionSchema } from "@/lib/validators";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
        session.user.id = token.uid as string;
        // @ts-expect-error augmenting session shape
        session.user.role = token.role;
      }
      return session;
    },
  },
});
