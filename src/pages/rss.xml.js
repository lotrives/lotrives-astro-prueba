import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { marked } from 'marked';
import { urlTexto, ordenarNovedades, fechaNovedad, descripcionDe } from '../utils/url';

marked.use({ extensions: [
	{
		name: 'footnote',
		level: 'block',
		start(src) { return src.indexOf('\n[^'); },
		tokenizer(src) {
			const match = src.match(/^\[\^([^\]]+)\]:\s*([^\n]+)/);
			if (match) return { type: 'footnote', raw: match[0], id: match[1], text: match[2] };
		},
		renderer(token) {
			return `<p id="fn-${token.id}"><sup>${token.id}</sup> ${token.text}</p>`;
		}
	},
	{
		name: 'footnoteRef',
		level: 'inline',
		start(src) { return src.indexOf('[^'); },
		tokenizer(src) {
			const match = src.match(/^\[\^([^\]]+)\]/);
			if (match) return { type: 'footnoteRef', raw: match[0], id: match[1] };
		},
		renderer(token) {
			return `<sup><a href="#fn-${token.id}">${token.id}</a></sup>`;
		}
	}
] });

// Feed único con los últimos textos (antiguos artículos y notas).
// notas-feed.xml sirve exactamente lo mismo, para no dejar sin feed a quien lo tenía.
//
// - Solo las últimas ENTRADAS_FEED, por fecha de novedad (webDate o pubDate):
//   una crónica antigua subida ahora entra como novedad; una corrección
//   (updatedDate) no la vuelve a enviar.
// - Texto completo, con rutas y anclas convertidas a direcciones absolutas.

const ENTRADAS_FEED = 20;
const AUTOR = 'José Manuel Grau Navarro';

const esc = (t) => String(t)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;');

export async function GET(context) {
	const raiz = new URL('/', context.site).href;
	const posts = ordenarNovedades(await getCollection('blog')).slice(0, ENTRADAS_FEED);
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		xmlns: {
			atom: 'http://www.w3.org/2005/Atom',
			dc: 'http://purl.org/dc/elements/1.1/',
		},
		customData: [
			'<language>es</language>',
			`<atom:link href="${esc(new URL('rss.xml', context.site).href)}" rel="self" type="application/rss+xml"/>`,
			`<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
			`<image><url>${esc(new URL('apple-touch-icon.png', context.site).href)}</url><title>${esc(SITE_TITLE)}</title><link>${esc(raiz)}</link></image>`,
		].join(''),
		items: posts.map((post) => {
			const enlace = new URL(urlTexto(post), context.site).href;
			return {
				title: post.data.title,
				pubDate: fechaNovedad(post),
				description: descripcionDe(post),
				content: marked(post.body)
					// Rutas locales («/assets/...») a absolutas.
					.replace(/(src|href)="\/(?!\/)/g, `$1="${raiz}`)
					// Anclas internas («#fn-1») a la dirección completa del texto,
					// para que las notas al pie funcionen en cualquier lector.
					.replace(/href="#/g, `href="${enlace}#`),
				link: urlTexto(post),
				categories: post.data.tags ?? [],
				customData: `<dc:creator>${esc(post.data.author || AUTOR)}</dc:creator>`,
			};
		}),
	});
}
