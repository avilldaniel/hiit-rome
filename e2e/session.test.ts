import { expect, test } from '@playwright/test';

const NAVY = 'rgb(7, 59, 76)';
const WARM_UP_YELLOW = 'rgb(255, 209, 102)';

test('the demo Workout runs from Lead-in to completion on the Session screen', async ({ page }) => {
	await page.clock.install();
	await page.goto('/');
	const screen = page.getByTestId('session');

	await expect(screen).toHaveCSS('background-color', NAVY);
	await page.keyboard.press('Space');

	// Lead-in: neutral screen, the rail already shows what's first.
	await page.clock.runFor(3_000);
	await expect(screen).toHaveCSS('background-color', NAVY);
	await expect(page.getByRole('list', { name: 'Up next' })).toContainText('Warm-up');

	// After the 10 s Lead-in the first Interval fills the screen with its color.
	await page.clock.runFor(8_000);
	await expect(screen).toHaveCSS('background-color', WARM_UP_YELLOW);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Warm-up');

	// Space pauses: the screen goes neutral and the clock stops.
	await page.keyboard.press('Space');
	await expect(screen).toHaveCSS('background-color', NAVY);
	const frozen = await page.getByTestId('remaining').textContent();
	await page.clock.runFor(5_000);
	await expect(page.getByTestId('remaining')).toHaveText(frozen!);
	await page.keyboard.press('Space');

	// Jump the clock rather than replaying every frame: the timestamp-based engine must land on completion anyway.
	await page.clock.fastForward(10 * 60_000);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Workout complete');
});
