import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, sessionOptions, type Settings } from './settings';

const settings: Settings = {
	voiceId: null,
	cues: { announce: true, warning: true, warningSec: 10, finalBeeps: true, halfway: false, completion: true },
	resumeLeadIn: true
};

describe('Settings', () => {
	it('start with every Cue on but Halfway, the Warning at 10 s, the resume Lead-in on and the device’s own voice', () => {
		expect(DEFAULT_SETTINGS).toEqual(settings);
	});
});

describe('Session options', () => {
	it('take the Workout’s Lead-in, and a 3 s resume Lead-in unless it is turned off', () => {
		expect(sessionOptions({ leadInSec: 15 }, settings)).toMatchObject({ leadInMs: 15_000, resumeLeadInMs: 3_000 });
		expect(sessionOptions({ leadInSec: 0 }, { ...settings, resumeLeadIn: false })).toMatchObject({
			leadInMs: 0,
			resumeLeadInMs: 0
		});
	});

	it('overlay the Workout’s Cue overrides on the defaults; an unset override inherits the default', () => {
		const { cueSettings } = sessionOptions(
			{ leadInSec: 10, cueOverrides: { warningSec: 5, halfway: true, completion: false, announce: undefined } },
			settings
		);

		expect(cueSettings).toEqual({
			announce: true,
			warning: true,
			warningSec: 5,
			finalBeeps: true,
			halfway: true,
			completion: false
		});
	});

	it('use the defaults as they are for a Workout with no overrides', () => {
		expect(sessionOptions({ leadInSec: 10 }, settings).cueSettings).toEqual(settings.cues);
	});
});
