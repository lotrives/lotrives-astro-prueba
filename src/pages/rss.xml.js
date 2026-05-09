import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { marked } from 'marked';

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

export async function GET(context) {
	const posts = await getCollection('blog');
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts
			.filter((p) => !p.data.draft)
			.sort((a, b) => new Date(b.data.pubDate) - new Date(a.data.pubDate))
			.map((post) => {
				const pid = post.id.replace(/\.md$/, '');
				const [y, m, d, ...r] = pid.split('-');
				const link = `/${y}/${m}/${d}/${r.join('-')}/`;
				return {
					title: post.data.title,
					pubDate: post.data.pubDate,
					description: post.data.description,
					content: marked(post.body),
					link,
				};
			}),
	});
}
