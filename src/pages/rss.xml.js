import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { marked } from 'marked';

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
