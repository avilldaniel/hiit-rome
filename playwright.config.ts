import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	// The short sample Workout as the seed, not the demo's classes (see src/lib/store/device.ts).
	webServer: { command: 'VITE_SEED=sample npm run build && npm run preview', port: 4173 },
	use: {
		baseURL: 'http://localhost:4173',
		// Uses the locally installed Chrome; run `npx playwright install chromium` and drop this to use the bundled browser.
		channel: 'chrome',
		viewport: { width: 1920, height: 1080 },
		// Screens deal their cards and tiles in on springs; with reduced motion they land at once, so a click (and the
		// stopped clocks the tests run on) never waits for an animation to settle.
		reducedMotion: 'reduce'
	}
});
