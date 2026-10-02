import { expect, test } from '@playwright/test';

const WARM_UP_YELLOW = 'rgb(255, 209, 102)';

test('once loaded, the app opens and runs a Workout with the network gone', async ({ page, context }) => {
	await page.clock.install({ time: new Date('2026-10-01T09:00:00') });
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'My Workouts', level: 1 })).toBeVisible();
	// The service worker has precached the app and taken control of the page.
	await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

	await context.setOffline(true);
	await page.reload();
	await expect(page.getByRole('heading', { name: 'My Workouts', level: 1 })).toBeVisible();

	await page.getByRole('link', { name: 'Start Thursday Tabatas' }).click();
	await expect(page.getByText('Press Space or tap to start')).toBeVisible();
	// Any address opens offline, not only the one loaded before.
	await page.reload();
	await expect(page.getByText('Press Space or tap to start')).toBeVisible();
	await page.clock.pauseAt(new Date('2026-10-01T09:00:01'));
	await page.keyboard.press('Space');
	// After the 10 s Lead-in the first Interval fills the screen with its color.
	await page.clock.runFor(10_016);
	await expect(page.getByTestId('session')).toHaveCSS('background-color', WARM_UP_YELLOW);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Warm-up');
});

test('the app can be installed: it links a manifest with a name, icons, navy theme and full-screen display', async ({ page, request }) => {
	await page.goto('/');
	const href = await page.locator('link[rel="manifest"]').getAttribute('href');
	const manifest = await (await request.get(new URL(href!, page.url()).href)).json();

	expect(manifest).toMatchObject({ name: 'hiit-rome', theme_color: '#073b4c', display: 'fullscreen' });
	await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#073b4c');
	for (const icon of manifest.icons) {
		const response = await request.get(new URL(icon.src, page.url()).href);
		expect(response.ok(), icon.src).toBe(true);
	}
	expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
});
