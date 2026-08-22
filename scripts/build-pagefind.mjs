import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as pagefind from 'pagefind';
import anyAscii from 'any-ascii';

const SEARCH_JSON = new URL('../dist/search.json', import.meta.url);
const OUTPUT_DIR_URL = new URL('../dist/pagefind/', import.meta.url);
const OUTPUT_DIR = fileURLToPath(OUTPUT_DIR_URL);

const MONTHS = [
	'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
	'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const MONTHS_SHORT = [
	'ene', 'feb', 'mar', 'abr', 'may', 'jun',
	'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

const TYPE_LABELS = {
	post: 'artículo',
	nota: 'nota',
	'página': 'página',
};

function foldDiacritics(value) {
	return value
		.normalize('NFD')
		.replace(/\p{M}+/gu, '');
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

	for (const [from, to] of replacements) {
		variant = variant.replaceAll(from, to);
	}

	if (variant === word) return '';

	return anyAscii(variant);
}

function buildAliases(values) {
	const text = values.filter(Boolean).join(' ');
	const words = text.match(/\p{L}+(?:['’.-]\p{L}+)*/gu) || [];
	const aliases = new Set();

	for (const word of new Set(words)) {
		if (/^[\x00-\x7F]+$/.test(word)) continue;

		const transliterated = anyAscii(word);
		const unicodeFolded = foldDiacritics(word);

		// Pagefind ya resuelve los diacríticos Unicode normales.
		// Solo añadimos AnyAscii cuando aporta una equivalencia adicional.
		if (
			transliterated &&
			transliterated !== word &&
			transliterated.toLowerCase() !== unicodeFolded.toLowerCase()
		) {
			aliases.add(transliterated);
		}

		// Variante sin apóstrofos de romanizaciones cirílicas.
		if (transliterated) {
			const simplified = transliterated
				.replace(/['’`´]/g, '')
				.trim();

			if (
				simplified &&
				simplified !== transliterated &&
				simplified.toLowerCase() !== unicodeFolded.toLowerCase()
			) {
				aliases.add(simplified);
			}

			// Variante occidental frecuente: Dostoevskiy → Dostoevsky,
			// Zelenskiy → Zelensky, Sofiya → Sofia.
			const westernized = simplified
				.replace(/iy\b/gi, 'y')
				.replace(/iya\b/gi, 'ia');

			if (
				westernized &&
				westernized !== simplified &&
				westernized.toLowerCase() !== unicodeFolded.toLowerCase()
			) {
				aliases.add(westernized);
			}
		}

		// Algunas convenciones europeas admiten otra romanización habitual:
		// Müller → Mueller, Đorđe → Djordje, Å… → Aa…
		const traditional = traditionalEuropeanVariant(word);

		if (
			traditional &&
			traditional !== word &&
			traditional.toLowerCase() !== transliterated.toLowerCase()
		) {
			aliases.add(traditional);
		}
	}

	return [...aliases];
}

function formatDateForSearch(raw) {
	if (!raw) {
		return {
			iso: '',
			search: '',
		};
	}

	const iso = String(raw);
	const date = new Date(iso);

	if (Number.isNaN(date.getTime())) {
		return {
			iso,
			search: iso,
		};
	}

	const day = date.getUTCDate();
	const month = date.getUTCMonth();
	const year = date.getUTCFullYear();

	return {
		iso,
		search: [
			`${day} de ${MONTHS[month]} de ${year}`,
			`${day} ${MONTHS_SHORT[month]} ${year}`,
			String(year),
		].join(' '),
	};
}

function splitTags(tags) {
	if (!tags) return [];

	return String(tags)
		.split(', ')
		.map((tag) => tag.trim())
		.filter(Boolean);
}

const records = JSON.parse(
	await fs.readFile(SEARCH_JSON, 'utf8')
);

await fs.rm(OUTPUT_DIR_URL, {
	recursive: true,
	force: true,
});

const { index } = await pagefind.createIndex({
	forceLanguage: 'es',
	writePlayground: process.env.PAGEFIND_PLAYGROUND === '1',
});

if (!index) {
	throw new Error('Pagefind no pudo crear el índice.');
}

let aliasCount = 0;

try {
	for (const record of records) {
		const aliases = buildAliases([
			record.title,
			record.excerpt,
			record.content,
			record.tags,
		]);

		aliasCount += aliases.length;

		const type = TYPE_LABELS[record.type] || record.type || '';
		const date = formatDateForSearch(record.date);
		const tags = splitTags(record.tags);

		const meta = {
			title: record.title || '',
			excerpt: record.excerpt || '',
			tags: record.tags || '',
			type,
			date: date.search,
			date_iso: date.iso,
			alias: aliases.join(' '),
		};

		const filters = {
			type: type ? [type] : [],
			tags,
		};

		const sort = date.iso
			? { date: date.iso }
			: {};

		const { errors } = await index.addCustomRecord({
			url: record.url,
			content: record.content || record.excerpt || '',
			language: 'es',
			meta,
			filters,
			sort,
		});

		if (errors?.length) {
			throw new Error(
				`Error indexando ${record.url}: ${errors.join('; ')}`
			);
		}
	}

	const { errors } = await index.writeFiles({
		outputPath: OUTPUT_DIR,
	});

	if (errors?.length) {
		throw new Error(
			`Error escribiendo el índice: ${errors.join('; ')}`
		);
	}
} finally {
	await pagefind.close();
}

console.log(`Registros indexados: ${records.length}`);
console.log(`Alias adicionales generados: ${aliasCount}`);
console.log('Índice Pagefind creado en dist/pagefind/');
