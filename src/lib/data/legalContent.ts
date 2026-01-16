/**
 * Contenido Legal - Consentimiento Informado Jumping Park
 *
 * Este archivo centraliza todo el texto legal del consentimiento informado.
 * SOPORTA MÚLTIPLES IDIOMAS: Español (es) e Inglés (en).
 * Preparado para ser cargado desde base de datos en el futuro.
 *
 * @version 2.0.0
 * @lastUpdated 2025-12-27
 */

import type { Language } from "@/lib/i18n/dictionary";
import { 
	validateLocalizedContent, 
	detectConsentFormat,
	type LocalizedConsentValidated 
} from "@/lib/schemas/legalContent.schema";

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Representa una cláusula del consentimiento informado.
 */
export interface ConsentClause {
	/** Identificador único de la cláusula */
	id: number;
	/** Texto de la cláusula (puede incluir {COMPANY_NAME} como placeholder) */
	text: string;
	/** Si es true, se resaltará visualmente como importante */
	highlight?: boolean;
	/** Icono o emoji a mostrar antes del texto (solo para highlights) */
	icon?: string;
	/** Etiqueta del highlight (ej. "IMPORTANTE", "MENORES") */
	highlightLabel?: string;
}

/**
 * Representa una regla del parque.
 */
export interface ParkRule {
	/** Identificador único de la regla */
	id: number;
	/** Texto de la regla */
	text: string;
	/** Si es true, se resaltará visualmente */
	highlight?: boolean;
	/** Icono o emoji a mostrar antes del texto */
	icon?: string;
	/** Etiqueta del highlight */
	highlightLabel?: string;
}

/**
 * Estructura completa del contenido del consentimiento.
 */
export interface ConsentContentStructure {
	/** Metadatos del documento */
	meta: {
		version: string;
		lastUpdated: string;
		companyName: string;
	};
	/** Sección del consentimiento informado */
	consent: {
		title: string;
		subtitle: string;
		introduction: string;
		clauses: ConsentClause[];
		closingStatement: string;
	};
	/** Sección de reglas del parque */
	rules: {
		title: string;
		introduction: string;
		items: ParkRule[];
		closingMessage: string;
	};
}

// ============================================================================
// CONTENIDO POR DEFECTO
// ============================================================================

/**
 * Contenido por defecto del consentimiento informado.
 * En el futuro, esto puede ser reemplazado por datos de Firestore.
 */
export const DEFAULT_CONSENT_CONTENT: ConsentContentStructure = {
	meta: {
		version: "3.0.0",
		lastUpdated: "2025-12-16",
		companyName: "Jumping Park",
	},

	consent: {
		title:
			"Consentimiento Informado para la Práctica de Actividades Deportivas",
		subtitle:
			"Es una actividad deportiva que puede ocasionar lesiones leves o importantes",
		introduction:
			"Yo, identificado como aparece en el encabezado, mayor de edad, obrando en nombre propio y/o en representación de los menores relacionados en este formulario digital, CON MI FIRMA, MANIFIESTO QUE:",

		clauses: [
			{
				id: 1,
				text: "{COMPANY_NAME}, les ha informado mediante diversas maneras (pantalla, carteleras y resalta de manera verbal las más importantes) sobre las características de la actividad deportiva en que van a participar y sobre las condiciones físicas requeridas para dicha participación, así como lo muestran las Reglas Publicadas en el establecimiento.",
			},
			{
				id: 2,
				text: "{COMPANY_NAME}, me ha informado, de manera suficiente, detallada y clara (pantalla, carteleras y resalta de manera verbal las más importantes) sobre los riesgos de las actividades físicas que van a practicar dentro del establecimiento, sobre la idoneidad de los guías y sobre las medidas mínimas de seguridad que se deben adoptar en la realización de las actividades.",
			},
			{
				id: 3,
				text: "He informado de manera voluntaria, libre y sincera, que las personas a mi cargo carecen de contraindicación o limitación médica alguna que les impida desarrollar en debida forma las actividades a realizar en {COMPANY_NAME}.",
			},
			{
				id: 4,
				text: "Ninguna se encuentra en estado de embarazo y que de estarlo practicaran las actividades físicas bajo su propio riesgo, eximiendo de cualquier responsabilidad a {COMPANY_NAME}, del daño o perjuicio que la práctica dentro del establecimiento pueda generar.",
			},
			{
				id: 5,
				text: "NO uso de accesorios (anillos, relojes, cadena o derivados) que puedan poner en riesgo la integridad física de los participantes.",
				highlight: true,
				icon: "⚠️",
				highlightLabel: "IMPORTANTE",
			},
			{
				id: 6,
				text: "Las actividades que realizaremos en {COMPANY_NAME} serán bajo nuestra propia responsabilidad.",
			},
			{
				id: 7,
				text: "Desde el ingreso a las instalaciones de {COMPANY_NAME}, se me dio a conocer el reglamento (pantalla, carteleras y resalta de manera verbal las más importantes) para la realización de las actividades deportivas, condiciones de seguridad de estas, riesgos inherentes a las actividades, lo cual asumo bajo mi propio riesgo y patrimonio en cuanto a los daños que eventualmente se puedan generar a alguno del grupo y que pude evidenciar y leer todos los Reglamentos publicados en el establecimiento.",
			},
			{
				id: 8,
				text: "Manifiesto conocer y entender las normas reguladoras de las actividades que desarrollaremos dentro del establecimiento, que estoy conforme con ellas y que nos someteremos a las reglas, dirección, disciplina y control por parte de los funcionarios autorizados de {COMPANY_NAME}, quedando bajo mi exclusiva responsabilidad actuar de manera contraria a ellas.",
			},
			{
				id: 9,
				text: "Asumo todos los riesgos de la actividad del grupo y, en consecuencia, eximo a {COMPANY_NAME} de cualquier daño o perjuicio que pueda sufrir en el desarrollo de la actividad.",
			},
			{
				id: 10,
				text: "Ninguno se encuentra bajo la influencia del alcohol o cualquier droga, sustancia ilícita o medicamentos que pueda afectar la capacidad física o poner en riesgo la salud para participar en las actividades dentro del establecimiento.",
			},
			{
				id: 11,
				text: "Autorizo a {COMPANY_NAME} a sección de derechos de uso de imagen y autorización para tratamiento de datos personales, utilizar las fotografías y/o grabaciones que nos realicen en el desarrollo de la actividad, para publicidad y promoción del establecimiento, sin que esto implique, ningún tipo de contraprestación, para lo cual este escrito corresponde a una renuncia expresa de cualquier tipo de reclamación patrimonial al respecto.",
			},
			{
				id: 12,
				text: "Que de conformidad con la ley 1581 de 2012 o ley de Habeas Data autorizo para que {COMPANY_NAME}, recopile, almacene, use y suprima los datos personales aquí suministrados, especialmente, aquellos que son definidos como datos sensibles.",
			},
			{
				id: 13,
				text: "Todos los participantes están afiliados a una EPS, como lo dicta el Régimen Contributivo de Seguridad Social.",
			},
			{
				id: 14,
				text: "En caso de que los participantes no estén afiliados a una EPS, yo me hago responsable con mi patrimonio de cualquier situación desafortunada, después de ser atendido por la póliza de área protegida de {COMPANY_NAME}, en la que se brinda primeros auxilios y se lleva al accidentado (en caso de que lo hubiera) hasta la clínica de mi preferencia; eximiendo a {COMPANY_NAME} de cualquier responsabilidad.",
			},
			{
				id: 15,
				text: "El personal no está autorizado a hacerse responsable de los participantes en ausencia de los padres o acudientes, o de abandonar las instalaciones del parque por parte de los participantes ya que no se presta servicio de guardería.",
				highlight: true,
				icon: "⚠️",
				highlightLabel: "IMPORTANTE",
			},
			{
				id: 16,
				text: "APOYARÉ LAS DECISIONES DEL PERSONAL ENCARGADO DEL PARQUE, PARA PRESERVAR LA SEGURIDAD DE LOS PARTICIPANTES Y EN ESPECIAL LA DEL GRUPO DEL QUE SOY RESPONSABLE.",
			},
			{
				id: 17,
				text: "El uso de las medias antideslizantes es obligatorio para el Ingreso a las áreas de Juego.",
			},
		],

		closingStatement:
			"Mediante mi firma manifiesto que Jumping Park, me ha puesto en conocimiento el documento sobre consentimiento informado para practicar actividades físicas de todas las personas registradas al respaldo, dentro de su establecimiento, que lo he leído y certifico que toda la información que yo consigne en este formato es veraz y completa, también en estar de acuerdo con las futuras normas o reglas que sean estipuladas por el establecimiento.",
	},

	rules: {
		title: "Bienvenido a Jumping Park",
		introduction:
			"Asegúrese de leer y haber visto el video de estas reglas antes de entrar a nuestro parque de trampolines. Al igual que con todos los deportes y actividades físicas, siempre existe la posibilidad de accidentes o lesiones graves y nosotros estamos aquí para evitar que usted se haga daño o les haga daño a otras personas. Reglas son reglas y estamos seguros de que las puede cumplir.",

		items: [
			{
				id: 1,
				text: "Antes de iniciar a saltar debe haber diligenciado el formulario de inscripción y haber firmado la carta de consentimiento.",
			},
			{
				id: 2,
				text: "Los menores de seis (6) años con condiciones especiales o zona galáctica deben estar acompañados por sus padres o un adulto responsable.",
				highlight: true,
				icon: "👶",
				highlightLabel: "MENORES",
			},
			{
				id: 3,
				text: "Al ingresar a la zona del parque no tenga nada en la boca (chicles, dulces, etc.).",
			},
			{
				id: 4,
				text: "Retire sus zapatos y medias lisas. Solo se ingresa con medias que tengan goma antideslizante.",
			},
			{
				id: 5,
				text: "Retire y guarde todas sus joyas (anillos, cadenas, pulseras, relojes, entre otras). Vacíe completamente sus bolsillos antes de saltar.",
			},
			{
				id: 6,
				text: "No se permite el ingreso si tiene alguna limitación de salud (cardiacas, vértigo, lumbares, etc.) o lesiones recientes.",
			},
			{
				id: 7,
				text: "No salte si se encuentra bajo la influencia del alcohol.",
			},
			{
				id: 8,
				text: "No se permite el ingreso si está en embarazo.",
			},
			{
				id: 9,
				text: "No salte con objetos afilados o dispositivos no autorizados (cámaras, teléfonos, etc.).",
			},
			{
				id: 10,
				text: "No aterrice sobre la cabeza o cuello en la zona de juegos.",
			},
			{
				id: 11,
				text: "No interrumpa el salto de otra persona de ninguna manera.",
			},
			{
				id: 12,
				text: "Si está cansado, debe salir y descansar fuera de la zona de salto.",
			},
			{
				id: 13,
				text: "No se siente o acueste sobre el trampolín, siempre debe estar saltando mientras esté sobre los trampolines.",
			},
			{
				id: 14,
				text: "No corra sobre los trampolines ni pasillos, no haga carreras.",
			},
			{
				id: 15,
				text: "No salte sobre las protecciones de los trampolines.",
			},
			{
				id: 16,
				text: "No se cuelgue de las escaleras o agarre de las protecciones de los trampolines, especialmente de las camas inclinadas.",
			},
			{
				id: 17,
				text: "No empuje, juegue brusco o realice trucos peligrosos o imprudentes.",
			},
			{
				id: 18,
				text: "No debe perder el control de su cuerpo en ningún momento.",
			},
			{
				id: 19,
				text: "No ingiera alimentos, bebidas en los trampolines, ni pasillos.",
			},
			{
				id: 20,
				text: "No haga salto mortal doble o cualquier pirueta similar.",
			},
			{
				id: 21,
				text: "No realice saltos en un trampolín con más personas. Solo debe saltar una persona por trampolín.",
			},
			{
				id: 22,
				text: "Tenga cuidado con las personas que están a su lado, en especial las de menor tamaño. Debe alejarse hacia otros trampolines más libres.",
			},
			{
				id: 23,
				text: "Sea consciente de los que lo rodean e intercambie saltos con las personas que son de su mismo tamaño.",
			},
			{
				id: 24,
				text: "No toque ninguna parte de la estructura metálica del parque.",
			},
			{
				id: 25,
				text: "No se agarre de las mallas, ni salte sobre ellas.",
			},
			{
				id: 26,
				text: "No deslizarse de cabeza, espalda o acostado.",
			},
			{
				id: 27,
				text: "Ingreso a Mundo Galáctico de 80 cm a 1.30 mt (por recomendaciones del fabricante NO hay excepción).",
			},
			{
				id: 28,
				text: "No ingresar objetos o juguetes.",
			},
			{
				id: 29,
				text: "Mantener despejada las rutas de evacuación.",
			},
			{
				id: 30,
				text: "No halar, colgarse o despegar piezas decorativas.",
			},
			{
				id: 31,
				text: "En Mundo Galáctico, el menor de edad debe estar siempre acompañado por un mayor de 18 años.",
			},
			{
				id: 32,
				text: "Espacio libre de humo.",
			},
			{
				id: 33,
				text: "Haga caso al personal del parque y cumpla con sus instrucciones, en caso de no hacerlo será interrumpida su actividad por su seguridad y la de los demás.",
			},
			{
				id: 34,
				text: "No se permite las agresiones físicas o verbales con otros visitantes o colaboradores ya que es causa de retiro de la atracción sin derecho a devolución de dinero.",
				highlight: true,
				icon: "🚫",
				highlightLabel: "PROHIBIDO",
			},
			{
				id: 35,
				text: "Siga todas y cada una de las reglas del parque y evite ser retirado de la actividad.",
			},
		],

		closingMessage: "¡Que se diviertan! y gracias por venir a Jumping Park.",
	},
};

// ============================================================================
// CONTENIDO EN INGLÉS
// ============================================================================

/**
 * Contenido del consentimiento informado en inglés.
 * Documento legal completo adaptado para visitantes de habla inglesa.
 */
export const ENGLISH_CONSENT_CONTENT: ConsentContentStructure = {
	meta: {
		version: "3.0.0",
		lastUpdated: "2025-12-27",
		companyName: "Jumping Park",
	},

	consent: {
		title: "Informed Consent for Sports Activities",
		subtitle:
			"This is a sports activity that may cause minor or serious injuries",
		introduction:
			"I, identified as shown in the header, of legal age, acting on my own behalf and/or on behalf of the minors listed in this digital form, BY MY SIGNATURE, DECLARE THAT:",

		clauses: [
			{
				id: 1,
				text: "{COMPANY_NAME} has informed us through various means (screens, bulletin boards, and verbally highlighting the most important ones) about the characteristics of the sports activity we are about to participate in and the physical conditions required for such participation, as shown in the Rules Posted at the establishment.",
			},
			{
				id: 2,
				text: "{COMPANY_NAME} has sufficiently, thoroughly, and clearly informed me (through screens, bulletin boards, and verbally highlighting the most important ones) about the risks of the physical activities to be practiced within the establishment, the suitability of the guides, and the minimum safety measures to be adopted during the activities.",
			},
			{
				id: 3,
				text: "I have voluntarily, freely, and sincerely informed that the persons under my care have no medical contraindication or limitation that prevents them from properly performing the activities at {COMPANY_NAME}.",
			},
			{
				id: 4,
				text: "None are pregnant, and if so, they will practice physical activities at their own risk, exempting {COMPANY_NAME} from any liability for damage or harm that practicing at the establishment may cause.",
			},
			{
				id: 5,
				text: "NO wearing of accessories (rings, watches, chains, or similar items) that may put the physical integrity of participants at risk.",
				highlight: true,
				icon: "⚠️",
				highlightLabel: "IMPORTANT",
			},
			{
				id: 6,
				text: "The activities we perform at {COMPANY_NAME} will be under our own responsibility.",
			},
			{
				id: 7,
				text: "Upon entering {COMPANY_NAME} facilities, I was informed of the regulations (through screens, bulletin boards, and verbally highlighting the most important ones) for performing sports activities, their safety conditions, and inherent risks, which I assume at my own risk and expense regarding any damages that may be caused to any member of the group, and I was able to read all the Regulations posted at the establishment.",
			},
			{
				id: 8,
				text: "I declare that I know and understand the regulations governing the activities we will perform within the establishment, that I agree with them, and that we will submit to the rules, direction, discipline, and control by authorized {COMPANY_NAME} staff, remaining under my exclusive responsibility to act contrary to them.",
			},
			{
				id: 9,
				text: "I assume all risks of the group's activity and, consequently, exempt {COMPANY_NAME} from any damage or harm that may be suffered during the activity.",
			},
			{
				id: 10,
				text: "No one is under the influence of alcohol or any drug, illegal substance, or medications that may affect physical capacity or endanger health to participate in activities within the establishment.",
			},
			{
				id: 11,
				text: "I authorize {COMPANY_NAME} to use image rights and authorization for personal data processing, to use photographs and/or recordings taken of us during the activity, for advertising and promotion of the establishment, without this implying any type of compensation, for which this document corresponds to an express waiver of any type of financial claim in this regard.",
			},
			{
				id: 12,
				text: "In accordance with Law 1581 of 2012 or Habeas Data Law, I authorize {COMPANY_NAME} to collect, store, use, and delete the personal data provided here, especially those defined as sensitive data.",
			},
			{
				id: 13,
				text: "All participants are affiliated with a Health Insurance Provider (EPS), as required by the Colombian Social Security Contributory Regime.",
			},
			{
				id: 14,
				text: "In case participants are not affiliated with a Health Insurance Provider, I take responsibility with my assets for any unfortunate situation, after being attended by {COMPANY_NAME}'s protected area policy, which provides first aid and takes the injured person (if any) to the clinic of my preference; exempting {COMPANY_NAME} from any liability.",
			},
			{
				id: 15,
				text: "Staff is not authorized to be responsible for participants in the absence of parents or guardians, or for participants leaving the park facilities as no childcare service is provided.",
				highlight: true,
				icon: "⚠️",
				highlightLabel: "IMPORTANT",
			},
			{
				id: 16,
				text: "I WILL SUPPORT THE DECISIONS OF THE PARK STAFF TO PRESERVE THE SAFETY OF PARTICIPANTS AND ESPECIALLY THAT OF THE GROUP FOR WHICH I AM RESPONSIBLE.",
			},
			{
				id: 17,
				text: "The use of non-slip socks is mandatory for entry to the play areas.",
			},
		],

		closingStatement:
			"By my signature, I declare that Jumping Park has made me aware of the informed consent document for practicing physical activities for all persons registered on the back, within its establishment, that I have read it and certify that all information I provide in this form is true and complete, and I also agree with any future rules or regulations established by the establishment.",
	},

	rules: {
		title: "Welcome to Jumping Park",
		introduction:
			"Make sure to read and watch the video of these rules before entering our trampoline park. As with all sports and physical activities, there is always the possibility of accidents or serious injuries, and we are here to prevent you from hurting yourself or others. Rules are rules, and we are sure you can follow them.",

		items: [
			{
				id: 1,
				text: "Before starting to jump, you must have completed the registration form and signed the consent letter.",
			},
			{
				id: 2,
				text: "Children under six (6) years with special conditions or in the galactic zone must be accompanied by their parents or a responsible adult.",
				highlight: true,
				icon: "👶",
				highlightLabel: "MINORS",
			},
			{
				id: 3,
				text: "When entering the park area, do not have anything in your mouth (gum, candy, etc.).",
			},
			{
				id: 4,
				text: "Remove your shoes and regular socks. You may only enter with socks that have non-slip rubber.",
			},
			{
				id: 5,
				text: "Remove and store all your jewelry (rings, chains, bracelets, watches, etc.). Empty your pockets completely before jumping.",
			},
			{
				id: 6,
				text: "Entry is not permitted if you have any health limitations (cardiac, vertigo, lumbar, etc.) or recent injuries.",
			},
			{
				id: 7,
				text: "Do not jump if you are under the influence of alcohol.",
			},
			{
				id: 8,
				text: "Entry is not permitted if you are pregnant.",
			},
			{
				id: 9,
				text: "Do not jump with sharp objects or unauthorized devices (cameras, phones, etc.).",
			},
			{
				id: 10,
				text: "Do not land on your head or neck in the play area.",
			},
			{
				id: 11,
				text: "Do not interrupt another person's jump in any way.",
			},
			{
				id: 12,
				text: "If you are tired, you should exit and rest outside the jump area.",
			},
			{
				id: 13,
				text: "Do not sit or lie on the trampoline; you should always be jumping while on the trampolines.",
			},
			{
				id: 14,
				text: "Do not run on the trampolines or aisles, do not race.",
			},
			{
				id: 15,
				text: "Do not jump on the trampoline protections.",
			},
			{
				id: 16,
				text: "Do not hang from ladders or grab the trampoline protections, especially on inclined beds.",
			},
			{
				id: 17,
				text: "Do not push, play rough, or perform dangerous or reckless tricks.",
			},
			{
				id: 18,
				text: "You must not lose control of your body at any time.",
			},
			{
				id: 19,
				text: "Do not consume food or drinks on the trampolines or aisles.",
			},
			{
				id: 20,
				text: "Do not perform double somersaults or any similar stunts.",
			},
			{
				id: 21,
				text: "Do not jump on a trampoline with more people. Only one person should jump per trampoline.",
			},
			{
				id: 22,
				text: "Be careful of people next to you, especially smaller ones. You should move to other freer trampolines.",
			},
			{
				id: 23,
				text: "Be aware of those around you and take turns jumping with people of your same size.",
			},
			{
				id: 24,
				text: "Do not touch any part of the park's metal structure.",
			},
			{
				id: 25,
				text: "Do not grab onto the nets or jump on them.",
			},
			{
				id: 26,
				text: "Do not slide head-first, on your back, or lying down.",
			},
			{
				id: 27,
				text: "Entry to Galactic World is for heights from 80 cm to 1.30 m (per manufacturer recommendations, there are NO exceptions).",
			},
			{
				id: 28,
				text: "Do not bring in objects or toys.",
			},
			{
				id: 29,
				text: "Keep evacuation routes clear.",
			},
			{
				id: 30,
				text: "Do not pull, hang on, or remove decorative pieces.",
			},
			{
				id: 31,
				text: "In Galactic World, the minor must always be accompanied by an adult over 18 years old.",
			},
			{
				id: 32,
				text: "Smoke-free space.",
			},
			{
				id: 33,
				text: "Follow park staff instructions; failure to do so will result in your activity being interrupted for your safety and that of others.",
			},
			{
				id: 34,
				text: "Physical or verbal aggression towards other visitors or staff is not permitted and will result in removal from the attraction without a refund.",
				highlight: true,
				icon: "🚫",
				highlightLabel: "PROHIBITED",
			},
			{
				id: 35,
				text: "Follow each and every rule of the park and avoid being removed from the activity.",
			},
		],

		closingMessage: "Have fun! And thank you for visiting Jumping Park.",
	},
};

// ============================================================================
// MAPA DE CONTENIDO POR IDIOMA (FALLBACK ESTÁTICO)
// ============================================================================

/**
 * Mapa de contenido legal por idioma.
 * Se usa como fallback cuando Firestore no tiene datos.
 */
export const CONSENT_CONTENT_BY_LANGUAGE: Record<Language, ConsentContentStructure> = {
	es: DEFAULT_CONSENT_CONTENT,
	en: ENGLISH_CONSENT_CONTENT,
};

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Reemplaza los placeholders {COMPANY_NAME} con el nombre de la empresa.
 */
export function replaceCompanyName(text: string, companyName: string): string {
	return text.replace(/{COMPANY_NAME}/g, companyName);
}

/**
 * Procesa el contenido de consentimiento reemplazando placeholders.
 * @param content - Contenido base a procesar
 * @returns Contenido con placeholders reemplazados
 */
function processConsentContent(content: ConsentContentStructure): ConsentContentStructure {
	const companyName = content.meta.companyName;

	// Reemplazar placeholders en todas las cláusulas
	const processedClauses = content.consent.clauses.map((clause) => ({
		...clause,
		text: replaceCompanyName(clause.text, companyName),
	}));

	return {
		...content,
		consent: {
			...content.consent,
			clauses: processedClauses,
		},
	};
}

/**
 * Extrae el contenido para un idioma específico desde datos multilenguaje de Firestore.
 * Implementa lógica de fallback: idioma solicitado -> español -> null
 * 
 * @param firestoreData - Datos crudos de Firestore (puede ser formato antiguo o nuevo)
 * @param language - Idioma solicitado
 * @returns Contenido validado para el idioma o null si no existe
 */
export function extractLocalizedContent(
	firestoreData: unknown,
	language: Language
): LocalizedConsentValidated | null {
	if (!firestoreData || typeof firestoreData !== 'object') {
		return null;
	}

	const format = detectConsentFormat(firestoreData);

	// Formato antiguo: el documento raíz ES el contenido (sin claves de idioma)
	if (format === 'legacy') {
		const validation = validateLocalizedContent(firestoreData);
		return validation.success ? validation.data : null;
	}

	// Formato nuevo: buscar por clave de idioma
	if (format === 'multilang') {
		const data = firestoreData as Record<string, unknown>;

		// Intentar idioma solicitado
		if (language in data) {
			const validation = validateLocalizedContent(data[language]);
			if (validation.success) {
				return validation.data;
			}
		}

		// Fallback a español si el idioma no existe
		if (language !== 'es' && 'es' in data) {
			const validation = validateLocalizedContent(data['es']);
			if (validation.success) {
				console.warn(`[LegalContent] Idioma '${language}' no encontrado, usando fallback 'es'`);
				return validation.data;
			}
		}
	}

	return null;
}

/**
 * Obtiene el contenido del consentimiento con los placeholders reemplazados.
 * Soporta tanto datos de Firestore (multilenguaje) como fallback estático.
 * 
 * @param language - Idioma del contenido ('es' | 'en')
 * @param firestoreData - Datos opcionales de Firestore (documento settings/consent_v1)
 * @returns Contenido procesado del consentimiento
 * 
 * @example
 * // Uso básico con fallback estático
 * const content = getConsentContent('es');
 * 
 * @example
 * // Uso con datos de Firestore
 * const dbData = await getDoc(doc(db, 'settings', 'consent_v1'));
 * const content = getConsentContent('en', dbData.data());
 */
export function getConsentContent(
	language: Language = "es",
	firestoreData?: unknown,
): ConsentContentStructure {
	// Si hay datos de Firestore, intentar extraer el idioma correcto
	if (firestoreData) {
		const extracted = extractLocalizedContent(firestoreData, language);
		if (extracted) {
			// Convertir LocalizedConsentValidated a ConsentContentStructure
			const content: ConsentContentStructure = {
				meta: extracted.meta,
				consent: {
					title: extracted.consent.title,
					subtitle: extracted.consent.subtitle,
					introduction: extracted.consent.introduction,
					clauses: extracted.consent.clauses,
					closingStatement: extracted.consent.closingStatement,
				},
				rules: {
					title: extracted.rules.title,
					introduction: extracted.rules.introduction,
					items: extracted.rules.items,
					closingMessage: extracted.rules.closingMessage,
				},
			};
			return processConsentContent(content);
		}
		console.warn(`[LegalContent] No se pudo extraer contenido de Firestore, usando fallback estático`);
	}

	// Fallback: usar contenido estático hardcodeado
	const baseContent = CONSENT_CONTENT_BY_LANGUAGE[language] || DEFAULT_CONSENT_CONTENT;
	return processConsentContent(baseContent);
}
