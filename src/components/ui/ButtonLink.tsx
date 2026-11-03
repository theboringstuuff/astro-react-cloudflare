// DESIGN.md `button-primary` / `button-primary-hover`: the one main action of a screen, a pill of ink that turns to
// signal on hover and focus. A link, because every action of a static site is a navigation.
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/cx';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode };

export default function ButtonLink({ className, children, ...props }: Props) {
	return (
		<a
			className={cx(
				'inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-medium text-paper no-underline',
				'[transition:background-color_0.3s_var(--ease-out),color_0.3s_var(--ease-out)] hover:bg-signal hover:text-ink focus-visible:bg-signal focus-visible:text-ink',
				className,
			)}
			{...props}
		>
			{children}
		</a>
	);
}
