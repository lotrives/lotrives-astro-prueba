import { getCollection } from 'astro:content';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export async function GET() {
	const pages = await getCollection('pages');
	const cwd = process.cwd();
	
	const debug = pages.map((page) => {
		const id = page.id;
		const path1 = resolve(cwd, 'src/content/pages', id);
		const path2 = resolve(cwd, 'src/content/pages', id + '.md');
		return {
			id,
			path1,
			path2,
			exists1: existsSync(path1),
			exists2: existsSync(path2),
			bodyLen: (page.body || '').length,
		};
	});

	return new Response(JSON.stringify(debug, null, 2), {
		headers: { 'Content-Type': 'application/json' },
	});
}
