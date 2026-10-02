import { expect, test } from '@playwright/test';

test('a Tabata Wizard totals live, and Start now saves the Workout and opens its Session', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Wizard' }).click();
	await page.getByRole('link', { name: /^Tabata/ }).click();

	// One Tabata by default: 8 × (0:20 + 0:10) − the last Rest.
	const total = page.getByTestId('total');
	await expect(total).toHaveText('3:50');
	await expect(page.getByRole('textbox', { name: 'Workout name' })).toHaveValue('Tabata (20/10)');

	// Four Tabatas with a minute between: 4 × 3:50 + 3 × 1:00.
	await page.getByRole('spinbutton', { name: 'Tabatas' }).fill('4');
	await expect(total).toHaveText('18:20');
	await expect(page.getByRole('textbox', { name: 'Workout name' })).toHaveValue('Tabata ×4 (20/10)');
	await page.getByRole('textbox', { name: 'Warm-up' }).fill('5:00');
	await page.getByRole('textbox', { name: 'Warm-up' }).press('Enter');
	await expect(total).toHaveText('23:20');

	await page.getByRole('button', { name: 'Start now' }).click();
	await expect(page.getByTestId('session')).toBeVisible();
	await expect(page).toHaveTitle('Tabata ×4 (20/10) · hiit-rome');

	// Saved as an ordinary Workout of the trainer's own.
	await page.goto('/');
	await expect(page.getByRole('article', { name: 'Tabata ×4 (20/10)' }).getByTestId('duration')).toHaveText('23:20');
});

test('a Circuit Wizard needs an exercise, and Save & edit opens its Workout in the editor', async ({ page }) => {
	await page.goto('/wizard/circuit');
	const exercises = page.getByRole('textbox', { name: 'Exercises', exact: true });

	// Nothing to make without an exercise.
	await page.getByRole('button', { name: 'Save & edit' }).click();
	await expect(exercises).toBeFocused();
	await expect(page).toHaveURL(/\/wizard\/circuit$/);

	await exercises.fill('Squats\nPush-ups\n');
	// 3 Rounds of (0:45 + 0:15 + 0:45 + a 1:00 Round rest), less the last Round rest.
	await expect(page.getByTestId('total')).toHaveText('7:15');
	await page.getByRole('textbox', { name: 'Workout name' }).fill('Leg Circuit');

	await page.getByRole('button', { name: 'Save & edit' }).click();
	await expect(page.getByRole('textbox', { name: 'Workout name' })).toHaveValue('Leg Circuit');
	await expect(page.getByTestId('total')).toHaveText('7:15');
	await expect(page.getByRole('group', { name: 'Interval Squats' })).toBeVisible();
	await expect(page.getByRole('group', { name: 'Interval Round rest' })).toBeVisible();
});
