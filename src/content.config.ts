import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Esquemas estrictos: un campo que no esté declarado aquí (una errata como
// «webdate», o un campo antiguo como «canonical» o «last_modified_at») hace
// fallar la compilación con el nombre del archivo y del campo, en vez de
// ignorarse en silencio.

// Una sola colección para todos los textos (antes «blog» y «notes»).
// Las fechas admiten fecha sola (2026-10-10) o fecha y hora ("2026-10-10T21:30:00").
const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: z.strictObject({
		title: z.string(),
		description: z.string().optional(),
		// Fecha original del texto: la que se muestra y ordena el Archivo.
		pubDate: z.coerce.date(),
		// Solo para textos antiguos subidos ahora: cuándo llegó el texto a lotrives.com.
		// Ordena y fecha el texto en la portada y en el feed; no se muestra.
		webDate: z.coerce.date().optional(),
		// Cambio real de contenido: «Actualizado el…» y lastmod del sitemap.
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		draft: z.boolean().optional(),
		tags: z.array(z.string()).optional(),
		author: z.string(),
	}),
});

const pages = defineCollection({
	loader: glob({ base: './src/content/pages', pattern: '**/*.{md,mdx}' }),
	schema: z.strictObject({
		title: z.string(),
		description: z.string().optional(),
		tags: z.array(z.string()).optional(),
		draft: z.boolean().optional(),
	}),
});

export const collections = { blog, pages };
