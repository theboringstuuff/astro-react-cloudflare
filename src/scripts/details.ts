// Every <details data-dismiss> (the language switcher, a disclosure menu): a native element that opens, closes and
// works with the keyboard without JavaScript. This adds what <details> lacks: it closes on a click outside and on
// Escape (focus back on its summary). It also remembers the language the visitor picks, so the next arrival on the
// home page does not send them back to their browser's language (see the inline script in Layout.astro).
const all = () => document.querySelectorAll<HTMLDetailsElement>('details[data-dismiss][open]');

document.addEventListener('click', (e) => {
	const target = e.target as Element;
	const choice = target.closest<HTMLElement>('[data-lang-choice]');
	if (choice) {
		try {
			localStorage.setItem('lang', choice.dataset.langChoice!);
		} catch {
			// private browsing without storage: the choice holds for this visit only
		}
	}
	all().forEach((d) => {
		if (!d.contains(target)) d.open = false;
	});
});

document.addEventListener('keydown', (e) => {
	if (e.key !== 'Escape') return;
	all().forEach((d) => {
		d.open = false;
		d.querySelector('summary')?.focus();
	});
});
