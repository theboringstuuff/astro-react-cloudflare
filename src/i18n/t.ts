// The texts of a page, in its language: `const t = i18n(lang, 'home')`, then
//   t('book')                                  a text
//   t('hero.title', { name: 'Ada' })            a text with its {{values}} filled in
//   t('stats.pages', { count: 3 })             the plural form of the language (3 pages, 3 страницы…)
//   t('principles.items')                      a whole block (a list), with the type of the reference file
// A third argument narrows to one block: `i18n(lang, 'common', 'footer')` reads t('address') for footer.address.
//
// The keys and what they return are typed from the reference language's files (src/locales/fr/): an unknown key is a type error in
// `pnpm run check`; the other languages are compared to it by `pnpm run i18n:check`. (i18next's own typing is not
// used: the language server behind `astro check` gives up on its generic types in .astro files.)
//
// The language is fixed for this page: never use the global `t` from 'i18next', whose language is shared by every
// page being rendered at the same time (two pages built or served together would mix their languages).
import i18next from 'i18next';
import type { Lang, Namespace } from './config';
import type about from '../locales/fr/about.json';
import type common from '../locales/fr/common.json';
import type home from '../locales/fr/home.json';

// one line per namespace (src/i18n/config.ts NAMESPACES), typed from the reference language's file
export type Resources = {
	about: typeof about;
	common: typeof common;
	home: typeof home;
};

// the plural forms (adults_one, adults_few…) are read through their base key: t('booking.adults', { count })
type PluralForm = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
type Base<K extends string> = K extends `${infer B}_${PluralForm}` ? B : K;

// every key of a block, down to its texts and lists (a list is read whole: its items are not keys)
export type Key<T> = T extends string | readonly unknown[]
	? never
	: { [K in keyof T & string]: Base<K> | (T[K] extends string | readonly unknown[] ? never : `${K}.${Key<T[K]>}`) }[keyof T & string];

// what a key returns: the reference value's type, or a text for a plural base key
type Value<T, K extends string> = K extends `${infer H}.${infer R}`
	? H extends keyof T
		? Value<T[H], R>
		: never
	: K extends keyof T
		? T[K]
		: string;

type Root<NS extends Namespace, P extends string | undefined> = P extends string ? Value<Resources[NS], P> : Resources[NS];

export function i18n<NS extends Namespace, P extends Key<Resources[NS]> | undefined = undefined>(lang: Lang, ns: NS, keyPrefix?: P) {
	const fixed = i18next.getFixedT(lang, ns, keyPrefix);
	// returnObjects: a block comes back whole, its texts filled in with the same values; a text comes back as a text
	return <K extends Key<Root<NS, P>>>(key: K, values?: Record<string, string | number>): Value<Root<NS, P>, K> =>
		fixed(key as string, { ...values, returnObjects: true }) as Value<Root<NS, P>, K>;
}
