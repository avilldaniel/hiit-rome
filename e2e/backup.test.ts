import { expect, test, type Browser } from '@playwright/test';

/** A separate device, with storage of its own. */
async function device(browser: Browser, baseURL: string | undefined) {
	const page = await (await browser.newContext({ baseURL })).newPage();
	await page.goto('/settings');
	return page;
}

test('a backup exported on one device imports on another, Settings only when asked', async ({ browser, baseURL }) => {
	const phone = await device(browser, baseURL);
	await expect(phone.getByText('Last backed up: never')).toBeVisible();
	await phone.getByRole('checkbox', { name: 'Halfway' }).check();

	const downloading = phone.waitForEvent('download');
	await phone.getByRole('button', { name: 'Export backup' }).click();
	const download = await downloading;
	expect(download.suggestedFilename()).toMatch(/^hiit-rome-backup-\d{4}-\d{2}-\d{2}\.json$/);
	await expect(phone.getByText(/^Last backed up: (?!never)/)).toBeVisible();
	const file = await download.path();

	const tv = await device(browser, baseURL);
	await tv.getByLabel('Import backup').setInputFiles(file);
	await expect(tv.getByRole('dialog', { name: 'Import backup' })).toContainText('has 1 Workout');
	await tv.getByRole('checkbox', { name: /replace my Settings and Presets/ }).check();
	await tv.getByRole('button', { name: 'Import', exact: true }).click();

	// The seeded Workout is on both devices under its own id, so the backup's is added alongside, numbered.
	await expect(tv.getByRole('status')).toHaveText('Added 1 Workout; Settings and Presets replaced.');
	await expect(tv.getByRole('checkbox', { name: 'Halfway' })).toBeChecked();
	await tv.getByRole('link', { name: '← My Workouts' }).click();
	await expect(tv.getByRole('link', { name: 'Start Thursday Tabatas (2)' })).toBeVisible();

	// Imported again on the same device: the Settings are left alone unless asked.
	await tv.getByRole('link', { name: 'Settings' }).click();
	await tv.getByRole('checkbox', { name: 'Halfway' }).uncheck();
	await tv.getByLabel('Import backup').setInputFiles(file);
	await tv.getByRole('button', { name: 'Import', exact: true }).click();
	await expect(tv.getByRole('status')).toHaveText('Added 1 Workout.');
	await expect(tv.getByRole('checkbox', { name: 'Halfway' })).not.toBeChecked();
});

test('a file that isn’t a backup shows why, and changes nothing', async ({ browser, baseURL }) => {
	const page = await device(browser, baseURL);

	await page.getByLabel('Import backup').setInputFiles({ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('{"hello": 1}') });

	await expect(page.getByRole('alert')).toHaveText(/isn’t a hiit-rome backup/);
	await expect(page.getByRole('dialog')).toBeHidden();
});
