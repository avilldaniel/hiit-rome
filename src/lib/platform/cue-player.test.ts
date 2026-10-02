import { describe, expect, it } from 'vitest';
import { createRecordingCuePlayer, playCues } from './cue-player';

describe('Recording Cue player', () => {
	it('records each Cue played, at the moment it is due', () => {
		let now = 1000;
		const { player, log } = createRecordingCuePlayer([], () => now);

		playCues(player, [
			{ type: 'final-tone', delayMs: 0 },
			{ type: 'speech', text: 'Burpees', delayMs: 0 },
			{ type: 'beep', delayMs: 300 }
		]);
		now = 1500;
		playCues(player, [{ type: 'chime', delayMs: 100 }]);

		expect(log).toEqual([
			{ type: 'final-tone', at: 1000 },
			{ type: 'speech', text: 'Burpees', at: 1000 },
			{ type: 'beep', at: 1300 },
			{ type: 'chime', at: 1600 }
		]);
	});

	it('forgets Cues still pending when cancelled, as the real player never plays them', () => {
		let now = 1000;
		const { player, log } = createRecordingCuePlayer([], () => now);

		playCues(player, [
			{ type: 'beep', delayMs: 0 },
			{ type: 'beep', delayMs: 400 }
		]);
		now = 1200;
		player.cancelPending();

		expect(log).toEqual([{ type: 'beep', at: 1000 }]);
	});
});
