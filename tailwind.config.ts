import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx,mdx}",
    "./src/components/**/*.{ts,tsx,mdx}",
    "./src/services/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ========================================================================
      // COLORES - JUMPING PARK BRAND SYSTEM
      // ========================================================================
      colors: {
        // Colores base del sistema
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        accent: "var(--accent)",
        
        // Superficies
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        "surface-card": "var(--surface-card)",
        "surface-elevated": "var(--surface-elevated)",
        
        // Bordes
        border: "var(--border)",
        "border-muted": "var(--border-muted)",
        "border-focus": "var(--border-focus)",
        
        // Textos
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        
        // Colores de marca (directos)
        "brand-green": "#2ECC71",
        "brand-blue": "#3498DB",
        "brand-purple": "#9B59B6",
        "brand-yellow": "#F39C12",
        
        // Estados semánticos
        success: "#2ECC71",
        warning: "#F39C12",
        danger: "#E74C3C",
        info: "#3498DB",
      },

      // ========================================================================
      // TIPOGRAFÍA
      // ========================================================================
      fontFamily: {
        sans: ["var(--font-sora)", "Sora", "system-ui", "sans-serif"],
        mono: [
          "var(--font-geist-mono)",
          "Geist Mono",
          "ui-monospace",
          "SFMono-Regular",
        ],
      },

      // ========================================================================
      // RADIOS - ESTILO CLEAN PRO (REDONDEADOS)
      // ========================================================================
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
        touch: "16px",
      },

      // ========================================================================
      // SOMBRAS - SOFT LIFT STYLE
      // ========================================================================
      boxShadow: {
        // Sombras de utilidad general
        "soft-sm": "0 1px 3px rgba(52, 73, 94, 0.06), 0 1px 2px rgba(52, 73, 94, 0.04)",
        "soft-md": "0 4px 6px rgba(52, 73, 94, 0.07), 0 2px 4px rgba(52, 73, 94, 0.05)",
        "soft-lg": "0 10px 25px rgba(52, 73, 94, 0.08), 0 4px 10px rgba(52, 73, 94, 0.05)",
        "soft-xl": "0 20px 40px rgba(52, 73, 94, 0.1), 0 8px 16px rgba(52, 73, 94, 0.06)",
        
        // Sombras para tarjetas
        card: "0 4px 20px rgba(52, 73, 94, 0.08)",
        "card-hover": "0 8px 30px rgba(52, 73, 94, 0.12)",
        "card-elevated": "0 12px 40px rgba(52, 73, 94, 0.15)",
        
        // Sombras para botones (coloreadas)
        "button-green": "0 4px 14px rgba(46, 204, 113, 0.25)",
        "button-green-hover": "0 6px 20px rgba(46, 204, 113, 0.35)",
        "button-blue": "0 4px 14px rgba(52, 152, 219, 0.25)",
        "button-blue-hover": "0 6px 20px rgba(52, 152, 219, 0.35)",
        "button-purple": "0 4px 14px rgba(155, 89, 182, 0.25)",
        "button-purple-hover": "0 6px 20px rgba(155, 89, 182, 0.35)",
        
        // Sombra de focus accesible
        "focus-ring": "0 0 0 3px rgba(52, 152, 219, 0.2)",
      },

      // ========================================================================
      // TAMAÑOS MÍNIMOS (TOUCH-FRIENDLY)
      // ========================================================================
      minHeight: {
        touch: "48px",
        "touch-lg": "56px",
      },
      minWidth: {
        touch: "48px",
      },

      // ========================================================================
      // TRANSICIONES
      // ========================================================================
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
      },

      // ========================================================================
      // ANIMACIONES
      // ========================================================================
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 300ms ease-out",
        "scale-in": "scaleIn 200ms ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },

      // ========================================================================
      // ESPACIADO ADICIONAL
      // ========================================================================
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
    },
  },
  plugins: [],
};

export default config;
