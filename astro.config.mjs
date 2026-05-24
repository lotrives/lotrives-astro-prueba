// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import { visit } from 'unist-util-visit';

const SITE = 'https://lotrives.com';

const rehypeFixExternalLinks = () => (tree) => {
	visit(tree, 'element', (node) => {
		if (
			node.tagName === 'a' &&
			node.properties?.href &&
			typeof node.properties.href === 'string' &&
			/^https?:\/\//.test(node.properties.href) &&
			!node.properties.href.startsWith(SITE)
		) {
			node.properties.target = '_blank';
			node.properties.rel = ['noopener', 'noreferrer'];
		}
	});
};

export default defineConfig({
	site: SITE,
	base: '/',
	integrations: [mdx(), sitemap()],
	markdown: {
		rehypePlugins: [
			[rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
			rehypeFixExternalLinks,
			rehypeSlug,
			[rehypeAutolinkHeadings, {
				behavior: 'prepend',
				properties: { class: 'heading-anchor', 'aria-label': 'Copiar enlace' },
				content: {
					type: 'element',
					tagName: 'svg',
					properties: {
						xmlns: 'http://www.w3.org/2000/svg',
						viewBox: '0 0 24 24',
						width: '20',
						height: '20',
						fill: 'none',
						stroke: 'currentColor',
						'stroke-width': '2',
						'stroke-linecap': 'round',
						'stroke-linejoin': 'round',
						'aria-hidden': 'true',
					},
					children: [
						{ type: 'element', tagName: 'path', properties: { d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' }, children: [] },
						{ type: 'element', tagName: 'path', properties: { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' }, children: [] },
					],
				},
				test: ['h2', 'h3', 'h4'],
			}],
		],
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
