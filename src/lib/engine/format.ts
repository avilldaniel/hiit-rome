const minutesSeconds = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** Formats a remaining time as m:ss, rounding up so a 20 s Interval shows 0:20 at its start and 0:01 just before it ends. */
export function formatClock(ms: number): string {
	return minutesSeconds(Math.max(0, Math.ceil(ms / 1000)));
}

/** Formats a measured time (e.g. in the Session summary) as m:ss, to the nearest second. */
export function formatDuration(ms: number): string {
	return minutesSeconds(Math.max(0, Math.round(ms / 1000)));
}

/**
 * Reads a typed duration — plain seconds ("90") or m:ss ("1:30") — as whole seconds, or null if
 * it isn't one. Range limits are the Workout model's concern, not this one's.
 */
export function parseDuration(text: string): number | null {
	const match = /^(?:(\d+):([0-5]\d)|(\d+))$/.exec(text.trim());
	if (!match) return null;
	const [, minutes, seconds, plain] = match;
	return plain !== undefined ? Number(plain) : Number(minutes) * 60 + Number(seconds);
}
