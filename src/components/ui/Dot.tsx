// The signature of DESIGN.md (Shapes): a disc of signal that says « here ». Decorative, hidden from screen readers.
import { cx } from '@/lib/cx';

export default function Dot({ className }: { className?: string }) {
	return <span className={cx('inline-block size-2 flex-none rounded-full bg-signal', className)} aria-hidden="true" />;
}
