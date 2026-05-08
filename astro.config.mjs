// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import rehypeExternalLinks from 'rehype-external-links';
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
