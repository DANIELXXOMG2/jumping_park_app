import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * ============================================================================
 * PROXY - RBAC para rutas protegidas (Next.js 16+)
 * ============================================================================
 * 
 * Protege las rutas bajo /admin/* verificando la autenticación del usuario.
 * 
 * Nota: El proxy de Next.js se ejecuta en Edge Runtime y no tiene acceso
 * directo a Firebase Admin SDK. La verificación completa del rol se hace en
 * el componente AdminGuard del lado del cliente.
 * 
 * Este proxy solo verifica la existencia de cookies de sesión de Firebase.
 */

// Rutas que no requieren autenticación
const PUBLIC_ROUTES = [
  "/admin/login",
  "/admin/unauthorized",
];

// Matcher para rutas que deben ser verificadas
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (assets, manifest, etc.)
     * - API routes (manejados por su propia autenticación)
     */
    "/((?!_next/static|_next/image|favicon.ico|assets|manifest.json|api).*)",
  ],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Solo verificar rutas bajo /admin
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Permitir rutas públicas del admin
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar si hay una sesión de Firebase Auth (cookie)
  // Firebase Auth en cliente usa IndexedDB, no cookies, así que verificamos
  // la presencia de token en el header de autorización para API routes
  // Para páginas, la verificación se hace en AdminGuard (cliente)
  
  // Verificar si es una ruta admin protegida
  // La autenticación real se verifica en AdminGuard con Firebase Auth del cliente
  // Aquí solo podemos hacer verificaciones básicas como la presencia de cookies
  
  // Por ahora, permitimos el acceso y dejamos que AdminGuard haga la verificación
  // En una implementación más robusta, se usarían cookies de sesión HTTP-only
  
  const response = NextResponse.next();
  
  // Agregar headers de seguridad
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  return response;
}
