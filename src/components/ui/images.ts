// The images of the React components, optimised by Astro at build time (astro:assets), as <Image> and <Picture> did.
// getImage() is asynchronous and a React component is not: each image is resolved once, cached by its options, and
// read with React's use(). The server render waits for it (Astro reads the whole stream), so the HTML holds the final
// <img>, with no placeholder.
import { use } from 'react';
import { getImage } from 'astro:assets';
import type { GetImageResult, ImageOutputFormat, UnresolvedImageTransform } from 'astro';

export interface Transform {
	src: ImageMetadata;
	format?: ImageOutputFormat;
	width?: number;
	height?: number;
	widths?: number[];
	densities?: number[];
	sizes?: string;
	quality?: number;
	fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

const cache = new Map<string, Promise<GetImageResult>>();

/** One optimised image, the same promise for the same options (React's use() needs a stable promise). */
export function optimise(options: Transform): Promise<GetImageResult> {
	// the options left unset are left out, as when they are not written on Astro's components
	const set = Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined)) as Transform;
	const { src, ...rest } = set;
	const key = JSON.stringify([src.src, rest]);
	let hit = cache.get(key);
	if (!hit) {
		// Transform is the part of Astro's options these components use: widths and densities are never both set
		hit = getImage(set as UnresolvedImageTransform);
		cache.set(key, hit);
	}
	return hit;
}

/** The optimised image inside a component, for an <img> written by hand (src, srcSet.attribute, attributes). */
export const useImage = (options: Transform) => use(optimise(options));

// a JPEG, a GIF or an SVG keeps its own format as the fallback of a <picture>; anything else falls back to PNG
// (the rule of Astro's <Picture>)
export const fallbackFormat = (src: ImageMetadata): ImageOutputFormat =>
	(['gif', 'svg', 'jpg', 'jpeg'] as string[]).includes(src.format) ? (src.format as ImageOutputFormat) : 'png';

const MIME: Record<string, string> = { avif: 'image/avif', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', svg: 'image/svg+xml' };
export const mime = (format: string) => MIME[format] ?? `image/${format}`;
