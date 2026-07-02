import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
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
