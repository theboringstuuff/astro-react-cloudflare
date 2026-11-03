// The header: the wordmark, the menu and the language switcher. Plain links, no script, no menu to open: with two or
// three entries a hamburger costs more than it saves. Grow it into a <details data-dismiss> menu when the menu grows.
import { NAV } from '@/data/site';
import { href, pathWithoutLang } from '@/i18n/routes';
import { useLang, usePage, useT, withPage } from '@/i18n/react';
import Dot from '@/components/ui/Dot';
import LangSwitch from './LangSwitch';

function SiteHeader() {
	const lang = useLang();
	const { pathname } = usePage();
	const t = useT('common');
	const here = pathWithoutLang(pathname);

	return (
		<header className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-gutter py-4">
			<a className="flex items-center gap-2 text-xl font-extrabold tracking-[-0.03em] no-underline" href={href(lang, '/')}>
				<Dot className="size-3" />
				{t('meta.brand')}
			</a>
			<div className="flex items-center gap-1">
				<nav aria-label={t('nav.label')}>
					<ul className="m-0 flex list-none items-center gap-1 p-0">
						{NAV.map((item) => {
							const current = href(lang, item.href) === href(lang, here);
							return (
								<li key={item.key}>
									<a
										className="flex min-h-11 items-center gap-2 rounded-full px-3 no-underline hover:bg-ink hover:text-paper"
										href={href(lang, item.href)}
										aria-current={current ? 'page' : undefined}
									>
										{current && <Dot />}
										{t(`nav.${item.key}`)}
									</a>
								</li>
							);
						})}
					</ul>
				</nav>
				<LangSwitch />
			</div>
		</header>
	);
}

export default withPage(SiteHeader);
