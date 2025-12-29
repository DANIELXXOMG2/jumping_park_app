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
	"ingreso.step": {
		es: "Paso 1",
		en: "Step 1",
	},
	"ingreso.title": {
		es: "Ingresá tu cédula para continuar",
		en: "Enter your ID to continue",
	},
	"ingreso.subtitle": {
		es: "Usamos este número para validar tu identidad y mostrar tus consentimientos previos.",
		en: "We use this number to verify your identity and show your previous consents.",
	},
	"ingreso.placeholder": {
		es: "Número de documento",
		en: "Document Number",
	},
	"ingreso.hint": {
		es: "Letras y números, sin espacios. Mínimo {min} caracteres.",
		en: "Letters and numbers, no spaces. Minimum {min} characters.",
	},
	"ingreso.verifying": {
		es: "Verificando cédula...",
		en: "Verifying ID...",
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
	"otp.step": {
		es: "Paso 2",
		en: "Step 2",
	},
	"otp.heading": {
		es: "Ingresá el código de verificación",
		en: "Enter the verification code",
	},
	"otp.sentToEmail": {
		es: "Hemos enviado un código a",
		en: "We have sent a code to",
	},
	"otp.inputLabel": {
		es: "Ingresar código",
		en: "Enter code",
	},
	"otp.resendCooldown": {
		es: "Reenviar ({seconds}s)",
		en: "Resend ({seconds}s)",
	},
	"otp.validating": {
		es: "Validando código...",
		en: "Validating code...",
	},
	"otp.noData.title": {
		es: "Necesitamos validar tu correo",
		en: "We need to validate your email",
	},
	"otp.noData.description": {
		es: "Para ingresar el código OTP primero tenés que registrar tu cédula y correo en el paso anterior.",
		en: "To enter the OTP code, you first need to register your ID and email in the previous step.",
	},
	"otp.noData.button": {
		es: "Volver a Ingreso",
		en: "Back to Entry",
	},
	"otp.noData.resendError": {
		es: "No hay datos válidos para reenviar el código",
		en: "No valid data to resend the code",
	},
	"otp.warning.title": {
		es: "IMPORTANTE: Medias Antideslizantes",
		en: "IMPORTANT: Non-Slip Socks",
	},
	"otp.warning.description": {
		es: "El uso de medias antideslizantes es obligatorio para ingresar a las atracciones. Puedes traerlas o adquirirlas en taquilla.",
		en: "Non-slip socks are mandatory to enter the attractions. You can bring your own or purchase them at the ticket office.",
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
	"registro.step": {
		es: "Paso 1",
		en: "Step 1",
	},
	"registro.heading": {
		es: "Ingresá tus datos",
		en: "Enter your information",
	},
	"registro.description": {
		es: "Necesitamos tu información para generar el consentimiento y enviarte el código de verificación.",
		en: "We need your information to generate the consent and send you the verification code.",
	},
	"registro.form.address": {
		es: "Dirección (opcional)",
		en: "Address (optional)",
	},
	"registro.form.cedula": {
		es: "Cédula",
		en: "ID Number",
	},
	"registro.placeholder.fullName": {
		es: "Ej. Ana María López",
		en: "E.g. Ana Maria Lopez",
	},
	"registro.placeholder.email": {
		es: "nombre@correo.com",
		en: "name@email.com",
	},
	"registro.placeholder.phone": {
		es: "300 123 4567",
		en: "300 123 4567",
	},
	"registro.placeholder.address": {
		es: "Calle 123 #45-67",
		en: "123 Main St #45",
	},
	"registro.submit": {
		es: "Guardar y Continuar",
		en: "Save and Continue",
	},
	"registro.noCedula.title": {
		es: "Empecemos desde el inicio",
		en: "Let's start from the beginning",
	},
	"registro.noCedula.description": {
		es: "Necesitamos que ingreses primero tu cédula para continuar con el registro.",
		en: "We need you to enter your ID first to continue with the registration.",
	},
	"registro.noCedula.button": {
		es: "Volver a Ingreso",
		en: "Back to Entry",
	},
	"registro.success": {
		es: "Enviamos un código a tu correo",
		en: "We sent a code to your email",
	},
	"registro.error.generic": {
		es: "No pudimos continuar. Intentá de nuevo.",
		en: "We couldn't continue. Please try again.",
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
	// TEMA / DARK MODE
	// ============================================================================
	"theme.loading": {
		es: "Cargando tema",
		en: "Loading theme",
	},
	"theme.light": {
		es: "Modo claro",
		en: "Light mode",
	},
	"theme.dark": {
		es: "Modo oscuro",
		en: "Dark mode",
	},
	"theme.switchToLight": {
		es: "Cambiar a modo claro",
		en: "Switch to light mode",
	},
	"theme.switchToDark": {
		es: "Cambiar a modo oscuro",
		en: "Switch to dark mode",
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
	"keypad.clearAll": {
		es: "Limpiar todo",
		en: "Clear all",
	},
	"keypad.enterDigit": {
		es: "Ingresar {digit}",
		en: "Enter {digit}",
	},
	"keypad.deleteLastDigit": {
		es: "Borrar último dígito",
		en: "Delete last digit",
	},
	"keypad.confirmDocument": {
		es: "Confirmar documento",
		en: "Confirm document",
	},

	// ============================================================================
	// PÁGINA DE CONSENTIMIENTO (COMPLETA)
	// ============================================================================
	"consentPage.title": {
		es: "Consentimiento y Exoneración",
		en: "Consent and Waiver",
	},
	"consentPage.responsible": {
		es: "Responsable",
		en: "Responsible Party",
	},
	"consentPage.guest": {
		es: "Invitado",
		en: "Guest",
	},
	"consentPage.expandButton": {
		es: "Pantalla Completa",
		en: "Full Screen",
	},
	"consentPage.expandButtonAria": {
		es: "Leer consentimiento en pantalla completa",
		en: "Read consent in full screen",
	},
	"consentPage.acceptTerms": {
		es: "He leído, entiendo y acepto los términos y condiciones descritos anteriormente, así como la política de tratamiento de datos personales.",
		en: "I have read, understand, and accept the terms and conditions described above, as well as the personal data processing policy.",
	},
	"consentPage.digitalSignature": {
		es: "Firma Digital",
		en: "Digital Signature",
	},
	"consentPage.signatureRequired": {
		es: "Firma requerida",
		en: "Signature required",
	},
	"consentPage.signatureRequiredDesc": {
		es: "Por favor, firme el documento antes de continuar.",
		en: "Please sign the document before continuing.",
	},
	"consentPage.submitButton": {
		es: "ACEPTAR Y FIRMAR",
		en: "ACCEPT AND SIGN",
	},
	"consentPage.processing": {
		es: "Procesando...",
		en: "Processing...",
	},
	"consentPage.successTitle": {
		es: "¡Consentimiento firmado!",
		en: "Consent signed!",
	},
	"consentPage.successConsecutivo": {
		es: "Consecutivo",
		en: "Confirmation number",
	},
	"consentPage.errorTitle": {
		es: "Error al guardar",
		en: "Error saving",
	},
	"consentPage.errorDesc": {
		es: "Hubo un problema al guardar el consentimiento. Intente nuevamente.",
		en: "There was a problem saving the consent. Please try again.",
	},
	"consentPage.termsBoxAria": {
		es: "Términos y condiciones del consentimiento",
		en: "Consent terms and conditions",
	},
	"consentPage.checkboxAria": {
		es: "Aceptar términos y condiciones",
		en: "Accept terms and conditions",
	},
	"consentPage.signaturePadAria": {
		es: "Área de firma digital",
		en: "Digital signature area",
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
