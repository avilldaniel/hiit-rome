<script lang="ts">
	import type { CueOverrides, CueSettings } from '#lib/engine/cues.ts';
	import { CUE_TOGGLES } from '#lib/engine/settings.ts';
	import { isValidLeadIn, isValidWarningSec, LIMITS, type Workout } from '#lib/engine/workout.ts';

	/** A Workout's Lead-in and Cue overrides; any override left unset follows the `defaults` from Settings. */
	let {
		workout,
		defaults,
		onchange
	}: {
		workout: Workout;
		defaults: CueSettings;
		onchange: (change: Pick<Workout, 'leadInSec'> | Pick<Workout, 'cueOverrides'>) => void;
	} = $props();

	const overrides = $derived(workout.cueOverrides ?? {});
	const onOff = (on: boolean) => (on ? 'On' : 'Off');

	/** Sets or, with undefined, clears one override; cleared ones are dropped, so "inherit" is never stored. */
	function override<K extends keyof CueSettings>(key: K, value: CueSettings[K] | undefined) {
		const next: CueOverrides = { ...overrides, [key]: value };
		if (value === undefined) delete next[key];
		onchange({ cueOverrides: next });
	}

	let invalid = $state<{ leadIn: boolean; warningSec: boolean }>({ leadIn: false, warningSec: false });
	function changeLeadIn(text: string) {
		const sec = Number(text);
		invalid.leadIn = text === '' || !isValidLeadIn(sec);
		if (!invalid.leadIn) onchange({ leadInSec: sec });
	}
	function changeWarningSec(text: string) {
		const sec = Number(text);
		invalid.warningSec = text !== '' && !isValidWarningSec(sec);
		if (!invalid.warningSec) override('warningSec', text === '' ? undefined : sec);
	}
</script>

<details class="workout-settings">
	<summary>Workout settings</summary>
	<div class="fields" role="group" aria-label="Workout settings">
		<label>
			Lead-in
			<input
				type="number"
				min="0"
				max={LIMITS.maxLeadInSec}
				aria-label="Lead-in seconds"
				aria-invalid={invalid.leadIn}
				value={workout.leadInSec}
				oninput={(event) => changeLeadIn(event.currentTarget.value)}
			/>
			s
		</label>

		<p class="hint">Cues set to Default follow Settings.</p>
		{#each CUE_TOGGLES as toggle (toggle.key)}
			<div class="row">
				<label>
					<span class="label">{toggle.label}</span>
					<select
						aria-label={toggle.label}
						value={overrides[toggle.key] === undefined ? '' : overrides[toggle.key] ? 'on' : 'off'}
						onchange={(event) => {
							const value = event.currentTarget.value;
							override(toggle.key, value === '' ? undefined : value === 'on');
						}}
					>
						<option value="">Default ({onOff(defaults[toggle.key])})</option>
						<option value="on">On</option>
						<option value="off">Off</option>
					</select>
				</label>
				{#if toggle.key === 'warning'}
					<label>
						<input
							type="number"
							min={LIMITS.minWarningSec}
							max={LIMITS.maxWarningSec}
							aria-label="Warning seconds"
							aria-invalid={invalid.warningSec}
							placeholder={String(defaults.warningSec)}
							value={overrides.warningSec ?? ''}
							oninput={(event) => changeWarningSec(event.currentTarget.value)}
						/>
						s before the end
					</label>
				{/if}
			</div>
		{/each}
	</div>
</details>

<style>
	.workout-settings {
		margin: 0 32px 16px;
		max-width: 1036px;
	}

	summary {
		font-weight: 700;
		cursor: pointer;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px 0 0 20px;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
	}

	label {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.label {
		min-width: 12em;
	}

	input[type='number'] {
		width: 4.5em;
	}

	[aria-invalid='true'] {
		outline: 3px solid #fff;
		outline-offset: 1px;
	}

	.hint {
		margin: 8px 0 0;
		opacity: 0.8;
	}
</style>
