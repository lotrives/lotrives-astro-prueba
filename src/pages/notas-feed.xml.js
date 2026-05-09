import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';

const SITE = 'https://lotrives.com';

const plainText = (body) =>
	body
		.replace(/!\[[^\]]*\]\([^)]+\)/g, '')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/[#*`>\-]/g, '')
		.replace(/\s+/g, ' ')
		.trim();

const markdownToFeedHtml = (body) => {
	let html = body.trim();

	// Imágenes (antes que los enlaces)
	html = html.replace(
		/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g,
		'<img src="$2" alt="$1" style="max-width:100%">'
	);

	// Cursivas y negritas
	html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

	// Enlaces Markdown
	html = html.replace(
		/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
		'<a href="$2">$1</a>'
	);

	// Párrafos
	return `<p>${html
		.replace(/\n{2,}/g, '</p><p>')
		.replace(/\n/g, '<br />')}</p>`;
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
