import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Una sola colección para todos los textos (antes «blog» y «notes»).
// pubDate admite fecha sola (2026-10-10) o fecha y hora ("2026-10-10T21:30:00").
const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		draft: z.boolean().optional(),
		canonical: z.string().optional(),
		tags: z.array(z.string()).optional(),
		author: z.string(),
	}),
});

const pages = defineCollection({
	loader: glob({ base: './src/content/pages', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		permalink: z.string().optional(),
		layout: z.string().optional(),
		tags: z.array(z.string()).optional(),
		canonical: z.string().optional(),
		draft: z.boolean().optional(),
	}),
});

export const collections = { blog, pages };
