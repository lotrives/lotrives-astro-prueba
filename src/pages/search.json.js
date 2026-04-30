import { getCollection } from 'astro:content';

function stripHtml(value = '') {
	return String(value)
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function postUrl(post) {
	return `/blog/${post.id.replace(/\.md$/, '').replace(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/, '$1/$2/$3/$4')}/`;
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
			const url = postUrl(post);

			return {
				id: url,
				title,
				url,
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
