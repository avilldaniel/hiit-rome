import { describe, expect, it } from 'vitest';
import { buildTimeline } from './timeline';
import { group, interval } from './workout';
import { createSession, dispatch, view, type SessionAction } from './session';

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

describe('Session controls', () => {
	// Timeline (after the 10 s Lead-in): Warm-up 0–60, Burpees 60–80, Rest 80–90, Burpees 90–110, Cool-down 110–140.
	const act = (session: ReturnType<typeof started>, type: 'next' | 'previous', atSec: number) =>
		dispatch(session, { type, at: s(atSec) });

	it('next jumps to the start of the next Interval and keeps counting', () => {
		const skipped = act(started(), 'next', 30); // 20 s into Warm-up

		expect(view(skipped, s(30))).toMatchObject({ status: 'running', current: { name: 'Burpees' }, remainingMs: 20_000 });
		expect(view(skipped, s(35)).remainingMs).toBe(15_000);
	});

	it('next on the final Interval completes the Session', () => {
		const done = act(started(), 'next', 125); // in Cool-down

		expect(view(done, s(125))).toMatchObject({ status: 'completed', totalRemainingMs: 0 });
	});

	it('next during the Lead-in starts the first Interval', () => {
		expect(view(act(started(), 'next', 3), s(3))).toMatchObject({ current: { name: 'Warm-up' }, remainingMs: 60_000 });
	});

	it('next keeps a paused Session paused', () => {
		const paused = dispatch(started(), { type: 'pause', at: s(30) });

		expect(view(act(paused, 'next', 40), s(50))).toMatchObject({
			status: 'paused',
			current: { name: 'Burpees' },
			remainingMs: 20_000
		});
	});

	it('previous restarts the Interval when more than 3 s have elapsed', () => {
		const restarted = act(started(), 'previous', 74); // 4 s into Burpees

		expect(view(restarted, s(74))).toMatchObject({ current: { name: 'Burpees', index: 1 }, remainingMs: 20_000 });
	});

	it('previous goes back to the previous Interval within its first 3 s', () => {
		const back = act(started(), 'previous', 72); // 2 s into Burpees

		expect(view(back, s(72))).toMatchObject({ current: { name: 'Warm-up' }, remainingMs: 60_000 });
	});

	it('previous on the first Interval restarts it', () => {
		expect(view(act(started(), 'previous', 11), s(11))).toMatchObject({ current: { name: 'Warm-up' }, remainingMs: 60_000 });
	});

	it('previous during the Lead-in restarts the Lead-in', () => {
		expect(view(act(started(), 'previous', 6), s(6))).toMatchObject({ status: 'lead-in', remainingMs: 10_000 });
	});

	const adjust = (session: ReturnType<typeof started>, deltaSec: number, atSec: number) =>
		dispatch(session, { type: 'adjust', deltaMs: deltaSec * 1000, at: s(atSec) });

	it('+30 s lengthens the current Interval and the total remaining time', () => {
		const longer = adjust(started(), 30, 75); // 15 s left in Burpees, 75 s in the Session

		expect(view(longer, s(75))).toMatchObject({ remainingMs: 45_000, totalRemainingMs: 105_000 });
		expect(view(longer, s(75)).progress).toBeCloseTo(5 / 50);
		expect(view(longer, s(125)).current?.name).toBe('Rest');
	});

	it('−30 s shortens the current Interval', () => {
		const shorter = adjust(started(), -30, 15); // 55 s left in Warm-up

		expect(view(shorter, s(15))).toMatchObject({ current: { name: 'Warm-up' }, remainingMs: 25_000, totalRemainingMs: 105_000 });
	});

	it('−30 s with less than 30 s left ends the Interval and starts the next', () => {
		const ended = adjust(started(), -30, 75); // 15 s left in Burpees

		expect(view(ended, s(75))).toMatchObject({ current: { name: 'Rest' }, remainingMs: 10_000, totalRemainingMs: 60_000 });
	});

	it('−30 s near the end of the final Interval completes the Session', () => {
		const done = adjust(started(), -30, 130); // 20 s left in Cool-down

		expect(view(done, s(130))).toMatchObject({ status: 'completed', summary: { intervalsCompleted: 5 } });
	});

	it('keeps each adjustment with its Interval for the rest of the Session', () => {
		const adjusted = adjust(started(), 30, 75); // Burpees now 50 s
		const away = act(act(adjusted, 'next', 76), 'previous', 77); // to Rest, then straight back

		expect(view(away, s(77))).toMatchObject({ current: { name: 'Burpees', index: 1 }, remainingMs: 50_000 });
	});

	it('never changes the Workout’s own Timeline', () => {
		adjust(started(), 30, 75);

		expect(timeline.entries[1].durationMs).toBe(20_000);
		expect(timeline.totalMs).toBe(140_000);
	});
});

describe('Session summary', () => {
	it('summarizes a completed Session', () => {
		expect(view(started(), s(10 + 140 + 5)).summary).toEqual({ elapsedMs: 140_000, intervalsCompleted: 5, workMs: 40_000 });
	});

	it('ends on request and summarizes only what was actually done', () => {
		let session = started();
		session = dispatch(session, { type: 'pause', at: s(75) }); // Warm-up done, 5 s into Burpees
		session = dispatch(session, { type: 'resume', at: s(100) });
		session = dispatch(session, { type: 'next', at: s(105) }); // 10 s of Burpees, then skipped
		session = dispatch(session, { type: 'end', at: s(108) }); // 3 s into Rest

		const v = view(session, s(500));
		expect(v).toMatchObject({ status: 'ended', current: null });
		expect(v.summary).toEqual({ elapsedMs: 73_000, intervalsCompleted: 1, workMs: 10_000 });
	});

	it('can be ended during the Lead-in, with nothing done', () => {
		const v = view(dispatch(started(), { type: 'end', at: s(4) }), s(4));

		expect(v).toMatchObject({ status: 'ended', summary: { elapsedMs: 0, intervalsCompleted: 0, workMs: 0 } });
	});

	it('ignores further controls once ended', () => {
		const ended = dispatch(started(), { type: 'end', at: s(75) }); // 15 s left in Burpees
		const poked = ['next', 'previous', 'restart', 'pause', 'resume', 'toggle'].reduce(
			(session, type) => dispatch(session, { type, at: s(76) } as SessionAction),
			dispatch(ended, { type: 'adjust', deltaMs: -30_000, at: s(76) })
		);

		expect(poked).toEqual(ended);
	});

	it('has no summary while the Session is under way', () => {
		expect(view(started(), s(75)).summary).toBeNull();
	});

	it('counts an Interval ended early by −30 s as completed', () => {
		let session = dispatch(started(), { type: 'adjust', deltaMs: -30_000, at: s(75) }); // ends Burpees after 5 s
		session = dispatch(session, { type: 'end', at: s(75) });

		expect(view(session, s(75)).summary).toEqual({ elapsedMs: 65_000, intervalsCompleted: 2, workMs: 5_000 });
	});

	it('restarts only from pause', () => {
		const running = started();

		expect(dispatch(running, { type: 'restart', at: s(75) })).toEqual(running);
	});

	it('restart starts the Session over, from the Lead-in, as if new', () => {
		let session = dispatch(started(), { type: 'adjust', deltaMs: 30_000, at: s(75) });
		session = dispatch(session, { type: 'pause', at: s(80) });
		session = dispatch(session, { type: 'restart', at: s(200) });

		expect(view(session, s(203))).toMatchObject({ status: 'lead-in', remainingMs: 7_000, totalRemainingMs: 140_000 });
		expect(view(dispatch(session, { type: 'end', at: s(215) }), s(215)).summary).toEqual({
			elapsedMs: 5_000,
			intervalsCompleted: 0,
			workMs: 0
		});
	});
});

describe('Resume Lead-in', () => {
	const pausedAt = (atSec: number) =>
		dispatch(dispatch(createSession(timeline, { leadInMs: 10_000, resumeLeadInMs: 3_000 }), { type: 'start', at: T0 }), {
			type: 'pause',
			at: s(atSec)
		});

	it('counts 3 s on the neutral screen before the paused Interval carries on from the same point', () => {
		const resumed = dispatch(pausedAt(75), { type: 'resume', at: s(100) }); // 15 s left in Burpees

		expect(view(resumed, s(101))).toMatchObject({
			status: 'resume-lead-in',
			current: { name: 'Burpees' },
			remainingMs: 2_000,
			finalSecond: 2,
			totalRemainingMs: 75_000,
			colors: { background: '#073b4c' }
		});
		expect(view(resumed, s(103))).toMatchObject({ status: 'running', remainingMs: 15_000 });
		expect(view(resumed, s(108)).remainingMs).toBe(10_000);
	});

	it('can be paused, and holds the Interval where it was', () => {
		const again = dispatch(dispatch(pausedAt(75), { type: 'resume', at: s(100) }), { type: 'pause', at: s(101) });

		expect(view(again, s(150))).toMatchObject({ status: 'paused', remainingMs: 15_000 });
	});

	it('is skipped when resuming inside the Session’s own Lead-in', () => {
		const resumed = dispatch(pausedAt(5), { type: 'resume', at: s(50) });

		expect(view(resumed, s(50))).toMatchObject({ status: 'lead-in', remainingMs: 5_000 });
	});
});
