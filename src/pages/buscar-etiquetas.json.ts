// Etiquetas con página propia (3 o más entradas), para /buscar/:
// el filtro por etiqueta, el aviso «Etiqueta: …» y las sugerencias cuando no hay resultados.
// n = nombre, s = slug (dirección), t = número de entradas.
import { etiquetasConPagina } from '../utils/etiquetas';

export async function GET() {
	const lista = [...(await etiquetasConPagina()).values()]
		.map((e) => ({ n: e.nombre, s: e.slug, t: e.total }))
		.sort((a, b) => a.n.localeCompare(b.n, 'es'));

	return new Response(JSON.stringify(lista), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}
