import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // Fallback para modo offline (se creará la página luego)
  fallbacks: {
    document: "/offline",
  },
  // Estrategia de cache granular para Admin y Kiosko
  runtimeCaching: [
    // 1. APIs del Admin (Datos críticos - prioridad alta)
    {
      urlPattern: /\/api\/admin\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "admin-api-cache",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // 2. Navegación del Admin (Documentos HTML - rutas /admin/*)
    {
      urlPattern: /\/admin(?:\/.*)?$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "admin-pages-cache",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        },
      },
    },
    // 3. Fuentes de Google (CacheFirst - larga duración)
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
        },
      },
    },
    // 4. Imágenes y assets estáticos (CacheFirst)
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
      },
    },
    // 5. Fallback para todo lo demás (Next.js internals, scripts, etc.)
    {
      urlPattern: /^https?.*/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "general-cache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  // Necesario para Next.js 16+ con plugins que usan webpack (como next-pwa)
  // Esto indica a Next.js que use webpack en lugar de turbopack para el build
  turbopack: {},
};

export default withPWA(nextConfig);
