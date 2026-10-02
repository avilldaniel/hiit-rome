import type { Cue, CueSound } from '#lib/engine/cues.ts';

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
	/** Drops Cues told ahead of time that haven't started yet, e.g. when the Session pauses or jumps. */
	cancelPending(): void;
}

export function playCues(player: CuePlayer, cues: Cue[]) {
	for (const cue of cues) {
		if (cue.type === 'speech') player.speak(cue.text, cue.delayMs);
		else if (cue.type === 'beep') player.beep(cue.delayMs);
		else if (cue.type === 'final-tone') player.finalTone(cue.delayMs);
		else player.chime(cue.delayMs);
	}
}

/** A Cue as the recording fake heard it, and when it was due to play. */
export type RecordedCue = CueSound & { at: number };

/** A fake that records what it is asked to play, into `log`, instead of making a sound. */
export function createRecordingCuePlayer(log: RecordedCue[] = [], now = () => performance.now()) {
	const record = (sound: CueSound, delayMs: number) => log.push({ ...sound, at: now() + delayMs });
	const player: CuePlayer = {
		unlock() {},
		speak: (text, delayMs) => record({ type: 'speech', text }, delayMs),
		beep: (delayMs) => record({ type: 'beep' }, delayMs),
		finalTone: (delayMs) => record({ type: 'final-tone' }, delayMs),
		chime: (delayMs) => record({ type: 'chime' }, delayMs),
		cancelPending() {
			const t = now();
			for (let i = log.length - 1; i >= 0; i--) if (log[i].at > t) log.splice(i, 1);
		}
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

	function say(text: string) {
		// A newer announcement replaces one still being spoken, so fast skipping never builds a backlog.
		speechSynthesis.cancel();
		speechSynthesis.speak(new SpeechSynthesisUtterance(text));
	}

	return {
		unlock() {
			audio ??= new AudioContext();
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
			for (const pending of pendingTones) {
				if (audio && pending.startsAt > audio.currentTime) {
					pending.oscillator.stop();
					pendingTones.delete(pending);
				}
			}
		}
	};
}
