// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import { visit } from 'unist-util-visit';
import { unified } from '@astrojs/markdown-remark';
import { readdirSync, readFileSync } from 'node:fs';

const SITE = 'https://lotrives.com';

// lastmod del sitemap para cada texto: updatedDate si existe; si no, webDate;
// si no, pubDate. Se lee del frontmatter de src/content/blog/ con la misma
// regla de direcciones que src/utils/url.ts. Las páginas sin fecha no llevan lastmod.
const sinBarraFinal = (u) => u.replace(/\/+$/, '');
const fechasSitemap = (() => {
	const dir = new URL('./src/content/blog/', import.meta.url);
	const mapa = new Map();
	for (const archivo of readdirSync(dir)) {
		if (!/\.mdx?$/.test(archivo)) continue;
		const id = archivo.replace(/\.mdx?$/, '');
		const fm = readFileSync(new URL(archivo, dir), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
		if (!fm) continue;
		const campo = (nombre) => {
			const m = fm[1].match(new RegExp(`^${nombre}:\\s*["']?([^"'\\r\\n]+?)["']?\\s*$`, 'm'));
			if (!m) return undefined;
			const d = new Date(m[1]);
			return isNaN(d.valueOf()) ? undefined : d;
		};
		if (/^draft:\s*true\s*$/m.test(fm[1])) continue;
		const fecha = campo('updatedDate') ?? campo('webDate') ?? campo('pubDate');
		if (!fecha) continue;
		let ruta;
		const fechado = id.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
		if (/^\d{8}-\d{4}$/.test(id)) ruta = `notas/${id}`;
		else if (fechado) ruta = `${fechado[1]}/${fechado[2]}/${fechado[3]}/${fechado[4]}`;
		else continue;
		mapa.set(sinBarraFinal(`${SITE}/${ruta}`), fecha.toISOString());
	}
	return mapa;
})();

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

const rehypeTranslateFootnoteLabel = () => (tree) => {
	visit(tree, 'element', (node) => {
		if (node.tagName === 'h2' && node.properties?.id === 'footnote-label') {
			visit(node, 'text', (textNode) => {
				if (textNode.value === 'Footnotes') {
					textNode.value = 'Notas';
				}
			});
		}
	});
};

export default defineConfig({
	site: SITE,
	base: '/',
	integrations: [mdx(), sitemap({
		filter: (page) => !page.includes("/blog/") && !page.includes("/etiquetas-substack/") && !page.endsWith("/notas/"),
		serialize: (item) => {
			const lastmod = fechasSitemap.get(sinBarraFinal(item.url));
			return lastmod ? { ...item, lastmod } : item;
		},
	})],
	markdown: {
		processor: unified({
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
			rehypeTranslateFootnoteLabel,
		],
		}),
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'SourceSerif4',
			cssVariable: '--font-source-serif',
			fallbacks: ['serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/sourceserif4-regular.ttf'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/sourceserif4-bold.ttf'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/sourceserif4-italic.ttf'],
						weight: 400,
						style: 'italic',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/sourceserif4-semibold.ttf'],
						weight: 600,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
