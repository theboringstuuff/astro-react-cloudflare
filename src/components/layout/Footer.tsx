import { SITE } from '@/data/site';
import { useT, withPage } from '@/i18n/react';

function Footer() {
	const t = useT('common');
	return (
		<footer className="mx-auto mt-32 flex max-w-[90rem] flex-wrap items-baseline justify-between gap-4 border-t border-line px-gutter py-8 font-mono text-label tracking-[0.08em] text-muted uppercase">
			<p>{t('footer.made')}</p>
			{SITE.sourceUrl && (
				<a className="underline-offset-4 hover:text-ink" href={SITE.sourceUrl} target="_blank" rel="noopener">
					{t('footer.source')}
					<span className="sr-only"> {t('newTab')}</span>
				</a>
			)}
		</footer>
	);
}

export default withPage(Footer);
