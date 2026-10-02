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

/**
 * The share-link format: bump it whenever the payload changes shape, and keep reading the old
 * ones. A link from a newer app than this one is refused rather than guessed at.
 */
const VERSION = 1;

/** Where a share link opens: the preview, which reads the Workout from the fragment. */
export const SHARE_PATH = '/share';

/** A shared link can't make the app inflate more than this, however it was crafted. */
const MAX_PAYLOAD_BYTES = 1_000_000;

/** What a link carries: the Workout's content, without the ids, Favorite flag or timestamps that are local to a device. */
type SharedItem =
	| { type: 'interval'; name: string; kind: Kind; durationSec: number; color?: PaletteToken }
	| { type: 'group'; name?: string; rounds: number; skipLastRest: boolean; items: SharedItem[] };
interface SharedWorkout {
	name: string;
	leadInSec: number;
	cueOverrides?: CueOverrides;
	items: SharedItem[];
}

/** The Workout a share link carries, with fresh ids; or why it can't be read, in words for the trainer. */
export type ShareLinkResult = { workout: Workout } | { error: string };

const toShared = (item: Item): SharedItem =>
	item.type === 'interval'
		? { type: 'interval', name: item.name, kind: item.kind, durationSec: item.durationSec, color: item.color }
		: {
				type: 'group',
				name: item.name,
				rounds: item.rounds,
				skipLastRest: item.skipLastRest,
				items: item.items.map(toShared)
			};

/** A link that opens `workout` on another device: its content travels in the fragment, which never reaches a server. */
export async function shareLink(workout: Workout, origin: string): Promise<string> {
	const shared: SharedWorkout = {
		name: workout.name,
		leadInSec: workout.leadInSec,
		cueOverrides: workout.cueOverrides,
		items: workout.items.map(toShared)
	};
	const bytes = await pipeBytes(new TextEncoder().encode(JSON.stringify(shared)), new CompressionStream('deflate'));
	return `${new URL(SHARE_PATH, origin)}#${VERSION}.${toBase64Url(bytes)}`;
}

const DAMAGED = 'This link is damaged or incomplete. Ask for it to be shared again.';
const NEWER = 'This link was made by a newer version of hiit-rome. Reload the app to update it, then open the link again.';

/** The Workout in a share link (or just its fragment), checked against the Workout model. */
export async function readShareLink(link: string): Promise<ShareLinkResult> {
	const fragment = link.slice(link.indexOf('#') + 1);
	const match = /^(\d+)\.([A-Za-z0-9_-]+)$/.exec(fragment);
	if (!match) return { error: DAMAGED };
	const version = Number(match[1]);
	if (version > VERSION) return { error: NEWER };
	if (version !== VERSION) return { error: DAMAGED };
	let data: unknown;
	try {
		const bytes = await pipeBytes(fromBase64Url(match[2]), new DecompressionStream('deflate'), MAX_PAYLOAD_BYTES);
		data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
	} catch {
		return { error: DAMAGED };
	}
	const workout = parseWorkout(data);
	return workout ? { workout } : { error: DAMAGED };
}

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);
const isOptional = <T>(value: unknown, check: (v: unknown) => v is T): value is T | undefined =>
	value === undefined || check(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isNumber = (value: unknown): value is number => typeof value === 'number';
const isKind = (value: unknown): value is Kind => isString(value) && Object.hasOwn(KIND_LABEL, value);
const isToken = (value: unknown): value is PaletteToken => (PALETTE_TOKENS as readonly unknown[]).includes(value);

/** A Workout built from untrusted data, with fresh ids, or null if anything in it is out of shape or out of range. */
function parseWorkout(data: unknown): Workout | null {
	if (!isObject(data) || !isString(data.name) || !isNumber(data.leadInSec) || !isValidLeadIn(data.leadInSec)) return null;
	const cueOverrides = parseCueOverrides(data.cueOverrides);
	const items = parseItems(data.items, 0);
	if (cueOverrides === null || !items) return null;
	// Blank, as the editor never leaves one.
	const name = data.name.trim() ? data.name : UNTITLED;
	return { id: crypto.randomUUID(), name, leadInSec: data.leadInSec, cueOverrides, items };
}

function parseCueOverrides(data: unknown): CueOverrides | undefined | null {
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
function parseItems(data: unknown, depth: number): Item[] | null {
	if (!Array.isArray(data)) return null;
	const items: Item[] = [];
	for (const item of data) {
		const parsed = parseItem(item, depth);
		if (!parsed) return null;
		items.push(parsed);
	}
	return items;
}

function parseItem(data: unknown, depth: number): Item | null {
	if (!isObject(data) || !isOptional(data.name, isString)) return null;
	if (data.type === 'interval') {
		const { name, kind, durationSec, color } = data;
		if (!isString(name) || !isKind(kind) || !isNumber(durationSec) || !isValidDuration(durationSec)) return null;
		if (!isOptional(color, isToken)) return null;
		return interval(name, kind, durationSec, color ? { color } : {});
	}
	if (data.type !== 'group' || depth >= MAX_GROUP_DEPTH) return null;
	const { name, rounds, skipLastRest } = data;
	if (!isNumber(rounds) || !isValidRounds(rounds) || !isBoolean(skipLastRest)) return null;
	const items = parseItems(data.items, depth + 1);
	return items && group(rounds, items, { name, skipLastRest });
}

/** Runs `bytes` through a compression stream, giving up past `limit` bytes of output. */
async function pipeBytes(bytes: Uint8Array, stream: TransformStream<BufferSource, Uint8Array>, limit = Infinity) {
	const chunks: Uint8Array[] = [];
	let length = 0;
	const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(stream).getReader();
	for (let next = await reader.read(); !next.done; next = await reader.read()) {
		length += next.value.length;
		if (length > limit) {
			await reader.cancel();
			throw new Error('Too large');
		}
		chunks.push(next.value);
	}
	const out = new Uint8Array(length);
	let offset = 0;
	for (const chunk of chunks) out.set(chunk, (offset += chunk.length) - chunk.length);
	return out;
}

function toBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
	const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
