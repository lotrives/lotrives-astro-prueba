import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';

export async function GET(context) {
	const notes = await getCollection('notes');
	return rss({
		title: 'Notas — Lotrives',
		description: 'Apuntes breves, observaciones y pensamientos a vuela pluma.',
		site: context.site,
		items: notes
			.sort((a, b) => new Date(b.data.pubDate) - new Date(a.data.pubDate))
			.map((note) => {
				const slug = note.id.replace(/\.md$/, '');
				const excerpt = note.body.replace(/[#*`>\-]/g, '').trim().slice(0, 200);
				return {
					title: excerpt.slice(0, 60) + (excerpt.length > 60 ? '…' : ''),
					pubDate: note.data.pubDate,
					description: excerpt,
					link: `/notas/${slug}/`,
				};
			}),
	});
}
