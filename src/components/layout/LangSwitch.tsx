// The language switcher: a native <details> (opens, closes and works with the keyboard without JavaScript; closes on
// a click outside and on Escape through src/scripts/details.ts). Each language is written in its own language and
// leads to the same page in that language; the current one carries the dot.
import { LOCALES } from '@/i18n/config';
import { href, pathWithoutLang } from '@/i18n/routes';
import { useLang, usePage, useT } from '@/i18n/react';
import Dot from '@/components/ui/Dot';

export default function LangSwitch() {
	const { pathname } = usePage();
	const lang = useLang();
	const t = useT('common', 'lang');
	// the 404 has no copy in the other languages: its switcher leads to each language's home page
	const path = /^\/404\/?$/.test(pathWithoutLang(pathname)) ? '/' : pathWithoutLang(pathname);
	const current = LOCALES.find((l) => l.code === lang)!;

	return (
		<details className="group relative" data-dismiss="" data-lang-switch="">
			<summary
				className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full px-3 font-mono text-label tracking-[0.08em] uppercase select-none hover:bg-ink hover:text-paper [&::-webkit-details-marker]:hidden"
				// the name starts with the visible code, so a voice command naming what is on screen reaches it
				aria-label={`${lang.toUpperCase()} — ${t('label')} : ${current.name}`}
			>
				{lang}
				<svg className="size-3 transition-transform group-open:rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
					<path d="m2 4.5 4 4 4-4" />
				</svg>
			</summary>
			<ul className="absolute end-0 top-[calc(100%+0.5rem)] z-50 m-0 min-w-44 list-none border border-ink bg-paper p-2">
				{LOCALES.map((l) => (
					<li key={l.code}>
						<a
							className="flex min-h-11 items-center gap-3 px-3 no-underline hover:bg-ink hover:text-paper"
							href={href(l.code, path)}
							hrefLang={l.hreflang}
							lang={l.htmlLang}
							dir={l.dir}
							aria-current={l.code === lang ? 'true' : undefined}
							data-lang-choice={l.code}
						>
							{l.name}
							{l.code === lang && <Dot className="ms-auto" />}
						</a>
					</li>
				))}
			</ul>
		</details>
	);
}
