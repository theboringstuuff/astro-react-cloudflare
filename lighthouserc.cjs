// Lighthouse CI (`pnpm lighthouse`, and the « Lighthouse » job of ci.yml): the built site (dist/client) served
// locally, each URL audited five times on Lighthouse's mobile profile (throttled CPU and network), the median kept.
// The thresholds are the floor, not the goal: a template page should score 100 everywhere.
module.exports = {
	ci: {
		collect: {
			staticDistDir: './dist/client',
			url: ['/', '/about/', '/en/'],
			numberOfRuns: 5,
			settings: {
				// the home page redirects a first visit to the browser's language: Lighthouse must stay where it is told
				// (Layout.astro already skips user agents containing « lighthouse »; this keeps it explicit)
				extraHeaders: JSON.stringify({ 'Accept-Language': 'fr' }),
			},
		},
		assert: {
			// the median of the five runs: one slow run on a busy CI machine is noise, not a regression
			aggregationMethod: 'median-run',
			assertions: {
				'categories:performance': ['error', { minScore: 0.95 }],
				'categories:accessibility': ['error', { minScore: 1 }],
				'categories:best-practices': ['error', { minScore: 0.95 }],
				// robots.txt carries Cloudflare's Content-Signal lines (src/pages/robots.txt.ts), which Lighthouse does not
				// know and counts as 2 errors: the SEO score tops at 0.92 because of it. Every other SEO audit is held at 1.
				'categories:seo': ['error', { minScore: 0.9 }],
				'robots-txt': 'off',
				'document-title': ['error', { minScore: 1 }],
				'meta-description': ['error', { minScore: 1 }],
				'http-status-code': ['error', { minScore: 1 }],
				'is-crawlable': ['error', { minScore: 1 }],
				'link-text': ['error', { minScore: 1 }],
				'crawlable-anchors': ['error', { minScore: 1 }],
				'hreflang': ['error', { minScore: 1 }],
				'canonical': ['error', { minScore: 1 }],
				'image-alt': ['error', { minScore: 1 }],
				'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
				'cumulative-layout-shift': ['error', { maxNumericValue: 0.02 }],
				// a page with no script of its own has a TBT of ~0: anything here is Lighthouse's or the machine's own noise
				'total-blocking-time': ['error', { maxNumericValue: 150 }],
			},
		},
		upload: { target: 'filesystem', outputDir: './.lighthouseci' },
	},
};
