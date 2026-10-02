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

test('the Session speaks and beeps its Cues, in order', async ({ page }) => {
	// Swap the device's Cue player for the recording fake.
	await page.addInitScript(() => (window.__hiitCueLog = []));
	await page.clock.install();
	await page.goto('/');
	const heard = () => page.evaluate(() => window.__hiitCueLog!.map((cue) => (cue.type === 'speech' ? cue.text : cue.type)));

	// Demo Workout: 10 s Lead-in, Warm-up 0:20, then Mountain Climbers 0:20.
	await expect(page.getByText('Press Space or tap to start')).toBeVisible();
	await page.keyboard.press('Space');
	await page.clock.runFor(31_000);
	expect(await heard()).toEqual([
		...['beep', 'beep', 'beep', 'final-tone', 'Warm-up'],
		'Next: Mountain Climbers',
		...['beep', 'beep', 'beep', 'final-tone', 'Mountain Climbers']
	]);

	// Jump to the final Interval and let it play out.
	const before = (await heard()).length;
	await page.keyboard.press('KeyJ');
	await page.getByRole('dialog', { name: 'Intervals' }).getByRole('button', { name: /Cool-down/ }).click();
	await page.clock.runFor(21_000);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Workout complete');
	expect((await heard()).slice(before)).toEqual([
		'Cool-down',
		'Last 10 seconds',
		...['beep', 'beep', 'beep', 'chime', 'Workout complete']
	]);
});

test.describe('Session controls', () => {
	// Demo Workout: 10 s Lead-in, Warm-up 0:20, then Mountain Climbers 0:20 … 3:50 in all.
	test.beforeEach(async ({ page }) => {
		await page.clock.install({ time: new Date('2026-10-01T09:00:00') });
		await page.goto('/');
		await expect(page.getByText('Press Space or tap to start')).toBeVisible();
		await page.clock.pauseAt(new Date('2026-10-01T09:00:01')); // time moves only when the test says so
		await page.keyboard.press('Space');
	});

	test('the keyboard drives next, previous and ±30 s', async ({ page }) => {
		const name = page.getByRole('heading', { level: 1 });
		const remaining = page.getByTestId('remaining');
		const timeLeft = page.getByTestId('time-left');

		await page.keyboard.press('ArrowRight'); // skip the Lead-in
		await expect(name).toHaveText('Warm-up');
		await page.keyboard.press('ArrowRight');
		await expect(name).toHaveText('Mountain Climbers');
		await expect(remaining).toHaveText('0:20');
		await expect(timeLeft).toHaveText('3:30 left');

		await page.keyboard.press('ArrowUp');
		await expect(remaining).toHaveText('0:50');
		await expect(timeLeft).toHaveText('4:00 left');
		await page.keyboard.press('ArrowDown');
		await expect(remaining).toHaveText('0:20');
		await expect(timeLeft).toHaveText('3:30 left');

		// The music-player rule: past 3 s, ← restarts the Interval; within 3 s, it goes back.
		await page.clock.runFor(5_000);
		await expect(remaining).toHaveText('0:15');
		await page.keyboard.press('ArrowLeft');
		await expect(name).toHaveText('Mountain Climbers');
		await expect(remaining).toHaveText('0:20');
		await page.keyboard.press('ArrowLeft');
		await expect(name).toHaveText('Warm-up');

		// −30 s with less than 30 s left ends the Interval.
		await page.keyboard.press('ArrowDown');
		await expect(name).toHaveText('Mountain Climbers');
		await expect(remaining).toHaveText('0:20');
	});

	test('the Interval list jumps to a chosen Interval, by keyboard or by tap, without pausing', async ({ page }) => {
		const name = page.getByRole('heading', { level: 1 });
		const remaining = page.getByTestId('remaining');
		const list = page.getByRole('dialog', { name: 'Intervals' });

		await page.keyboard.press('ArrowRight'); // skip the Lead-in
		await page.clock.runFor(5_000);
		await expect(remaining).toHaveText('0:15');

		await page.keyboard.press('KeyJ');
		await expect(list.getByRole('heading', { name: 'Tabata 2 of 2' })).toBeVisible();
		const warmUp = list.getByRole('button', { name: /Warm-up/ });
		await expect(warmUp).toHaveAttribute('aria-current', 'true');
		await expect(warmUp).toBeFocused();

		// The Session keeps running behind the list.
		await page.clock.runFor(2_000);
		await expect(remaining).toHaveText('0:13');

		// Space still pauses and resumes there; it never picks the focused Interval.
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Space');
		await expect(page.getByText('Paused', { exact: true })).toBeVisible();
		await expect(name).toHaveText('Warm-up');
		await page.keyboard.press('Space');
		await page.clock.runFor(3_000); // the resume Lead-in

		// Esc closes the list and changes nothing.
		await page.keyboard.press('Escape');
		await expect(list).toBeHidden();
		await expect(name).toHaveText('Warm-up');

		// Down past the first Tabata's three Rounds to the rest between Tabatas, and Enter jumps there.
		await page.keyboard.press('KeyJ');
		for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowDown');
		await expect(list.getByRole('button', { name: /Between Tabatas/ })).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(list).toBeHidden();
		await expect(name).toHaveText('Between Tabatas');
		await expect(remaining).toHaveText('0:30');

		// By touch: the control bar opens the list, and a tap jumps.
		await page.mouse.move(200, 200); // reveals the control bar
		await page.getByRole('button', { name: 'Intervals' }).click();
		await list.getByRole('button', { name: /Cool-down/ }).click();
		await expect(name).toHaveText('Cool-down');
		await expect(remaining).toHaveText('0:20');
	});

	test('Esc ends the Session once confirmed, and shows the summary', async ({ page }) => {
		await page.keyboard.press('ArrowRight'); // into the Warm-up
		await page.clock.runFor(20_000); // Warm-up done
		await page.clock.runFor(5_000);

		await page.keyboard.press('Escape');
		await page.getByRole('button', { name: 'Keep going' }).click();
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mountain Climbers');

		await page.keyboard.press('Escape');
		await page.keyboard.press('Enter');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Session ended');
		await expect(page.getByTestId('summary-elapsed')).toHaveText('0:25');
		await expect(page.getByTestId('summary-intervals')).toHaveText('1');
		await expect(page.getByTestId('summary-work')).toHaveText('0:05');
	});
});
