// One 404 for the whole site: Cloudflare serves it for any unknown address, in any language. It is built in the
// default language; the inline script of src/pages/404.astro switches it to the language of the address.
import { useT, withPage } from '@/i18n/react';
import ButtonLink from '@/components/ui/ButtonLink';

function NotFoundPage() {
	const t = useT('common', 'notFound');

	return (
		<section className="mx-auto grid max-w-[90rem] justify-items-start gap-8 px-gutter pt-16 md:pt-32">
			<p className="font-mono text-label tracking-[0.08em] text-muted uppercase">404</p>
			<h1 className="text-display leading-[0.9] font-extrabold tracking-[-0.045em]" data-lost="heading">
				{t('heading')}
			</h1>
			<p className="max-w-[32rem] text-muted" data-lost="text">
				{t('text')}
			</p>
			<ButtonLink href="/" data-lost="back">
				{t('back')}
			</ButtonLink>
		</section>
	);
}

export default withPage(NotFoundPage);
