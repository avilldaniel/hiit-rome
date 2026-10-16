<script lang="ts">
	import type { CueSettings } from '#lib/engine/cues.ts';
	import { COLOR_NAME, PALETTE } from '#lib/engine/palette.ts';
	import {
		COUNTDOWN_COLORS,
		CUE_TOGGLES,
		SESSION_LAYOUTS,
		type CountdownSettings,
		type SessionLayout,
		type Settings
	} from '#lib/engine/settings.ts';
	import DurationInput from '#lib/editor/DurationInput.svelte';
	import { isValidWarningSec, LIMITS } from '#lib/engine/workout.ts';
	import { createCuePlayer, type Voice } from '#lib/platform/cue-player.ts';
	import { deviceStore } from '#lib/store/device.ts';
	import LayoutSketch from '#lib/session/LayoutSketch.svelte';
	import BackupSection from '#lib/transfer/BackupSection.svelte';
	import type { WorkoutStore } from '#lib/store/workout-store.ts';
	import Alert from '#lib/ui/Alert.svelte';
	import Band from '#lib/ui/Band.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Field from '#lib/ui/Field.svelte';
	import Loading from '#lib/ui/Loading.svelte';
	import { dealIn } from '#lib/ui/motion.ts';
	import NumberedCard from '#lib/ui/NumberedCard.svelte';
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

	/** The sections, for the chips that jump straight to one. */
	const SECTIONS = [
		{ id: 'voice-heading', label: 'Voice' },
		{ id: 'cues-heading', label: 'Cues' },
		{ id: 'pause-heading', label: 'Pause' },
		{ id: 'session-heading', label: 'Session' },
		{ id: 'countdown-heading', label: 'Countdown' },
		{ id: 'backup-heading', label: 'Backup' }
	];

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
	<Band hue="var(--hue-purple)" back={{ href: '/', label: 'My Workouts' }} title="Settings">
		{#if settings}
			<nav class="jump" aria-label="Sections" {@attach dealIn({ gap: 0.04 })}>
				{#each SECTIONS as section (section.id)}
					<a href="#{section.id}">{section.label}</a>
				{/each}
			</nav>
		{/if}
	</Band>

	<main>
		{#if failed}
			<Alert>Your Settings couldn’t be loaded. Try reloading the page.</Alert>
		{:else if !settings}
			<Loading />
		{:else}
			{#if saveFailed}
				<Alert>Your changes couldn’t be saved. Try reloading the page.</Alert>
			{/if}

			<div class="columns">
				<div class="column" {@attach dealIn({ gap: 0.07 })}>
					<NumberedCard number="01" title="Voice" hue="var(--hue-teal)" id="voice-heading">
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
					</NumberedCard>

					<NumberedCard number="02" title="Cues" hue="var(--hue-yellow)" id="cues-heading">
						<p class="hint">The defaults for every Workout; a Workout can override them in its own settings.</p>
						<div class="switches">
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
					</NumberedCard>

					<NumberedCard number="03" title="Pause" hue="var(--hue-pink)" id="pause-heading">
						<div class="row">
							<label class="toggle">
								<Switch
									checked={settings.resumeLeadIn}
									onchange={(event) => change({ resumeLeadIn: event.currentTarget.checked })}
								/>
								3 s Lead-in when resuming from pause
							</label>
						</div>
					</NumberedCard>

					<NumberedCard number="04" title="Session" hue="var(--hue-purple)" id="session-heading">
						<p class="hint">How the Session is laid out for the room. It can be switched from the Session’s controls too.</p>
						<div class="row">
							<Field label="Session layout" inline class="fill">
								<select
									value={settings.sessionLayout}
									onchange={(event) => change({ sessionLayout: event.currentTarget.value as SessionLayout })}
								>
									{#each SESSION_LAYOUTS as layout (layout.id)}
										<option value={layout.id}>{layout.label}</option>
									{/each}
								</select>
							</Field>
							<LayoutSketch layout={settings.sessionLayout} />
						</div>
					</NumberedCard>
				</div>

				<div class="column" {@attach dealIn({ gap: 0.07, delay: 0.05 })}>
					<NumberedCard number="05" title="Countdown" hue="var(--hue-orange)" id="countdown-heading">
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
					</NumberedCard>

					<BackupSection onreplaced={(next, nextPresets) => ((settings = next), (presets = nextPresets))} />
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	.settings {
		padding-bottom: var(--s9);
	}

	/* Chips in the band that jump straight to a section, alternately tilted. */
	.jump {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2);
		margin-top: var(--s5);
	}

	.jump a {
		padding: var(--s1) var(--s3);
		border: 2px solid var(--line);
		border-radius: var(--r-full);
		background: var(--surface);
		color: var(--text);
		font: 700 var(--fs-xs) / 1.6 var(--font-mono);
		text-decoration: none;
		box-shadow: var(--shadow-sm);
		transition: translate var(--dur) var(--ease-out);
	}

	.jump a:nth-child(odd) {
		rotate: -2deg;
	}

	.jump a:nth-child(even) {
		rotate: 2deg;
	}

	@media (hover: hover) {
		.jump a:hover {
			translate: 0 -3px;
		}
	}

	main {
		box-sizing: border-box;
		display: grid;
		gap: var(--s5);
		max-width: 1216px;
		margin: 0 auto;
		padding: var(--s7) var(--s6) 0;
	}

	.columns {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: start;
		gap: var(--s6);
	}

	.column {
		display: grid;
		gap: var(--s6);
	}

	.hint {
		max-width: 68ch;
		margin: 0;
		color: var(--muted);
		font-weight: 600;
	}

	.row {
		display: flex;
		align-items: center;
		gap: var(--s4);
		min-height: 52px;
	}

	/* Switches one under another, between dashed rules. */
	.switches .row + .row {
		border-top: 2px dashed var(--line);
	}

	.row :global(.fill) {
		flex: 1 1 0;
		min-width: 0;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: var(--s3);
		font-weight: 700;
		cursor: pointer;
	}

	.end {
		display: flex;
		align-items: center;
		gap: var(--s2);
		margin-left: auto;
		font-weight: 700;
		white-space: nowrap;
	}

	.seconds {
		width: 76px;
		font-family: var(--font-display);
		font-weight: 900;
		text-align: center;
	}

	.presets {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: var(--s3);
	}

	.presets :global(input) {
		text-align: center;
	}

	/* The Countdown color, as a tilted time in it. */
	.swatch {
		display: grid;
		flex: none;
		place-items: center;
		box-sizing: border-box;
		width: 120px;
		height: 56px;
		border: var(--stroke) solid var(--line);
		border-radius: var(--r);
		font: 900 var(--fs-h2) var(--font-display);
		font-variant-numeric: tabular-nums;
		rotate: 2deg;
		box-shadow: var(--shadow);
		transition: background-color var(--dur) ease;
	}

	@media (max-width: 1100px) {
		.columns {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	@media (max-width: 767px) {
		main {
			padding: var(--s6) var(--s4) 0;
		}

		.column {
			gap: var(--s5);
		}

		.presets {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.row {
			flex-wrap: wrap;
		}
	}
</style>
