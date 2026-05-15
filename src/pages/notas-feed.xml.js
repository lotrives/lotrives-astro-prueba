import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';

const SITE = 'https://lotrives.com';

const plainText = (body) =>
	body
		.replace(/<[^>]+>/g, '')
		.replace(/!\[[^\]]*\]\([^)]+\)/g, '')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/[#*`>\-]/g, '')
		.replace(/_/g, '')
		.replace(/\s+/g, ' ')
		.trim();

const markdownToFeedHtml = (body) => {
	const lines = body.trim().split('\n');
	const output = [];
	let inBlockquote = false;

	for (const line of lines) {
		if (line.startsWith('>') ) {
			const inner = line.replace(/^>\s?/, '');
			if (!inBlockquote) {
				output.push('<blockquote>');
				inBlockquote = true;
			}
			if (inner !== '') output.push(inner);
		} else {
			if (inBlockquote) {
				output.push('</blockquote>');
				inBlockquote = false;
			}
			output.push(line);
		}
	}
	if (inBlockquote) output.push('</blockquote>');

	let html = output.join('\n');

	// Rutas de imagen locales → absolutas
	html = html.replace(/!\[([^\]]*)\]\((\/[^)]+)\)/g, `![$1](https://lotrives.com$2)`);

	// Imágenes
	html = html.replace(
		/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g,
		'<img src="$2" alt="$1" style="max-width:100%">'
	);

	// Negritas
	html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

	// Cursivas con asterisco
	html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

	// Cursivas con guión bajo
	html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');

	// Encabezados ### → <h3>
	html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');

	// Encabezados ## → <h2>
	html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');

	// Enlaces
	html = html.replace(
		/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
		'<a href="$2">$1</a>'
	);

	// Párrafos (fuera de blockquotes)
	html = html
		.replace(/(<\/blockquote>)\n/g, '$1')
		.replace(/\n(<blockquote>)/g, '$1')
		.replace(/([^>])\n{2,}/g, '$1</p><p>')
		.replace(/([^>])\n/g, '$1<br />')
		.replace(/<br \/>(\s*<h[23]>)/g, '$1')
		.replace(/(<h[23]>[^<]*<\/h[23]>)\s*<br \/>/g, '$1');

	return `<p>${html}</p>`;
};

export async function GET(context) {
	const notes = await getCollection('notes');

	return rss({
		title: 'Notas — Lotrives',
		description: 'Apuntes breves, observaciones y pensamientos a vuela pluma.',
		site: context.site ?? SITE,
		items: notes
			.sort((a, b) => new Date(b.data.pubDate) - new Date(a.data.pubDate))
			.map((note) => {
				const slug = note.id.replace(/\.md$/, '');
				const url = `${SITE}/notas/${slug}/`;
				const excerpt = plainText(note.body).slice(0, 200);

				return {
					title: note.data.title,
					pubDate: note.data.pubDate,
					description: excerpt,
					content: markdownToFeedHtml(note.body),
					link: url,
					customData: `<guid isPermaLink="true">${url}</guid>`,
				};
			}),
	});
}
