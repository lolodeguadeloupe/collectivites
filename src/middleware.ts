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
