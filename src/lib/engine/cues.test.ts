import { describe, expect, it } from 'vitest';
import { buildTimeline } from './timeline';
import { group, interval } from './workout';
import type { CueSettings } from './cues';
import { createSession, dispatch, tick, type SessionState } from './session';
import { DEFAULT_SETTINGS, sessionOptions, type Settings } from './settings';

const T0 = 1_000_000; // arbitrary clock origin; the engine never reads the real clock
const s = (seconds: number) => T0 + seconds * 1000;

const workout = [
	interval('Warm-up', 'warmup', 60),
	group(2, [interval('Burpees', 'work', 20), interval('', 'rest', 10)], { name: 'Circuit' }),
	interval('Cool-down', 'cooldown', 30)
];
const timeline = buildTimeline(workout); // Warm-up, Burpees, Rest, Burpees, Cool-down = 140 s

/** The default Cue settings with some changed. */
const cueSettings = (changes: Partial<CueSettings> = {}): CueSettings => ({ ...DEFAULT_SETTINGS.cues, ...changes });

function started(leadInSec = 0, changes?: Partial<CueSettings>) {
	return dispatch(createSession(timeline, { leadInMs: leadInSec * 1000, cueSettings: cueSettings(changes) }), {
		type: 'start',
		at: T0
	});
}

/** A heard Cue: what played and when, in seconds since T0, as the player would time it. */
type Heard = { atSec: number; cue: string };

/** Ticks every `stepMs` from `fromSec` to `toSec`, collecting what the player is told to play. */
function play(session: SessionState, fromSec: number, toSec: number, stepMs = 250) {
	const heard: Heard[] = [];
	for (let now = s(fromSec); now <= s(toSec); now += stepMs) {
		const result = tick(session, now);
		session = result.state;
		for (const cue of result.cues) {
			heard.push({
				atSec: (now + cue.delayMs - T0) / 1000,
				cue: cue.type === 'speech' ? cue.text : cue.type
			});
		}
	}
	return { session, heard };
}

const spoken = (heard: Heard[]) => heard.filter((h) => !['beep', 'final-tone', 'chime'].includes(h.cue));

describe('Cues', () => {
	it('announces each Interval by name as it starts, an unnamed Rest as "Rest"', () => {
		const { heard } = play(started(0, { warning: false }), 0, 95);

		expect(spoken(heard)).toEqual([
			{ atSec: 0, cue: 'Warm-up' },
			{ atSec: 60, cue: 'Burpees' },
			{ atSec: 80, cue: 'Rest' },
			{ atSec: 90, cue: 'Burpees' }
		]);
	});

	it('warns 10 s before an Interval ends with what is next, and "Last 10 seconds" on the final Interval', () => {
		const { heard } = play(started(), 0, 140);

		expect(spoken(heard).filter((h) => h.cue.startsWith('Next') || h.cue.startsWith('Last'))).toEqual([
			{ atSec: 50, cue: 'Next: Burpees' },
			{ atSec: 70, cue: 'Next: Rest' },
			// None in the 10 s Rest: it merges into the start announcement instead.
			{ atSec: 100, cue: 'Next: Cool-down' },
			{ atSec: 130, cue: 'Last 10 seconds' }
		]);
	});

	it('merges the Warning into the start announcement when the Interval is no longer than the Warning', () => {
		const { heard } = play(started(), 79, 91);

		expect(spoken(heard)).toEqual([
			{ atSec: 80, cue: 'Rest. Next: Burpees.' },
			{ atSec: 90, cue: 'Burpees' }
		]);
	});

	it('merges on the final Interval by announcing just its name', () => {
		const t = buildTimeline([interval('Plank', 'work', 30), interval('Stretch', 'cooldown', 8)]);
		const session = dispatch(createSession(t, { leadInMs: 0 }), { type: 'start', at: T0 });

		expect(spoken(play(session, 0, 38).heard)).toEqual([
			{ atSec: 0, cue: 'Plank' },
			{ atSec: 20, cue: 'Next: Stretch' },
			{ atSec: 30, cue: 'Stretch' },
			{ atSec: 38, cue: 'Workout complete' }
		]);
	});

	it('beeps at 3, 2 and 1 s before an Interval ends, with a distinct tone at 0 as the next one is announced', () => {
		const { heard } = play(started(), 56, 60);

		expect(heard).toEqual([
			{ atSec: 57, cue: 'beep' },
			{ atSec: 58, cue: 'beep' },
			{ atSec: 59, cue: 'beep' },
			{ atSec: 60, cue: 'final-tone' },
			{ atSec: 60, cue: 'Burpees' }
		]);
	});

	it('beeps only for the seconds an Interval has, never over its start', () => {
		const t = buildTimeline([interval('Jump', 'work', 3), interval('Hold', 'work', 2)]);
		const session = dispatch(createSession(t, { leadInMs: 0, cueSettings: cueSettings({ warning: false }) }), {
			type: 'start',
			at: T0
		});

		expect(play(session, 0, 5).heard).toEqual([
			{ atSec: 0, cue: 'Jump' },
			{ atSec: 1, cue: 'beep' },
			{ atSec: 2, cue: 'beep' },
			{ atSec: 3, cue: 'final-tone' },
			{ atSec: 3, cue: 'Hold' },
			{ atSec: 4, cue: 'beep' },
			{ atSec: 5, cue: 'chime' },
			{ atSec: 5, cue: 'Workout complete' }
		]);
	});

	it('ends with "Workout complete" and a chime instead of the tone at 0', () => {
		const { heard } = play(started(), 136, 141);

		expect(heard).toEqual([
			{ atSec: 137, cue: 'beep' },
			{ atSec: 138, cue: 'beep' },
			{ atSec: 139, cue: 'beep' },
			{ atSec: 140, cue: 'chime' },
			{ atSec: 140, cue: 'Workout complete' }
		]);
	});

	it('beeps over the final seconds of the Lead-in, then the tone as the first Interval is announced', () => {
		const { heard } = play(started(10), 0, 10);

		expect(heard).toEqual([
			{ atSec: 7, cue: 'beep' },
			{ atSec: 8, cue: 'beep' },
			{ atSec: 9, cue: 'beep' },
			{ atSec: 10, cue: 'final-tone' },
			{ atSec: 10, cue: 'Warm-up' }
		]);
	});

	it('says "Halfway" only when turned on, and only in Intervals of 30 s or more', () => {
		const halfway = (changes?: Partial<CueSettings>) =>
			spoken(play(started(0, changes), 0, 140).heard).filter((h) => h.cue === 'Halfway');

		expect(halfway()).toEqual([]);
		expect(halfway({ halfway: true })).toEqual([
			{ atSec: 30, cue: 'Halfway' }, // Warm-up, 60 s
			{ atSec: 125, cue: 'Halfway' } // Cool-down, 30 s; the 20 s Burpees are too short
		]);
	});

	it('leaves out "Halfway" when the Warning comes first or at the same moment', () => {
		const halfway = (warningSec: number) =>
			spoken(play(started(0, { warningSec, halfway: true }), 110, 140).heard).map((h) => h.cue);

		expect(halfway(15)).toEqual(['Cool-down', 'Last 15 seconds', 'Workout complete']);
		expect(halfway(14)).toEqual(['Cool-down', 'Halfway', 'Last 14 seconds', 'Workout complete']);
	});

	it('says "Halfway" in every long Interval when the Warning is off', () => {
		const { heard } = play(started(0, { warning: false, warningSec: 40, halfway: true }), 0, 140);

		expect(spoken(heard).filter((h) => h.cue === 'Halfway').map((h) => h.atSec)).toEqual([30, 125]);
	});
});

describe('Cue settings', () => {
	it('with announcements off, speaks no Interval names, though a merged Warning still says what is next', () => {
		const { heard } = play(started(0, { announce: false }), 0, 140);

		expect(spoken(heard).map((h) => `${h.atSec} ${h.cue}`)).toEqual([
			'50 Next: Burpees',
			'70 Next: Rest',
			'80 Next: Burpees.',
			'100 Next: Cool-down',
			'130 Last 10 seconds',
			'140 Workout complete'
		]);
	});

	it('with final-seconds beeps off, plays no beeps or tone at the end of an Interval, but still beeps over the Lead-in', () => {
		const { heard } = play(started(10, { finalBeeps: false }), 0, 71);

		expect(heard.filter((h) => h.cue === 'beep' || h.cue === 'final-tone').map((h) => `${h.atSec} ${h.cue}`)).toEqual([
			'7 beep',
			'8 beep',
			'9 beep',
			'10 final-tone'
		]);
	});

	it('with completion off, ends on the tone at 0 rather than "Workout complete" and the chime', () => {
		const { heard } = play(started(0, { completion: false }), 136, 141);

		expect(heard.map((h) => `${h.atSec} ${h.cue}`)).toEqual(['137 beep', '138 beep', '139 beep', '140 final-tone']);
	});

	it('runs a Workout with its overrides on top of the defaults, e.g. a Tabata with the Warning at 5 s', () => {
		const tabata = buildTimeline([group(2, [interval('Work', 'work', 20), interval('', 'rest', 10)], { skipLastRest: false })]);
		const settings: Settings = { ...DEFAULT_SETTINGS, cues: cueSettings({ warningSec: 10 }) };
		const options = sessionOptions({ leadInSec: 0, cueOverrides: { warningSec: 5 } }, settings);
		const session = dispatch(createSession(tabata, options), { type: 'start', at: T0 });

		expect(spoken(play(session, 0, 60).heard).map((h) => `${h.atSec} ${h.cue}`)).toEqual([
			'0 Work',
			'15 Next: Rest',
			'20 Rest',
			'25 Next: Work',
			'30 Work',
			'45 Next: Rest',
			'50 Rest',
			'55 Last 5 seconds',
			'60 Workout complete'
		]);
	});
});

describe('Cues due', () => {
	it('a late tick still reports what fell due since the previous one, but drops Cues more than 2 s stale', () => {
		const first = tick(started(), s(45));
		const late = tick(first.state, s(61.5)); // throttled: 16.5 s since the last tick

		// "Next: Burpees" (50 s) and the beeps at 57 and 58 s are long past; the tone at 60 s and the announcement are 1.5 s late.
		expect(late.cues).toEqual([
			{ type: 'final-tone', delayMs: 0 },
			{ type: 'speech', text: 'Burpees', delayMs: 0 }
		]);
	});

	it('reports a Cue shortly before its moment, with its delay, and only once', () => {
		const ahead = tick(tick(started(), s(55)).state, s(55.7));
		expect(ahead.cues).toEqual([{ type: 'beep', delayMs: 1300 }]);

		expect(tick(ahead.state, s(55.9)).cues).toEqual([]);
	});

	it('plays nothing while idle or paused', () => {
		const idle = createSession(timeline, { leadInMs: 0 });
		expect(tick(idle, s(5)).cues).toEqual([]);

		const paused = dispatch(tick(started(), s(56)).state, { type: 'pause', at: s(56.5) });
		expect(play(paused, 56.5, 70).heard).toEqual([]);
	});
});

describe('Cues around Session controls', () => {
	it('announces the Interval that next or a jump lands on, straight away', () => {
		const skipped = dispatch(tick(started(10), s(3)).state, { type: 'next', at: s(3.2) });
		expect(tick(skipped, s(3.2)).cues).toEqual([{ type: 'speech', text: 'Warm-up', delayMs: 0 }]);

		const jumped = dispatch(tick(started(), s(30)).state, { type: 'jump', index: 4, at: s(30.1) });
		expect(play(jumped, 30.1, 51).heard.map((h) => h.cue)).toEqual(['Cool-down', 'Last 10 seconds']);
	});

	it('re-announces a restarted Interval, and plays nothing for the stretch a jump skipped', () => {
		const restarted = dispatch(tick(started(), s(65)).state, { type: 'previous', at: s(65) });
		expect(spoken(play(restarted, 65, 66).heard)).toEqual([{ atSec: 65, cue: 'Burpees' }]);

		const skipped = dispatch(tick(started(), s(30)).state, { type: 'next', at: s(30) });
		expect(play(skipped, 30, 31).heard).toEqual([{ atSec: 30, cue: 'Burpees' }]);
	});

	it('announces an Interval jumped to while paused once the Session resumes', () => {
		const paused = dispatch(started(), { type: 'pause', at: s(30) });
		const jumped = dispatch(paused, { type: 'jump', index: 1, at: s(35) });
		const resumed = dispatch(jumped, { type: 'resume', at: s(40) });

		expect(spoken(play(resumed, 40, 41).heard)).toEqual([{ atSec: 40, cue: 'Burpees' }]);
	});

	it('hears again, on resume, a Cue reported ahead just before a pause', () => {
		const ahead = tick(started(), s(56.7)); // the beeps at 57 and 58 s, told ahead
		const paused = dispatch(ahead.state, { type: 'pause', at: s(56.8) });
		const resumed = dispatch(paused, { type: 'resume', at: s(100) });

		expect(play(resumed, 100, 100).heard).toEqual([
			{ atSec: 100.2, cue: 'beep' },
			{ atSec: 101.2, cue: 'beep' }
		]);
	});

	it('beeps over the resume Lead-in, then carries on with the Interval’s own Cues', () => {
		const session = dispatch(createSession(timeline, { leadInMs: 0, resumeLeadInMs: 3000 }), { type: 'start', at: T0 });
		const paused = dispatch(tick(session, s(30)).state, { type: 'pause', at: s(30) });
		const resumed = dispatch(paused, { type: 'resume', at: s(100) });

		// Warm-up resumes 30 s in at 103 s, so its Warning, 20 s on, comes at 123 s.
		expect(play(resumed, 100, 124).heard).toEqual([
			{ atSec: 100, cue: 'beep' },
			{ atSec: 101, cue: 'beep' },
			{ atSec: 102, cue: 'beep' },
			{ atSec: 123, cue: 'Next: Burpees' }
		]);
	});

	it('moves the Warning and beeps with a +30 s adjustment', () => {
		const warned = play(started(), 0, 51).session; // "Next: Burpees" at 50 s
		const longer = dispatch(warned, { type: 'adjust', deltaMs: 30_000, at: s(51) });

		expect(play(longer, 51, 90).heard.map((h) => `${h.atSec} ${h.cue}`)).toEqual([
			'80 Next: Burpees',
			'87 beep',
			'88 beep',
			'89 beep',
			'90 final-tone',
			'90 Burpees'
		]);
	});
});
