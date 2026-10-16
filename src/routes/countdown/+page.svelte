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
	import Alert from '#lib/ui/Alert.svelte';
	import Band from '#lib/ui/Band.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Card from '#lib/ui/Card.svelte';
	import Field from '#lib/ui/Field.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import Loading from '#lib/ui/Loading.svelte';
	import { dealIn, pressable } from '#lib/ui/motion.ts';

	const PATH = '/countdown';
	/** The custom duration first offered: 2 minutes. */
	const CUSTOM_DEFAULT_SEC = 120;
	/** Each Preset sticker's tilt. */
	const TILTS = [-2, 1.5, -1, 2, -1.5];

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
		<Band hue="var(--hue-orange)" back={{ href: '/', label: 'My Workouts' }} title="Countdown" />

		<main>
			{#if failed}
				<Alert>Your Presets couldn’t be loaded. Try reloading the page.</Alert>
			{:else if !settings}
				<Loading />
			{:else}
				<section aria-labelledby="presets-heading">
					<h2 id="presets-heading">Presets</h2>
					<div class="presets" {@attach dealIn({ gap: 0.05 })}>
						{#each presets as sec, i (i)}
							<button
								type="button"
								class="preset pressable"
								style:background-color={PALETTE[settings.countdown.color].background}
								style:color={PALETTE[settings.countdown.color].text}
								style:--tilt="{TILTS[i % TILTS.length]}deg"
								aria-label="Start a {formatClock(sec * 1000)} Countdown"
								onclick={() => start(sec)}
								{@attach pressable}
							>
								{formatClock(sec * 1000)}
								<span class="play" aria-hidden="true"><Icon name="play" size={16} /></span>
							</button>
						{/each}
					</div>
					<a class="edit pressable" href="/settings#countdown-heading" {@attach pressable}
						><Icon name="sliders" size={18} />Edit Presets in Settings</a
					>
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
	main {
		box-sizing: border-box;
		display: grid;
		align-content: start;
		gap: var(--s7);
		max-width: 1216px;
		margin: 0 auto;
		padding: var(--s7) var(--s6) var(--s9);
	}

	h2 {
		margin: 0 0 var(--s4);
		font-size: var(--fs-h2);
		font-weight: 800;
		letter-spacing: -0.01em;
		line-height: 1.05;
		text-transform: uppercase;
	}

	.presets {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: var(--s5);
	}

	/* A square sticker in the Countdown color, tilted, with a little play badge; it straightens up on hover. */
	.preset {
		--depth: 8px;
		position: relative;
		display: grid;
		place-content: center;
		aspect-ratio: 1;
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-lg);
		font: 900 min(var(--fs-2xl), 3.6vw) / 1 var(--font-display);
		letter-spacing: -0.03em;
		font-variant-numeric: tabular-nums;
		rotate: var(--tilt);
		cursor: pointer;
		transition: rotate var(--dur) var(--ease-out);
	}

	@media (hover: hover) {
		.preset:hover {
			rotate: 0deg;
		}
	}

	.play {
		position: absolute;
		right: var(--s3);
		bottom: var(--s3);
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border: 2px solid var(--line);
		border-radius: var(--r-full);
		background: var(--surface);
		color: var(--text);
	}

	.play :global(.icon) {
		fill: currentColor;
	}

	.edit {
		--depth: 2px;
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		margin-top: var(--s6);
		padding: var(--s1) var(--s3);
		border: 2px solid var(--line);
		border-radius: var(--r-full);
		background: var(--hue-purple);
		color: var(--text);
		font-size: var(--fs-sm);
		font-weight: 700;
		text-underline-offset: 3px;
		rotate: -1.5deg;
	}

	main :global(.custom) {
		box-sizing: border-box;
		width: min(640px, 100%);
		rotate: 0.6deg;
	}

	form {
		display: flex;
		align-items: center;
		gap: var(--s4);
	}

	form :global(.field) {
		flex: 1;
		min-width: 0;
	}

	/* A large field, right-aligned like every other duration. */
	form :global(.field input.duration) {
		width: 100%;
		background-color: var(--surface-2);
		font-size: var(--fs-h2);
		text-align: right;
	}

	@media (max-width: 1000px) {
		main {
			padding: var(--s5) var(--s4) var(--s7);
		}

		.presets {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: var(--s4);
		}

		.preset {
			font-size: min(var(--fs-2xl), 7vw);
		}
	}

	@media (max-width: 767px) {
		.presets {
			grid-template-columns: repeat(6, minmax(0, 1fr));
			gap: var(--s3);
		}

		.preset {
			grid-column: span 2;
			border-radius: var(--r);
			font-size: var(--fs-lead);
		}

		.preset:nth-child(n + 4) {
			grid-column: span 3;
			aspect-ratio: 1.6;
		}

		.play {
			display: none;
		}

		form {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
