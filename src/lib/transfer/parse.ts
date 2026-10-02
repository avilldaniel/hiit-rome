import type { CueOverrides } from '../engine/cues';
import { MAX_GROUP_DEPTH } from '../engine/outline';
import { PALETTE_TOKENS, type PaletteToken } from '../engine/palette';
import {
	group,
	interval,
	UNTITLED,
	isValidDuration,
	isValidLeadIn,
	isValidRounds,
	isValidWarningSec,
	KIND_LABEL,
	type Item,
	type Kind,
	type Workout
} from '../engine/workout';

export const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);
export const isOptional = <T>(value: unknown, check: (v: unknown) => v is T): value is T | undefined =>
	value === undefined || check(value);
export const isString = (value: unknown): value is string => typeof value === 'string';
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isNumber = (value: unknown): value is number => typeof value === 'number';
const isKind = (value: unknown): value is Kind => isString(value) && Object.hasOwn(KIND_LABEL, value);
const isToken = (value: unknown): value is PaletteToken => (PALETTE_TOKENS as readonly unknown[]).includes(value);
const isId = (value: unknown): value is string => isString(value) && value !== '';

/**
 * How ids are found: `fresh` gives the Workout and everything in it new ones, as for a share link,
 * which carries none; `kept` requires and keeps the ones in the data, as a backup carries them.
 */
export type IdPolicy = 'fresh' | 'kept';

/** The id for `data` under `ids`, or null if it should have one and hasn't. */
const idOf = (data: Record<string, unknown>, ids: IdPolicy): string | null =>
	ids === 'fresh' ? crypto.randomUUID() : isId(data.id) ? data.id : null;

/** A Workout built from untrusted data, or null if anything in it is out of shape or out of range. */
export function parseWorkout(data: unknown, ids: IdPolicy): Workout | null {
	if (!isObject(data) || !isString(data.name) || !isNumber(data.leadInSec) || !isValidLeadIn(data.leadInSec)) return null;
	const id = idOf(data, ids);
	const cueOverrides = parseCueOverrides(data.cueOverrides);
	const items = parseItems(data.items, 0, ids);
	if (!id || cueOverrides === null || !items) return null;
	// Blank, as the editor never leaves one.
	const name = data.name.trim() ? data.name : UNTITLED;
	return { id, name, leadInSec: data.leadInSec, cueOverrides, items };
}

/** Cue overrides from untrusted data: undefined if there are none, null if they are out of shape or out of range. */
export function parseCueOverrides(data: unknown): CueOverrides | undefined | null {
	if (data === undefined) return undefined;
	if (!isObject(data)) return null;
	const overrides: CueOverrides = {};
	for (const flag of ['announce', 'warning', 'finalBeeps', 'halfway', 'completion'] as const) {
		const value = data[flag];
		if (!isOptional(value, isBoolean)) return null;
		if (value !== undefined) overrides[flag] = value;
	}
	const { warningSec } = data;
	if (warningSec !== undefined) {
		if (!isNumber(warningSec) || !isValidWarningSec(warningSec)) return null;
		overrides.warningSec = warningSec;
	}
	return overrides;
}

/** `depth` is how many Groups these items sit inside. */
function parseItems(data: unknown, depth: number, ids: IdPolicy): Item[] | null {
	if (!Array.isArray(data)) return null;
	const items: Item[] = [];
	for (const item of data) {
		const parsed = parseItem(item, depth, ids);
		if (!parsed) return null;
		items.push(parsed);
	}
	return items;
}

function parseItem(data: unknown, depth: number, ids: IdPolicy): Item | null {
	if (!isObject(data) || !isOptional(data.name, isString)) return null;
	const id = idOf(data, ids);
	if (!id) return null;
	if (data.type === 'interval') {
		const { name, kind, durationSec, color } = data;
		if (!isString(name) || !isKind(kind) || !isNumber(durationSec) || !isValidDuration(durationSec)) return null;
		if (!isOptional(color, isToken)) return null;
		return { ...interval(name, kind, durationSec, color ? { color } : {}), id };
	}
	if (data.type !== 'group' || depth >= MAX_GROUP_DEPTH) return null;
	const { name, rounds, skipLastRest } = data;
	if (!isNumber(rounds) || !isValidRounds(rounds) || !isBoolean(skipLastRest)) return null;
	const items = parseItems(data.items, depth + 1, ids);
	return items && { ...group(rounds, items, { name, skipLastRest }), id };
}
