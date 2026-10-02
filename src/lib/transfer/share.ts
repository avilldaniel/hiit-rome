import type { Workout } from '#lib/engine/workout.ts';
import { shareLink } from './share-link';

/** How a share went: through the device's share sheet, copied to the clipboard, or called off by the trainer. */
export type Shared = 'shared' | 'copied' | 'cancelled';

/** Shares a link to `workout`: with the native share sheet where there is one, otherwise by copying it. */
export async function shareWorkout(workout: Workout): Promise<Shared> {
	const url = await shareLink(workout, location.origin);
	const data = { title: workout.name, url };
	if (navigator.canShare?.(data)) {
		try {
			await navigator.share(data);
			return 'shared';
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
			// Refused for another reason (e.g. no user gesture left): copying still works.
		}
	}
	await navigator.clipboard.writeText(url);
	return 'copied';
}
