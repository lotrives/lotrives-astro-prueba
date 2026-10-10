// Etiquetas: cuáles tienen página propia y cómo se enlazan.
//
// Una etiqueta tiene página (/etiquetas/<etiqueta>/) y se muestra como píldora
// solo si la usan al menos MIN_ENTRADAS entradas (textos y páginas estáticas),
// el mismo criterio que el índice /etiquetas/ y el pie de cada texto.
//
// Las páginas se generan solas: no hay que crear nada a mano.

import { getCollection } from 'astro:content';
import { sinBorradores, ordenarPublicados } from './url';

export const MIN_ENTRADAS = 3;
export const MAX_PILDORAS = 3;

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const slugify = (text: string): string =>
	text
		.toString()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

export function urlEtiqueta(tag: string): string {
	return `${base}/etiquetas/${slugify(tag)}/`;
}

export interface InfoEtiqueta {
	slug: string;
	nombre: string;
	textos: Awaited<ReturnType<typeof getCollection<'blog'>>>;
	paginas: Awaited<ReturnType<typeof getCollection<'pages'>>>;
	total: number;
}

/** Etiquetas con página propia, indexadas por slug. */
export async function etiquetasConPagina(): Promise<Map<string, InfoEtiqueta>> {
	const textos = ordenarPublicados(await getCollection('blog'));
	const paginas = sinBorradores(await getCollection('pages'));

	const todas = new Map<string, InfoEtiqueta>();
	const obtener = (tag: string) => {
		const slug = slugify(tag);
		if (!todas.has(slug)) todas.set(slug, { slug, nombre: tag, textos: [], paginas: [], total: 0 });
		return todas.get(slug)!;
	};

	for (const t of textos) for (const tag of t.data.tags ?? []) obtener(tag).textos.push(t);
	for (const p of paginas) for (const tag of p.data.tags ?? []) obtener(tag).paginas.push(p);

	const conPagina = new Map<string, InfoEtiqueta>();
	for (const info of todas.values()) {
		info.total = info.textos.length + info.paginas.length;
		if (info.total >= MIN_ENTRADAS && info.slug) conPagina.set(info.slug, info);
	}
	return conPagina;
}

/** Hasta MAX_PILDORAS etiquetas de un texto que tengan página, en el orden del frontmatter. */
export function pildorasDe(
	tags: string[] | undefined,
	conPagina: Map<string, InfoEtiqueta>,
): { nombre: string; href: string }[] {
	const vistas = new Set<string>();
	const res: { nombre: string; href: string }[] = [];
	for (const tag of tags ?? []) {
		const slug = slugify(tag);
		if (!conPagina.has(slug) || vistas.has(slug)) continue;
		vistas.add(slug);
		res.push({ nombre: tag, href: urlEtiqueta(tag) });
		if (res.length === MAX_PILDORAS) break;
	}
	return res;
}
