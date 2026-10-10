import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { marked } from 'marked';
import { urlTexto, ordenarPublicados, descripcionDe } from '../utils/url';

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

// Feed único con todos los textos (antiguos artículos y notas).
// notas-feed.xml sirve exactamente lo mismo, para no dejar sin feed a quien lo tenía.
export async function GET(context) {
	const posts = ordenarPublicados(await getCollection('blog'));
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.pubDate,
			description: descripcionDe(post),
			// Rutas locales («/assets/...») a absolutas, como hacía el feed de notas.
			content: marked(post.body).replace(/(src|href)="\/(?!\/)/g, `$1="${new URL('/', context.site).href}`),
			link: urlTexto(post),
		})),
	});
}
