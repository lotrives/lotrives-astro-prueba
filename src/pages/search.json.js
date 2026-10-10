import { getCollection } from 'astro:content';
import { urlTexto, ordenarPublicados, sinBorradores } from '../utils/url';

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

function pageUrl(page) {
	return `${base}/${page.id.replace(/\.md$/, '')}/`;
}

export async function GET() {
	const [textos, pages] = await Promise.all([
		getCollection('blog'),
		getCollection('pages'),
	]);

	// Todos los textos con el mismo tipo: ya no se distingue entre artículo y nota.
	const blogData = ordenarPublicados(textos).map((post) => {
		const body = stripMarkdown(post.body || '');
		return {
			id: urlTexto(post),
			title: post.data.title || body.slice(0, 60) + (body.length > 60 ? '…' : ''),
			url: urlTexto(post),
			date: post.data.pubDate || '',
			excerpt: post.data.description || body.slice(0, 160),
			content: body,
			tags: Array.isArray(post.data.tags) ? post.data.tags.join(', ') : '',
			type: 'post',
		};
	});

	const pagesData = sinBorradores(pages).map((page) => ({
		id: pageUrl(page),
		title: page.data.title || '',
		url: pageUrl(page),
		date: '',
		excerpt: page.data.description || '',
		content: stripMarkdown(page.body || ''),
		tags: '',
		type: 'página',
	}));

	const data = [...blogData, ...pagesData];

	return new Response(JSON.stringify(data, null, 2), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}
