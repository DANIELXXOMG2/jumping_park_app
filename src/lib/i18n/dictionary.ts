/**
 * Diccionario de traducciones para el flujo del Kiosco.
 *
 * Idiomas soportados: Español (es), Inglés (en)
 * Solo contiene textos del flujo público del kiosco.
 */

export type Language = "es" | "en";

export const dictionary = {
	// ============================================================================
	// LAYOUT / HEADER
	// ============================================================================
	"layout.brand": {
		es: "Park",
		en: "Park",
	},
	"layout.subtitle": {
		es: "Kiosko de Registro",
		en: "Registration Kiosk",
	},

	// ============================================================================
	// PÁGINA PRINCIPAL (HOME)
	// ============================================================================
	"home.title.line1": {
		es: "¿Listo para",
		en: "Ready to",
	},
	"home.title.line2": {
		es: "saltar?",
		en: "jump?",
	},
	"home.subtitle": {
		es: "Tu aventura comienza con un toque.",
		en: "Your adventure starts with a touch.",
	},
	"home.cta": {
		es: "Comenzar Registro",
		en: "Start Registration",
	},
	"home.benefit.secure": {
		es: "Registro Seguro",
		en: "Secure Registration",
	},
	"home.benefit.fast": {
		es: "Proceso Rápido",
		en: "Fast Process",
	},
	"home.benefit.digital": {
		es: "100% Digital",
		en: "100% Digital",
	},
	"home.videoFallback": {
		es: "Tu navegador no soporta videos HTML5.",
		en: "Your browser does not support HTML5 videos.",
	},

	// ============================================================================
	// PÁGINA DE INGRESO (CÉDULA)
	// ============================================================================
	"ingreso.title": {
		es: "Ingresa tu Cédula",
		en: "Enter your ID Number",
	},
	"ingreso.subtitle": {
		es: "Escribe tu número de documento para continuar",
		en: "Type your document number to continue",
	},
	"ingreso.placeholder": {
		es: "Número de cédula",
		en: "ID Number",
	},
	"ingreso.continue": {
		es: "Continuar",
		en: "Continue",
	},
	"ingreso.checking": {
		es: "Verificando...",
		en: "Checking...",
	},
	"ingreso.error.empty": {
		es: "Ingresá tu número de cédula para continuar.",
		en: "Please enter your ID number to continue.",
	},
	"ingreso.error.minDigits": {
		es: "Ingresá al menos {min} dígitos.",
		en: "Please enter at least {min} digits.",
	},

	// ============================================================================
	// PÁGINA OTP
	// ============================================================================
	"otp.title": {
		es: "Código de Verificación",
		en: "Verification Code",
	},
	"otp.subtitle": {
		es: "Ingresa el código enviado a tu correo",
		en: "Enter the code sent to your email",
	},
	"otp.sentTo": {
		es: "Código enviado a:",
		en: "Code sent to:",
	},
	"otp.verify": {
		es: "Verificar",
		en: "Verify",
	},
	"otp.verifying": {
		es: "Verificando...",
		en: "Verifying...",
	},
	"otp.resend": {
		es: "Reenviar código",
		en: "Resend code",
	},
	"otp.resending": {
		es: "Reenviando...",
		en: "Resending...",
	},
	"otp.resent": {
		es: "Código reenviado",
		en: "Code resent",
	},
	"otp.error.invalid": {
		es: "Código incorrecto. Intenta de nuevo.",
		en: "Invalid code. Please try again.",
	},
	"otp.error.expired": {
		es: "El código ha expirado. Solicita uno nuevo.",
		en: "Code expired. Please request a new one.",
	},

	// ============================================================================
	// PÁGINA DE REGISTRO
	// ============================================================================
	"registro.title": {
		es: "Registro de Visitante",
		en: "Visitor Registration",
	},
	"registro.subtitle": {
		es: "Completa tus datos para continuar",
		en: "Complete your information to continue",
	},
	"registro.form.fullName": {
		es: "Nombre Completo",
		en: "Full Name",
	},
	"registro.form.email": {
		es: "Correo Electrónico",
		en: "Email Address",
	},
	"registro.form.phone": {
		es: "Teléfono",
		en: "Phone Number",
	},
	"registro.form.documentId": {
		es: "Número de Documento",
		en: "Document Number",
	},
	"registro.continue": {
		es: "Continuar",
		en: "Continue",
	},
	"registro.saving": {
		es: "Guardando...",
		en: "Saving...",
	},

	// ============================================================================
	// MENORES
	// ============================================================================
	"minors.title": {
		es: "Menores a tu cargo",
		en: "Minors under your care",
	},
	"minors.add": {
		es: "Agregar Menor",
		en: "Add Minor",
	},
	"minors.form.firstName": {
		es: "Nombres",
		en: "First Name",
	},
	"minors.form.lastName": {
		es: "Apellidos",
		en: "Last Name",
	},
	"minors.form.birthDate": {
		es: "Fecha de Nacimiento",
		en: "Birth Date",
	},
	"minors.form.relationship": {
		es: "Parentesco",
		en: "Relationship",
	},
	"minors.form.eps": {
		es: "EPS",
		en: "Health Insurance",
	},
	"minors.form.idType": {
		es: "Tipo de Documento",
		en: "Document Type",
	},
	"minors.form.idNumber": {
		es: "Número de Documento",
		en: "Document Number",
	},
	"minors.relationship.hijo": {
		es: "Hijo/a",
		en: "Son/Daughter",
	},
	"minors.relationship.sobrino": {
		es: "Sobrino/a",
		en: "Nephew/Niece",
	},
	"minors.relationship.nieto": {
		es: "Nieto/a",
		en: "Grandchild",
	},
	"minors.relationship.otro": {
		es: "Otro",
		en: "Other",
	},
	"minors.save": {
		es: "Guardar",
		en: "Save",
	},
	"minors.cancel": {
		es: "Cancelar",
		en: "Cancel",
	},
	"minors.remove": {
		es: "Eliminar",
		en: "Remove",
	},

	// ============================================================================
	// CONSENTIMIENTO
	// ============================================================================
	"consent.title": {
		es: "Consentimiento Informado",
		en: "Informed Consent",
	},
	"consent.subtitle": {
		es: "Lee y acepta los términos para continuar",
		en: "Read and accept the terms to continue",
	},
	"consent.readFull": {
		es: "Leer consentimiento completo",
		en: "Read full consent",
	},
	"consent.accept": {
		es: "He leído y acepto el consentimiento",
		en: "I have read and accept the consent",
	},
	"consent.sign": {
		es: "Firmar",
		en: "Sign",
	},
	"consent.signing": {
		es: "Firmando...",
		en: "Signing...",
	},
	"consent.clear": {
		es: "Limpiar firma",
		en: "Clear signature",
	},
	"consent.signHere": {
		es: "Firma aquí",
		en: "Sign here",
	},
	"consent.legal.summary": {
		es: "Al firmar, acepto las normas del parque y libero de responsabilidad a Jumping Park por lesiones que puedan ocurrir durante el uso de las instalaciones.",
		en: "By signing, I accept the park rules and release Jumping Park from liability for injuries that may occur during the use of the facilities.",
	},

	// ============================================================================
	// PÁGINA DE ÉXITO
	// ============================================================================
	"exito.title": {
		es: "¡Registro Exitoso!",
		en: "Registration Successful!",
	},
	"exito.greeting": {
		es: "Gracias por completar el registro,",
		en: "Thank you for completing the registration,",
	},
	"exito.registerNumber": {
		es: "Tu número de registro",
		en: "Your registration number",
	},
	"exito.saved": {
		es: "Consentimiento guardado exitosamente",
		en: "Consent saved successfully",
	},
	"exito.canPass": {
		es: "¡Ya puedes pasar a las atracciones!",
		en: "You can now enter the attractions!",
	},
	"exito.checkRules": {
		es: "No olvides revisar las reglas del parque",
		en: "Don't forget to check the park rules",
	},
	"exito.backToStart": {
		es: "Volver al Inicio",
		en: "Back to Start",
	},

	// ============================================================================
	// COMPONENTES COMUNES
	// ============================================================================
	"common.loading": {
		es: "Cargando...",
		en: "Loading...",
	},
	"common.error": {
		es: "Ha ocurrido un error",
		en: "An error occurred",
	},
	"common.retry": {
		es: "Reintentar",
		en: "Retry",
	},
	"common.back": {
		es: "Volver",
		en: "Back",
	},
	"common.next": {
		es: "Siguiente",
		en: "Next",
	},
	"common.close": {
		es: "Cerrar",
		en: "Close",
	},

	// ============================================================================
	// TECLADO VIRTUAL
	// ============================================================================
	"keypad.delete": {
		es: "Borrar",
		en: "Delete",
	},
	"keypad.clear": {
		es: "Limpiar",
		en: "Clear",
	},
} as const;

export type DictionaryKey = keyof typeof dictionary;

/**
 * Obtiene la traducción para una clave en un idioma específico.
 */
export function getTranslation(
	key: DictionaryKey,
	language: Language,
	replacements?: Record<string, string | number>
): string {
	const entry = dictionary[key];
	if (!entry) {
		console.warn(`[i18n] Missing translation key: ${key}`);
		return key;
	}

	let text: string = entry[language] || entry.es;

	// Reemplazar placeholders como {min}, {max}, etc.
	if (replacements) {
		for (const [placeholder, value] of Object.entries(replacements)) {
			text = text.replace(new RegExp(`\\{${placeholder}\\}`, "g"), String(value));
		}
	}

	return text;
}
