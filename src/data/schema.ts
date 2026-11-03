// Structured data (schema.org JSON-LD) for search engines and AI assistants: who publishes the site, and the path to
// each page. Declare only facts the page shows; integrations/agents.mjs reads the WebSite to title llms.txt.
import { i18n } from '@/i18n/t';
import { SITE_URL, locale, type Lang } from '@/i18n/config';
import { absolute } from '@/i18n/routes';

const WEBSITE_ID = `${SITE_URL}/#website`;

export function websiteSchema(lang: Lang) {
	const t = i18n(lang, 'common');
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'@id': WEBSITE_ID,
		name: t('meta.brand'),
		description: t('meta.description'),
		url: absolute(lang, '/'),
		inLanguage: locale(lang).htmlLang,
	};
}

// the path from the home page to the current one: [['Accueil', '/'], ['À propos', '/about'], ...]
export function breadcrumbSchema(lang: Lang, steps: [name: string, path: string][]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: steps.map(([name, path], i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name,
			item: absolute(lang, path),
		})),
	};
}
