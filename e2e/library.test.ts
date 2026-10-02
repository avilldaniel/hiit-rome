import { expect, test } from '@playwright/test';

test('the Library lists Samples, and a preview starts one as it is', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Library' }).click();
	await expect(page.getByRole('heading', { name: 'Library', level: 1 })).toBeVisible();

	const card = page.getByRole('link', { name: /^Double Tabata/ });
	await expect(card).toContainText('Intermediate · Tabata');
	await expect(card.getByTestId('duration')).toHaveText('15:40');

	await card.click();
	await expect(page.getByRole('heading', { name: 'Double Tabata', level: 1 })).toBeVisible();
	await expect(page.getByTestId('total')).toHaveText('15:40');
	await expect(page.getByText('Tabata × 2')).toBeVisible();
	await expect(page.getByText('Between Tabatas')).toBeVisible();

	await page.getByRole('link', { name: 'Start' }).click();
	await expect(page.getByTestId('session')).toBeVisible();
	await expect(page).toHaveTitle('Double Tabata · hiit-rome');

	// Started without copying.
	await page.goto('/');
	await expect(page.getByRole('article', { name: 'Double Tabata' })).toHaveCount(0);
});

test('Add to My Workouts copies a Sample, and changing the copy leaves the Sample as it was', async ({ page }) => {
	await page.goto('/library/sample-classic-40-20');
	await page.getByRole('button', { name: 'Add to My Workouts' }).click();
	await expect(page.getByRole('status')).toContainText('Added “Classic 40/20” to My Workouts');

	await page.getByRole('link', { name: 'Edit your copy' }).click();
	await expect(page).toHaveURL(/\/edit\/(?!sample-)/);
	await page.getByRole('textbox', { name: 'Workout name' }).fill('My 40/20');
	await page.getByRole('textbox', { name: 'Workout name' }).press('Enter');

	await page.goto('/');
	await expect(page.getByRole('article', { name: 'My 40/20' }).getByTestId('duration')).toHaveText('17:40');

	await page.goto('/library/sample-classic-40-20');
	await expect(page.getByRole('heading', { name: 'Classic 40/20', level: 1 })).toBeVisible();
	await expect(page.getByTestId('total')).toHaveText('17:40');
});
