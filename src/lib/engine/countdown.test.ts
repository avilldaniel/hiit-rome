import { describe, expect, it } from 'vitest';
import type { DueCue } from './cues';
import { createCountdown } from './countdown';
import { PALETTE } from './palette';
import { DEFAULT_SETTINGS } from './settings';
import { dispatch, restoreSession, serializeSession, tick, view, type SessionState } from './session';

const T0 = 1_000_000;
const s = (seconds: number) => T0 + seconds * 1000;
const defaults = DEFAULT_SETTINGS.countdown;

function started(durationSec: number, settings = defaults) {
	return dispatch(createCountdown(durationSec, settings), { type: 'start', at: T0 });
}

/** Ticks every 250 ms from `fromSec` up to `untilSec`, collecting each Cue with the moment it is due. */
function heard(session: SessionState, untilSec: number, fromSec = 0) {
	const cues: { atSec: number; cue: string }[] = [];
	for (let at = s(fromSec); at <= s(untilSec); at += 250) {
		const result = tick(session, at);
		session = result.state;
		cues.push(...result.cues.map((c: DueCue) => ({ atSec: (at + c.delayMs - T0) / 1000, cue: c.type === 'speech' ? c.text : c.type })));
	}
	return { session, cues };
}

describe('Countdown', () => {
	it('counts down at once, with no Lead-in, in the Countdown color', () => {
		const v = view(started(300), s(20));

		expect(v).toMatchObject({ status: 'running', remainingMs: 280_000, totalRemainingMs: 280_000 });
		expect(v.colors).toEqual(PALETTE.rest);
	});

	it('uses the configured color, with its paired text color', () => {
		expect(view(started(300, { ...defaults, color: 'warmup' }), s(1)).colors).toEqual(PALETTE.warmup);
	});

	it('beeps over its final seconds, says "1 minute remaining", and chimes three times at zero', () => {
		const { cues } = heard(started(180), 190);

		expect(cues).toEqual([
			{ atSec: 120, cue: '1 minute remaining' },
			{ atSec: 177, cue: 'beep' },
			{ atSec: 178, cue: 'beep' },
			{ atSec: 179, cue: 'beep' },
			{ atSec: 180, cue: 'chime' },
			{ atSec: 180.75, cue: 'chime' },
			{ atSec: 181.5, cue: 'chime' }
		]);
	});

	it('gives no Warning for a Countdown of 1 minute or less', () => {
		const { cues } = heard(started(60), 70);

		expect(cues.map((c) => c.cue)).toEqual(['beep', 'beep', 'beep', 'chime', 'chime', 'chime']);
	});

	it('gives the Warning once +30 s takes a 1-minute Countdown past 1 minute', () => {
		const longer = dispatch(started(60), { type: 'adjust', deltaMs: 30_000, at: s(10) });

		expect(heard(longer, 40, 10).cues).toContainEqual({ atSec: 30, cue: '1 minute remaining' });
	});

	it('gives no Warning when it is turned off', () => {
		const { cues } = heard(started(180, { ...defaults, warning: false }), 190);

		expect(cues.map((c) => c.cue)).not.toContain('1 minute remaining');
	});

	it('shows TIME once it reaches zero, and keeps showing it until dismissed', () => {
		const session = started(60);

		expect(view(session, s(59)).timeUp).toBe(false);
		expect(view(session, s(60))).toMatchObject({ status: 'completed', timeUp: true, remainingMs: 0, colors: PALETTE.rest });
		expect(view(session, s(3600))).toMatchObject({ status: 'completed', timeUp: true });
	});

	it('hands over all three chimes as it reaches zero, so they ring even if TIME is dismissed at once', () => {
		const { cues } = heard(started(60), 60);

		expect(cues.filter((c) => c.cue === 'chime')).toHaveLength(3);
	});

	it('reaches TIME, with its chimes, when −30 s takes off more than is left', () => {
		const ended = dispatch(started(60), { type: 'adjust', deltaMs: -30_000, at: s(40) });

		expect(view(ended, s(40)).timeUp).toBe(true);
		expect(heard(ended, 45, 40).cues.map((c) => c.cue)).toEqual(['chime', 'chime', 'chime']);
	});

	it('does not show TIME when ended early', () => {
		const ended = dispatch(started(60), { type: 'end', at: s(10) });

		expect(view(ended, s(10))).toMatchObject({ status: 'ended', timeUp: false });
	});

	it('pauses, resumes without a Lead-in, and restarts from the full duration', () => {
		const paused = dispatch(started(60), { type: 'pause', at: s(20) });
		expect(view(paused, s(100))).toMatchObject({ status: 'paused', remainingMs: 40_000 });

		const resumed = dispatch(paused, { type: 'resume', at: s(100) });
		expect(view(resumed, s(101))).toMatchObject({ status: 'running', remainingMs: 39_000 });

		const restarted = dispatch(dispatch(resumed, { type: 'pause', at: s(110) }), { type: 'restart', at: s(120) });
		expect(view(restarted, s(121))).toMatchObject({ status: 'running', remainingMs: 59_000 });
	});

	it('survives saving and restoring, paused, with its own Cues', () => {
		const restored = restoreSession(serializeSession(started(180), s(30)));
		expect(view(restored, s(500))).toMatchObject({ status: 'paused', remainingMs: 150_000 });

		const resumed = dispatch(restored, { type: 'resume', at: s(500) });
		expect(heard(resumed, 700, 500).cues.map((c) => c.cue)).toEqual([
			'1 minute remaining',
			...['beep', 'beep', 'beep', 'chime', 'chime', 'chime']
		]);
	});
});
