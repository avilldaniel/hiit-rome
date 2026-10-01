import { group, interval, type Workout } from './engine/workout';

/** Built-in demo until Workouts are stored (ticket 05). Short, and passes through every Kind color. */
export const demoWorkout: Workout = {
	id: 'demo',
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
