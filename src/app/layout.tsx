import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jumping Park - Kiosko de Registro",
  description: "Sistema de registro y consentimiento informado para visitantes de Jumping Park",
  // favicon.ico en src/app/ es detectado automáticamente por Next.js 16
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
