// The page being rendered, for the React components: its language and its address.
// A view (src/views) or a layout component rendered by an .astro file is the root of its own React tree: it is
// exported through withPage(), so it takes `lang` and `pathname` as props from the .astro file, and every component
// below reads them back with the hooks here instead of passing them down by hand.
import { createContext, use, type ComponentType, type ReactNode } from 'react';
import type { Lang, Namespace } from './config';
import { i18n, type Key, type Resources } from './t';

export interface PageProps {
	lang: Lang;
	/** the address of the page, with its language: Astro.url.pathname */
	pathname: string;
}

const PageContext = createContext<PageProps | null>(null);

export function PageScope({ lang, pathname, children }: PageProps & { children: ReactNode }) {
	return <PageContext value={{ lang, pathname }}>{children}</PageContext>;
}

/** A component rendered by an .astro file: `<HomePage lang={lang} pathname={Astro.url.pathname} />`. */
export function withPage<P extends object>(Component: ComponentType<P>) {
	const Root = ({ lang, pathname, ...props }: P & PageProps) => (
		<PageScope lang={lang} pathname={pathname}>
			<Component {...(props as P)} />
		</PageScope>
	);
	Root.displayName = `withPage(${Component.displayName ?? Component.name})`;
	return Root;
}

export function usePage(): PageProps {
	const page = use(PageContext);
	if (!page) throw new Error('A component that reads the page was rendered outside <PageScope>.');
	return page;
}

export const useLang = () => usePage().lang;

/** The texts of the page's language: `const t = useT('rooms')`, `useT('common', 'footer')` (see t.ts). */
export function useT<NS extends Namespace, P extends Key<Resources[NS]> | undefined = undefined>(ns: NS, keyPrefix?: P) {
	return i18n<NS, P>(useLang(), ns, keyPrefix);
}
