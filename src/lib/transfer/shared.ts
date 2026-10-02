import type { Workout } from '#lib/engine/workout.ts';

/**
 * Shared Workouts started from their preview without being added, by id. They live only in memory:
 * a Session of one plays as it is and is never stored, so it doesn't outlast a reload.
 */
const started = new Map<string, Workout>();

/** Makes `workout` playable at its Session route, as the share preview's Start opens it. */
export function startShared(workout: Workout) {
	started.set(workout.id, workout);
}

/** A shared Workout started from its preview on this page load, if `id` is one. */
export const findShared = (id: string): Workout | undefined => started.get(id);
