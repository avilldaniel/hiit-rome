import type { Cue, DueCue } from '#lib/engine/cues.ts';

/** A voice on this device that can speak Cues. */
export interface Voice {
	id: string;
	name: string;
	/** BCP 47 language tag, e.g. "en-GB". */
	lang: string;
}

/**
 * Plays Cues on the device: speech through the Web Speech API, beeps, tones and chimes through Web Audio.
 * A future music source would sit behind the same kind of seam.
 */
export interface CuePlayer {
	/** Enables audio. Browsers allow it only from a user gesture, so call it on the first click or keypress. */
	unlock(): void;
	speak(text: string, delayMs: number): void;
	beep(delayMs: number): void;
	finalTone(delayMs: number): void;
	chime(delayMs: number): void;
	/** Drops Cues told ahead of time that haven't started yet, and stops speech, e.g. when the Session pauses or jumps. */
	cancelPending(): void;
	/** The voices on this device to choose from. */
	listVoices(): Promise<Voice[]>;
	/** Speaks with this voice from now on; null, or a voice no longer on the device, for the device's default. */
	selectVoice(id: string | null): void;
}

export function playCues(player: CuePlayer, cues: DueCue[]) {
	for (const cue of cues) {
		if (cue.type === 'speech') player.speak(cue.text, cue.delayMs);
		else if (cue.type === 'beep') player.beep(cue.delayMs);
		else if (cue.type === 'final-tone') player.finalTone(cue.delayMs);
		else player.chime(cue.delayMs);
	}
}

/** A Cue as the recording fake heard it, when it was due to play, and, for speech, the voice chosen if any. */
export type RecordedCue = Cue & { at: number; voice?: string };

/** The voices the recording fake offers. */
export const FAKE_VOICES: Voice[] = [
	{ id: 'fake-alex', name: 'Alex', lang: 'en-US' },
	{ id: 'fake-moira', name: 'Moira', lang: 'en-IE' }
];

/** A fake that records what it is asked to play, into `log`, instead of making a sound. */
export function createRecordingCuePlayer(log: RecordedCue[] = [], now = () => performance.now()) {
	let voice: string | null = null;
	const record = (cue: Cue, delayMs: number) => log.push({ ...cue, at: now() + delayMs });
	const player: CuePlayer = {
		unlock() {},
		speak: (text, delayMs) => record({ type: 'speech', text, ...(voice && { voice }) }, delayMs),
		beep: (delayMs) => record({ type: 'beep' }, delayMs),
		finalTone: (delayMs) => record({ type: 'final-tone' }, delayMs),
		chime: (delayMs) => record({ type: 'chime' }, delayMs),
		cancelPending() {
			const t = now();
			for (let i = log.length - 1; i >= 0; i--) if (log[i].at > t) log.splice(i, 1);
		},
		listVoices: async () => FAKE_VOICES,
		selectVoice: (id) => void (voice = FAKE_VOICES.some((v) => v.id === id) ? id : null)
	};
	return { player, log };
}

declare global {
	interface Window {
		/** Set by browser tests before the app loads: Cues are recorded here instead of played. */
		__hiitCueLog?: RecordedCue[];
	}
}

/** The device's Cue player, or the recording fake when a browser test has asked for one. */
export function createCuePlayer(): CuePlayer {
	const log = window.__hiitCueLog;
	return log ? createRecordingCuePlayer(log).player : createWebCuePlayer();
}

const BEEP = { hz: 880, sec: 0.15 };
/** Higher and longer than the beeps, so zero is told apart by ear. */
const FINAL_TONE = { hz: 1760, sec: 0.5 };
/** A rising C major arpeggio. */
const CHIME = [1047, 1319, 1568];
const CHIME_STEP_SEC = 0.15;
const CHIME_RING_SEC = 1.2;
const VOLUME = 0.3;
/** How long to wait for the device's voices to load before taking what there is. */
const VOICES_WAIT_MS = 1000;

function createWebCuePlayer(): CuePlayer {
	let audio: AudioContext | null = null;
	// Tones are scheduled on the audio clock; speech, which has no clock of its own, on a timer.
	const pendingTones = new Set<{ oscillator: OscillatorNode; startsAt: number }>();
	const pendingSpeech = new Set<ReturnType<typeof setTimeout>>();

	function tone(hz: number, sec: number, delayMs: number) {
		if (!audio) return;
		const startsAt = audio.currentTime + delayMs / 1000;
		const oscillator = audio.createOscillator();
		const gain = audio.createGain();
		oscillator.frequency.value = hz;
		// A quick attack and a smooth decay, so tones don't click.
		gain.gain.setValueAtTime(0.0001, startsAt);
		gain.gain.exponentialRampToValueAtTime(VOLUME, startsAt + 0.01);
		gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + sec);
		oscillator.connect(gain).connect(audio.destination);
		oscillator.start(startsAt);
		oscillator.stop(startsAt + sec);
		const pending = { oscillator, startsAt };
		pendingTones.add(pending);
		oscillator.onended = () => pendingTones.delete(pending);
	}

	let voiceId: string | null = null;
	// Announcements queue rather than cut each other off; a pause or skip clears the queue (see cancelPending).
	function say(text: string) {
		const utterance = new SpeechSynthesisUtterance(text);
		// Looked up each time, as some browsers load their voices only after the page first asks for them.
		utterance.voice = speechSynthesis.getVoices().find((v) => v.voiceURI === voiceId) ?? null;
		speechSynthesis.speak(utterance);
	}

	return {
		unlock() {
			if (!audio) {
				audio = new AudioContext();
				// Some browsers (Safari) also allow speech only once it has been used inside a user gesture.
				say('');
			}
			if (audio.state === 'suspended') void audio.resume();
		},
		speak(text, delayMs) {
			if (delayMs <= 0) return say(text);
			const timer = setTimeout(() => {
				pendingSpeech.delete(timer);
				say(text);
			}, delayMs);
			pendingSpeech.add(timer);
		},
		beep: (delayMs) => tone(BEEP.hz, BEEP.sec, delayMs),
		finalTone: (delayMs) => tone(FINAL_TONE.hz, FINAL_TONE.sec, delayMs),
		chime(delayMs) {
			CHIME.forEach((hz, i) => tone(hz, CHIME_RING_SEC, delayMs + i * CHIME_STEP_SEC * 1000));
		},
		cancelPending() {
			for (const timer of pendingSpeech) clearTimeout(timer);
			pendingSpeech.clear();
			// What is being said, or queued, belongs to where the Session was.
			speechSynthesis.cancel();
			for (const pending of pendingTones) {
				if (audio && pending.startsAt > audio.currentTime) {
					pending.oscillator.stop();
					pendingTones.delete(pending);
				}
			}
		},
		listVoices: () =>
			new Promise((resolve) => {
				function list() {
					speechSynthesis.removeEventListener('voiceschanged', list);
					clearTimeout(timer);
					resolve(speechSynthesis.getVoices().map((v) => ({ id: v.voiceURI, name: v.name, lang: v.lang })));
				}
				if (speechSynthesis.getVoices().length) return list();
				speechSynthesis.addEventListener('voiceschanged', list);
				// Some devices have no voices at all, and never say so.
				const timer = setTimeout(list, VOICES_WAIT_MS);
			}),
		selectVoice: (id) => void (voiceId = id)
	};
}
