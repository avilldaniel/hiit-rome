import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	webServer: { command: 'npm run build && npm run preview', port: 4173 },
	use: {
		baseURL: 'http://localhost:4173',
		// Uses the locally installed Chrome; run `npx playwright install chromium` and drop this to use the bundled browser.
		channel: 'chrome',
		viewport: { width: 1920, height: 1080 }
	}
});
