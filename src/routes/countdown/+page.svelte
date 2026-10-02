<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatClock } from '#lib/engine/format.ts';
	import { PALETTE } from '#lib/engine/palette.ts';
	import type { SessionSnapshot } from '#lib/engine/session.ts';
	import type { Settings } from '#lib/engine/settings.ts';
	import DurationInput from '#lib/editor/DurationInput.svelte';
	import CountdownScreen, { type CountdownStart } from '#lib/session/CountdownScreen.svelte';
	import EndCurrentPrompt from '#lib/session/EndCurrentPrompt.svelte';
	import { resumeSaved, sessionPath, takeResumed } from '#lib/session/recovery.ts';
	import { deviceStore } from '#lib/store/device.ts';
	import type { SavedSession } from '#lib/store/workout-store.ts';

	const PATH = '/countdown';
	/** The custom duration first offered: 2 minutes. */
	const CUSTOM_DEFAULT_SEC = 120;

	let settings = $state.raw<Settings>();
	let presets = $state.raw<number[]>([]);
	let failed = $state(false);
	$effect(() => {
		deviceStore()
			.then((store) => Promise.all([store.getSettings(), store.getPresets()]))
			.then(([foundSettings, foundPresets]) => ((settings = foundSettings), (presets = foundPresets)))
			.catch(() => (failed = true));
	});

	/** The Countdown on screen, new or carried on from; null while choosing one. */
	let running = $state.raw<CountdownStart | null>(null);
	const resumed = takeResumed(PATH);
	if (resumed) running = { restored: resumed };
	/** Bumped for each Countdown, so a new one never inherits the last one's screen. */
	let runs = $state(0);
	let customSec = $state(CUSTOM_DEFAULT_SEC);

	/** Another Session or Countdown still under way, to end (or go back to) before starting `pendingSec`. */
	let current = $state.raw<SavedSession>();
	let pendingSec = 0;

	function show(next: CountdownStart) {
		runs++;
		running = next;
	}

	async function start(durationSec: number) {
		// Best effort: if it can't be checked, this one just starts.
		const saved = await deviceStore()
			.then((store) => store.savedSession())
			.catch(() => undefined);
		if (!saved) return show({ durationSec });
		pendingSec = durationSec;
		current = saved;
	}
	async function endCurrent() {
		// Gone for good before this one starts.
		await deviceStore()
			.then((store) => store.clearSession())
			.catch(() => {});
		current = undefined;
		show({ durationSec: pendingSec });
	}
	function backToCurrent(saved: SavedSession) {
		current = undefined;
		// A Countdown carries on right here; a Workout's Session, on its own screen.
		if ('countdown' in saved) return show({ restored: saved.session });
		resumeSaved(saved);
		void goto(sessionPath(saved));
	}

	// Saved as it goes, to be offered back after a reload or crash, like a Session.
	const save = (session: SessionSnapshot) =>
		void deviceStore()
			.then((store) => store.saveSession({ countdown: true, workoutName: 'Countdown', session }))
			.catch(() => {});
	const clear = () => void deviceStore().then((store) => store.clearSession()).catch(() => {});
</script>

<svelte:head>
	<title>Countdown · hiit-rome</title>
</svelte:head>

{#if running && settings}
	{#key runs}
		<CountdownScreen
			countdown={running}
			{settings}
			onsave={save}
			onclear={clear}
			ondone={() => (running = null)}
		/>
	{/key}
{:else if current}
	<EndCurrentPrompt {current} starting="a Countdown" onend={endCurrent} onback={() => backToCurrent(current!)} />
{:else}
	<div class="countdown" style:background-color={PALETTE.neutral.background} style:color={PALETTE.neutral.text}>
		<header>
			<a class="back" href="/">← My Workouts</a>
			<h1>Countdown</h1>
		</header>

		<main>
			{#if failed}
				<p class="message" role="alert">Your Presets couldn’t be loaded. Try reloading the page.</p>
			{:else if settings}
				<section aria-labelledby="presets-heading">
					<h2 id="presets-heading">Presets</h2>
					<div class="presets">
						{#each presets as sec, i (i)}
							<button
								type="button"
								class="preset"
								style:background-color={PALETTE[settings.countdown.color].background}
								style:color={PALETTE[settings.countdown.color].text}
								aria-label="Start a {formatClock(sec * 1000)} Countdown"
								onclick={() => start(sec)}
							>
								{formatClock(sec * 1000)}
							</button>
						{/each}
					</div>
					<a class="edit" href="/settings#countdown-heading">Edit Presets in Settings</a>
				</section>

				<section aria-labelledby="custom-heading">
					<h2 id="custom-heading">Custom</h2>
					<form
						onsubmit={(event) => {
							event.preventDefault();
							void start(customSec);
						}}
					>
						<DurationInput label="Custom duration" seconds={customSec} onchange={(sec) => (customSec = sec)} />
						<button type="submit">Start</button>
					</form>
				</section>
			{/if}
		</main>
	</div>
{/if}

<style>
	.countdown {
		min-height: 100vh;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 24px;
		padding: 24px 32px;
	}

	.back,
	.edit {
		color: inherit;
		font-weight: 600;
	}

	h1 {
		margin: 0;
		font-size: 36px;
	}

	main {
		padding: 0 32px 96px;
	}

	section {
		margin-bottom: 40px;
	}

	h2 {
		margin: 0 0 16px;
		font-size: 22px;
	}

	.presets {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 16px;
		margin-bottom: 16px;
	}

	.preset {
		min-height: 120px;
		border: none;
		border-radius: 16px;
		font: inherit;
		font-size: 48px;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		cursor: pointer;
	}

	form {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
	}

	form :global(.duration),
	form button {
		padding: 8px 12px;
		border: 1px solid rgb(255 255 255 / 0.3);
		border-radius: 8px;
		background: rgb(255 255 255 / 0.08);
		color: inherit;
		font: inherit;
		font-size: 20px;
	}

	form button {
		cursor: pointer;
	}

	.message {
		padding: 12px 16px;
		border-radius: 8px;
		background: #ffd166;
		color: #073b4c;
		font-weight: 600;
	}
</style>
