/** Formats a remaining time as m:ss, rounding up so a 20 s Interval shows 0:20 at its start and 0:01 just before it ends. */
export function formatClock(ms: number): string {
	const total = Math.max(0, Math.ceil(ms / 1000));
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
