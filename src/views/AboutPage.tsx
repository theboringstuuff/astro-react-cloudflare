import { useT, withPage } from '@/i18n/react';

function AboutPage() {
	const t = useT('about');

	return (
		<article className="mx-auto grid max-w-[90rem] gap-16 px-gutter pt-16 md:pt-32">
			<header className="grid max-w-[44rem] gap-8">
				<h1 className="text-display leading-[0.9] font-extrabold tracking-[-0.045em]">{t('title')}</h1>
				<p className="text-muted">{t('lead')}</p>
			</header>
			<div className="grid max-w-[44rem] gap-0">
				{t('sections').map((s, i) => (
					<section key={i} className="grid gap-2 border-t border-line py-8" data-reveal="">
						<h2 className="text-headline leading-none tracking-[-0.03em]">{s.title}</h2>
						<p className="text-muted [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-ink" dangerouslySetInnerHTML={{ __html: s.text }} />
					</section>
				))}
			</div>
		</article>
	);
}

export default withPage(AboutPage);
