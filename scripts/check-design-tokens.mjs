#!/usr/bin/env node
// DESIGN.md is the source of truth for the design tokens; src/styles/global.css carries them as CSS variables.
// This script compares the two value by value and exits 1 on any drift, so the CI catches a colour or a spacing
// changed in one place and not the other. Run it with `pnpm run check:tokens`.
import { readFileSync } from 'node:fs';

// DESIGN.md token -> the CSS variables that must carry the same value
const MAP = {
	'colors.primary': ['--ink'],
	'colors.neutral': ['--paper'],
	'colors.secondary': ['--muted'],
	'colors.tertiary': ['--signal'],
	'colors.line': ['--line'],
	'spacing.1': ['--space-1'],
	'spacing.2': ['--space-2'],
	'spacing.4': ['--space-4'],
	'spacing.8': ['--space-8'],
	'spacing.16': ['--space-16'],
	'spacing.32': ['--space-32'],
};

// the front matter's flat groups: `group:` then `  key: value` lines
function readTokens(md) {
	const front = md.match(/^---\n([\s\S]*?)\n---/);
	if (!front) throw new Error('DESIGN.md has no YAML front matter');
	const tokens = {};
	let group = null;
	for (const line of front[1].split('\n')) {
		const top = line.match(/^([a-z][\w-]*):\s*$/);
		if (top) {
			group = top[1];
			continue;
		}
		if (/^\S/.test(line)) {
			group = null;
			continue;
		}
		const entry = group && line.match(/^ {2}"?([\w-]+)"?:\s*"?([^"\n]+?)"?\s*$/);
		if (entry) tokens[`${group}.${entry[1]}`] = entry[2];
	}
	return tokens;
}

// the :root custom properties, with var() aliases resolved
function readCssVars(css) {
	const root = css.match(/:root\s*{([\s\S]*?)\n}/);
	if (!root) throw new Error('global.css has no :root block');
	const vars = {};
	for (const [, name, value] of root[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[name] = value.trim();
	const resolve = (v, depth = 0) => {
		const alias = v.match(/^var\((--[\w-]+)\)$/);
		return alias && depth < 5 ? resolve(vars[alias[1]] ?? v, depth + 1) : v;
	};
	return Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, resolve(v)]));
}

// #fff -> #ffffff, lower case, so equal colours compare equal
const normalise = (v) => {
	const s = String(v).trim().toLowerCase();
	const short = s.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
	return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : s;
};

const tokens = readTokens(readFileSync(new URL('../DESIGN.md', import.meta.url), 'utf8'));
const vars = readCssVars(readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8'));

const problems = [];
for (const [token, names] of Object.entries(MAP)) {
	if (!(token in tokens)) {
		problems.push(`${token}: missing from DESIGN.md`);
		continue;
	}
	for (const name of names) {
		if (!(name in vars)) problems.push(`${name}: missing from global.css (expected ${tokens[token]}, from ${token})`);
		else if (normalise(vars[name]) !== normalise(tokens[token]))
			problems.push(`${name} is ${vars[name]} in global.css but ${token} is ${tokens[token]} in DESIGN.md`);
	}
}
// a colour token nobody maps is a token the check silently ignores
for (const token of Object.keys(tokens).filter((t) => t.startsWith('colors.') || t.startsWith('spacing.'))) {
	if (!(token in MAP)) problems.push(`${token}: in DESIGN.md but not mapped in scripts/check-design-tokens.mjs`);
}

if (problems.length) {
	console.error(`Design tokens out of step (${problems.length}):\n- ${problems.join('\n- ')}`);
	process.exit(1);
}
console.log(`Design tokens in step: ${Object.keys(MAP).length} DESIGN.md tokens match src/styles/global.css.`);
