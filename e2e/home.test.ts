import { expect, test } from '@playwright/test';

test('the app opens to My Workouts, and Start on a card opens its Session', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'My Workouts', level: 1 })).toBeVisible();

	// Seeded on first launch, so the list isn't empty.
	const card = page.getByRole('article', { name: 'Thursday Tabatas' });
	await expect(card.getByTestId('duration')).toHaveText('3:50');

	await card.getByRole('link', { name: 'Start Thursday Tabatas' }).click();
	await expect(page.getByTestId('session')).toBeVisible();
	await expect(page.getByText('Press Space or tap to start')).toBeVisible();
	await expect(page).toHaveTitle('Thursday Tabatas · hiit-rome');
});
