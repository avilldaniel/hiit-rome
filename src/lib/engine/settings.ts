import type { CueOverrides, CueSettings } from './cues';
import { effectiveCueSettings } from './cues';
import type { PaletteToken } from './palette';
import type { Workout } from './workout';

/** How a Countdown looks and sounds. */
export interface CountdownSettings {
	/** The one palette color it is shown in. */
	color: CountdownColor;
	/** Say "1 minute remaining" when the Countdown is longer than 1 minute. */
	warning: boolean;
}

/** A Countdown may take any palette color but the neutral one, which means "paused". */
export const COUNTDOWN_COLORS = ['rest', 'work', 'warmup', 'cooldown'] as const satisfies PaletteToken[];
export type CountdownColor = (typeof COUNTDOWN_COLORS)[number];

/** The trainer's app-wide audio settings, configured once. */
export interface Settings {
	/** The device voice to speak Cues with, by its id; null for the device's default. */
	voiceId: string | null;
	/** The global Cue defaults, which a Workout may override. */
	cues: CueSettings;
	/** Play the short Lead-in when resuming from pause. */
	resumeLeadIn: boolean;
	countdown: CountdownSettings;
}

/** Settings on first launch. */
export const DEFAULT_SETTINGS: Settings = {
	voiceId: null,
	cues: { announce: true, warning: true, warningSec: 10, finalBeeps: true, halfway: false, completion: true },
	resumeLeadIn: true,
	countdown: { color: 'rest', warning: true }
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
