import type { Workout } from '../engine/workout';
import demoWorkouts from './demo-workouts.json';
import { seedWorkout } from './seed-workouts';
import type { Settings } from '../engine/settings';
import { openWorkoutStore, type StoredWorkout, type WorkoutStore } from './workout-store';

let opening: Promise<WorkoutStore> | undefined;

/**
 * What My Workouts starts with on a device's first launch. The MVP demo ships one trainer's classes, converted from
 * their Seconds Pro export, so every visitor sees the same Workouts; builds made with VITE_SEED=sample (the e2e
 * tests) start with the short sample instead.
 */
const SEED: Workout[] = import.meta.env.VITE_SEED === 'sample' ? [seedWorkout] : (demoWorkouts as Workout[]);

/** This device's Workout store, opened once and shared by every screen. */
export function deviceStore(): Promise<WorkoutStore> {
	// A failed open is tried again next time rather than remembered.
	opening ??= openWorkoutStore({ seed: SEED }).catch((error) => {
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
