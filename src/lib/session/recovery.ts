import type { SessionSnapshot } from '#lib/engine/session.ts';
import type { SavedSession } from '#lib/store/workout-store.ts';

/** The saved Session the trainer chose to resume, on its way from the recovery prompt to the Session screen. */
let resuming: SavedSession | null = null;

export function resumeSaved(saved: SavedSession) {
	resuming = saved;
}

/** The Session to resume on opening this Workout's Session screen, if the trainer just chose one; asked once. */
export function takeResumed(workoutId: string): SessionSnapshot | undefined {
	const saved = resuming;
	resuming = null;
	return saved?.workoutId === workoutId ? saved.session : undefined;
}
