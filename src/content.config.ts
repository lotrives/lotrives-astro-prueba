import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		last_modified_at: z.coerce.date().optional(),
		draft: z.boolean().optional(),
		canonical: z.string().optional(),
		tags: z.array(z.string()).optional(),
	}),
});

const notes = defineCollection({
	loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		pubDate: z.coerce.date(),
		heroImage: z.string().optional(),
		last_modified_at: z.coerce.date().optional(),
		draft: z.boolean().optional(),
		canonical: z.string().optional(),
		tags: z.array(z.string()).optional(),
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

export const collections = { blog, notes, pages };
