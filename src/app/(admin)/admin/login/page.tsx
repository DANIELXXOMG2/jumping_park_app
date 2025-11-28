"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/admin/Button";
import { Lock, Mail, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn(email, password);
      router.push("/admin");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("invalid-credential") || err.message.includes("wrong-password")) {
          setError("Credenciales inválidas");
        } else if (err.message.includes("user-not-found")) {
          setError("Usuario no encontrado");
        } else if (err.message.includes("too-many-requests")) {
          setError("Demasiados intentos. Intenta más tarde.");
        } else if (err.message.includes("permisos de administrador")) {
          setError("No tienes permisos de administrador");
        } else {
          setError("Error al iniciar sesión");
        }
      } else {
        setError("Error desconocido");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-primary font-bold text-2xl">Jumping</span>
            <span className="font-semibold text-foreground/80 text-2xl">Park</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Panel de Administración
          </h1>
          <p className="text-foreground/60 mt-1">
            Inicia sesión para continuar
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-surface rounded-2xl border border-border p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground/70 mb-2"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jumpingpark.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-surface-muted border-border rounded-xl focus:border-primary"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground/70 mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-3 bg-surface-muted border-border rounded-xl focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 min-h-0 p-0 bg-transparent border-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading || !email || !password}
            >
              Iniciar Sesión
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-foreground/40 mt-6">
          Acceso restringido a personal autorizado
        </p>
      </div>
    </div>
  );
}
