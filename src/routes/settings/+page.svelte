<script lang="ts">
	import type { CueSettings } from '#lib/engine/cues.ts';
	import { COLOR_NAME, PALETTE } from '#lib/engine/palette.ts';
	import { COUNTDOWN_COLORS, CUE_TOGGLES, type CountdownSettings, type Settings } from '#lib/engine/settings.ts';
	import DurationInput from '#lib/editor/DurationInput.svelte';
	import { isValidWarningSec, LIMITS } from '#lib/engine/workout.ts';
	import { createCuePlayer, type Voice } from '#lib/platform/cue-player.ts';
	import { deviceStore } from '#lib/store/device.ts';
	import BackupSection from '#lib/transfer/BackupSection.svelte';
	import type { WorkoutStore } from '#lib/store/workout-store.ts';
	import BackLink from '#lib/ui/BackLink.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Card from '#lib/ui/Card.svelte';
	import Field from '#lib/ui/Field.svelte';
	import Switch from '#lib/ui/Switch.svelte';

	let settings = $state.raw<Settings>();
	let presets = $state.raw<number[]>([]);
	let failed = $state(false);
	$effect(() => {
		deviceStore()
			.then((store) => Promise.all([store.getSettings(), store.getPresets()]))
			.then(([foundSettings, foundPresets]) => ((settings = foundSettings), (presets = foundPresets)))
			.catch(() => (failed = true));
	});

	const player = createCuePlayer();
	let voices = $state.raw<Voice[]>([]);
	$effect(() => void player.listVoices().then((found) => (voices = found)));

	/** Saves run one after another, in the order the changes were made. */
	let saving: Promise<void> = Promise.resolve();
	let saveFailed = $state(false);
	function persist(write: (store: WorkoutStore) => Promise<void>) {
		saving = saving.then(async () => write(await deviceStore())).then(
			() => void (saveFailed = false),
			() => void (saveFailed = true)
		);
	}
	function change(next: Partial<Settings>) {
		if (!settings) return;
		settings = { ...settings, ...next };
		const snapshot = settings;
		persist((store) => store.saveSettings(snapshot));
	}
	const changeCues = (next: Partial<CueSettings>) => settings && change({ cues: { ...settings.cues, ...next } });
	const changeCountdown = (next: Partial<CountdownSettings>) =>
		settings && change({ countdown: { ...settings.countdown, ...next } });
	function changePreset(index: number, sec: number) {
		const snapshot = (presets = presets.with(index, sec));
		persist((store) => store.savePresets(snapshot));
	}

	let warningInvalid = $state(false);
	function changeWarningSec(text: string) {
		const sec = Number(text);
		warningInvalid = text === '' || !isValidWarningSec(sec);
		if (!warningInvalid) changeCues({ warningSec: sec });
	}

	function testVoice() {
		player.unlock();
		player.cancelPending();
		player.selectVoice(settings?.voiceId ?? null);
		player.speak('This is how your Cues will sound.', 0);
	}
</script>

<svelte:head>
	<title>Settings · hiit-rome</title>
</svelte:head>

<div class="settings">
	<header>
		<BackLink href="/" label="My Workouts" />
		<h1>Settings</h1>
	</header>

	<main>
		{#if failed}
			<p class="message" role="alert">Your Settings couldn’t be loaded. Try reloading the page.</p>
		{:else if settings}
			{#if saveFailed}
				<p class="message" role="alert">Your changes couldn’t be saved. Try reloading the page.</p>
			{/if}

			<div class="columns">
				<div class="column">
					<Card as="section" aria-labelledby="voice-heading">
						<h2 id="voice-heading">Voice</h2>
						<div class="row">
							<Field label="Voice" inline class="fill">
								<select
									value={settings.voiceId ?? ''}
									onchange={(event) => change({ voiceId: event.currentTarget.value || null })}
								>
									<option value="">Device default</option>
									{#each voices as voice (voice.id)}
										<option value={voice.id}>{voice.name} ({voice.lang})</option>
									{/each}
								</select>
							</Field>
							<Button icon="speaker" onclick={testVoice}>Test voice</Button>
						</div>
					</Card>

					<Card as="section" aria-labelledby="cues-heading">
						<h2 id="cues-heading">Cues</h2>
						<p class="hint">The defaults for every Workout; a Workout can override them in its own settings.</p>
						<div>
							{#each CUE_TOGGLES as toggle (toggle.key)}
								<div class="row">
									<label class="toggle">
										<Switch
											checked={settings.cues[toggle.key]}
											onchange={(event) => changeCues({ [toggle.key]: event.currentTarget.checked })}
										/>
										{toggle.label}
									</label>
									{#if toggle.key === 'warning'}
										<label class="end">
											<input
												class="input seconds"
												type="number"
												min={LIMITS.minWarningSec}
												max={LIMITS.maxWarningSec}
												aria-label="Warning seconds"
												aria-invalid={warningInvalid}
												value={settings.cues.warningSec}
												oninput={(event) => changeWarningSec(event.currentTarget.value)}
											/>
											s before the end
										</label>
									{/if}
								</div>
							{/each}
						</div>
					</Card>

					<Card as="section" aria-labelledby="pause-heading">
						<h2 id="pause-heading">Pause</h2>
						<div class="row">
							<label class="toggle">
								<Switch
									checked={settings.resumeLeadIn}
									onchange={(event) => change({ resumeLeadIn: event.currentTarget.checked })}
								/>
								3 s Lead-in when resuming from pause
							</label>
						</div>
					</Card>
				</div>

				<div class="column">
					<Card as="section" aria-labelledby="countdown-heading">
						<h2 id="countdown-heading">Countdown</h2>
						<p class="hint">The five Presets offered as one-tap starts.</p>
						<div class="presets">
							{#each presets as sec, i (i)}
								<Field label="Preset {i + 1}">
									<DurationInput label="Preset {i + 1}" seconds={sec} onchange={(next) => changePreset(i, next)} />
								</Field>
							{/each}
						</div>
						<div class="row">
							<Field label="Color" inline class="fill">
								<select
									value={settings.countdown.color}
									onchange={(event) =>
										changeCountdown({ color: event.currentTarget.value as CountdownSettings['color'] })}
								>
									{#each COUNTDOWN_COLORS as token (token)}
										<option value={token}>{COLOR_NAME[token]}</option>
									{/each}
								</select>
							</Field>
							<span
								class="swatch"
								aria-hidden="true"
								style:background-color={PALETTE[settings.countdown.color].background}
								style:color={PALETTE[settings.countdown.color].text}>0:00</span
							>
						</div>
						<div class="row">
							<label class="toggle">
								<Switch
									checked={settings.countdown.warning}
									onchange={(event) => changeCountdown({ warning: event.currentTarget.checked })}
								/>
								Say “1 minute remaining” on Countdowns over 1 minute
							</label>
						</div>
					</Card>

					<BackupSection onreplaced={(next, nextPresets) => ((settings = next), (presets = nextPresets))} />
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	.settings {
		display: grid;
		gap: var(--s5);
		padding: var(--s7) var(--s8) var(--s9);
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
		gap: var(--s5);
	}

	.columns {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: start;
		gap: var(--s5);
		max-width: 1640px;
	}

	.column {
		display: grid;
		gap: var(--s5);
	}

	/* The Settings cards, BackupSection's among them, are a little tighter than a Card's default. */
	.column :global(.card) {
		gap: var(--s3);
		padding: var(--s5) var(--s6);
	}

	h2 {
		margin: 0;
		font-size: var(--fs-h2);
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.05;
	}

	.hint {
		max-width: 68ch;
		margin: 0;
		color: var(--muted);
		font-size: 16px;
	}

	.row {
		display: flex;
		align-items: center;
		gap: var(--s4);
		min-height: 52px;
	}

	.row + .row {
		border-top: 1px solid var(--line);
	}

	.row :global(.fill) {
		flex: 1 1 0;
		min-width: 0;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: var(--s4);
		font-weight: 500;
		cursor: pointer;
	}

	.end {
		display: flex;
		align-items: center;
		gap: var(--s2);
		margin-left: auto;
		color: var(--muted);
		white-space: nowrap;
	}

	.seconds {
		width: 88px;
		text-align: right;
	}

	.presets {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: var(--s3);
	}

	.swatch {
		display: grid;
		flex: none;
		place-items: center;
		width: 120px;
		height: 56px;
		border-radius: var(--r);
		font: 800 28px var(--font-display);
		font-variant-numeric: tabular-nums;
	}

	.message {
		margin: 0;
		color: var(--danger);
		font-size: var(--fs-lead);
		font-weight: 600;
	}

	@media (max-width: 1100px) {
		.columns {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	@media (max-width: 1000px) {
		.settings {
			padding: var(--s5) var(--s4) var(--s7);
		}

		h1 {
			font-size: 48px;
		}
	}

	@media (max-width: 640px) {
		.presets {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.row {
			flex-wrap: wrap;
		}
	}
</style>
