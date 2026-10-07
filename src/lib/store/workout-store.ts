import { DEFAULT_PRESETS_SEC } from '../engine/countdown';
import { effectiveCueSettings } from '../engine/cues';
import type { SessionSnapshot } from '../engine/session';
import { DEFAULT_SETTINGS, type Settings } from '../engine/settings';
import { buildTimeline } from '../engine/timeline';
import type { Workout } from '../engine/workout';

/** A Workout as kept on this device, with the bookkeeping that never travels in a share link. */
export interface StoredWorkout extends Workout {
	favorite: boolean;
	createdAt: number;
	/** When a Session of it last started, or null if never. */
	lastUsedAt: number | null;
}

/** The active Session, as the screen running it hands it over: a Workout's, or a Countdown. */
export type ActiveSession = {
	/** Shown when offering it back. */
	workoutName: string;
	session: SessionSnapshot;
} & ({ workoutId: string } | { countdown: true });

/** The active Session, saved as it goes so it can be offered back after a reload or crash. */
export type SavedSession = ActiveSession & { savedAt: number };

/** A saved Session older than this is discarded rather than offered back. */
export const SAVED_SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

/** One step of the stored data's schema, run inside the upgrade transaction. */
export type Migration = (tx: IDBTransaction) => void;

/**
 * Every schema change, in order. The schema version is the number of migrations; opening the
 * store runs whichever ones the device hasn't had yet. Only ever append.
 */
export const MIGRATIONS: Migration[] = [
	(tx) => tx.db.createObjectStore('workouts', { keyPath: 'id' }),
	// App-wide records, such as Settings, each under its own key.
	(tx) => tx.db.createObjectStore('app')
];

export interface StoreOptions {
	indexedDB: IDBFactory;
	now: () => number;
	/** Asks the browser not to evict the app's data. */
	persist: () => Promise<boolean>;
	/** Workouts added on first launch, so the list isn't empty. */
	seed: Workout[];
	migrations: Migration[];
}

const BROWSER_DEFAULTS: StoreOptions = {
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

/** Orders two Workouts; `totalMs` gives each one's Timeline total, worked out once per listing. */
type Compare = (a: StoredWorkout, b: StoredWorkout, totalMs: (w: StoredWorkout) => number) => number;

const COMPARE: Record<WorkoutSort, Compare> = {
	name: (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
	duration: (a, b, totalMs) => totalMs(a) - totalMs(b),
	// Most recently used first; never-used ones after, newest first.
	recent: (a, b) => (b.lastUsedAt ?? -Infinity) - (a.lastUsedAt ?? -Infinity) || b.createdAt - a.createdAt
};

const DB_NAME = 'hiit-rome';
const WORKOUTS = 'workouts';
const APP = 'app';
const SETTINGS_KEY = 'settings';
const SESSION_KEY = 'session';
const PRESETS_KEY = 'presets';
const LAST_BACKUP_KEY = 'lastBackup';

/** The outcome of an IndexedDB request, as a promise. */
const resultOf = <T>(request: IDBRequest<T>): Promise<T> =>
	new Promise<T>((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});

/** What a Workout is made of, without its id: the part an edit replaces and a copy takes. */
const content = ({ name, leadInSec, cueOverrides, items }: Workout) => ({ name, leadInSec, cueOverrides, items });

/** When a transaction has committed, as a promise; it rejects if the transaction fails or is aborted. */
const completionOf = (tx: IDBTransaction): Promise<void> =>
	new Promise<void>((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error);
	});

/** What an import changes: Workouts to add as they are, and Settings and Presets to replace, if given. */
export interface ImportChange {
	workouts: StoredWorkout[];
	settings?: Settings;
	presets?: number[];
}

const newRecord = (workout: Workout, now: number): StoredWorkout => ({
	...workout,
	favorite: false,
	createdAt: now,
	lastUsedAt: null
});

export async function openWorkoutStore(overrides: Partial<StoreOptions> = {}) {
	const options = { ...BROWSER_DEFAULTS, ...overrides };
	let firstLaunch = false;
	const request = options.indexedDB.open(DB_NAME, options.migrations.length);
	request.onupgradeneeded = ({ oldVersion }) => {
		const tx = request.transaction!;
		for (const migrate of options.migrations.slice(oldVersion)) migrate(tx);
		if (oldVersion > 0) return;
		firstLaunch = true;
		// One moment for all of them, a millisecond apart, so they list in seed order with the last one newest.
		const now = options.now();
		options.seed.forEach((workout, i) =>
			tx.objectStore(WORKOUTS).add(newRecord(workout, now - (options.seed.length - 1 - i)))
		);
	};
	const db = await resultOf(request);
	// A newer version of the app opened in another tab: step aside so its migrations can run.
	db.onversionchange = () => db.close();
	// Best effort: the browser may say no, and the app works either way.
	if (firstLaunch) options.persist().catch(() => false);
	const workouts = (mode: IDBTransactionMode = 'readonly') => db.transaction(WORKOUTS, mode).objectStore(WORKOUTS);
	const app = (mode: IDBTransactionMode = 'readonly') => db.transaction(APP, mode).objectStore(APP);

	async function existing(store: IDBObjectStore, id: string): Promise<StoredWorkout> {
		const found = (await resultOf(store.get(id))) as StoredWorkout | undefined;
		if (!found) throw new Error(`No Workout with id ${id}`);
		return found;
	}

	/** Applies a change to one stored Workout within a single transaction. */
	async function update(id: string, change: (w: StoredWorkout) => Partial<StoredWorkout>): Promise<void> {
		const store = workouts('readwrite');
		const current = await existing(store, id);
		await resultOf(store.put({ ...current, ...change(current) }));
	}

	const get = (id: string) => resultOf(workouts().get(id)) as Promise<StoredWorkout | undefined>;

	async function add(workout: Workout): Promise<StoredWorkout> {
		const stored = newRecord(workout, options.now());
		await resultOf(workouts('readwrite').add(stored));
		return stored;
	}

	return {
		add,
		/** Replaces a Workout's content, keeping its Favorite flag and timestamps. */
		save: (workout: Workout) => update(workout.id, () => content(workout)),
		async duplicate(id: string): Promise<StoredWorkout> {
			const original = content(await existing(workouts(), id));
			return add({ ...original, id: crypto.randomUUID(), name: `${original.name} (copy)` });
		},
		/** Deletes a Workout, returning it as it was so the deletion can be undone with `restore`. */
		async remove(id: string): Promise<StoredWorkout> {
			const store = workouts('readwrite');
			const current = await existing(store, id);
			await resultOf(store.delete(id));
			return current;
		},
		restore: async (workout: StoredWorkout) => void (await resultOf(workouts('readwrite').add(workout))),
		/**
		 * Imports what `plan` makes of the Workouts on the device, in one transaction: all of it or, if anything
		 * fails (such as an id already taken), none of it.
		 */
		async applyImport(plan: (existing: StoredWorkout[]) => ImportChange): Promise<void> {
			const tx = db.transaction([WORKOUTS, APP], 'readwrite');
			const done = completionOf(tx);
			const existing = (await resultOf(tx.objectStore(WORKOUTS).getAll())) as StoredWorkout[];
			try {
				const { workouts: records, settings, presets } = plan(existing);
				for (const record of records) tx.objectStore(WORKOUTS).add(record);
				if (settings) tx.objectStore(APP).put(settings, SETTINGS_KEY);
				if (presets) tx.objectStore(APP).put(presets, PRESETS_KEY);
			} catch (error) {
				tx.abort();
				throw error;
			}
			await done;
		},
		get,
		async list({ search = '', sort = 'recent' }: ListQuery = {}): Promise<StoredWorkout[]> {
			const all = (await resultOf(workouts().getAll())) as StoredWorkout[];
			const needle = search.trim().toLowerCase();
			const totals = new Map<StoredWorkout, number>();
			const totalMs = (w: StoredWorkout) => totals.get(w) ?? totals.set(w, buildTimeline(w.items).totalMs).get(w)!;
			return all
				.filter((w) => w.name.toLowerCase().includes(needle))
				.sort((a, b) => Number(b.favorite) - Number(a.favorite) || COMPARE[sort](a, b, totalMs));
		},
		markUsed: (id: string) => update(id, () => ({ lastUsedAt: options.now() })),
		setFavorite: (id: string, favorite: boolean) => update(id, () => ({ favorite })),
		/** The trainer's Settings, with the defaults for any they haven't set (all of them, until they change one). */
		async getSettings(): Promise<Settings> {
			const stored = (await resultOf(app().get(SETTINGS_KEY))) as Partial<Settings> | undefined;
			return {
				...DEFAULT_SETTINGS,
				...stored,
				cues: effectiveCueSettings(DEFAULT_SETTINGS.cues, stored?.cues),
				countdown: { ...DEFAULT_SETTINGS.countdown, ...stored?.countdown }
			};
		},
		saveSettings: async (settings: Settings) =>
			void (await resultOf(app('readwrite').put(settings, SETTINGS_KEY))),
		/** The five Countdown Presets, in seconds: the trainer's, or the defaults until they change one. */
		getPresets: async (): Promise<number[]> =>
			((await resultOf(app().get(PRESETS_KEY))) as number[] | undefined) ?? DEFAULT_PRESETS_SEC,
		savePresets: async (presets: number[]) => void (await resultOf(app('readwrite').put(presets, PRESETS_KEY))),
		/** When the trainer last exported a backup, or null if never. */
		lastBackupAt: async (): Promise<number | null> =>
			((await resultOf(app().get(LAST_BACKUP_KEY))) as number | undefined) ?? null,
		/** Notes that a backup was just exported, returning when. */
		async recordBackup(): Promise<number> {
			const at = options.now();
			await resultOf(app('readwrite').put(at, LAST_BACKUP_KEY));
			return at;
		},
		/** Saves the active Session, replacing the one saved before. */
		saveSession: async (saved: ActiveSession) =>
			void (await resultOf(app('readwrite').put({ ...saved, savedAt: options.now() }, SESSION_KEY))),
		/** The Session left unfinished, if there is one from the last 12 hours; an older one is discarded. */
		async savedSession(): Promise<SavedSession | undefined> {
			const store = app('readwrite');
			const saved = (await resultOf(store.get(SESSION_KEY))) as SavedSession | undefined;
			if (!saved || options.now() - saved.savedAt <= SAVED_SESSION_MAX_AGE_MS) return saved;
			await resultOf(store.delete(SESSION_KEY));
		},
		clearSession: async () => void (await resultOf(app('readwrite').delete(SESSION_KEY))),
		close: () => db.close()
	};
}

export type WorkoutStore = Awaited<ReturnType<typeof openWorkoutStore>>;
