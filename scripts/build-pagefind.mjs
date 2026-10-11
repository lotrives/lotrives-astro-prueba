// Índice del buscador (/buscar/), construido con Pagefind sobre las páginas ya compiladas.
//
// Solo entran las páginas marcadas con data-pagefind-body: los textos (BlogPost.astro)
// y las páginas estáticas de src/content/pages/ (Page.astro). En esas plantillas se
// marca también qué se ignora (autor, fecha, pie de etiquetas, navegación), los datos
// para filtrar y ordenar, y los metadatos que se buscan con peso propio: título,
// etiquetas, entradilla y alias (los pesos se fijan al buscar, en buscar.astro).
//
// Este script añade a cada página, solo dentro del índice, variantes de los nombres con
// letras no latinas o con convenciones de transliteración distintas (Zelenski/Zelensky,
// Müller/Mueller), para que se encuentren se escriban como se escriban.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pagefind from 'pagefind';
import anyAscii from 'any-ascii';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const OUTPUT_DIR = path.join(DIST, 'pagefind');

// ---------------------------------------------------------------------------
// Alias de transliteración

function foldDiacritics(value) {
	return value.normalize('NFD').replace(/\p{M}+/gu, '');
}

function traditionalEuropeanVariant(word) {
	const replacements = new Map([
		['Ä', 'Ae'], ['ä', 'ae'],
		['Ö', 'Oe'], ['ö', 'oe'],
		['Ü', 'Ue'], ['ü', 'ue'],
		['Å', 'Aa'], ['å', 'aa'],
		['Đ', 'Dj'], ['đ', 'dj'],
		['Ð', 'Dh'], ['ð', 'dh'],
	]);

	let variant = word;
	for (const [from, to] of replacements) variant = variant.replaceAll(from, to);
	if (variant === word) return '';
	return anyAscii(variant);
}

// Devuelve un Map alias → palabra original (Hoss → Höß).
function buildAliases(text) {
	const words = text.match(/\p{L}+(?:['’.-]\p{L}+)*/gu) || [];
	const aliases = new Map();
	const add = (alias, word) => {
		if (!aliases.has(alias)) aliases.set(alias, word);
	};

	for (const word of new Set(words)) {
		if (/^[\x00-\x7F]+$/.test(word)) continue;

		const transliterated = anyAscii(word);
		const unicodeFolded = foldDiacritics(word);

		// Pagefind ya resuelve los diacríticos normales (á, ñ, ü…).
		// Solo se añade AnyAscii cuando aporta otra equivalencia (ł → l, ß → ss).
		if (
			transliterated &&
			transliterated !== word &&
			transliterated.toLowerCase() !== unicodeFolded.toLowerCase()
		) {
			add(transliterated, word);
		}

		if (transliterated) {
			// Sin apóstrofos de romanizaciones cirílicas.
			const simplified = transliterated.replace(/['’`´]/g, '').trim();
			if (
				simplified &&
				simplified !== transliterated &&
				simplified.toLowerCase() !== unicodeFolded.toLowerCase()
			) {
				add(simplified, word);
			}

			// Variante occidental frecuente: Zelenskiy → Zelensky, Sofiya → Sofia.
			const westernized = simplified.replace(/iy\b/gi, 'y').replace(/iya\b/gi, 'ia');
			if (
				westernized &&
				westernized !== simplified &&
				westernized.toLowerCase() !== unicodeFolded.toLowerCase()
			) {
				add(westernized, word);
			}
		}

		// Müller → Mueller, Đorđe → Djordje, Å… → Aa…
		const traditional = traditionalEuropeanVariant(word);
		if (
			traditional &&
			traditional !== word &&
			traditional.toLowerCase() !== transliterated.toLowerCase()
		) {
			add(traditional, word);
		}
	}

	return aliases;
}

// ---------------------------------------------------------------------------
// Utilidades

async function* htmlFiles(dir) {
	for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (full === OUTPUT_DIR) continue;
			yield* htmlFiles(full);
		} else if (entry.name.endsWith('.html')) {
			yield full;
		}
	}
}

function urlDe(file) {
	const rel = path.relative(DIST, file).split(path.sep).join('/');
	if (rel === 'index.html') return '/';
	if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
	return '/' + rel;
}

const decodeEntities = (s) =>
	s
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
		.replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

const escapeHtml = (s) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function textoVisible(html) {
	const body = html.match(/<body[\s\S]*<\/body>/i)?.[0] ?? html;
	return decodeEntities(
		body
			.replace(/<script[\s\S]*?<\/script>/gi, ' ')
			.replace(/<style[\s\S]*?<\/style>/gi, ' ')
			.replace(/<[^>]+>/g, ' '),
	);
}

// Hueco que dejan las plantillas para los alias: <span data-pagefind-alias></span>
// (Astro puede añadirle otros atributos).
const HUECO_ALIAS = /<span\b[^>]*\bdata-pagefind-alias\b[^>]*>\s*<\/span>/;

// ---------------------------------------------------------------------------
// Índice

await fs.rm(OUTPUT_DIR, { recursive: true, force: true });

const { index } = await pagefind.createIndex({
	forceLanguage: 'es',
	writePlayground: process.env.PAGEFIND_PLAYGROUND === '1',
});

if (!index) throw new Error('Pagefind no pudo crear el índice.');

let paginas = 0;
let aliasCount = 0;

// Tabla de equivalencias para la página de búsqueda: si alguien escribe «Hoss»,
// /buscar/ busca «Höß», de modo que el fragmento y el resaltado marcan la palabra real.
const TABLA_ALIAS = path.join(DIST, 'buscar-alias.json');
const tablaAlias = {};
// Palabras que sí aparecen escritas en algún texto: esas no se sustituyen nunca.
const palabrasReales = new Set();

try {
	for await (const file of htmlFiles(DIST)) {
		const html = await fs.readFile(file, 'utf8');
		if (!/\bdata-pagefind-body\b/.test(html)) continue;

		const texto = textoVisible(html);
		for (const p of texto.match(/\p{L}+/gu) || []) palabrasReales.add(foldDiacritics(p).toLowerCase());
		const aliases = buildAliases(texto);
		aliasCount += aliases.size;
		for (const [alias, original] of aliases) {
			const clave = alias.toLowerCase();
			// Las variantes muy cortas («o») confundirían más que ayudarían.
			if (clave.length >= 3 && !(clave in tablaAlias)) tablaAlias[clave] = original;
		}

		const content = HUECO_ALIAS.test(html)
			? html.replace(
					HUECO_ALIAS,
					`<span data-pagefind-meta="alias">${escapeHtml([...aliases.keys()].join(' '))}</span>`,
				)
			: html;

		const url = urlDe(file);
		const { errors } = await index.addHTMLFile({ url, content });
		if (errors?.length) throw new Error(`Error indexando ${url}: ${errors.join('; ')}`);
		paginas++;
	}

	if (paginas === 0) {
		throw new Error('No se encontró ninguna página con data-pagefind-body: el buscador quedaría vacío.');
	}

	const { errors } = await index.writeFiles({ outputPath: OUTPUT_DIR });
	if (errors?.length) throw new Error(`Error escribiendo el índice: ${errors.join('; ')}`);

	for (const clave of Object.keys(tablaAlias)) {
		if (palabrasReales.has(clave)) delete tablaAlias[clave];
	}
	await fs.writeFile(TABLA_ALIAS, JSON.stringify(tablaAlias));
} finally {
	await pagefind.close();
}

console.log(`Páginas indexadas: ${paginas}`);
console.log(`Alias adicionales generados: ${aliasCount} (tabla para /buscar/: ${Object.keys(tablaAlias).length})`);
console.log('Índice Pagefind creado en dist/pagefind/');
