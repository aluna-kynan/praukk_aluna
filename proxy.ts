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
  const isProtectedRoute = isAdminRoute || isPetugasRoute || isPeminjamRoute;

  // Jika belum login dan mengakses halaman yang dilindungi, redirect ke /login tanpa cache
  if (!activeUser && isProtectedRoute) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
    redirectResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    redirectResponse.headers.set("Pragma", "no-cache");
    redirectResponse.headers.set("Expires", "0");
    return redirectResponse;
  }

  // Cegah browser menyimpan cache halaman yang dilindungi (mencegah akses kembali lewat tombol Back)
  if (isProtectedRoute) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
