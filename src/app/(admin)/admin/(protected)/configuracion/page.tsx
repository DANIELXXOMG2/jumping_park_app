"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/admin/Card";
import { Badge } from "@/components/admin/Badge";
import { Settings, Database, Mail, Shield } from "lucide-react";

export default function ConfigurationPage() {
  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Configuración
        </h1>
        <p className="text-foreground/60 mt-1">
          Ajustes del sistema y conexiones
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* System Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <CardTitle>Sistema</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                <span className="text-sm text-foreground/70">Versión</span>
                <Badge variant="info">1.0.0</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                <span className="text-sm text-foreground/70">Entorno</span>
                <Badge variant="warning">
                  {process.env.NODE_ENV || "development"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                <span className="text-sm text-foreground/70">Framework</span>
                <span className="text-sm font-medium">Next.js 16</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Firebase Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <CardTitle>Firebase</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                <span className="text-sm text-foreground/70">Firestore</span>
                <Badge variant="success">Conectado</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                <span className="text-sm text-foreground/70">Storage</span>
                <Badge variant="success">Conectado</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                <span className="text-sm text-foreground/70">Plan</span>
                <Badge variant="info">Spark (Free)</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Config */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              <CardTitle>Email (Resend)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                <span className="text-sm text-foreground/70">Estado</span>
                <Badge variant="success">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                <span className="text-sm text-foreground/70">Tipo</span>
                <span className="text-sm font-medium">OTP + Consentimientos</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                <span className="text-sm text-foreground/70">Plan</span>
                <Badge variant="info">Free Tier</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Seguridad</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                <span className="text-sm text-foreground/70">OTP</span>
                <Badge variant="success">6 dígitos, 10 min</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                <span className="text-sm text-foreground/70">Consentimiento</span>
                <Badge variant="info">Válido 1 año</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                <span className="text-sm text-foreground/70">Versión Política</span>
                <span className="text-sm font-medium">1.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Features */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Funcionalidades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-surface-muted rounded-lg border border-border/50">
              <p className="font-medium text-foreground">Autenticación Admin</p>
              <p className="text-sm text-foreground/50 mt-1">
                Login seguro para administradores
              </p>
              <Badge variant="warning" className="mt-2">
                En desarrollo
              </Badge>
            </div>
            <div className="p-4 bg-surface-muted rounded-lg border border-border/50">
              <p className="font-medium text-foreground">Reportes PDF</p>
              <p className="text-sm text-foreground/50 mt-1">
                Exportar datos en formato PDF
              </p>
              <Badge variant="default" className="mt-2">
                Planificado
              </Badge>
            </div>
            <div className="p-4 bg-surface-muted rounded-lg border border-border/50">
              <p className="font-medium text-foreground">Notificaciones</p>
              <p className="text-sm text-foreground/50 mt-1">
                Alertas en tiempo real
              </p>
              <Badge variant="default" className="mt-2">
                Planificado
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
