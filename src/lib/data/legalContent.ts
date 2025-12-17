/**
 * Contenido Legal - Consentimiento Informado Jumping Park
 *
 * Este archivo centraliza todo el texto legal del consentimiento informado.
 * Preparado para ser cargado desde base de datos en el futuro.
 *
 * @version 1.0.0
 * @lastUpdated 2024-12-16
 */

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
// UTILIDADES
// ============================================================================

/**
 * Reemplaza los placeholders {COMPANY_NAME} con el nombre de la empresa.
 */
export function replaceCompanyName(text: string, companyName: string): string {
	return text.replace(/{COMPANY_NAME}/g, companyName);
}

/**
 * Obtiene el contenido del consentimiento con los placeholders reemplazados.
 * En el futuro, esta función puede cargar desde Firestore.
 */
export function getConsentContent(
	customContent?: Partial<ConsentContentStructure>,
): ConsentContentStructure {
	const content = customContent
		? { ...DEFAULT_CONSENT_CONTENT, ...customContent }
		: DEFAULT_CONSENT_CONTENT;

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
