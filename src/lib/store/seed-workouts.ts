import { group, interval, type Workout } from '../engine/workout';

/** Seeded into My Workouts on first launch, so the list isn't empty. Short, and passes through every Kind color. */
export const seedWorkout: Workout = {
	id: 'seed-thursday-tabatas',
	name: 'Thursday Tabatas',
	leadInSec: 10,
	items: [
		interval('Warm-up', 'warmup', 20),
		group(
			2,
			[
				group(3, [interval('Mountain Climbers', 'work', 20), interval('Rest', 'rest', 10)]),
				interval('Between Tabatas', 'rest', 30)
			],
			{ name: 'Tabata' }
		),
		interval('Cool-down', 'cooldown', 20)
	]
};
