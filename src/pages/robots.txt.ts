// robots.txt, written at build time from SITE_URL (src/i18n/config.ts): one address to change, not two files.
// Every robot may read the whole site, search engines and AI assistants alike. The AI crawlers are named one by one
// so the permission is explicit, not only inherited from * (a robot that finds its own name follows that group only,
// so the content signals are repeated there). Content signals: https://contentsignals.org.
// On Cloudflare, keep « Block AI bots » and the zone's « managed robots.txt » off, or they win over this file.
import type { APIRoute } from 'astro';
import { SITE_URL } from '@/i18n/config';

const SIGNAL = 'Content-Signal: search=yes, ai-input=yes, ai-train=no';
const AI = ['OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'Claude-SearchBot', 'Claude-User', 'ClaudeBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'MistralAI-User', 'meta-externalagent', 'DuckAssistBot'];

export const GET: APIRoute = () =>
	new Response(
		[
			'User-agent: *',
			SIGNAL,
			'Allow: /',
			'',
			...AI.map((bot) => `User-agent: ${bot}`),
			SIGNAL,
			'Allow: /',
			'',
			`Sitemap: ${SITE_URL}/sitemap.xml`,
			'',
		].join('\n'),
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
	);
