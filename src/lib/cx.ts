// The class names of an element, from strings and { name: condition } pairs (what `class:list` did in Astro):
//   cx('pin', { 'pin--lifted': lifted })  ->  'pin pin--lifted'
type ClassValue = string | false | null | undefined | Record<string, boolean | undefined>;

export function cx(...values: ClassValue[]): string {
	const out: string[] = [];
	for (const v of values) {
		if (!v) continue;
		if (typeof v === 'string') out.push(v);
		else for (const [name, on] of Object.entries(v)) if (on) out.push(name);
	}
	return out.join(' ');
}
