import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';

const SITE = 'https://lotrives.com';

const escapeHtml = (str) =>
	String(str)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');

const plainText = (body) =>
	body
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/[#*`>\-]/g, '')
		.replace(/\s+/g, ' ')
		.trim();

const markdownToFeedHtml = (body) => {
	const escaped = escapeHtml(body.trim());

	const withLinks = escaped.replace(
		/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
		'<a href="$2">$1</a>'
	);

	return `<p>${withLinks
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
					title: excerpt.slice(0, 60) + (excerpt.length > 60 ? '…' : ''),
					pubDate: note.data.pubDate,
					description: excerpt,
					content: markdownToFeedHtml(note.body),
					link: url,
					customData: `<guid isPermaLink="true">${url}</guid>`,
				};
			}),
	});
}
