import type { Metadata } from 'next'
import Link from 'next/link'
import {
	APP_DESCRIPTION,
	APP_NAME,
	APP_URL,
	createCanonicalUrl,
	INDEXABLE_ROBOTS,
} from '@/lib/seo'

const PAGE_PATH = '/consentimiento-digital'
const PAGE_TITLE = 'Consentimiento digital para visitantes'
const PAGE_DESCRIPTION =
	'Conoce como funciona el consentimiento digital de Jumping Park antes de llegar al parque: registro agil, validacion por OTP y firma segura para adultos y menores.'

const structuredData = {
	'@context': 'https://schema.org',
	'@graph': [
		{
			'@type': 'WebPage',
			'@id': `${createCanonicalUrl(PAGE_PATH)}#webpage`,
			url: createCanonicalUrl(PAGE_PATH),
			name: PAGE_TITLE,
			description: PAGE_DESCRIPTION,
			isPartOf: {
				'@id': `${APP_URL}/#website`,
			},
			about: {
				'@id': `${APP_URL}/#organization`,
			},
		},
		{
			'@type': 'WebSite',
			'@id': `${APP_URL}/#website`,
			url: APP_URL,
			name: APP_NAME,
			description: APP_DESCRIPTION,
			inLanguage: 'es-CO',
		},
		{
			'@type': 'AmusementPark',
			'@id': `${APP_URL}/#organization`,
			name: APP_NAME,
			url: APP_URL,
			description: APP_DESCRIPTION,
			image: `${APP_URL}/og-image.png`,
			inLanguage: 'es-CO',
		},
	],
}

export const metadata: Metadata = {
	title: PAGE_TITLE,
	description: PAGE_DESCRIPTION,
	robots: INDEXABLE_ROBOTS,
	alternates: {
		canonical: PAGE_PATH,
	},
	openGraph: {
		title: `${PAGE_TITLE} | ${APP_NAME}`,
		description: PAGE_DESCRIPTION,
		url: createCanonicalUrl(PAGE_PATH),
		type: 'article',
		images: [
			{
				url: `${APP_URL}/og-image.png`,
				width: 1200,
				height: 630,
				alt: APP_NAME,
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: `${PAGE_TITLE} | ${APP_NAME}`,
		description: PAGE_DESCRIPTION,
		images: [`${APP_URL}/og-image.png`],
	},
}

export default function ConsentimientoDigitalPage() {
	return (
		<main className="min-h-screen bg-linear-to-b from-zinc-950 via-zinc-900 to-emerald-950 px-6 py-16 text-zinc-50 sm:px-10 lg:px-16">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
			/>

			<div className="mx-auto flex max-w-5xl flex-col gap-12">
				<section className="grid gap-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur sm:p-10 lg:grid-cols-[1.3fr_0.7fr]">
					<div className="space-y-6">
						<p className="text-sm uppercase tracking-[0.35em] text-emerald-300">
							Experiencia previa a la visita
						</p>
						<h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
							Consentimiento digital rapido, claro y listo antes de saltar.
						</h1>
						<p className="max-w-2xl text-lg leading-8 text-zinc-200">
							En Jumping Park usamos un flujo digital para validar identidad,
							confirmar responsables y capturar firmas con respaldo seguro.
							 Eso reduce filas, mejora el control operativo y deja el ingreso
							 listo para adultos y menores.
						</p>
						<div className="flex flex-wrap gap-4">
							<Link
								href="/"
								className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300"
							>
								Ir al kiosco de ingreso
							</Link>
							<Link
								href={PAGE_PATH}
								className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-200"
							>
								URL canonica publica
							</Link>
						</div>
					</div>

					<div className="grid gap-4 rounded-[1.5rem] border border-emerald-300/20 bg-black/20 p-6">
						<div>
							<p className="text-sm uppercase tracking-[0.3em] text-emerald-200">
								Incluye
							</p>
							<p className="mt-2 text-2xl font-bold text-white">
								Flujo listo para recepcion y taquilla
							</p>
						</div>
						<ul className="space-y-3 text-sm leading-7 text-zinc-200">
							<li>OTP por correo para validar acceso del visitante.</li>
							<li>Captura de firma digital con datos del responsable.</li>
							<li>Registro estructurado para consentimientos de menores.</li>
							<li>Panel administrativo aislado del surface publico.</li>
						</ul>
					</div>
				</section>

				<section className="grid gap-6 md:grid-cols-3">
					<article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
						<h2 className="text-xl font-bold text-white">1. Registro</h2>
						<p className="mt-3 text-sm leading-7 text-zinc-200">
							El visitante ingresa su documento y el sistema recupera o valida
							 la informacion necesaria para continuar.
						</p>
					</article>

					<article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
						<h2 className="text-xl font-bold text-white">2. Validacion</h2>
						<p className="mt-3 text-sm leading-7 text-zinc-200">
							Se envia un OTP al correo del responsable y el flujo limita abuso,
							 reintentos y sesiones bloqueadas.
						</p>
					</article>

					<article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
						<h2 className="text-xl font-bold text-white">3. Consentimiento</h2>
						<p className="mt-3 text-sm leading-7 text-zinc-200">
							La firma queda asociada al consentimiento y lista para consulta
							 administrativa, descarga y soporte operativo.
						</p>
					</article>
				</section>
			</div>
		</main>
	)
}
