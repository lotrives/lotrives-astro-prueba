import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

const escapeHtml = (str) =>
	String(str)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');

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
					content: markdownToFeedHtml(post.body),
					link,
				};
			}),
	});
}
