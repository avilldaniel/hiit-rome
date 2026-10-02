import { DEFAULT_PRESETS_SEC } from '../engine/countdown';
import { COUNTDOWN_COLORS, DEFAULT_SETTINGS, type CountdownColor, type Settings } from '../engine/settings';
import { copyWorkout, isValidDuration, isValidWarningSec, type Workout } from '../engine/workout';
import type { CueSettings } from '../engine/cues';
import type { StoredWorkout, WorkoutStore } from '../store/workout-store';
import { isBoolean, isNumber, isObject, isString, parseCueOverrides, parseWorkout } from './parse';

/** Everything on a device worth keeping, as a backup file holds it. */
export interface Backup {
	app: typeof APP;
	version: number;
	/** When it was exported, as an ISO 8601 date. */
	exportedAt: string;
	workouts: StoredWorkout[];
	/** The Countdown Presets, in seconds. */
	presets: number[];
	settings: Settings;
}

/** Turns a backup file's data, as an older version of the app wrote it, into the next version's. */
export type BackupMigration = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * Every change to the backup format, in order: the current version is one more than their count, and reading a
 * file runs whichever ones it hasn't had. Append one whenever the format changes shape. Only ever append.
 */
export const BACKUP_MIGRATIONS: BackupMigration[] = [];

const APP = 'hiit-rome';

/** A backup file's contents, ready to import; or why it can't be, in words for the trainer. */
export type BackupResult = { backup: Backup } | { error: string };

/** What an import did with the backup's Workouts. */
export interface ImportSummary {
	/** Workouts added, under new ids. */
	added: number;
	/** Workouts already on the device, exactly as they are in the backup. */
	skipped: number;
}

/** A backup of everything in `store`, as a file to save; it notes the export, at `exportedAt`, as the trainer's last backup. */
export async function exportBackup(store: WorkoutStore): Promise<{ filename: string; text: string; exportedAt: number }> {
	const [workouts, presets, settings] = await Promise.all([store.list(), store.getPresets(), store.getSettings()]);
	const at = new Date(await store.recordBackup());
	const backup: Backup = {
		app: APP,
		version: BACKUP_MIGRATIONS.length + 1,
		exportedAt: at.toISOString(),
		workouts,
		presets,
		settings
	};
	const day = [at.getFullYear(), at.getMonth() + 1, at.getDate()].map((n) => String(n).padStart(2, '0')).join('-');
	return { filename: `${APP}-backup-${day}.json`, text: JSON.stringify(backup, null, '\t'), exportedAt: at.getTime() };
}

const NOT_A_BACKUP = 'This file isn’t a hiit-rome backup. Choose a file made with “Export backup”.';
const DAMAGED = 'This backup file is damaged, so nothing was imported.';
const NEWER = 'This backup was made by a newer version of hiit-rome. Reload the app to update it, then import it again.';

/** No real backup comes near this; anything bigger is the wrong file. */
const MAX_FILE_BYTES = 20_000_000;

/** The backup in a file the trainer chose, as `readBackup` finds it. */
export async function readBackupFile(file: Blob): Promise<BackupResult> {
	if (file.size > MAX_FILE_BYTES) return { error: NOT_A_BACKUP };
	try {
		return readBackup(await file.text());
	} catch {
		return { error: NOT_A_BACKUP };
	}
}

/** The backup in a file's text, brought up to the current format and checked against the Workout and Settings models. */
export function readBackup(text: string, migrations: BackupMigration[] = BACKUP_MIGRATIONS): BackupResult {
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		return { error: NOT_A_BACKUP };
	}
	if (!isObject(data) || data.app !== APP) return { error: NOT_A_BACKUP };
	const { version } = data;
	const current = migrations.length + 1;
	if (!isNumber(version) || !Number.isInteger(version) || version < 1) return { error: DAMAGED };
	if (version > current) return { error: NEWER };
	try {
		for (const migrate of migrations.slice(version - 1)) data = migrate(data as Record<string, unknown>);
	} catch {
		// Data an older app never wrote, which the migration couldn't make sense of.
		return { error: DAMAGED };
	}
	const backup = parseBackup(data, current);
	return backup ? { backup } : { error: DAMAGED };
}

function parseBackup(data: unknown, version: number): Backup | null {
	if (!isObject(data) || !isString(data.exportedAt) || Number.isNaN(Date.parse(data.exportedAt))) return null;
	if (!Array.isArray(data.workouts)) return null;
	const workouts: StoredWorkout[] = [];
	for (const item of data.workouts) {
		const workout = parseStoredWorkout(item);
		if (!workout) return null;
		workouts.push(workout);
	}
	const presets = parsePresets(data.presets);
	const settings = parseSettings(data.settings);
	if (!presets || !settings) return null;
	return { app: APP, version, exportedAt: data.exportedAt, workouts, presets, settings };
}

function parseStoredWorkout(data: unknown): StoredWorkout | null {
	const workout = parseWorkout(data, 'kept');
	if (!workout || !isObject(data)) return null;
	const { favorite, createdAt, lastUsedAt } = data;
	if (!isBoolean(favorite) || !isNumber(createdAt) || !(lastUsedAt === null || isNumber(lastUsedAt))) return null;
	return { ...workout, favorite, createdAt, lastUsedAt };
}

const parsePresets = (data: unknown): number[] | null =>
	Array.isArray(data) && data.length === DEFAULT_PRESETS_SEC.length && data.every((sec) => isNumber(sec) && isValidDuration(sec))
		? data
		: null;

const isCountdownColor = (value: unknown): value is CountdownColor => (COUNTDOWN_COLORS as readonly unknown[]).includes(value);

function parseSettings(data: unknown): Settings | null {
	if (!isObject(data) || !isObject(data.countdown)) return null;
	const { voiceId, resumeLeadIn } = data;
	const cues = parseCueOverrides(data.cues);
	const { color, warning } = data.countdown;
	if (!(voiceId === null || isString(voiceId)) || !isBoolean(resumeLeadIn) || !isCueSettings(cues)) return null;
	if (!isCountdownColor(color) || !isBoolean(warning)) return null;
	return { voiceId, cues, resumeLeadIn, countdown: { color, warning } };
}

/** Cue overrides that set every Cue setting, as full Settings do. */
const isCueSettings = (cues: Partial<CueSettings> | null | undefined): cues is CueSettings =>
	!!cues && Object.keys(DEFAULT_SETTINGS.cues).every((key) => Object.hasOwn(cues, key));

export interface ImportOptions {
	/** Replace this device's Settings and Presets with the backup's: only once the trainer has confirmed it. */
	replaceSettingsAndPresets: boolean;
}

/**
 * Merges `backup` into `store`, never changing a Workout already there. One with the same id and content as the
 * backup's is skipped; every other one is added under a new id, with " (2)", " (3)" and so on on a name clash.
 */
export async function importBackup(
	store: WorkoutStore,
	backup: Backup,
	{ replaceSettingsAndPresets }: ImportOptions
): Promise<ImportSummary> {
	let added = 0;
	await store.applyImport((mine) => {
		const byId = new Map(mine.map((w) => [w.id, w]));
		const names = new Set(mine.map((w) => w.name));
		const workouts: StoredWorkout[] = [];
		for (const workout of backup.workouts) {
			const here = byId.get(workout.id);
			if (here && sameContent(here, workout)) continue;
			const name = freeName(workout.name, names);
			names.add(name);
			workouts.push({ ...workout, ...copyWorkout(workout), name });
		}
		added = workouts.length;
		return replaceSettingsAndPresets ? { workouts, settings: backup.settings, presets: backup.presets } : { workouts };
	});
	return { added, skipped: backup.workouts.length - added };
}

/** `name`, or the first of "name (2)", "name (3)" and so on that isn't `taken`. */
function freeName(name: string, taken: Set<string>): string {
	if (!taken.has(name)) return name;
	let n = 2;
	while (taken.has(`${name} (${n})`)) n++;
	return `${name} (${n})`;
}

/** Whether two Workouts are made of the same things, ignoring key order and empty Cue overrides. */
const sameContent = (a: Workout, b: Workout) => canonical(a) === canonical(b);

function canonical({ name, leadInSec, cueOverrides, items }: Workout): string {
	const overrides = Object.values(cueOverrides ?? {}).some((v) => v !== undefined) ? cueOverrides : undefined;
	return JSON.stringify({ name, leadInSec, cueOverrides: overrides, items }, (_, value) =>
		isObject(value) ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1))) : value
	);
}
