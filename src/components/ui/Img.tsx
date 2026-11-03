// <Image> from astro:assets, for React: one optimised <img> (see images.ts).
import { use, type ImgHTMLAttributes } from 'react';
import { optimise, type Transform } from './images';

type Props = Transform & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'width' | 'height' | 'sizes'> & { alt: string };

export default function Img({ src, format, width, height, widths, densities, sizes, quality, fit, ...attributes }: Props) {
	const image = use(optimise({ src, format, width, height, widths, densities, sizes, quality, fit }));
	const { width: w, height: h, sizes: s } = image.attributes as { width?: number; height?: number; sizes?: string };
	return (
		<img
			src={image.src}
			srcSet={image.srcSet.values.length > 0 ? image.srcSet.attribute : undefined}
			width={w}
			height={h}
			sizes={s}
			loading="lazy"
			decoding="async"
			{...attributes}
		/>
	);
}
