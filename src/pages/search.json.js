import { getCollection } from 'astro:content';

function stripHtml(value = '') {
	return String(value)
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export async function GET() {
	const posts = await getCollection('blog');

	const data = posts
		.sort((a, b) => new Date(b.data.pubDate) - new Date(a.data.pubDate))
		.map((post) => {
			const title = post.data.title || '';
			const description = post.data.description || '';
			const body = stripHtml(post.body || '');
			const tags = Array.isArray(post.data.tags) ? post.data.tags.join(', ') : '';

			return {
				id: `/blog/${post.slug}/`,
				title,
				url: `/blog/${post.slug}/`,
				date: post.data.pubDate || '',
				excerpt: description,
				content: body,
				tags,
			};
		});

	return new Response(JSON.stringify(data, null, 2), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
		},
	});
}
