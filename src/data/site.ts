// The facts of the site that are not texts: links, contacts, the menu. Texts live in src/locales/<lang>/*.json.

export const SITE = {
	// the repository the footer links to; '' hides the link
	sourceUrl: 'https://github.com/theboringstuuff/astro-react-cloudflare',
	// shown when the page is shared, light and dark browser chrome (DESIGN.md colors.primary)
	themeColor: '#16140F',
};

// the main menu: the labels are in the dictionaries (src/locales/<lang>/common.json, `nav`), the addresses get the
// language in front through href() (src/i18n/routes.ts)
export const NAV = [
	{ key: 'home', href: '/' },
	{ key: 'about', href: '/about' },
] as const;
