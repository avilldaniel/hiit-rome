import { describe, expect, it } from 'vitest';
import { buildTimeline } from './timeline';
import { group, interval } from './workout';
import { createSession, dispatch, view } from './session';

const T0 = 1_000_000; // arbitrary clock origin; the engine never reads the real clock
const s = (seconds: number) => T0 + seconds * 1000;

const workout = [
	interval('Warm-up', 'warmup', 60),
	group(2, [interval('Burpees', 'work', 20), interval('Rest', 'rest', 10)], { name: 'Circuit' }),
	interval('Cool-down', 'cooldown', 30)
];
const timeline = buildTimeline(workout); // Warm-up, Burpees, Rest, Burpees, Cool-down = 140 s

function started(leadInSec = 10) {
	return dispatch(createSession(timeline, { leadInMs: leadInSec * 1000 }), { type: 'start', at: T0 });
}

describe('Session', () => {
	it('counts down the Lead-in on the neutral screen before the first Interval', () => {
		const v = view(started(), s(3));

		expect(v.status).toBe('lead-in');
		expect(v.remainingMs).toBe(7000);
		expect(v.current).toBeNull();
		expect(v.upcoming[0].name).toBe('Warm-up');
		expect(v.colors.background).toBe('#073b4c');
	});

	it('runs the Intervals in order once the Lead-in ends', () => {
		const session = started();

		expect(view(session, s(10)).current?.name).toBe('Warm-up');
		expect(view(session, s(75))).toMatchObject({
			status: 'running',
			current: { name: 'Burpees' },
			remainingMs: 15_000,
			totalRemainingMs: 75_000,
			colors: { background: '#ef476f' }
		});
		expect(view(session, s(75)).progress).toBeCloseTo(0.25);
	});

	it('freezes exactly while paused and continues from the same point on resume', () => {
		const paused = dispatch(started(), { type: 'pause', at: s(75) });

		expect(view(paused, s(500))).toMatchObject({
			status: 'paused',
			current: { name: 'Burpees' },
			remainingMs: 15_000,
			colors: { background: '#073b4c' }
		});

		const resumed = dispatch(paused, { type: 'resume', at: s(500) });
		expect(view(resumed, s(505))).toMatchObject({ status: 'running', remainingMs: 10_000 });
	});

	it('completes when the last Interval ends', () => {
		const v = view(started(), s(10 + 140));

		expect(v).toMatchObject({ status: 'completed', current: null, upcoming: [], totalRemainingMs: 0 });
		expect(v.colors.background).toBe('#073b4c');
	});

	it('reports elapsed time in the current Interval', () => {
		expect(view(started(), s(75)).elapsedMs).toBe(5_000);
	});

	it('counts the final 3 whole seconds of an Interval or Lead-in, for the pulse', () => {
		const session = started();

		expect(view(session, s(7.5)).finalSecond).toBe(3); // Lead-in, 2.5 s left
		expect(view(session, s(69.2)).finalSecond).toBe(1); // Warm-up ends at 70 s
		expect(view(session, s(66)).finalSecond).toBeNull();
		expect(view(dispatch(session, { type: 'pause', at: s(69) }), s(69)).finalSecond).toBeNull();
	});

	it('toggles: start when idle, pause while counting, resume when paused, nothing once complete', () => {
		const idle = createSession(timeline, { leadInMs: 10_000 });
		const running = dispatch(idle, { type: 'toggle', at: T0 });
		expect(view(running, s(3)).status).toBe('lead-in');

		const paused = dispatch(running, { type: 'toggle', at: s(75) });
		expect(view(paused, s(80))).toMatchObject({ status: 'paused', remainingMs: 15_000 });

		const resumed = dispatch(paused, { type: 'toggle', at: s(80) });
		expect(view(resumed, s(85))).toMatchObject({ status: 'running', remainingMs: 10_000 });

		const done = dispatch(resumed, { type: 'toggle', at: s(1000) });
		expect(view(done, s(2000)).status).toBe('completed');
	});

	it('starts straight into the first Interval when the Lead-in is zero', () => {
		expect(view(started(0), T0)).toMatchObject({ status: 'running', current: { name: 'Warm-up' } });
	});
});

describe('Session screen labels', () => {
	const tabatas = buildTimeline([
		interval('Warm-up', 'warmup', 60),
		group(
			4,
			[group(8, [interval('Burpees', 'work', 20), interval('', 'rest', 10)]), interval('Between', 'rest', 60)],
			{ name: 'Tabata' }
		),
		interval('Cool-down', 'cooldown', 60)
	]);
	const at = (workoutSec: number) =>
		view(dispatch(createSession(tabatas, { leadInMs: 0 }), { type: 'start', at: T0 }), s(workoutSec));

	it('shows named Groups by name and the unnamed innermost Group as "Round X of Y"', () => {
		// Tabata 2 starts at 60 + 230 + 60 = 350 s; its Round 5 Burpees at 350 + 4 × 30 = 470 s.
		expect(at(470).header).toEqual(['Tabata 2 of 4', 'Round 5 of 8']);
		expect(at(0).header).toEqual([]);
	});

	it('omits unnamed outer Groups from the header', () => {
		const t = buildTimeline([group(2, [group(3, [interval('Squats', 'work', 30)])])]);
		const v = view(dispatch(createSession(t, { leadInMs: 0 }), { type: 'start', at: T0 }), s(100));

		expect(v.header).toEqual(['Round 1 of 3']);
	});

	it('labels the Kind, unless the Interval’s name already says it', () => {
		expect(at(60)).toMatchObject({ current: { name: 'Burpees' }, kindLabel: 'Work' });
		expect(at(0)).toMatchObject({ current: { name: 'Warm-up' }, kindLabel: null });
	});

	it('names an unnamed Interval after its Kind', () => {
		expect(at(80)).toMatchObject({ current: { name: 'Rest' }, kindLabel: null });
	});

	it('marks the final Interval so the screen can show "Finish" next', () => {
		expect(at(60).isFinal).toBe(false);
		expect(at(60 + 1100 + 1)).toMatchObject({ current: { name: 'Cool-down' }, isFinal: true, upcoming: [] });
	});
});
