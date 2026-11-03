// <Picture> from astro:assets, for React: one <source> per format, and an <img> in the source's own format as the
// fallback (see images.ts). Its class goes on the <img>, as with Astro's component.
import { use, type ImgHTMLAttributes } from 'react';
import type { ImageOutputFormat } from 'astro';
import { fallbackFormat, mime, optimise, type Transform } from './images';

type Props = Omit<Transform, 'format'> &
	Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'width' | 'height' | 'sizes'> & {
		alt: string;
		formats?: ImageOutputFormat[];
	};

export default function Picture({ src, formats = ['webp'], width, height, widths, densities, sizes, quality, fit, ...attributes }: Props) {
	const transform = { src, width, height, widths, densities, sizes, quality, fit };
	const sources = formats.map((format) => ({ format, image: use(optimise({ ...transform, format })) }));
	const fallback = use(optimise({ ...transform, format: fallbackFormat(src) }));
	const { width: w, height: h } = fallback.attributes as { width?: number; height?: number };
	return (
		<picture>
			{sources.map(({ format, image }) => (
				<source
					key={format}
					srcSet={densities || !widths ? `${image.src}${image.srcSet.values.length > 0 ? ', ' + image.srcSet.attribute : ''}` : image.srcSet.attribute}
					type={mime(format)}
					sizes={sizes}
				/>
			))}
			<img
				src={fallback.src}
				srcSet={fallback.srcSet.values.length > 0 ? fallback.srcSet.attribute : undefined}
				width={w}
				height={h}
				sizes={sizes}
				loading="lazy"
				decoding="async"
				{...attributes}
			/>
		</picture>
	);
}
