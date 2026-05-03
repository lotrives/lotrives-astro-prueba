import { getCollection } from 'astro:content';

function stripMarkdown(value = '') {
	return String(value)
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`[^`]*`/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/#{1,6}\s+/g, ' ')
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/\*([^*]+)\*/g, '$1')
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

function postUrl(post) {
	return `${base}/${post.id.replace(/\.md$/, '').replace(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/, '$1/$2/$3/$4')}/`;
}

function noteUrl(note) {
	return `${base}/notas/${note.id.replace(/\.md$/, '')}/`;
}

function pageUrl(page) {
	return `${base}/${page.id.replace(/\.md$/, '')}/`;
}

export async function GET() {
	const [blogPosts, notes, pages] = await Promise.all([
		getCollection('blog'),
		getCollection('notes'),
		getCollection('pages'),
	]);

	const blogData = blogPosts
		.filter((p) => !p.data.draft)
		.sort((a, b) => new Date(b.data.pubDate) - new Date(a.data.pubDate))
		.map((post) => ({
			id: postUrl(post),
			title: post.data.title || '',
			url: postUrl(post),
			date: post.data.pubDate || '',
			excerpt: post.data.description || '',
			content: stripMarkdown(post.body || ''),
			tags: Array.isArray(post.data.tags) ? post.data.tags.join(', ') : '',
			type: 'post',
		}));

	const notesData = notes
		.sort((a, b) => new Date(b.data.pubDate) - new Date(a.data.pubDate))
		.map((note) => {
			const body = stripMarkdown(note.body || '');
			return {
				id: noteUrl(note),
				title: body.slice(0, 60) + (body.length > 60 ? '…' : ''),
				url: noteUrl(note),
				date: note.data.pubDate || '',
				excerpt: body.slice(0, 160),
				content: body,
				tags: '',
				type: 'nota',
			};
		});

	const pagesData = pages.map((page) => ({
		id: pageUrl(page),
		title: page.data.title || '',
		url: pageUrl(page),
		date: '',
		excerpt: page.data.description || '',
		content: stripMarkdown(page.body || ''),
		tags: '',
		type: 'página',
	}));

	const data = [...blogData, ...notesData, ...pagesData];

	return new Response(JSON.stringify(data, null, 2), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}
