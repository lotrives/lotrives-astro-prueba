import { closeSync, openSync, readSync } from 'node:fs';
import { join } from 'node:path';

// Google Discover pide imágenes de al menos 1200 px de ancho.
export const ANCHO_MINIMO_GRANDE = 1200;

const cache = new Map<string, number | null>();

/** Ancho de un WebP a partir de sus primeros bytes (VP8, VP8L o VP8X). */
export function anchoWebp(b: Uint8Array): number | null {
	const ascii = (i: number, n: number) => String.fromCharCode(...b.slice(i, i + n));
	if (b.length < 30 || ascii(0, 4) !== 'RIFF' || ascii(8, 4) !== 'WEBP') return null;
	const tipo = ascii(12, 4);
	if (tipo === 'VP8 ') {
		if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
		return (b[26] | (b[27] << 8)) & 0x3fff;
	}
	if (tipo === 'VP8L') {
		if (b[20] !== 0x2f) return null;
		return ((b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24)) & 0x3fff) + 1;
	}
	if (tipo === 'VP8X') {
		return 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
	}
	return null;
}

/**
 * Ancho en píxeles de una imagen WebP local de public/ (por ejemplo «/assets/images/x.webp»).
 * Devuelve null si la imagen no es local, no es WebP o no se puede leer.
 */
export function anchoImagenLocal(ruta: string): number | null {
	if (!ruta.startsWith('/') || ruta.startsWith('//') || ruta.includes('..')) return null;
	if (cache.has(ruta)) return cache.get(ruta)!;

	let ancho: number | null = null;
	try {
		const fd = openSync(join(process.cwd(), 'public', decodeURIComponent(ruta)), 'r');
		try {
			const buf = new Uint8Array(32);
			readSync(fd, buf, 0, 32, 0);
			ancho = anchoWebp(buf);
		} finally {
			closeSync(fd);
		}
	} catch {
		ancho = null;
	}
	cache.set(ruta, ancho);
	return ancho;
}
