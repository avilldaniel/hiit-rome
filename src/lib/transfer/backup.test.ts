import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PRESETS_SEC } from '../engine/countdown';
import { DEFAULT_SETTINGS, type Settings } from '../engine/settings';
import { group, interval, type Item, type Workout } from '../engine/workout';
import { openWorkoutStore } from '../store/workout-store';
import { exportBackup, importBackup, readBackup, readBackupFile, type BackupMigration } from './backup';

const workout = (name: string, items: Item[] = [interval('Work', 'work', 20)]): Workout => ({
	id: crypto.randomUUID(),
	name,
	leadInSec: 10,
	items
});

const tabata = (): Workout => ({
	...workout('Tabata', [group(8, [interval('Burpees', 'work', 20), interval('Rest', 'rest', 10, { color: 'neutral' })], { name: 'Tabata' })]),
	cueOverrides: { halfway: true, warningSec: 5 }
});

const mySettings: Settings = {
	...DEFAULT_SETTINGS,
	voiceId: 'moira',
	cues: { ...DEFAULT_SETTINGS.cues, finalBeeps: false },
	countdown: { color: 'work', warning: false }
};

/** A device with its own store and clock. */
async function device() {
	let clock = Date.UTC(2026, 9, 2, 12);
	const store = await openWorkoutStore({ indexedDB: new IDBFactory(), now: () => clock, persist: async () => true });
	return { store, tick: (ms: number) => (clock += ms), now: () => clock };
}

/** Reads a backup file that must be valid. */
function read(text: string) {
	const result = readBackup(text);
	if ('error' in result) throw new Error(result.error);
	return result.backup;
}

/** The outline without its ids, which an added Workout gets afresh. */
const shape = (items: Item[]): unknown[] =>
	items.map(({ id: _, ...item }) => (item.type === 'group' ? { ...item, items: shape(item.items) } : item));

const names = async (store: Awaited<ReturnType<typeof device>>['store']) =>
	(await store.list({ sort: 'name' })).map((w) => w.name);

describe('Backup', () => {
	it('carries every Workout, the Presets and the Settings to another device', async () => {
		const phone = await device();
		const hiit = await phone.store.add(tabata());
		const run = await phone.store.add(workout('Long run', [interval('Run', 'work', 1800)]));
		await phone.store.setFavorite(run.id, true);
		await phone.store.markUsed(hiit.id);
		await phone.store.saveSettings(mySettings);
		await phone.store.savePresets([30, 60, 90, 120, 150]);

		const file = await exportBackup(phone.store);
		const tv = await device();
		const summary = await importBackup(tv.store, read(file.text), { replaceSettingsAndPresets: true });

		expect(summary).toEqual({ added: 2, skipped: 0 });
		const [first, second] = await tv.store.list({ sort: 'name' });
		expect(first).toMatchObject({ name: 'Long run', favorite: true, lastUsedAt: null });
		expect(shape(first.items)).toEqual(shape(run.items));
		expect(second).toMatchObject({
			name: 'Tabata',
			leadInSec: 10,
			cueOverrides: { halfway: true, warningSec: 5 },
			favorite: false,
			lastUsedAt: phone.now()
		});
		expect(shape(second.items)).toEqual(shape(hiit.items));
		expect(await tv.store.getSettings()).toEqual(mySettings);
		expect(await tv.store.getPresets()).toEqual([30, 60, 90, 120, 150]);
	});

	it('is one JSON file with its schema version and export date, named for the day', async () => {
		const { store, now } = await device();
		await store.add(workout('Tabata'));

		const file = await exportBackup(store);

		expect(file.filename).toBe('hiit-rome-backup-2026-10-02.json');
		expect(JSON.parse(file.text)).toMatchObject({
			app: 'hiit-rome',
			version: 1,
			exportedAt: new Date(now()).toISOString(),
			workouts: [{ name: 'Tabata' }],
			presets: expect.any(Array),
			settings: DEFAULT_SETTINGS
		});
	});

	it('records the export as the last backup', async () => {
		const { store, tick, now } = await device();
		expect(await store.lastBackupAt()).toBeNull();

		tick(60_000);
		await exportBackup(store);

		expect(await store.lastBackupAt()).toBe(now());
	});

	describe('import', () => {
		it('skips a Workout already on the device with the same id and content', async () => {
			const { store } = await device();
			const hiit = await store.add(tabata());
			const file = await exportBackup(store);

			expect(await importBackup(store, read(file.text), { replaceSettingsAndPresets: false })).toEqual({ added: 0, skipped: 1 });
			expect(await names(store)).toEqual(['Tabata']);
			expect(await store.get(hiit.id)).toMatchObject({ items: hiit.items });
		});

		it('adds a copy, numbered, of a Workout changed since the backup, leaving the trainer’s as it is', async () => {
			const { store } = await device();
			const hiit = await store.add(tabata());
			const backup = read((await exportBackup(store)).text);
			const edited = { ...hiit, leadInSec: 3 };
			await store.save(edited);

			expect(await importBackup(store, backup, { replaceSettingsAndPresets: false })).toEqual({ added: 1, skipped: 0 });
			const [mine, copy] = await store.list({ sort: 'name' });
			expect(mine).toMatchObject({ id: hiit.id, name: 'Tabata', leadInSec: 3 });
			expect(copy).toMatchObject({ name: 'Tabata (2)', leadInSec: 10 });
			expect(copy.id).not.toBe(hiit.id);
		});

		it('adds a Workout from another device under a new id, numbering it past every name taken', async () => {
			const phone = await device();
			const theirs = await phone.store.add(workout('Tabata'));
			await phone.store.add(workout('Tabata'));
			await phone.store.add(workout('Leg day'));
			const backup = read((await exportBackup(phone.store)).text);
			const tv = await device();
			await tv.store.add(workout('Tabata'));
			await tv.store.add(workout('Tabata (2)'));

			expect(await importBackup(tv.store, backup, { replaceSettingsAndPresets: false })).toEqual({ added: 3, skipped: 0 });
			expect(await names(tv.store)).toEqual(['Leg day', 'Tabata', 'Tabata (2)', 'Tabata (3)', 'Tabata (4)']);
			expect((await tv.store.list()).map((w) => w.id)).not.toContain(theirs.id);
		});

		it('treats a Workout without Cue overrides and one with none set as the same', async () => {
			const { store } = await device();
			const plain = await store.add(workout('Plain'));
			const backup = read((await exportBackup(store)).text);
			await store.save({ ...plain, cueOverrides: {} });

			expect(await importBackup(store, backup, { replaceSettingsAndPresets: false })).toEqual({ added: 0, skipped: 1 });
		});

		it('replaces Settings and Presets only when the trainer confirms it', async () => {
			const phone = await device();
			await phone.store.saveSettings(mySettings);
			await phone.store.savePresets([30, 60, 90, 120, 150]);
			const backup = read((await exportBackup(phone.store)).text);
			const tv = await device();
			const tvSettings = { ...DEFAULT_SETTINGS, resumeLeadIn: false };
			await tv.store.saveSettings(tvSettings);

			await importBackup(tv.store, backup, { replaceSettingsAndPresets: false });
			expect(await tv.store.getSettings()).toEqual(tvSettings);
			expect(await tv.store.getPresets()).toEqual(DEFAULT_PRESETS_SEC);

			await importBackup(tv.store, backup, { replaceSettingsAndPresets: true });
			expect(await tv.store.getSettings()).toEqual(mySettings);
			expect(await tv.store.getPresets()).toEqual([30, 60, 90, 120, 150]);
		});
	});

	describe('reading a file', () => {
		it('brings a backup from an older version of the app up to date', () => {
			// Pretend version 1 kept the Presets under another name, and version 2 renamed it.
			const renamePresets: BackupMigration = ({ countdownPresets, ...data }) => ({ ...data, presets: countdownPresets });
			const old = {
				app: 'hiit-rome',
				version: 1,
				exportedAt: '2026-01-01T00:00:00.000Z',
				workouts: [{ ...tabata(), favorite: false, createdAt: 1, lastUsedAt: null }],
				countdownPresets: [30, 60, 90, 120, 150],
				settings: DEFAULT_SETTINGS
			};

			const result = readBackup(JSON.stringify(old), [renamePresets]);

			expect(result).toMatchObject({ backup: { version: 2, presets: [30, 60, 90, 120, 150], workouts: [{ name: 'Tabata' }] } });
			const current = { ...old, version: 2, presets: [10, 20, 30, 40, 50] };
			expect(readBackup(JSON.stringify(current), [renamePresets])).toMatchObject({ backup: { presets: [10, 20, 30, 40, 50] } });
		});

		describe('refuses, with a reason for the trainer,', () => {
			async function validBackup() {
				const { store } = await device();
				await store.add(tabata());
				return JSON.parse((await exportBackup(store)).text);
			}

			it('a file that isn’t a backup', () => {
				const notBackup = { error: expect.stringMatching(/isn’t a hiit-rome backup/) };
				for (const text of ['', 'not json', '[1, 2]', '{"workouts": []}', '{"app": "other", "version": 1}']) {
					expect(readBackup(text)).toEqual(notBackup);
				}
			});

			it('an older backup a migration can’t make sense of', async () => {
				const older = { ...(await validBackup()), version: 1 };
				const fails: BackupMigration = () => {
					throw new TypeError('missing field');
				};

				expect(readBackup(JSON.stringify(older), [fails])).toEqual({ error: expect.stringMatching(/damaged/) });
			});

			it('a chosen file too big to be a backup, or one that can’t be read', async () => {
				const notBackup = { error: expect.stringMatching(/isn’t a hiit-rome backup/) };
				const unreadable = new Blob(['{}']);
				unreadable.text = () => Promise.reject(new DOMException('gone', 'NotReadableError'));

				expect(await readBackupFile(new Blob([JSON.stringify(await validBackup())]))).toHaveProperty('backup');
				expect(await readBackupFile(new Blob([new Uint8Array(20_000_001)]))).toEqual(notBackup);
				expect(await readBackupFile(unreadable)).toEqual(notBackup);
			});

			it('a backup from a newer version of the app', async () => {
				const newer = { ...(await validBackup()), version: 2 };

				expect(readBackup(JSON.stringify(newer))).toEqual({ error: expect.stringMatching(/newer version/) });
			});

			it('a backup whose contents break the model', async () => {
				const valid = await validBackup();
				const [w] = valid.workouts;
				const bad: unknown[] = [
					{ ...valid, version: 0 },
					{ ...valid, exportedAt: 'yesterday' },
					{ ...valid, version: '1' },
					{ ...valid, workouts: 'none' },
					{ ...valid, workouts: [{ ...w, id: undefined }] },
					{ ...valid, workouts: [{ ...w, favorite: 'yes' }] },
					{ ...valid, workouts: [{ ...w, leadInSec: -1 }] },
					{ ...valid, workouts: [{ ...w, items: [{ ...w.items[0], rounds: 0 }] }] },
					{ ...valid, workouts: [{ ...w, items: [{ ...w.items[0], id: undefined }] }] },
					{ ...valid, presets: [60, 120] },
					{ ...valid, presets: [0, 60, 120, 180, 240] },
					{ ...valid, settings: undefined },
					{ ...valid, settings: { ...valid.settings, cues: { ...valid.settings.cues, halfway: undefined } } },
					{ ...valid, settings: { ...valid.settings, voiceId: 4 } },
					{ ...valid, settings: { ...valid.settings, cues: { ...valid.settings.cues, warningSec: 0 } } },
					{ ...valid, settings: { ...valid.settings, countdown: { ...valid.settings.countdown, color: 'neutral' } } }
				];

				expect(readBackup(JSON.stringify(valid))).toHaveProperty('backup');
				for (const data of bad) expect(readBackup(JSON.stringify(data))).toEqual({ error: expect.stringMatching(/damaged/) });
			});
		});
	});
});
