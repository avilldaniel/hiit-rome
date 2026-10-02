import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, type Settings } from '../engine/settings';
import { group, interval, type Item, type Workout } from '../engine/workout';
import { MIGRATIONS, openWorkoutStore, type Migration, type StoreOptions } from './workout-store';

const workout = (name: string, items: Item[] = [interval('Work', 'work', 20)]): Workout => ({
	id: crypto.randomUUID(),
	name,
	leadInSec: 10,
	items
});

function device() {
	const indexedDB = new IDBFactory();
	let clock = 1_000;
	const open = (options: Partial<StoreOptions> = {}) =>
		openWorkoutStore({ indexedDB, now: () => clock++, persist: async () => true, ...options });
	return { indexedDB, open };
}

describe('Workout store', () => {
	it('saves a Workout and reads it back after the app reopens', async () => {
		const { open } = device();
		const tabata = workout('Tabata', [group(8, [interval('Work', 'work', 20), interval('Rest', 'rest', 10)])]);

		const first = await open();
		await first.add(tabata);
		first.close();
		const store = await open();

		expect(await store.get(tabata.id)).toMatchObject({ ...tabata, favorite: false, lastUsedAt: null });
		expect((await store.list()).map((w) => w.name)).toEqual(['Tabata']);
	});

	it('searches names case-insensitively, anywhere in the name', async () => {
		const store = await device().open();
		for (const name of ['Morning HIIT', 'Leg day', 'hiit finisher']) await store.add(workout(name));

		expect((await store.list({ search: 'HiIt' })).map((w) => w.name).sort()).toEqual(['Morning HIIT', 'hiit finisher']);
		expect(await store.list({ search: 'yoga' })).toEqual([]);
	});

	it('sorts by name, by total duration from the Timeline, or by most recently used, with Favorites pinned first', async () => {
		const store = await device().open();
		// 8 Rounds of 20/10, the last Rest skipped: 3:50.
		const tabata = await store.add(workout('Tabata', [group(8, [interval('Work', 'work', 20), interval('Rest', 'rest', 10)])]));
		const short = await store.add(workout('bike sprints', [interval('Sprint', 'work', 60)]));
		const long = await store.add(workout('Long run', [interval('Run', 'work', 1800)]));
		const names = async (sort: 'recent' | 'name' | 'duration') => (await store.list({ sort })).map((w) => w.name);

		expect(await names('name')).toEqual(['bike sprints', 'Long run', 'Tabata']);
		expect(await names('duration')).toEqual(['bike sprints', 'Tabata', 'Long run']);

		// Used most recently first; never-used Workouts last, newest first.
		await store.markUsed(short.id);
		await store.markUsed(tabata.id);
		expect(await names('recent')).toEqual(['Tabata', 'bike sprints', 'Long run']);

		await store.setFavorite(long.id, true);
		expect(await names('name')).toEqual(['Long run', 'bike sprints', 'Tabata']);
		expect(await names('recent')).toEqual(['Long run', 'Tabata', 'bike sprints']);
		await store.setFavorite(long.id, false);
		expect(await names('name')).toEqual(['bike sprints', 'Long run', 'Tabata']);
	});

	it('duplicates a Workout as a new, unused, non-Favorite copy', async () => {
		const store = await device().open();
		const original = await store.add(workout('Tabata'));
		await store.setFavorite(original.id, true);
		await store.markUsed(original.id);

		const copy = await store.duplicate(original.id);

		expect(copy.id).not.toBe(original.id);
		expect(copy).toMatchObject({ name: 'Tabata (copy)', items: original.items, favorite: false, lastUsedAt: null });
		expect((await store.list({ sort: 'name' })).map((w) => w.name)).toEqual(['Tabata', 'Tabata (copy)']);
	});

	it('deletes a Workout, and Undo puts it back exactly as it was', async () => {
		const store = await device().open();
		const tabata = await store.add(workout('Tabata'));
		await store.setFavorite(tabata.id, true);
		await store.markUsed(tabata.id);
		const before = await store.get(tabata.id);

		const deleted = await store.remove(tabata.id);
		expect(await store.list()).toEqual([]);
		expect(await store.get(tabata.id)).toBeUndefined();

		await store.restore(deleted);
		expect(await store.get(tabata.id)).toEqual(before);
	});

	it('saves edits to a Workout, keeping its Favorite flag and timestamps', async () => {
		const store = await device().open();
		const tabata = await store.add(workout('Tabata'));
		await store.setFavorite(tabata.id, true);

		// `tabata` still says `favorite: false`; the store's own flag wins.
		await store.save({ ...tabata, name: 'Tabata ×2', items: [interval('Work', 'work', 40)] });

		expect(await store.get(tabata.id)).toMatchObject({
			name: 'Tabata ×2',
			favorite: true,
			createdAt: tabata.createdAt,
			items: [{ durationSec: 40 }]
		});
	});

	it('keeps a Workout’s Lead-in and Cue overrides through edits and copies', async () => {
		const store = await device().open();
		const tabata = await store.add(workout('Tabata'));

		await store.save({ ...tabata, leadInSec: 0, cueOverrides: { warningSec: 5, halfway: true } });
		const copy = await store.duplicate(tabata.id);

		for (const id of [tabata.id, copy.id]) {
			expect(await store.get(id)).toMatchObject({ leadInSec: 0, cueOverrides: { warningSec: 5, halfway: true } });
		}
	});

	it('starts with the default Settings, and keeps the trainer’s changes after the app reopens', async () => {
		const { open } = device();
		const first = await open();
		expect(await first.getSettings()).toEqual(DEFAULT_SETTINGS);

		const changed: Settings = {
			voiceId: 'com.apple.voice.Daniel',
			cues: { ...DEFAULT_SETTINGS.cues, warningSec: 5, halfway: true },
			resumeLeadIn: false
		};
		await first.saveSettings(changed);
		first.close();

		expect(await (await open()).getSettings()).toEqual(changed);
	});

	it('adds default Settings on a device that kept its Workouts under the first schema', async () => {
		const { open } = device();
		const v1 = await open({ migrations: MIGRATIONS.slice(0, 1) });
		await v1.add(workout('Tabata'));
		v1.close();

		const store = await open();

		expect((await store.list()).map((w) => w.name)).toEqual(['Tabata']);
		expect(await store.getSettings()).toEqual(DEFAULT_SETTINGS);
	});

	it('on first launch only, seeds Workouts and asks for persistent storage', async () => {
		const { open } = device();
		const seeded = workout('Thursday Tabatas');
		let asked = 0;
		const persist = async () => (asked++, true);

		const first = await open({ seed: [seeded], persist });
		await first.remove(seeded.id);
		first.close();
		const store = await open({ seed: [seeded], persist });

		expect(asked).toBe(1);
		expect(await store.list()).toEqual([]);
	});

	it('migrates Workouts saved under an older schema when the app opens', async () => {
		const { open } = device();
		const v1 = await open();
		await v1.add(workout('Tabata'));
		v1.close();

		// A later schema that, say, rewrites every name.
		const toV2: Migration = (tx) => {
			tx.objectStore('workouts').openCursor().onsuccess = function () {
				const cursor = this.result;
				if (!cursor) return;
				cursor.update({ ...cursor.value, name: `${cursor.value.name} v2` });
				cursor.continue();
			};
		};
		const v2 = await open({ migrations: [...MIGRATIONS, toV2] });

		expect((await v2.list()).map((w) => w.name)).toEqual(['Tabata v2']);
		v2.close();
		// Already migrated: reopening runs nothing again.
		const again = await open({ migrations: [...MIGRATIONS, toV2] });
		expect((await again.list()).map((w) => w.name)).toEqual(['Tabata v2']);
	});
});
