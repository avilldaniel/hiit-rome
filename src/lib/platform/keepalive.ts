/**
 * A near-silent tone, below what speakers reproduce and far below hearing, yet loud enough for the browser to
 * count the page as playing audio. Browsers spare such pages the heavy timer throttling of background tabs, so
 * Cues stay on time while another app or tab is in front.
 */
const HUM = { hz: 20, gain: 0.001 };

export interface Keepalive {
	/** Enables audio. Browsers allow it only from a user gesture, so call it on the first click or keypress. */
	unlock(): void;
	/** Plays the hum from now on, or once audio is unlocked. */
	start(): void;
	stop(): void;
	/** Stops the hum and frees its audio, for good. */
	dispose(): void;
}

export function createKeepalive(): Keepalive {
	let audio: AudioContext | null = null;
	let hum: OscillatorNode | null = null;
	let wanted = false;

	function play() {
		if (!audio || hum || !wanted) return;
		hum = audio.createOscillator();
		const gain = audio.createGain();
		hum.frequency.value = HUM.hz;
		gain.gain.value = HUM.gain;
		hum.connect(gain).connect(audio.destination);
		hum.start();
	}

	function stop() {
		wanted = false;
		hum?.stop();
		hum = null;
	}

	return {
		unlock() {
			audio ??= new AudioContext();
			if (audio.state === 'suspended') void audio.resume();
			play();
		},
		start() {
			wanted = true;
			play();
		},
		stop,
		dispose() {
			stop();
			void audio?.close();
			audio = null;
		}
	};
}
