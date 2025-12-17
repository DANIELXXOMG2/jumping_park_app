# 📖 Manual de Usuario - Jumping Park

## Sistema de Gestión de Consentimientos Digitales

**Versión:** 1.0  
**Última actualización:** Diciembre 2025

---

## Índice

1. [Introducción](#1-introducción)
2. [Glosario de Términos](#2-glosario-de-términos)
3. [Rol Cajero/Portero - Visor de Verificación](#3-rol-cajeroportero---visor-de-verificación)
4. [Rol Visitante - Flujo en Kiosko](#4-rol-visitante---flujo-en-kiosko)
5. [Panel Administrativo](#5-panel-administrativo)
6. [Preguntas Frecuentes (FAQ)](#6-preguntas-frecuentes-faq)
7. [Solución de Problemas](#7-solución-de-problemas)
8. [Contacto de Soporte](#8-contacto-de-soporte)

---

## 1. Introducción

Bienvenido al sistema de gestión de consentimientos de **Jumping Park**. Este manual te guiará a través de las funciones principales del sistema según tu rol.

### Propósito del Sistema

El sistema permite:

- ✅ **Registro digital** de visitantes mediante kiosko táctil
- ✅ **Firma electrónica** de consentimientos informados
- ✅ **Verificación rápida** del estado del consentimiento en punto de ingreso
- ✅ **Gestión de menores** bajo responsabilidad de un adulto

### Roles del Sistema

| Rol | Acceso | Función Principal |
|-----|--------|-------------------|
| **Visitante** | Kiosko táctil | Registrarse y firmar consentimiento |
| **Cajero/Portero** | Panel Admin | Verificar estado de consentimientos |
| **Administrador** | Panel Admin completo | Gestión total del sistema |

---

## 2. Glosario de Términos

| Término | Significado |
|---------|-------------|
| **Consentimiento** | Documento legal que el visitante firma aceptando los términos y condiciones del parque |
| **OTP** | Código de un solo uso (One-Time Password) enviado al email para verificar identidad |
| **Consecutivo** | Número único e irrepetible asignado a cada consentimiento firmado |
| **Semáforo** | Indicador visual del estado del consentimiento (Verde/Rojo) |
| **Kiosko** | Terminal táctil de autoservicio para visitantes |

---

## 3. Rol Cajero/Portero - Visor de Verificación

### 3.1 Acceso al Panel

1. Abre el navegador web en la computadora del punto de ingreso
2. Ingresa a la URL del sistema administrativo
3. Inicia sesión con tus credenciales proporcionadas

![Placeholder - Pantalla de Login Admin](./screenshots/admin-login.png)
<!-- PLACEHOLDER: Captura de la pantalla de login del panel administrativo -->

### 3.2 Pantalla Principal del Visor

Al ingresar, verás el **Dashboard de Verificación** con:

- Barra de búsqueda por cédula
- Historial de verificaciones recientes
- Estadísticas del día

![Placeholder - Dashboard Principal](./screenshots/admin-dashboard.png)
<!-- PLACEHOLDER: Captura del dashboard principal mostrando la barra de búsqueda -->

### 3.3 Cómo Buscar un Visitante

#### Paso 1: Ingresar la Cédula

1. Ubica la **barra de búsqueda** en la parte superior
2. Ingresa el número de cédula del visitante (sin puntos ni guiones)
3. Presiona **Enter** o haz clic en el botón **Buscar**

![Placeholder - Barra de Búsqueda](./screenshots/admin-search-bar.png)
<!-- PLACEHOLDER: Captura de la barra de búsqueda con un número de cédula ingresado -->

#### Paso 2: Interpretar el Semáforo

El sistema mostrará uno de los siguientes estados:

##### 🟢 **VERDE - Acceso Permitido**

```
┌─────────────────────────────────────────────────┐
│  ✅ CONSENTIMIENTO VIGENTE                      │
│                                                 │
│  Visitante: Juan Pérez García                   │
│  Cédula: 1234567890                             │
│  Consecutivo: #1234                             │
│  Fecha firma: 15/11/2025                        │
│                                                 │
│  Menores autorizados: 2                         │
│  - María Pérez (8 años)                         │
│  - Carlos Pérez (12 años)                       │
│                                                 │
│  [Botón: Registrar Ingreso]                     │
└─────────────────────────────────────────────────┘
```

**Acción:** El visitante puede ingresar. Haz clic en **"Registrar Ingreso"** para dejar constancia.

![Placeholder - Estado Verde](./screenshots/admin-status-green.png)
<!-- PLACEHOLDER: Captura mostrando el estado verde con datos del visitante -->

##### 🔴 **ROJO - Sin Consentimiento**

```
┌─────────────────────────────────────────────────┐
│  ❌ SIN CONSENTIMIENTO ACTIVO                   │
│                                                 │
│  Cédula: 9876543210                             │
│  Estado: No registrado en el sistema            │
│                                                 │
│  El visitante debe completar el registro        │
│  en el kiosko antes de ingresar.                │
│                                                 │
│  [Botón: Indicar Kiosko]                        │
└─────────────────────────────────────────────────┘
```

**Acción:** Indicar al visitante que debe dirigirse al **kiosko de registro** para completar el proceso.

![Placeholder - Estado Rojo](./screenshots/admin-status-red.png)
<!-- PLACEHOLDER: Captura mostrando el estado rojo indicando que no hay consentimiento -->

##### 🟡 **AMARILLO - Usuario Existe pero Sin Consentimiento del Día** (Opcional)

En algunos casos, el visitante puede estar registrado pero su consentimiento anterior no aplica para el día actual (si la política requiere renovación).

![Placeholder - Estado Amarillo](./screenshots/admin-status-yellow.png)
<!-- PLACEHOLDER: Captura mostrando estado amarillo si aplica -->

### 3.4 Registrar un Ingreso

Cuando un visitante tiene semáforo **verde**:

1. Verifica visualmente que la persona coincida con los datos mostrados
2. Confirma los menores que ingresan (si aplica)
3. Haz clic en **"Registrar Ingreso"**
4. El sistema guardará la hora y fecha de entrada

![Placeholder - Confirmación de Ingreso](./screenshots/admin-access-confirm.png)
<!-- PLACEHOLDER: Captura del modal o pantalla de confirmación de ingreso -->

### 3.5 Historial de Ingresos del Día

En la sección **"Ingresos de Hoy"** puedes ver:

- Lista de todos los ingresos registrados
- Hora de entrada
- Nombre del visitante
- Cantidad de menores

![Placeholder - Historial de Ingresos](./screenshots/admin-access-history.png)
<!-- PLACEHOLDER: Captura de la tabla de historial de ingresos -->

---

## 4. Rol Visitante - Flujo en Kiosko

### 4.1 Visión General del Proceso

El proceso de registro en el kiosko consta de **4 pasos simples**:

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  PASO 1  │───►│  PASO 2  │───►│  PASO 3  │───►│  PASO 4  │
│ Ingresar │    │ Validar  │    │Completar │    │  Firmar  │
│  Cédula  │    │   OTP    │    │  Datos   │    │Consenti- │
│          │    │          │    │          │    │ miento   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

**Tiempo estimado:** 2-3 minutos

### 4.2 Pantalla de Inicio

Al acercarte al kiosko, verás la pantalla de bienvenida con un video del parque.

1. Toca el botón **"¡Comenzar!"** para iniciar el proceso

![Placeholder - Pantalla de Inicio del Kiosko](./screenshots/kiosk-home.png)
<!-- PLACEHOLDER: Captura de la pantalla inicial del kiosko con el botón de comenzar -->

### 4.3 PASO 1: Ingresar tu Cédula

#### Instrucciones:

1. Utiliza el **teclado numérico virtual** en pantalla
2. Ingresa tu número de cédula **sin puntos ni guiones**
3. Si te equivocas, usa el botón **"Borrar"** (⌫)
4. Cuando termines, presiona **"Continuar"**

![Placeholder - Pantalla de Ingreso de Cédula](./screenshots/kiosk-cedula.png)
<!-- PLACEHOLDER: Captura de la pantalla con el teclado numérico virtual y el campo de cédula -->

#### Ejemplo:

```
Tu cédula: 1.234.567.890
Ingresas:  1234567890 ✅
```

### 4.4 PASO 2: Validación OTP

#### ¿Qué es el OTP?

Es un código de **6 dígitos** que se envía a tu correo electrónico para verificar tu identidad.

#### Instrucciones:

1. Revisa tu correo electrónico (incluyendo la carpeta de spam)
2. Busca un email de **Jumping Park** con asunto "Código de Verificación"
3. Ingresa el código de 6 dígitos usando el teclado numérico
4. Presiona **"Verificar"**

![Placeholder - Pantalla de OTP](./screenshots/kiosk-otp.png)
<!-- PLACEHOLDER: Captura de la pantalla de ingreso de código OTP con los 6 campos -->

#### Ejemplo de Email OTP:

```
De: Jumping Park <noreply@jumpingpark.com>
Asunto: Código de Verificación - Jumping Park

Hola,

Tu código de verificación es: 847291

Este código expira en 10 minutos.

Si no solicitaste este código, ignora este mensaje.
```

#### ¿No recibiste el código?

- Espera 30 segundos y presiona **"Reenviar código"**
- Verifica que tu email esté correctamente escrito
- Revisa la carpeta de spam/correo no deseado

### 4.5 PASO 3: Completar Datos Personales

> **Nota:** Este paso solo aparece si es tu **primera vez** registrándote. Si ya tienes cuenta, pasarás directamente al Paso 4.

#### Datos Requeridos:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Nombre completo** | Tu nombre y apellidos | Juan Pérez García |
| **Correo electrónico** | Email válido donde recibirás el PDF | juan@email.com |
| **Teléfono** | Número de contacto (10 dígitos) | 3001234567 |

![Placeholder - Formulario de Registro](./screenshots/kiosk-register.png)
<!-- PLACEHOLDER: Captura del formulario de datos personales -->

#### Agregar Menores de Edad

Si vienes acompañado de menores:

1. En la sección **"Menores a tu cargo"**, presiona **"+ Agregar menor"**
2. Completa los datos del menor:
   - Nombre completo
   - Fecha de nacimiento
   - Parentesco (Hijo/a, Sobrino/a, Otro)
3. Repite para cada menor adicional
4. Puedes agregar hasta **5 menores** por adulto

![Placeholder - Agregar Menores](./screenshots/kiosk-minors.png)
<!-- PLACEHOLDER: Captura de la sección de agregar menores -->

### 4.6 PASO 4: Firma del Consentimiento

Este es el paso final donde aceptas los términos y condiciones del parque.

#### Instrucciones:

1. **Lee el consentimiento completo** (puedes hacer scroll)
2. Marca la casilla **"He leído y acepto los términos y condiciones"**
3. **Firma en el recuadro** usando tu dedo o stylus
4. Si no te gusta tu firma, presiona **"Limpiar firma"**
5. Cuando estés satisfecho, presiona **"Firmar y Finalizar"**

![Placeholder - Pantalla de Firma](./screenshots/kiosk-signature.png)
<!-- PLACEHOLDER: Captura de la pantalla con el área de firma y el texto del consentimiento -->

#### Contenido del Consentimiento

El documento incluye:

- ✅ Aceptación de riesgos inherentes a la actividad
- ✅ Autorización para atención médica de emergencia
- ✅ Compromiso de seguir las reglas del parque
- ✅ Liberación de responsabilidad por lesiones menores

### 4.7 Confirmación Final

¡Listo! Después de firmar verás la pantalla de confirmación con:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│            ✅ ¡REGISTRO EXITOSO!                │
│                                                 │
│  Consecutivo: #1234                             │
│  Nombre: Juan Pérez García                      │
│                                                 │
│  📧 Hemos enviado el PDF del consentimiento     │
│     a tu correo electrónico.                    │
│                                                 │
│  [      Código QR de Acceso      ]              │
│                                                 │
│  Presenta este código en la entrada.            │
│                                                 │
│  [Botón: Volver al Inicio]                      │
└─────────────────────────────────────────────────┘
```

![Placeholder - Pantalla de Confirmación](./screenshots/kiosk-success.png)
<!-- PLACEHOLDER: Captura de la pantalla final con el código QR y el número de consecutivo -->

#### ¿Qué recibirás por email?

- PDF con el consentimiento firmado
- Número de consecutivo para referencia
- Código QR (mismo que se muestra en pantalla)

---

## 5. Panel Administrativo

El **Panel Administrativo** es la herramienta central para la gestión del sistema de consentimientos. Solo el personal autorizado puede acceder a esta sección.

### 5.1 Login con Google

El acceso al panel administrativo se realiza mediante autenticación con **Google**.

#### Requisitos de Acceso

- ✅ Cuenta de Google corporativa o personal autorizada
- ✅ Rol asignado previamente por un administrador del sistema
- ✅ Conexión a internet estable

#### Pasos para Ingresar

1. Abre el navegador y accede a la URL del panel: `/admin`
2. Haz clic en el botón **"Iniciar sesión con Google"**
3. Selecciona tu cuenta de Google autorizada
4. Espera la validación de permisos
5. Serás redirigido al Dashboard automáticamente

![Placeholder - Login con Google](./screenshots/admin-google-login.png)
<!-- PLACEHOLDER: Captura de la pantalla de login con botón de Google -->

> ⚠️ **Importante:** Si tu cuenta no tiene permisos asignados, verás un mensaje de error. Contacta al administrador del sistema.

---

### 5.2 Dashboard - Métricas y Estadísticas

El Dashboard es la pantalla principal del panel administrativo. Muestra un resumen de la actividad del sistema.

#### Métricas Disponibles

| Métrica | Descripción |
|---------|-------------|
| **Consentimientos Hoy** | Total de consentimientos firmados en el día actual |
| **Consentimientos del Mes** | Acumulado de consentimientos en el mes |
| **Usuarios Registrados** | Total de visitantes en la base de datos |
| **Ingresos del Día** | Cantidad de accesos registrados hoy |

#### Vista del Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 DASHBOARD                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ 📝 Hoy       │  │ 📅 Este Mes  │  │ 👥 Usuarios  │              │
│  │     45       │  │     1,234    │  │    5,678     │              │
│  │ consentim.   │  │ consentim.   │  │ registrados  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                     │
│  📈 Actividad Reciente                                             │
│  ─────────────────────────────────────────────────                 │
│  • Juan Pérez firmó consentimiento #1234 (hace 5 min)              │
│  • María García firmó consentimiento #1233 (hace 12 min)           │
│  • Carlos López ingresó al parque (hace 15 min)                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

![Placeholder - Dashboard con Métricas](./screenshots/admin-dashboard-metrics.png)
<!-- PLACEHOLDER: Captura del dashboard mostrando las tarjetas de métricas -->

---

### 5.3 Gestión de Consentimientos

En esta sección puedes buscar, visualizar y gestionar todos los consentimientos firmados.

#### Cómo Buscar un Consentimiento

1. Navega a **"Consentimientos"** en el menú lateral
2. Usa la **barra de búsqueda** para filtrar por:
   - Número de cédula
   - Nombre del visitante
   - Número de consecutivo
3. Los resultados se muestran en una tabla paginada

![Placeholder - Lista de Consentimientos](./screenshots/admin-consents-list.png)
<!-- PLACEHOLDER: Captura de la tabla de consentimientos con barra de búsqueda -->

#### Ver Detalle de un Consentimiento

1. En la tabla de resultados, haz clic en el **número de consecutivo** o en el botón **"Ver"**
2. Se abrirá una vista detallada con:
   - Datos completos del firmante
   - Fecha y hora de firma
   - Lista de menores incluidos
   - Estado del consentimiento

```
┌─────────────────────────────────────────────────────────────────────┐
│  📄 DETALLE DEL CONSENTIMIENTO #1234                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  👤 Firmante                                                        │
│  ─────────────                                                      │
│  Nombre: Juan Pérez García                                          │
│  Cédula: 1234567890                                                 │
│  Email: juan@email.com                                              │
│  Teléfono: 300 123 4567                                             │
│                                                                     │
│  📅 Información de Firma                                            │
│  ─────────────────────                                              │
│  Fecha: 15 de Diciembre de 2025                                     │
│  Hora: 14:35:22                                                     │
│  Estado: ✅ Vigente                                                 │
│                                                                     │
│  👶 Menores Incluidos (2)                                           │
│  ──────────────────────                                             │
│  • María Pérez - 8 años                                             │
│  • Carlos Pérez - 12 años                                           │
│                                                                     │
│  [Ver Firma] [Descargar PDF] [Volver]                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

![Placeholder - Detalle del Consentimiento](./screenshots/admin-consent-detail.png)
<!-- PLACEHOLDER: Captura de la vista de detalle de un consentimiento -->

#### Ver la Firma del Consentimiento

1. Dentro del detalle del consentimiento, haz clic en **"Ver Firma"**
2. Se mostrará la imagen de la firma digital capturada
3. Puedes verificar visualmente la autenticidad de la firma

![Placeholder - Vista de Firma](./screenshots/admin-consent-signature.png)
<!-- PLACEHOLDER: Captura mostrando la firma digital del consentimiento -->

---

### 5.4 Configuración del Sistema

La sección de configuración permite personalizar aspectos clave del sistema **sin necesidad de tocar código**.

#### Editar el Texto Legal del Consentimiento

Esta es una de las funciones más importantes. Permite modificar el contenido del documento que firman los visitantes.

##### Pasos para Editar:

1. Navega a **"Configuración"** en el menú lateral
2. Busca la sección **"Texto del Consentimiento"**
3. Verás un editor de texto con el contenido actual
4. Realiza los cambios necesarios:
   - Modifica párrafos existentes
   - Agrega nuevas cláusulas
   - Actualiza información legal
5. Haz clic en **"Guardar Cambios"**
6. Los nuevos consentimientos usarán el texto actualizado

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚙️ CONFIGURACIÓN > Texto del Consentimiento                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📝 Editor de Texto Legal                                           │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │  CONSENTIMIENTO INFORMADO Y LIBERACIÓN DE RESPONSABILIDAD     │ │
│  │                                                               │ │
│  │  Yo, el firmante, declaro que:                                │ │
│  │                                                               │ │
│  │  1. Comprendo que las actividades en Jumping Park             │ │
│  │     conllevan riesgos inherentes...                           │ │
│  │                                                               │ │
│  │  2. Me comprometo a seguir todas las instrucciones            │ │
│  │     del personal del parque...                                │ │
│  │                                                               │ │
│  │  [El texto continúa...]                                       │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  [Cancelar]                              [💾 Guardar Cambios]       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

![Placeholder - Editor de Texto Legal](./screenshots/admin-config-consent-text.png)
<!-- PLACEHOLDER: Captura del editor de texto del consentimiento -->

> ⚠️ **Nota Legal:** Cualquier cambio en el texto del consentimiento debe ser revisado por el departamento legal antes de publicarse. Los consentimientos ya firmados **no se ven afectados** por cambios posteriores.

---

### 5.5 Gestión de Usuarios

En esta sección puedes ver y gestionar los usuarios del sistema administrativo.

#### Ver Usuarios y sus Roles

1. Navega a **"Usuarios"** en el menú lateral
2. Verás una tabla con todos los usuarios registrados
3. La tabla muestra:
   - Nombre del usuario
   - Email
   - Rol asignado
   - Estado de la cuenta

#### Roles Disponibles

| Rol | Permisos |
|-----|----------|
| **Administrador** | Acceso completo a todas las funciones |
| **Cajero/Portero** | Solo puede verificar consentimientos y registrar ingresos |
| **Visualizador** | Solo puede ver información, sin editar |

```
┌─────────────────────────────────────────────────────────────────────┐
│  👥 GESTIÓN DE USUARIOS                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🔍 Buscar usuario...                                               │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Nombre           │ Email                │ Rol          │ ⚙️  │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Admin Principal  │ admin@jumping.com    │ 🔴 Admin     │ ... │ │
│  │ Juan Portero     │ juan@jumping.com     │ 🟡 Cajero    │ ... │ │
│  │ María Caja       │ maria@jumping.com    │ 🟡 Cajero    │ ... │ │
│  │ Carlos Supervisor│ carlos@jumping.com   │ 🟢 Viewer    │ ... │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Mostrando 4 de 4 usuarios                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

![Placeholder - Lista de Usuarios](./screenshots/admin-users-list.png)
<!-- PLACEHOLDER: Captura de la tabla de usuarios con roles -->

#### Identificación Visual de Roles

Cada rol tiene un color distintivo para facilitar su identificación:

- 🔴 **Rojo:** Administrador (acceso total)
- 🟡 **Amarillo:** Cajero/Portero (acceso operativo)
- 🟢 **Verde:** Visualizador (solo lectura)

> 💡 **Tip:** Para cambiar el rol de un usuario o agregar nuevos usuarios administrativos, contacta al administrador del sistema o consulta el Manual de Instalación.

---

## 6. Preguntas Frecuentes (FAQ)

### Para Visitantes

#### ❓ ¿Puedo registrarme antes de llegar al parque?

Por el momento, el registro solo está disponible en los kioskos del parque. Esto garantiza que la firma sea presencial.

#### ❓ ¿Qué pasa si no recibo el código OTP?

1. Verifica tu carpeta de spam
2. Espera 30 segundos y solicita reenvío
3. Si persiste el problema, pide ayuda al personal del parque

#### ❓ ¿El consentimiento tiene vigencia?

Sí, el consentimiento es válido para el día de la visita. Si vienes otro día, podrás ingresar rápidamente validando tu identidad con OTP.

#### ❓ ¿Puedo agregar más menores después de firmar?

No directamente. Deberás iniciar un nuevo registro de consentimiento incluyendo a los nuevos menores.

### Para Cajeros/Porteros

#### ❓ ¿Qué hago si el visitante dice que ya firmó pero aparece en rojo?

1. Pídele su número de cédula y verifica que lo ingresó correctamente en el kiosko
2. Revisa si hay un consentimiento a nombre similar (posible error de digitación)
3. Si no se encuentra, invítalo a registrarse nuevamente en el kiosko

#### ❓ ¿Puedo registrar manualmente un consentimiento?

No. Todos los consentimientos deben ser firmados por el visitante en el kiosko para garantizar la validez legal.

#### ❓ ¿Cómo sé si un menor está autorizado?

Al buscar al adulto, el sistema muestra la lista de menores incluidos en su consentimiento con nombre y edad.

---

## 7. Solución de Problemas

### Problemas Comunes en el Kiosko

| Problema | Solución |
|----------|----------|
| La pantalla no responde al toque | Espera 5 segundos. Si persiste, notifica al personal |
| El teclado no aparece | Toca en el campo de texto para activarlo |
| Error al enviar OTP | Verifica conexión a internet del kiosko |
| La firma no se ve bien | Usa el dedo índice y firma lentamente |
| El video no carga | No afecta el funcionamiento, continúa normalmente |

### Problemas Comunes en el Panel Admin

| Problema | Solución |
|----------|----------|
| No carga la página | Verifica conexión a internet, recarga con F5 |
| Sesión expirada | Vuelve a iniciar sesión |
| Búsqueda sin resultados | Verifica que la cédula sea correcta y completa |
| Botón "Registrar Ingreso" no funciona | Recarga la página e intenta nuevamente |

---

## 8. Contacto de Soporte

### Soporte Técnico

| Canal | Contacto | Horario |
|-------|----------|---------|
| **Email** | soporte@jumpingpark.com | 24/7 |
| **Teléfono** | (601) 123-4567 | Lun-Dom 9am-8pm |
| **WhatsApp** | +57 300 123 4567 | Lun-Dom 9am-8pm |

### En el Parque

Si tienes problemas con el sistema durante tu visita, acércate a:

- 🎯 **Punto de Información** (entrada principal)
- 💼 **Oficina Administrativa** (segundo piso)

---

## Anexos

### A. Diagrama del Flujo Completo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FLUJO DEL VISITANTE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐     ┌──────────────┐                                      │
│  │ LLEGADA  │────►│ ¿Ya tienes   │──── SÍ ───►┌────────────────┐        │
│  │ AL PARQUE│     │ consentimi-  │            │ Ir directamente│        │
│  └──────────┘     │ ento vigente?│            │ a la entrada   │        │
│                   └──────────────┘            └───────┬────────┘        │
│                          │ NO                         │                 │
│                          ▼                            │                 │
│                   ┌──────────────┐                    │                 │
│                   │    KIOSKO    │                    │                 │
│                   │  (4 pasos)   │                    │                 │
│                   └──────┬───────┘                    │                 │
│                          │                            │                 │
│                          ▼                            ▼                 │
│                   ┌──────────────────────────────────────┐              │
│                   │     PUNTO DE ENTRADA (Cajero)        │              │
│                   │  - Buscar cédula                     │              │
│                   │  - Verificar semáforo                │              │
│                   │  - Registrar ingreso                 │              │
│                   └──────────────────────────────────────┘              │
│                                     │                                   │
│                                     ▼                                   │
│                              ┌─────────────┐                            │
│                              │  ¡DISFRUTA  │                            │
│                              │  EL PARQUE! │                            │
│                              └─────────────┘                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### B. Estructura de Carpetas para Capturas

Para completar este manual con capturas de pantalla reales, crea la siguiente estructura:

```
docs/
├── MANUAL_USUARIO.md
└── screenshots/
    ├── admin-login.png
    ├── admin-google-login.png
    ├── admin-dashboard.png
    ├── admin-dashboard-metrics.png
    ├── admin-search-bar.png
    ├── admin-status-green.png
    ├── admin-status-red.png
    ├── admin-status-yellow.png
    ├── admin-access-confirm.png
    ├── admin-access-history.png
    ├── admin-consents-list.png
    ├── admin-consent-detail.png
    ├── admin-consent-signature.png
    ├── admin-config-consent-text.png
    ├── admin-users-list.png
    ├── kiosk-home.png
    ├── kiosk-cedula.png
    ├── kiosk-otp.png
    ├── kiosk-register.png
    ├── kiosk-minors.png
    ├── kiosk-signature.png
    └── kiosk-success.png
```

---

**Documento generado para Jumping Park © 2025**  
*Versión 1.0 - Diciembre 2025*
