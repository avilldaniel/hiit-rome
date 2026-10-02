import { seedWorkout } from './seed-workouts';
import type { Settings } from '../engine/settings';
import { openWorkoutStore, type StoredWorkout, type WorkoutStore } from './workout-store';

let opening: Promise<WorkoutStore> | undefined;

/** This device's Workout store, opened once and shared by every screen. */
export function deviceStore(): Promise<WorkoutStore> {
	// A failed open is tried again next time rather than remembered.
	opening ??= openWorkoutStore({ seed: [seedWorkout] }).catch((error) => {
		opening = undefined;
		throw error;
	});
	return opening;
}

/** A Workout, if there is one with this id, and the Settings it is edited or played with. */
export async function workoutWithSettings(id: string): Promise<{ workout: StoredWorkout | undefined; settings: Settings }> {
	const store = await deviceStore();
	const [workout, settings] = await Promise.all([store.get(id), store.getSettings()]);
	return { workout, settings };
}
