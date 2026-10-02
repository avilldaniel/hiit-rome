import { exampleWorkout } from './example-workouts';
import { openWorkoutStore, type WorkoutStore } from './workout-store';

let opening: Promise<WorkoutStore> | undefined;

/** This device's Workout store, opened once and shared by every screen. */
export const deviceStore = () => (opening ??= openWorkoutStore({ seed: [exampleWorkout] }));
