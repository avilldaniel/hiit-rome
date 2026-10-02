import { seedWorkout } from './seed-workouts';
import { openWorkoutStore, type WorkoutStore } from './workout-store';

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
