import type { SessionSnapshot } from '#lib/engine/session.ts';
import type { ActiveSession, SavedSession } from '#lib/store/workout-store.ts';

/** The screen an active Session plays on: its Workout's Session screen, or the Countdown. */
export const sessionPath = (active: ActiveSession) =>
	'countdown' in active ? '/countdown' : `/session/${active.workoutId}`;

/** The saved Session the trainer chose to resume, on its way from the recovery prompt to the screen it plays on. */
let resuming: SavedSession | null = null;

export function resumeSaved(saved: SavedSession) {
	resuming = saved;
}

/** The Session to resume on opening the screen at `path`, if the trainer just chose one; asked once. */
export function takeResumed(path: string): SessionSnapshot | undefined {
	const saved = resuming;
	resuming = null;
	return saved && sessionPath(saved) === path ? saved.session : undefined;
}
