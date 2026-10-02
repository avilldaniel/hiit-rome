import type { CueOverrides, CueSettings } from './cues';
import { effectiveCueSettings } from './cues';
import type { Workout } from './workout';

/** The trainer's app-wide audio settings, configured once. */
export interface Settings {
	/** The device voice to speak Cues with, by its id; null for the device's default. */
	voiceId: string | null;
	/** The global Cue defaults, which a Workout may override. */
	cues: CueSettings;
	/** Play the short Lead-in when resuming from pause. */
	resumeLeadIn: boolean;
}

/** Settings on first launch. */
export const DEFAULT_SETTINGS: Settings = {
	voiceId: null,
	cues: { announce: true, warning: true, warningSec: 10, finalBeeps: true, halfway: false, completion: true },
	resumeLeadIn: true
};

/** The Cue settings that are simply on or off, as the trainer sees them. */
export const CUE_TOGGLES = [
	{ key: 'announce', label: 'Announce each Interval' },
	{ key: 'warning', label: 'Warning' },
	{ key: 'finalBeeps', label: 'Final-seconds beeps' },
	{ key: 'halfway', label: 'Halfway' },
	{ key: 'completion', label: 'Workout complete' }
] as const satisfies { key: keyof CueSettings; label: string }[];

/** The resume Lead-in's length, when it is on. */
export const RESUME_LEAD_IN_MS = 3000;

/** What a Session of `workout` starts with: its Lead-in, and the effective settings from `settings` and its overrides. */
export function sessionOptions(
	workout: Pick<Workout, 'leadInSec'> & { cueOverrides?: CueOverrides },
	settings: Settings
): { leadInMs: number; resumeLeadInMs: number; cueSettings: CueSettings } {
	return {
		leadInMs: workout.leadInSec * 1000,
		resumeLeadInMs: settings.resumeLeadIn ? RESUME_LEAD_IN_MS : 0,
		cueSettings: effectiveCueSettings(settings.cues, workout.cueOverrides)
	};
}
