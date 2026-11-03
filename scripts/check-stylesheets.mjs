// The site has one stylesheet: src/styles/global.css, Tailwind's entry (the tokens from DESIGN.md, the base rules, the
// keyframes, then the utilities). Components are styled with utility classes in their .tsx, never with a stylesheet of
// their own. This check fails when a second .css file appears in src, when a source file imports a stylesheet other
// than global.css from the layout, or when an .astro file carries a <style> block.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const src = join(root, 'src');
const ENTRY = 'src/styles/global.css';
const LAYOUT = 'src/layouts/Layout.astro';

const files = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? files(join(dir, d.name)) : [join(dir, d.name)]));
const rel = (p) => relative(root, p);

const problems = [];
const all = files(src);
for (const file of all.filter((f) => f.endsWith('.css'))) {
	if (rel(file) !== ENTRY) problems.push(`${rel(file)}: a stylesheet besides ${ENTRY}; style the component with utilities in its .tsx`);
}
for (const file of all.filter((f) => /\.(tsx?|astro|mjs)$/.test(f))) {
	const code = readFileSync(file, 'utf8');
	for (const [, spec] of code.matchAll(/^\s*import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+\.css)['"]/gm)) {
		if (!(rel(file) === LAYOUT && spec === '@/styles/global.css')) problems.push(`${rel(file)} imports ${spec}; only ${LAYOUT} imports a stylesheet (global.css)`);
	}
	if (file.endsWith('.astro') && /<style[\s>]/.test(code)) problems.push(`${rel(file)}: a <style> block; use utilities, or global.css for markup no component writes`);
}

if (problems.length) {
	console.error(`✗ ${problems.length} stylesheet problem(s):`);
	for (const p of problems) console.error('  ' + p);
	process.exit(1);
}
console.log(`✓ Stylesheets: ${ENTRY} is the only one, imported once by ${LAYOUT}.`);
