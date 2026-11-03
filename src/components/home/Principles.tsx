import { useT } from '@/i18n/react';

export default function Principles() {
	const t = useT('home', 'principles');

	return (
		<section className="mx-auto max-w-[90rem] px-gutter py-16 md:py-32" aria-labelledby="principles">
			<h2 id="principles" className="mb-8 text-headline leading-none tracking-[-0.03em]">
				{t('title')}
			</h2>
			<ol className="m-0 grid list-none gap-0 p-0 md:grid-cols-3">
				{t('items').map((item, i) => (
					<li key={i} className="grid gap-2 border-t border-line py-8 md:pe-8" data-reveal="">
						<span className="font-mono text-label text-muted">0{i + 1}</span>
						<h3 className="text-xl tracking-[-0.02em]">{item.title}</h3>
						<p className="text-muted">{item.text}</p>
					</li>
				))}
			</ol>
		</section>
	);
}
