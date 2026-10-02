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

<div class="settings" style:background-color={PALETTE.neutral.background} style:color={PALETTE.neutral.text}>
	<header>
		<a class="back" href="/">← My Workouts</a>
		<h1>Settings</h1>
	</header>

	<main>
		{#if failed}
			<p class="message" role="alert">Your Settings couldn’t be loaded. Try reloading the page.</p>
		{:else if settings}
			{#if saveFailed}
				<p class="message" role="alert">Your changes couldn’t be saved. Try reloading the page.</p>
			{/if}

			<section aria-labelledby="voice-heading">
				<h2 id="voice-heading">Voice</h2>
				<div class="row">
					<label>
						Voice
						<select
							value={settings.voiceId ?? ''}
							onchange={(event) => change({ voiceId: event.currentTarget.value || null })}
						>
							<option value="">Device default</option>
							{#each voices as voice (voice.id)}
								<option value={voice.id}>{voice.name} ({voice.lang})</option>
							{/each}
						</select>
					</label>
					<button type="button" onclick={testVoice}>Test voice</button>
				</div>
			</section>

			<section aria-labelledby="cues-heading">
				<h2 id="cues-heading">Cues</h2>
				<p class="hint">The defaults for every Workout; a Workout can override them in its own settings.</p>
				{#each CUE_TOGGLES as toggle (toggle.key)}
					<div class="row">
						<label>
							<input
								type="checkbox"
								checked={settings.cues[toggle.key]}
								onchange={(event) => changeCues({ [toggle.key]: event.currentTarget.checked })}
							/>
							{toggle.label}
						</label>
						{#if toggle.key === 'warning'}
							<label>
								<input
									class="seconds"
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
			</section>

			<section aria-labelledby="pause-heading">
				<h2 id="pause-heading">Pause</h2>
				<label>
					<input
						type="checkbox"
						checked={settings.resumeLeadIn}
						onchange={(event) => change({ resumeLeadIn: event.currentTarget.checked })}
					/>
					3 s Lead-in when resuming from pause
				</label>
			</section>

			<section aria-labelledby="countdown-heading">
				<h2 id="countdown-heading">Countdown</h2>
				<p class="hint">The five Presets offered as one-tap starts.</p>
				<div class="row">
					{#each presets as sec, i (i)}
						<DurationInput label="Preset {i + 1}" seconds={sec} onchange={(next) => changePreset(i, next)} />
					{/each}
				</div>
				<div class="row">
					<label>
						Color
						<select
							value={settings.countdown.color}
							onchange={(event) =>
								changeCountdown({ color: event.currentTarget.value as CountdownSettings['color'] })}
						>
							{#each COUNTDOWN_COLORS as token (token)}
								<option value={token}>{COLOR_NAME[token]}</option>
							{/each}
						</select>
					</label>
					<span
						class="swatch"
						aria-hidden="true"
						style:background-color={PALETTE[settings.countdown.color].background}
						style:color={PALETTE[settings.countdown.color].text}>0:00</span
					>
				</div>
				<label>
					<input
						type="checkbox"
						checked={settings.countdown.warning}
						onchange={(event) => changeCountdown({ warning: event.currentTarget.checked })}
					/>
					Say “1 minute remaining” on Countdowns over 1 minute
				</label>
			</section>

			<BackupSection onreplaced={(next, nextPresets) => ((settings = next), (presets = nextPresets))} />
		{/if}
	</main>
</div>

<style>
	.settings {
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

	.back {
		color: inherit;
		font-weight: 600;
	}

	h1 {
		margin: 0;
		font-size: 36px;
	}

	main {
		max-width: 720px;
		padding: 0 32px 96px;
	}

	section {
		margin-bottom: 32px;
	}

	h2 {
		margin: 0 0 12px;
		font-size: 22px;
	}

	.hint {
		margin: 0 0 12px;
		opacity: 0.8;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
		min-height: 44px;
	}

	label {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	select,
	button,
	.seconds,
	.row :global(.duration) {
		padding: 8px 12px;
		border: 1px solid rgb(255 255 255 / 0.3);
		border-radius: 8px;
		background: rgb(255 255 255 / 0.08);
		color: inherit;
		font: inherit;
	}

	.seconds,
	.row :global(.duration) {
		width: 4.5em;
	}

	.swatch {
		padding: 4px 12px;
		border-radius: 8px;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	[aria-invalid='true'] {
		outline: 3px solid #fff;
		outline-offset: 1px;
	}

	option {
		color: initial;
	}

	button {
		cursor: pointer;
	}

	input[type='checkbox'] {
		width: 20px;
		height: 20px;
	}

	.message {
		padding: 12px 16px;
		border-radius: 8px;
		background: #ffd166;
		color: #073b4c;
		font-weight: 600;
	}
</style>
