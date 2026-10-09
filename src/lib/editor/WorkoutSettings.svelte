<script lang="ts">
	import type { CueOverrides, CueSettings } from '#lib/engine/cues.ts';
	import { CUE_TOGGLES } from '#lib/engine/settings.ts';
	import Icon from '#lib/ui/Icon.svelte';
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
	<summary><Icon name="chevron" />Workout settings</summary>
	<div class="fields" role="group" aria-label="Workout settings">
		<label class="field">
			<span class="label">Lead-in</span>
			<span class="inline">
				<input
					class="input number"
					type="number"
					min="0"
					max={LIMITS.maxLeadInSec}
					aria-label="Lead-in seconds"
					aria-invalid={invalid.leadIn}
					value={workout.leadInSec}
					oninput={(event) => changeLeadIn(event.currentTarget.value)}
				/>
				s
			</span>
		</label>

		{#each CUE_TOGGLES as toggle (toggle.key)}
			<div class="field">
				<label class="field">
					<span class="label">{toggle.label}</span>
					<select
						class="select"
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
					<label class="inline">
						<input
							class="input number"
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

		<p class="hint">Cues set to Default follow Settings.</p>
	</div>
</details>

<style>
	.workout-settings {
		border-radius: var(--r-lg);
		background: var(--surface);
		box-shadow: var(--shadow);
	}

	summary {
		display: flex;
		align-items: center;
		gap: var(--s2);
		min-height: 52px;
		padding: 0 var(--s5);
		font-weight: 600;
		list-style: none;
		cursor: pointer;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary :global(.icon) {
		transition: transform var(--dur) var(--ease-out);
	}

	[open] > summary :global(.icon) {
		transform: rotate(90deg);
	}

	.fields {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		align-items: start;
		gap: var(--s3) var(--s5);
		padding: 0 var(--s5) var(--s5);
	}

	.field {
		display: grid;
		gap: var(--s1);
	}

	.label {
		color: var(--muted);
		font-size: 14px;
		font-weight: 600;
	}

	.inline {
		display: flex;
		align-items: center;
		gap: var(--s2);
		white-space: nowrap;
	}

	.number {
		width: 96px;
	}

	.hint {
		grid-column: 1 / -1;
		margin: 0;
		color: var(--muted);
		font-size: 16px;
	}

	@media (max-width: 1100px) {
		.fields {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
