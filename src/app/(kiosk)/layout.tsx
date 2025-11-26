import type { ReactNode } from "react";

interface KioskLayoutProps {
  children: ReactNode;
}

export default function KioskLayout({ children }: KioskLayoutProps) {
  return (
    <div className="kiosk-bg min-h-screen text-foreground">
      <div className="kiosk-content flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.4em] uppercase text-foreground/70">
            <span className="text-primary">Jumping</span>
            <span>Park</span>
          </div>
          <span className="text-sm font-medium text-foreground/60">
            Kiosko de Registro
          </span>
        </header>
        <main className="flex flex-1 flex-col px-4 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
