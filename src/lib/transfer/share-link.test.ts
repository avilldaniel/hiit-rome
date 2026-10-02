import { describe, expect, it } from 'vitest';
import { buildTimeline } from '../engine/timeline';
import { group, interval, type Item, type Workout } from '../engine/workout';
import { readShareLink, shareLink } from './share-link';

const ORIGIN = 'https://hiit.example';

/** The 4-Tabata example: nested, named Groups, a color override and Cue overrides. */
const fourTabatas: Workout = {
	id: 'local-id',
	name: '4 Tabatas',
	leadInSec: 5,
	cueOverrides: { halfway: false, warningSec: 5 },
	items: [
		interval('Warm up', 'warmup', 300),
		group(
			4,
			[
				group(8, [interval('Burpees', 'work', 20), interval('Rest', 'rest', 10, { color: 'neutral' })], {
					name: 'Tabata'
				}),
				interval('Between', 'rest', 60)
			],
			{ name: 'Tabatas', skipLastRest: false }
		),
		interval('Cool down', 'cooldown', 180)
	]
};

/** The outline without its ids, which are local to each device. */
const shape = (items: Item[]): unknown[] =>
	items.map(({ id: _, ...item }) => (item.type === 'group' ? { ...item, items: shape(item.items) } : item));

const ids = (items: Item[]): string[] => items.flatMap((i) => [i.id, ...(i.type === 'group' ? ids(i.items) : [])]);

describe('Share link', () => {
	it('carries a Workout in the fragment of a link to the share preview', async () => {
		const link = new URL(await shareLink(fourTabatas, ORIGIN));

		expect(link.origin).toBe(ORIGIN);
		expect(link.pathname).toBe('/share');
		expect(link.search).toBe('');
		expect(link.hash).toMatch(/^#1\.[A-Za-z0-9_-]+$/);
	});

	it('round trips a Workout’s content, with fresh ids', async () => {
		const read = await readShareLink(await shareLink(fourTabatas, ORIGIN));

		if (!('workout' in read)) throw new Error(read.error);
		const { workout } = read;
		expect(workout).toMatchObject({ name: '4 Tabatas', leadInSec: 5, cueOverrides: { halfway: false, warningSec: 5 } });
		expect(shape(workout.items)).toEqual(shape(fourTabatas.items));
		expect(buildTimeline(workout.items).totalMs).toBe(buildTimeline(fourTabatas.items).totalMs);
		expect(workout.id).not.toBe(fourTabatas.id);
		const fresh = new Set([workout.id, ...ids(workout.items)]);
		expect(fresh.size).toBe(1 + ids(fourTabatas.items).length);
		for (const id of ids(fourTabatas.items)) expect(fresh.has(id)).toBe(false);
	});

	it('leaves out the Favorite flag and timestamps, which belong to the device that made the link', async () => {
		const stored = { ...fourTabatas, favorite: true, createdAt: 1_000, lastUsedAt: 2_000 };

		const read = await readShareLink(await shareLink(stored, ORIGIN));

		expect(read).toHaveProperty('workout');
		expect(Object.keys((read as { workout: Workout }).workout).sort()).toEqual(['cueOverrides', 'id', 'items', 'leadInSec', 'name']);
	});

	it('names a Workout shared with a blank name as the editor would', async () => {
		const read = await readShareLink(await linkTo({ name: '  ', leadInSec: 0, items: [] }));

		expect(read).toMatchObject({ workout: { name: 'Untitled Workout', items: [] } });
	});

	describe('refuses, with a reason for the trainer,', () => {
		const damaged = { error: expect.stringMatching(/damaged/) };

		it('a link from a newer version of the app', async () => {
			const link = (await shareLink(fourTabatas, ORIGIN)).replace('#1.', '#2.');

			expect(await readShareLink(link)).toEqual({ error: expect.stringMatching(/newer version/) });
		});

		it('a link in a format this app never made', async () => {
			const link = (await shareLink(fourTabatas, ORIGIN)).replace('#1.', '#0.');

			expect(await readShareLink(link)).toEqual(damaged);
		});

		it('a link with its fragment cut short, garbled or missing', async () => {
			const link = await shareLink(fourTabatas, ORIGIN);
			const [base, fragment] = link.split('#');
			const garbled = fragment.slice(0, 20) + (fragment[20] === 'A' ? 'B' : 'A') + fragment.slice(21);

			expect(await readShareLink(link.slice(0, -10))).toEqual(damaged);
			expect(await readShareLink(`${base}#${garbled}`)).toEqual(damaged);
			expect(await readShareLink(base)).toEqual(damaged);
			expect(await readShareLink(`${base}#1.`)).toEqual(damaged);
			expect(await readShareLink(`${base}#1.not base64!`)).toEqual(damaged);
		});

		it('a well-formed link whose Workout breaks the model', async () => {
			const valid = { name: 'Bad', leadInSec: 0, items: [{ type: 'interval', name: 'Work', kind: 'work', durationSec: 20 }] };
			const work = valid.items[0];
			const tooDeep = (levels: number): object =>
				levels === 0 ? work : { type: 'group', rounds: 2, skipLastRest: true, items: [tooDeep(levels - 1)] };
			const bad: unknown[] = [
				'not a Workout',
				{ ...valid, items: [{ ...work, durationSec: 0 }] },
				{ ...valid, items: [{ ...work, durationSec: 20.5 }] },
				{ ...valid, items: [{ ...work, kind: 'sprint' }] },
				{ ...valid, items: [{ ...work, color: 'purple' }] },
				{ ...valid, items: [{ type: 'group', rounds: 100, skipLastRest: true, items: [work] }] },
				{ ...valid, items: [tooDeep(3)] },
				{ ...valid, leadInSec: -1 },
				{ ...valid, name: 42 },
				{ ...valid, cueOverrides: { warningSec: 0 } },
				{ ...valid, cueOverrides: { halfway: 'yes' } }
			];

			expect(await readShareLink(await linkTo(valid))).toHaveProperty('workout');
			expect(await readShareLink(await linkTo({ ...valid, items: [tooDeep(2)] }))).toHaveProperty('workout');
			for (const data of bad) expect(await readShareLink(await linkTo(data))).toEqual(damaged);
		});
	});
});

/** A version-1 link to `data`, made by hand as another app could. */
async function linkTo(data: unknown): Promise<string> {
	const stream = new Blob([JSON.stringify(data)]).stream().pipeThrough(new CompressionStream('deflate'));
	const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
	const base64 = btoa(String.fromCharCode(...bytes));
	return `${ORIGIN}/share#1.${base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
}
