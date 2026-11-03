// The home page. A view is the page's content as React, rendered to HTML at build time (src/pages/[...lang]/index.astro).
import { withPage } from '@/i18n/react';
import Hero from '@/components/home/Hero';
import Principles from '@/components/home/Principles';

function HomePage() {
	return (
		<>
			<Hero />
			<Principles />
		</>
	);
}

export default withPage(HomePage);
