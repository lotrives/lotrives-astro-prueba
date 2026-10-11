// Vocabulario para las sugerencias de /buscar/ cuando no hay resultados
// («Varsobia» → «Varsovia»): palabras de 4 o más letras de los títulos y de todas
// las etiquetas, con el número de entradas en que aparecen.
import { getCollection } from 'astro:content';
import { ordenarPublicados, sinBorradores } from '../utils/url';

export async function GET() {
	const textos = ordenarPublicados(await getCollection('blog'));
	const paginas = sinBorradores(await getCollection('pages'));

	const cuenta = new Map<string, number>();
	for (const entrada of [...textos, ...paginas]) {
		const palabras = new Set<string>();
		for (const fuente of [entrada.data.title ?? '', ...(entrada.data.tags ?? [])]) {
			for (const w of fuente.match(/\p{L}+/gu) ?? []) if (w.length >= 4) palabras.add(w);
		}
		for (const w of palabras) cuenta.set(w, (cuenta.get(w) ?? 0) + 1);
	}

	return new Response(JSON.stringify(Object.fromEntries(cuenta)), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}
