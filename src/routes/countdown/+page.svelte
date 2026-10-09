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
	import BackLink from '#lib/ui/BackLink.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Card from '#lib/ui/Card.svelte';
	import Field from '#lib/ui/Field.svelte';

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
	<div class="countdown">
		<header>
			<BackLink href="/" label="My Workouts" />
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

				<Card as="section" class="custom" aria-labelledby="custom-heading">
					<h2 id="custom-heading">Custom</h2>
					<form
						onsubmit={(event) => {
							event.preventDefault();
							void start(customSec);
						}}
					>
						<Field label="Custom duration" hideLabel size="large">
							<DurationInput label="Custom duration" seconds={customSec} onchange={(sec) => (customSec = sec)} />
						</Field>
						<Button type="submit" variant="primary" size="large" icon="play">Start</Button>
					</form>
				</Card>
			{/if}
		</main>
	</div>
{/if}

<style>
	.countdown {
		display: grid;
		gap: var(--s6);
		padding: var(--s7) var(--s8);
	}

	header {
		display: grid;
		gap: var(--s2);
	}

	h1 {
		margin: 0;
		font-size: var(--fs-title);
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.05;
	}

	main {
		display: grid;
		align-content: start;
		gap: var(--s7);
	}

	h2 {
		margin: 0;
		font-size: var(--fs-h2);
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.05;
	}

	section > h2 {
		margin-bottom: var(--s3);
	}

	.presets {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: var(--s5);
	}

	/* Sized with the viewport, so "15:00" fits its tile from 1280 wide and the page fits 720 high. */
	.preset {
		appearance: none;
		min-height: clamp(160px, 24vh, 260px);
		border: 0;
		border-radius: var(--r-xl);
		box-shadow: var(--shadow);
		font: 800 min(112px, 5.8vw) / 1 var(--font-display);
		letter-spacing: -0.03em;
		font-variant-numeric: tabular-nums;
		cursor: pointer;
		transition: transform var(--dur) var(--ease-out);
	}

	@media (hover: hover) {
		.preset:hover {
			transform: translateY(-4px);
		}
	}

	.preset:active {
		transform: translateY(0);
	}

	.edit {
		display: inline-flex;
		align-items: center;
		width: max-content;
		min-height: 44px;
		color: var(--text);
		font-weight: 600;
		text-underline-offset: 4px;
	}

	main :global(.custom) {
		box-sizing: border-box;
		width: min(680px, 100%);
	}

	form {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s4);
	}

	/* A large field, but right-aligned like every other duration. */
	form :global(.field input.duration) {
		width: 220px;
		text-align: right;
	}

	.message {
		margin: 0;
		color: var(--danger);
		font-size: var(--fs-lead);
		font-weight: 600;
	}

	@media (max-width: 1000px) {
		.countdown {
			padding: var(--s5) var(--s4) var(--s7);
		}

		h1 {
			font-size: 48px;
		}

		.presets {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: var(--s4);
		}

		.preset {
			font-size: min(88px, 9vw);
		}
	}

	@media (max-width: 560px) {
		.presets {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.preset {
			font-size: 13vw;
		}
	}
</style>
