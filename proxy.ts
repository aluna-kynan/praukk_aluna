import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();
  const userIdCookie = request.cookies.get("user_id")?.value;
  const activeUser = user || userIdCookie;

  const pathname = request.nextUrl.pathname;

  // Protected route checking
  const isAuthRoute = pathname.startsWith("/login");
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/categories") || pathname.startsWith("/users") || pathname.startsWith("/logs");
  const isPetugasRoute = pathname.startsWith("/approvals") || pathname.startsWith("/monitoring") || pathname.startsWith("/reports");
  const isPeminjamRoute = pathname.startsWith("/tools") || pathname.startsWith("/my-loans");

  if (!activeUser && (isAdminRoute || isPetugasRoute || isPeminjamRoute)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
