import { expect, test } from '@playwright/test';

test('Settings are kept, and the next Session plays its Cues with them', async ({ page }) => {
	// Swap the device's Cue player for the recording fake, which offers the voices Alex and Moira.
	await page.addInitScript(() => (window.__hiitCueLog = []));
	await page.clock.install();
	await page.goto('/');
	await page.getByRole('link', { name: 'Settings' }).click();

	// The defaults: every Cue on but Halfway, the Warning at 10 s, the resume Lead-in on.
	await expect(page.getByRole('combobox', { name: 'Voice' })).toHaveValue('');
	await expect(page.getByRole('checkbox', { name: 'Announce each Interval' })).toBeChecked();
	await expect(page.getByRole('checkbox', { name: 'Warning' })).toBeChecked();
	await expect(page.getByRole('spinbutton', { name: 'Warning seconds' })).toHaveValue('10');
	await expect(page.getByRole('checkbox', { name: 'Final-seconds beeps' })).toBeChecked();
	await expect(page.getByRole('checkbox', { name: 'Halfway' })).not.toBeChecked();
	await expect(page.getByRole('checkbox', { name: 'Workout complete' })).toBeChecked();
	await expect(page.getByRole('checkbox', { name: /Lead-in when resuming/ })).toBeChecked();

	await page.getByRole('combobox', { name: 'Voice' }).selectOption({ label: 'Moira (en-IE)' });
	await page.getByRole('button', { name: 'Test voice' }).click();
	const heard = () => page.evaluate(() => window.__hiitCueLog!.map((cue) => (cue.type === 'speech' ? `${cue.voice} ${cue.text}` : cue.type)));
	expect(await heard()).toEqual(['fake-moira This is how your Cues will sound.']);

	await page.getByRole('spinbutton', { name: 'Warning seconds' }).fill('5');
	await page.getByRole('checkbox', { name: 'Final-seconds beeps' }).uncheck();
	await page.getByRole('checkbox', { name: /Lead-in when resuming/ }).uncheck();

	// Kept on the device.
	await page.getByRole('link', { name: '← My Workouts' }).click();
	await page.getByRole('link', { name: 'Settings' }).click();
	await expect(page.getByRole('combobox', { name: 'Voice' })).toHaveValue('fake-moira');
	await expect(page.getByRole('spinbutton', { name: 'Warning seconds' })).toHaveValue('5');
	await expect(page.getByRole('checkbox', { name: 'Final-seconds beeps' })).not.toBeChecked();
	await expect(page.getByRole('checkbox', { name: /Lead-in when resuming/ })).not.toBeChecked();

	// Seeded Workout: 10 s Lead-in, Warm-up 0:20, then Mountain Climbers 0:20.
	await page.getByRole('link', { name: '← My Workouts' }).click();
	await page.getByRole('link', { name: 'Start Thursday Tabatas' }).click();
	await page.evaluate(() => (window.__hiitCueLog!.length = 0));
	await expect(page.getByText('Press Space or tap to start')).toBeVisible();
	await page.keyboard.press('Space');
	await page.clock.runFor(31_000);
	expect(await heard()).toEqual([
		...['beep', 'beep', 'beep', 'final-tone'], // the Lead-in still beeps
		'fake-moira Warm-up',
		'fake-moira Next: Mountain Climbers', // at 5 s before the end
		'fake-moira Mountain Climbers'
	]);

	// No resume Lead-in: the Interval carries straight on.
	await page.keyboard.press('Space');
	await page.keyboard.press('Space');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mountain Climbers');
	await expect(page.getByText('Get ready')).toBeHidden();
});
