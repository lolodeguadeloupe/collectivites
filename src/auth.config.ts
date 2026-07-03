import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  // Derrière le reverse proxy Coolify/Traefik, l'hôte vu par Node est celui
  // du réseau interne : sans trustHost, Auth.js répond UntrustedHost (500)
  // sur toutes les routes /api/auth/*.
  trustHost: true,
  pages: {
    signIn: "/connexion",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isProtected = request.nextUrl.pathname.startsWith("/tableau-de-bord");
      if (isProtected && !auth?.user) {
        return Response.redirect(new URL("/connexion", request.nextUrl.origin));
      }
      return true;
    },
  },
};
