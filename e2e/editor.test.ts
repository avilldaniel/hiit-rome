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

test('the outline is restructured by duplicating, wrapping and dragging, each undoable', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Edit Thursday Tabatas' }).click();
	const total = page.getByTestId('total');
	await expect(total).toHaveText('3:50');

	// Duplicate goes right after the original, and Undo takes it away again.
	await page.getByRole('button', { name: 'Duplicate Warm-up' }).click();
	await expect(page.getByRole('group', { name: 'Interval Warm-up' })).toHaveCount(2);
	await expect(total).toHaveText('4:10');
	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(total).toHaveText('3:50');

	// Wrap two Intervals in a Group.
	await page.getByRole('checkbox', { name: 'Select Warm-up' }).check();
	await page.getByRole('checkbox', { name: 'Select Cool-down' }).check();
	await page.getByRole('button', { name: 'Wrap in Group' }).click();
	// The seed's inner Tabata Group is unnamed too; the new one comes first.
	const wrapper = page.getByRole('region', { name: 'Unnamed Group' }).first();
	await expect(wrapper.getByRole('group', { name: 'Interval Warm-up' })).toBeVisible();
	await expect(wrapper.getByRole('group', { name: 'Interval Cool-down' })).toBeVisible();
	await expect(wrapper.getByRole('spinbutton', { name: 'Rounds' })).toHaveValue('1');
	await expect(total).toHaveText('3:50');
	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(page.getByRole('region', { name: 'Unnamed Group' })).toHaveCount(1);

	// Drag Cool-down into the Tabata Group, before Between Tabatas: it now plays each Round.
	await page
		.getByRole('img', { name: 'Drag Interval Cool-down' })
		.dragTo(page.getByRole('group', { name: 'Interval Between Tabatas' }));
	const tabata = page.getByRole('region', { name: 'Group Tabata' });
	await expect(tabata.getByRole('group', { name: 'Interval Cool-down' })).toBeVisible();
	await expect(total).toHaveText('4:10');
	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(tabata.getByRole('group', { name: 'Interval Cool-down' })).toHaveCount(0);
	await expect(total).toHaveText('3:50');

	// Tabata is already two levels deep, so it can't go inside another Group.
	await page.getByRole('button', { name: '+ Add Group' }).last().click();
	const added = page.getByRole('region', { name: 'Unnamed Group' }).last();
	const target = added.getByRole('button', { name: '+ Add Interval' });
	await tabata.getByRole('img', { name: 'Drag Group Tabata' }).hover();
	await page.mouse.down();
	await target.hover();
	await target.hover({ position: { x: 5, y: 5 } });
	await expect(page.getByText('Can’t drop here: Groups nest at most 2 levels deep')).toBeVisible();
	await page.mouse.up();
	await expect(added.getByRole('region')).toHaveCount(0);
	await expect(total).toHaveText('3:50');
});
