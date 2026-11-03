// The opening of the home page. The title is the LCP element: plain text in the HTML, in the preloaded font, never
// animated in (an entrance would delay the LCP by its own duration).
import { href } from '@/i18n/routes';
import { useLang, useT } from '@/i18n/react';
import ButtonLink from '@/components/ui/ButtonLink';
import Dot from '@/components/ui/Dot';

export default function Hero() {
	const lang = useLang();
	const t = useT('home', 'hero');

	return (
		<section className="mx-auto grid max-w-[90rem] gap-8 px-gutter pt-16 pb-16 md:pt-32">
			<p className="flex items-center gap-2 font-mono text-label tracking-[0.08em] text-muted uppercase">
				<Dot />
				{t('label')}
			</p>
			<h1
				className="max-w-[14ch] text-display leading-[0.9] font-extrabold tracking-[-0.045em] [&_em]:bg-signal [&_em]:px-[0.08em] [&_em]:not-italic [&_em]:[box-decoration-break:clone]"
				dangerouslySetInnerHTML={{ __html: t('title') }}
			/>
			<p className="max-w-[38rem] text-muted">{t('lead')}</p>
			<div className="flex flex-wrap items-center gap-6">
				<ButtonLink href={href(lang, '/about')}>{t('cta')} →</ButtonLink>
				{/* the number is true by default: `pnpm check:perf` fails the build when a page ships JavaScript over budget */}
				<span className="font-mono text-label tracking-[0.08em] uppercase">{t('js', { count: 0 })}</span>
			</div>
		</section>
	);
}
