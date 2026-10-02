import { expect, test } from '@playwright/test';

test('a new Workout is built in the editor, totals live, and starts', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'New Workout' }).click();
	await page.getByRole('textbox', { name: 'Workout name' }).fill('Leg Day');

	// Starting with nothing in it is refused.
	await page.getByRole('button', { name: 'Start' }).click();
	await expect(page.getByRole('alert')).toHaveText('Nothing to play yet: add an Interval before starting.');

	// An Interval at the root, typed as plain seconds.
	await page.getByRole('button', { name: '+ Add Interval' }).click();
	const warmUp = page.getByRole('group', { name: /^Interval/ }).first();
	await warmUp.getByRole('textbox', { name: 'Interval name' }).fill('Jog');
	await warmUp.getByRole('combobox', { name: 'Kind' }).selectOption('Warm-up');
	await warmUp.getByRole('textbox', { name: 'Duration' }).fill('90');
	await warmUp.getByRole('textbox', { name: 'Duration' }).press('Enter');
	await expect(warmUp.getByRole('textbox', { name: 'Duration' })).toHaveValue('1:30');
	await expect(page.getByTestId('total')).toHaveText('1:30');

	// A Group of Squats and Rest, 2 Rounds; Skip last rest drops the final Rest.
	await page.getByRole('button', { name: '+ Add Group' }).click();
	const block = page.getByRole('region', { name: 'Unnamed Group' });
	await expect(block.getByRole('note')).toContainText('Empty Group');
	await block.getByRole('spinbutton', { name: 'Rounds' }).fill('2');
	await block.getByRole('button', { name: '+ Add Interval' }).click();
	await block.getByRole('textbox', { name: 'Interval name' }).fill('Squats');
	await block.getByRole('textbox', { name: 'Duration' }).fill('0:20');
	await block.getByRole('textbox', { name: 'Duration' }).press('Enter');
	await block.getByRole('button', { name: '+ Add Interval' }).click();
	const rest = block.getByRole('group', { name: /^Interval/ }).last();
	await rest.getByRole('combobox', { name: 'Kind' }).selectOption('Rest');
	await rest.getByRole('textbox', { name: 'Duration' }).fill('10');
	await rest.getByRole('textbox', { name: 'Duration' }).press('Enter');
	await expect(block.getByRole('note')).toHaveCount(0);

	// 1:30 + (0:20 + 0:10) + 0:20
	await expect(page.getByTestId('total')).toHaveText('2:20');

	await page.getByRole('button', { name: 'Start' }).click();
	await expect(page.getByTestId('session')).toBeVisible();
	await expect(page).toHaveTitle('Leg Day · hiit-rome');

	// The changes were saved: the card on home shows them.
	await page.goto('/');
	await expect(page.getByRole('article', { name: 'Leg Day' }).getByTestId('duration')).toHaveText('2:20');
});

test('Edit on a card opens the editor, and a deleted Interval can be undone', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Edit Thursday Tabatas' }).click();
	await expect(page.getByTestId('total')).toHaveText('3:50');

	await page.getByRole('button', { name: 'Delete Cool-down' }).click();
	await expect(page.getByTestId('total')).toHaveText('3:30');
	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(page.getByTestId('total')).toHaveText('3:50');
	await expect(page.getByRole('group', { name: 'Interval Cool-down' })).toBeVisible();
});
