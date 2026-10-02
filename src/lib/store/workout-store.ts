import { buildTimeline } from '../engine/timeline';
import type { Workout } from '../engine/workout';

/** A Workout as kept on this device, with the bookkeeping that never travels in a share link. */
export interface StoredWorkout extends Workout {
	favorite: boolean;
	createdAt: number;
	/** When a Session of it last started, or null if never. */
	lastUsedAt: number | null;
}

/** One step of the stored data's schema, run inside the upgrade transaction. */
export type Migration = (tx: IDBTransaction) => void;

/**
 * Every schema change, in order. The schema version is the number of migrations; opening the
 * store runs whichever ones the device hasn't had yet. Only ever append.
 */
export const MIGRATIONS: Migration[] = [(tx) => tx.db.createObjectStore('workouts', { keyPath: 'id' })];

export interface StoreOptions {
	indexedDB: IDBFactory;
	now: () => number;
	/** Asks the browser not to evict the app's data. */
	persist: () => Promise<boolean>;
	/** Workouts added on first launch, so the list isn't empty. */
	seed: Workout[];
	migrations: Migration[];
}

const BROWSER: StoreOptions = {
	get indexedDB() {
		return globalThis.indexedDB;
	},
	now: () => Date.now(),
	persist: async () => (await navigator.storage?.persist?.()) ?? false,
	seed: [],
	migrations: MIGRATIONS
};

export type WorkoutSort = 'recent' | 'name' | 'duration';

export interface ListQuery {
	/** Case-insensitive substring of the name. */
	search?: string;
	sort?: WorkoutSort;
}

const totalMs = (w: Workout) => buildTimeline(w.items).totalMs;

const COMPARE: Record<WorkoutSort, (a: StoredWorkout, b: StoredWorkout) => number> = {
	name: (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
	duration: (a, b) => totalMs(a) - totalMs(b),
	// Most recently used first; never-used ones after, newest first.
	recent: (a, b) => (b.lastUsedAt ?? -Infinity) - (a.lastUsedAt ?? -Infinity) || b.createdAt - a.createdAt
};

const DB_NAME = 'hiit-rome';
const WORKOUTS = 'workouts';

const done = <T>(request: IDBRequest<T>): Promise<T> =>
	new Promise<T>((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});

const fresh = (workout: Workout, now: number): StoredWorkout => ({
	...workout,
	favorite: false,
	createdAt: now,
	lastUsedAt: null
});

export async function openWorkoutStore(overrides: Partial<StoreOptions> = {}) {
	const options = { ...BROWSER, ...overrides };
	let firstLaunch = false;
	const request = options.indexedDB.open(DB_NAME, options.migrations.length);
	request.onupgradeneeded = ({ oldVersion }) => {
		const tx = request.transaction!;
		for (const migrate of options.migrations.slice(oldVersion)) migrate(tx);
		if (oldVersion > 0) return;
		firstLaunch = true;
		for (const workout of options.seed) tx.objectStore(WORKOUTS).add(fresh(workout, options.now()));
	};
	const db = await done(request);
	// Best effort: the browser may say no, and the app works either way.
	if (firstLaunch) options.persist().catch(() => false);
	const workouts = (mode: IDBTransactionMode = 'readonly') => db.transaction(WORKOUTS, mode).objectStore(WORKOUTS);

	/** Applies a change to one stored Workout within a single transaction. */
	async function update(id: string, change: (w: StoredWorkout) => Partial<StoredWorkout>): Promise<void> {
		const store = workouts('readwrite');
		const current = (await done(store.get(id))) as StoredWorkout | undefined;
		if (!current) throw new Error(`No Workout with id ${id}`);
		await done(store.put({ ...current, ...change(current) }));
	}

	const get = (id: string) => done(workouts().get(id)) as Promise<StoredWorkout | undefined>;

	async function add(workout: Workout): Promise<StoredWorkout> {
		const stored = fresh(workout, options.now());
		await done(workouts('readwrite').add(stored));
		return stored;
	}

	return {
		add,
		/** Replaces a Workout's content, keeping its Favorite flag and timestamps. */
		save: ({ id, name, leadInSec, items }: Workout) => update(id, () => ({ name, leadInSec, items })),
		async duplicate(id: string): Promise<StoredWorkout> {
			const original = await get(id);
			if (!original) throw new Error(`No Workout with id ${id}`);
			const { name, leadInSec, items } = original;
			return add({ id: crypto.randomUUID(), name: `${name} (copy)`, leadInSec, items });
		},
		/** Deletes a Workout, returning it as it was so the deletion can be undone with `restore`. */
		async remove(id: string): Promise<StoredWorkout> {
			const store = workouts('readwrite');
			const current = (await done(store.get(id))) as StoredWorkout | undefined;
			if (!current) throw new Error(`No Workout with id ${id}`);
			await done(store.delete(id));
			return current;
		},
		restore: async (workout: StoredWorkout) => void (await done(workouts('readwrite').add(workout))),
		get,
		async list({ search = '', sort = 'recent' }: ListQuery = {}): Promise<StoredWorkout[]> {
			const all = (await done(workouts().getAll())) as StoredWorkout[];
			const needle = search.trim().toLowerCase();
			return all
				.filter((w) => w.name.toLowerCase().includes(needle))
				.sort((a, b) => Number(b.favorite) - Number(a.favorite) || COMPARE[sort](a, b));
		},
		markUsed: (id: string) => update(id, () => ({ lastUsedAt: options.now() })),
		setFavorite: (id: string, favorite: boolean) => update(id, () => ({ favorite })),
		close: () => db.close()
	};
}

export type WorkoutStore = Awaited<ReturnType<typeof openWorkoutStore>>;
