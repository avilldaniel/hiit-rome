import { expect, test, type Browser, type Page } from '@playwright/test';

declare global {
	interface Window {
		copied?: string;
	}
}

/**
 * A separate device: its own storage, with no share sheet, so Share copies the link; to a clipboard
 * of its own, as the system one is shared by tests running side by side.
 */
async function device(browser: Browser, baseURL: string | undefined) {
	const context = await browser.newContext({ baseURL });
	await context.addInitScript(() => {
		// @ts-expect-error -- removed so the clipboard fallback runs, as on a device without a share sheet.
		delete Navigator.prototype.share;
		// @ts-expect-error -- as above.
		delete Navigator.prototype.canShare;
		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText: async (text: string) => void (window.copied = text) }
		});
	});
	return context.newPage();
}

const copiedLink = async (page: Page) => {
	await expect(page.getByRole('status').filter({ hasText: 'Link copied' })).toBeVisible();
	return (await page.evaluate(() => window.copied))!;
};

test('a Workout shared from one device opens as a preview on another, and can be added there', async ({ browser, baseURL }) => {
	const trainer = await device(browser, baseURL);
	await trainer.goto('/');
	await trainer.getByRole('link', { name: 'Edit Thursday Tabatas' }).click();
	await trainer.getByRole('textbox', { name: 'Workout name' }).fill('Friday Tabatas');
	await trainer.getByRole('button', { name: 'Share Friday Tabatas' }).click();
	const link = await copiedLink(trainer);
	expect(new URL(link).pathname).toBe('/share');

	const friend = await device(browser, baseURL);
	await friend.goto(link);
	await expect(friend.getByRole('heading', { name: 'Friday Tabatas', level: 1 })).toBeVisible();
	await expect(friend.getByTestId('total')).toHaveText('3:50');
	await expect(friend.getByText('Tabata × 2')).toBeVisible();
	await expect(friend.getByText('3 Rounds')).toBeVisible();

	await friend.getByRole('button', { name: 'Add to My Workouts' }).click();
	await expect(friend.getByRole('status')).toContainText('Added “Friday Tabatas” to My Workouts');
	await friend.getByRole('link', { name: 'My Workouts' }).click();
	await expect(friend.getByRole('article', { name: 'Friday Tabatas' }).getByTestId('duration')).toHaveText('3:50');
});

test('Share on a card copies a link whose Start plays the Workout without adding it', async ({ browser, baseURL }) => {
	const trainer = await device(browser, baseURL);
	await trainer.goto('/');
	await trainer.getByRole('button', { name: 'Share Thursday Tabatas' }).click();
	const link = await copiedLink(trainer);

	const friend = await device(browser, baseURL);
	await friend.goto('/');
	// Gone from this device, so only the link can bring it back.
	await friend.getByRole('button', { name: 'Delete' }).click();
	await expect(friend.getByText('Deleted “Thursday Tabatas”')).toBeVisible();
	await friend.goto(link);
	await friend.getByRole('link', { name: 'Start' }).click();
	await expect(friend.getByTestId('session')).toBeVisible();
	await expect(friend).toHaveTitle('Thursday Tabatas · hiit-rome');

	await friend.goto('/');
	await expect(friend.getByRole('article', { name: 'Thursday Tabatas' })).toHaveCount(0);
});

test('a damaged share link says so', async ({ page }) => {
	await page.goto('/share#1.garbled');
	await expect(page.getByRole('heading', { name: 'This link can’t be opened' })).toBeVisible();
	await expect(page.getByRole('alert')).toContainText('damaged');
});
