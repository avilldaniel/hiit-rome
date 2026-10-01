const minutesSeconds = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** Formats a remaining time as m:ss, rounding up so a 20 s Interval shows 0:20 at its start and 0:01 just before it ends. */
export function formatClock(ms: number): string {
	return minutesSeconds(Math.max(0, Math.ceil(ms / 1000)));
}

/** Formats a measured time (e.g. in the Session summary) as m:ss, to the nearest second. */
export function formatDuration(ms: number): string {
	return minutesSeconds(Math.max(0, Math.round(ms / 1000)));
}
