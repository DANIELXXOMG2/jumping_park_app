import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const APP_NAME = "Jumping Park";
const APP_DESCRIPTION = "Sistema de registro y consentimiento informado para visitantes de Jumping Park. Firma digital segura y gestión de menores.";
const APP_URL = "https://www.jumpingpark.lat";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} - Kiosko de Registro`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  authors: [{ name: "Jumping Park" }],
  keywords: ["jumping park", "parque de trampolines", "consentimiento", "registro", "menores", "firma digital"],
  
  // Favicons e íconos
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "icon", url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },

  // Open Graph (Facebook, LinkedIn, WhatsApp)
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} - Registro de Consentimientos`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Jumping Park - Parque de Trampolines",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - Registro de Consentimientos`,
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/og-image.png`],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
  },

  // Manifest para PWA
  manifest: "/manifest.json",
};

// Viewport y Theme Color separados (Next.js 16+)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2ECC71",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${sora.variable} font-sans antialiased`}>
        {children}
        <Toaster 
          position="top-center" 
          richColors 
          closeButton
          toastOptions={{
            duration: 4000,
            classNames: {
              toast: "font-sans",
            },
          }}
        />
      </body>
    </html>
  );
}
