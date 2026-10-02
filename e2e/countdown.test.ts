import { expect, test, type Page } from '@playwright/test';

const REST_BLUE = 'rgb(17, 138, 178)';
const COOL_DOWN_GREEN = 'rgb(6, 214, 160)';

/** Moves the stopped page clock on by `ms`, and one animation frame more, so the screen shows the moment reached. */
const runFor = (page: Page, ms: number) => page.clock.runFor(ms + 16);

/** Opens the Countdown screen from home with the page clock stopped: time moves only when the test says so. */
async function openCountdown(page: Page) {
	await page.clock.install({ time: new Date('2026-10-01T09:00:00') });
	await page.goto('/');
	await page.getByRole('link', { name: 'Countdown' }).click();
	await expect(page.getByRole('heading', { name: 'Presets' })).toBeVisible();
	await page.clock.pauseAt(new Date('2026-10-01T09:00:01'));
}

test('a Preset counts down in Rest blue, chimes three times at zero, and shows TIME until dismissed', async ({ page }) => {
	// Swap the device's Cue player for the recording fake.
	await page.addInitScript(() => (window.__hiitCueLog = []));
	await openCountdown(page);
	const heard = () => page.evaluate(() => window.__hiitCueLog!.map((cue) => (cue.type === 'speech' ? cue.text : cue.type)));

	// The five default Presets.
	for (const preset of ['1:00', '3:00', '5:00', '10:00', '15:00']) {
		await expect(page.getByRole('button', { name: `Start a ${preset} Countdown` })).toBeVisible();
	}
	await page.getByRole('button', { name: 'Start a 1:00 Countdown' }).click();

	const screen = page.getByTestId('countdown');
	await expect(screen).toHaveCSS('background-color', REST_BLUE);
	await expect(page.getByTestId('remaining')).toHaveText('1:00');
	await runFor(page, 10_000);
	await expect(page.getByTestId('remaining')).toHaveText('0:50');

	// −30 s brings the end closer.
	await page.keyboard.press('ArrowDown');
	await expect(page.getByTestId('remaining')).toHaveText('0:20');
	await runFor(page, 25_000);
	await expect(page.getByRole('heading', { name: 'TIME' })).toBeVisible();
	await expect(screen).toHaveCSS('background-color', REST_BLUE);
	// No Warning on a 1-minute Countdown.
	expect(await heard()).toEqual(['beep', 'beep', 'beep', 'chime', 'chime', 'chime']);

	// TIME stays until dismissed.
	await runFor(page, 10_000);
	await expect(page.getByRole('heading', { name: 'TIME' })).toBeVisible();
	await page.getByRole('button', { name: 'Dismiss' }).click();
	await expect(page.getByRole('heading', { name: 'Presets' })).toBeVisible();

	// Over and dismissed: nothing is offered back after a reload.
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Presets' })).toBeVisible();
});

test('a custom Countdown pauses, takes ±30 s, and ends once confirmed', async ({ page }) => {
	await openCountdown(page);
	await page.getByRole('textbox', { name: 'Custom duration' }).fill('2:30');
	await page.getByRole('button', { name: 'Start', exact: true }).click();
	await expect(page.getByTestId('remaining')).toHaveText('2:30');

	await page.keyboard.press('ArrowUp');
	await expect(page.getByTestId('remaining')).toHaveText('3:00');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('ArrowDown');
	await expect(page.getByTestId('remaining')).toHaveText('2:00');

	// Space pauses: the screen goes neutral and the clock stops.
	await page.keyboard.press('Space');
	await expect(page.getByText('Paused', { exact: true })).toBeVisible();
	await runFor(page, 10_000);
	await expect(page.getByTestId('remaining')).toHaveText('2:00');
	await page.keyboard.press('Space');
	await runFor(page, 10_000);
	await expect(page.getByTestId('remaining')).toHaveText('1:50');

	await page.keyboard.press('Escape');
	await page.getByRole('button', { name: 'End Countdown' }).click();
	await expect(page.getByRole('heading', { name: 'Presets' })).toBeVisible();
});

test('a running Countdown survives a reload, coming back paused at the same second', async ({ page }) => {
	await openCountdown(page);
	await page.getByRole('button', { name: 'Start a 3:00 Countdown' }).click();
	await runFor(page, 30_000);
	await expect(page.getByTestId('remaining')).toHaveText('2:30');

	await page.reload();
	await expect(page.getByRole('heading', { name: 'Resume where you left off?' })).toBeVisible();
	await expect(page.getByText('Countdown', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Resume' }).click();

	await expect(page.getByText('Paused', { exact: true })).toBeVisible();
	await expect(page.getByTestId('remaining')).toHaveText('2:30');
	await page.keyboard.press('Space');
	await runFor(page, 5_000);
	await expect(page.getByTestId('remaining')).toHaveText('2:25');
});

test('starting a Session while a Countdown is under way asks to end the Countdown first', async ({ page }) => {
	await openCountdown(page);
	await page.getByRole('button', { name: 'Start a 5:00 Countdown' }).click();
	await runFor(page, 10_000);
	await page.goBack();
	// Left behind, the Countdown no longer counts; the clock runs again for the app's own navigation.
	await page.clock.resume();

	// Going back to it carries on from where it was left, paused.
	await page.getByRole('link', { name: 'Start Thursday Tabatas' }).click();
	await expect(page.getByText('Countdown is still under way. End it to start Thursday Tabatas?')).toBeVisible();
	await page.getByRole('button', { name: 'Back to Countdown' }).click();
	await expect(page.getByText('Paused', { exact: true })).toBeVisible();
	await expect(page.getByTestId('remaining')).toHaveText('4:50');

	// Ending it lets the Session start.
	await page.goBack();
	await expect(page.getByText('Countdown is still under way. End it to start Thursday Tabatas?')).toBeVisible();
	await page.getByRole('button', { name: 'End Countdown' }).click();
	await expect(page.getByText('Press Space or tap to start')).toBeVisible();
	await page.reload();
	await expect(page.getByText('Press Space or tap to start')).toBeVisible();
});

test('starting a Countdown while a Session is under way asks to end the Session first', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Start Thursday Tabatas' }).click();
	await expect(page.getByText('Press Space or tap to start')).toBeVisible();
	await page.keyboard.press('Space');
	await page.keyboard.press('ArrowRight'); // into the Warm-up
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Warm-up');
	await page.goBack();

	await page.getByRole('link', { name: 'Countdown' }).click();
	await page.getByRole('button', { name: 'Start a 1:00 Countdown' }).click();
	await expect(page.getByText('Thursday Tabatas is still under way. End it to start a Countdown?')).toBeVisible();
	await page.getByRole('button', { name: 'Back to Thursday Tabatas' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Warm-up');
	await expect(page.getByText('Paused', { exact: true })).toBeVisible();
});

test('the Presets and the Countdown color are edited in Settings, and kept', async ({ page }) => {
	await page.goto('/settings');
	await page.getByRole('textbox', { name: 'Preset 2' }).fill('2:00');
	await page.getByRole('textbox', { name: 'Preset 2' }).press('Tab');
	await page.getByRole('combobox', { name: 'Color' }).selectOption({ label: 'Green' });

	await page.getByRole('link', { name: '← My Workouts' }).click();
	await page.getByRole('link', { name: 'Countdown' }).click();
	const preset = page.getByRole('button', { name: 'Start a 2:00 Countdown' });
	await expect(preset).toHaveCSS('background-color', COOL_DOWN_GREEN);

	// Kept: opened afresh, both screens read them back from the device.
	await page.goto('/settings');
	await expect(page.getByRole('textbox', { name: 'Preset 2' })).toHaveValue('2:00');
	await page.goto('/countdown');
	await expect(preset).toHaveCSS('background-color', COOL_DOWN_GREEN);
	await preset.click();
	await expect(page.getByTestId('countdown')).toHaveCSS('background-color', COOL_DOWN_GREEN);
	await expect(page.getByTestId('remaining')).toHaveText('2:00');
});
