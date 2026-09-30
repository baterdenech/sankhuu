import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/supabase/env";

// Хүсэлт бүрт Supabase session-ийг шинэчилж, нэвтрээгүй хэрэглэгчийг /login руу шилжүүлнэ
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isAuthed = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;
  const isLoginPage = pathname === "/login" || pathname.startsWith("/login/");
  // Худалдан авагчийн апп нэвтрэлт шаардахгүй
  const isPublic =
    isLoginPage ||
    pathname === "/" ||
    ["/s/", "/categories", "/search", "/cart", "/me", "/orders/", "/api/health"].some((p) => pathname === p.replace(/\/$/, "") || pathname.startsWith(p));

  if (!isAuthed && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/dashboard") loginUrl.searchParams.set("next", pathname + search);
    return redirectWithCookies(loginUrl, response);
  }
  if (isAuthed && isLoginPage) {
    return redirectWithCookies(new URL("/dashboard", request.url), response);
  }
  return response;
}

// Шинэчлэгдсэн session cookie-г redirect хариунд алдалгүй дамжуулна
function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|uploads/|s/|api/health|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
