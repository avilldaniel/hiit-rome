// Converts a Seconds Pro export into a hiit-rome backup file, ready for Settings → Import backup.
//
//   node scripts/seconds-pro-to-backup.mjs <export.seconds3|export.seconds> <backup.json> [seed.json]
//
// The backup is checked with the app's own backup reader before it is written. With a third path, the Workouts are
// also written there on their own, as the app's first-launch seed (src/lib/store/demo-workouts.json).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const [input, output, seedOutput] = process.argv.slice(2);
if (!input || !output) {
	console.error('Usage: node scripts/seconds-pro-to-backup.mjs <export.seconds3|export.seconds> <backup.json>');
	process.exit(1);
}

const load = async (path) => (await runnerImport(fileURLToPath(new URL(path, import.meta.url)), { configFile: false })).module;
const { convertSecondsPro } = await load('./seconds-pro/convert.ts');
const { readBackup } = await load('../src/lib/transfer/backup.ts');
const { DEFAULT_SETTINGS } = await load('../src/lib/engine/settings.ts');
const { DEFAULT_PRESETS_SEC } = await load('../src/lib/engine/countdown.ts');
const { buildTimeline } = await load('../src/lib/engine/timeline.ts');

const workouts = convertSecondsPro(JSON.parse(readFileSync(input, 'utf8').replace(/^﻿/, '')));
const now = Date.now();
const backup = {
	app: 'hiit-rome',
	version: 1,
	exportedAt: new Date(now).toISOString(),
	// In export order, the last one the most recently added.
	workouts: workouts.map((workout, i) => ({ ...workout, favorite: false, createdAt: now - (workouts.length - i) * 1000, lastUsedAt: null })),
	presets: DEFAULT_PRESETS_SEC,
	settings: DEFAULT_SETTINGS
};

const text = JSON.stringify(backup, null, '\t');
const read = readBackup(text);
if ('error' in read) {
	console.error(`The converted backup doesn’t pass the app’s checks: ${read.error}`);
	process.exit(1);
}
writeFileSync(output, text);
// Read back through the app's checks, as the seed is never checked when the app loads it.
if (seedOutput) writeFileSync(seedOutput, JSON.stringify(read.backup.workouts.map(({ favorite, createdAt, lastUsedAt, ...workout }) => workout)) + '\n');

const clock = (ms) => `${Math.floor(ms / 60_000)}:${String(Math.round(ms / 1000) % 60).padStart(2, '0')}`;
for (const workout of workouts) {
	const timeline = buildTimeline(workout.items);
	console.log(`${clock(timeline.totalMs).padStart(6)}  ${String(timeline.entries.length).padStart(3)} Intervals  ${workout.name}`);
}
console.log(`\n${workouts.length} Workouts written to ${output}${seedOutput ? ` and ${seedOutput}` : ''}`);
