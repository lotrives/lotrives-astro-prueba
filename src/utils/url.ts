// URL pública de un texto, deducida del nombre de su archivo.
//
//   2026-10-10-titulo-corto.md  →  /2026/10/10/titulo-corto/
//   20260512-1030.md            →  /notas/20260512-1030/   (notas antiguas: conservan su dirección)
//
// Así ninguna dirección publicada cambia y no hacen falta redirecciones.

const NOTA_ANTIGUA = /^\d{8}-\d{4}$/;
const FECHADO = /^(\d{4})-(\d{2})-(\d{2})-(.+)$/;

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function idLimpio(entry: { id: string }): string {
	return entry.id.replace(/\.mdx?$/, '');
}

/** Ruta sin barras inicial ni final, p. ej. «2026/10/10/titulo» o «notas/20260512-1030». */
export function rutaTexto(entry: { id: string }): string {
	const id = idLimpio(entry);
	if (NOTA_ANTIGUA.test(id)) return `notas/${id}`;
	const m = id.match(FECHADO);
	if (m) return `${m[1]}/${m[2]}/${m[3]}/${m[4]}`;
	throw new Error(`Nombre de archivo no reconocido en src/content/blog/: «${entry.id}». Usa AAAA-MM-DD-titulo.md`);
}

/** URL relativa con barras: «/2026/10/10/titulo/». */
export function urlTexto(entry: { id: string }): string {
	return `${base}/${rutaTexto(entry)}/`;
}

/** true para los archivos con el formato fechado (los que tenían redirección desde /blog/). */
export function esFechado(entry: { id: string }): boolean {
	return FECHADO.test(idLimpio(entry));
}

/** Textos publicados (sin borradores), del más reciente al más antiguo. */
export function ordenarPublicados<T extends { data: { draft?: boolean; pubDate: Date } }>(entradas: T[]): T[] {
	return entradas
		.filter((e) => !e.data.draft)
		.sort((a, b) => new Date(b.data.pubDate).valueOf() - new Date(a.data.pubDate).valueOf());
}

/** Descripción para SEO y listas: la del frontmatter o, si falta, el comienzo del texto. */
export function descripcionDe(entry: { data: { description?: string }; body?: string }): string {
	if (entry.data.description) return entry.data.description;
	return (entry.body ?? '').replace(/[#*`>\-]/g, '').trim().slice(0, 160);
}
