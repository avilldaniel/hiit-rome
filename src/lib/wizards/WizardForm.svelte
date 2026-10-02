<script lang="ts">
	import type { Snippet } from 'svelte';
	import { formatClock } from '#lib/engine/format.ts';
	import { PALETTE } from '#lib/engine/palette.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import type { Workout } from '#lib/engine/workout.ts';
	import type { Finish, OnFinish } from './registry.ts';

	/**
	 * The frame every Wizard's form sits in: its fields (`children`, one <label> each), the Workout
	 * they make so far with its live total, and the two ways to finish. The name follows the Wizard's
	 * proposal until the trainer types their own.
	 */
	let {
		title,
		workout,
		onfinish,
		hint = 'Set Warm-up, Cool-down or any Rest to 0:00 to leave it out.',
		children
	}: { title: string; workout: Workout; onfinish: OnFinish; hint?: string; children: Snippet } = $props();

	// The Timeline is the source of truth for the total, so skipped rests are already accounted for.
	const totalMs = $derived(buildTimeline(workout.items).totalMs);
	let typedName = $state<string | null>(null);
	const name = $derived(typedName ?? workout.name);

	let form: HTMLFormElement;
	let busy = $state(false);
	let failed = $state(false);
	async function finish(how: Finish) {
		// The browser points out the first field that's wrong.
		if (busy || !form.reportValidity()) return;
		busy = true;
		failed = false;
		try {
			await onfinish({ ...workout, name: name.trim() || workout.name }, how);
		} catch {
			failed = true;
			busy = false;
		}
	}
</script>

<div class="wizard" style:background-color={PALETTE.neutral.background} style:color={PALETTE.neutral.text}>
	<header>
		<a class="back" href="/wizard">← Wizards</a>
		<h1>{title}</h1>
	</header>

	<!-- Never submitted: its buttons finish the Wizard themselves, once the browser finds every field valid. -->
	<form bind:this={form} onsubmit={(event) => event.preventDefault()}>
		<div class="fields" role="group" aria-label="{title} Wizard">
			{@render children()}
			<p class="hint">{hint}</p>
		</div>

		<section class="finish" aria-label="Your Workout">
			<label class="name">
				Name
				<input
					type="text"
					aria-label="Workout name"
					value={name}
					oninput={(event) => (typedName = event.currentTarget.value)}
					onchange={(event) => !event.currentTarget.value.trim() && (typedName = null)}
				/>
			</label>
			<p class="total">Total <span data-testid="total">{formatClock(totalMs)}</span></p>
			{#if failed}
				<p class="message" role="alert">Your Workout couldn’t be saved. Try again.</p>
			{/if}
			<div class="actions">
				<button
					type="button"
					class="start"
					style:background-color={PALETTE.work.background}
					style:color={PALETTE.work.text}
					disabled={busy}
					onclick={() => finish('start')}>Start now</button
				>
				<button type="button" disabled={busy} onclick={() => finish('edit')}>Save & edit</button>
			</div>
		</section>
	</form>
</div>

<style>
	.wizard {
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

	form {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 48px;
		max-width: 1100px;
		padding: 0 32px 96px;
	}

	.fields {
		display: grid;
		flex: 1 1 24em;
		grid-template-columns: max-content 1fr;
		align-items: center;
		gap: 16px 24px;
	}

	/* Each field is a <label> holding its name and input, laid out as one row of the grid. */
	.fields :global(label) {
		display: contents;
	}

	.hint {
		grid-column: 1 / -1;
		margin: 8px 0 0;
		opacity: 0.8;
	}

	.finish {
		display: flex;
		flex: 1 1 20em;
		flex-direction: column;
		gap: 16px;
		padding: 24px;
		border-radius: 12px;
		background: rgb(255 255 255 / 0.08);
	}

	.name {
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-weight: 600;
	}

	.total {
		margin: 0;
		font-size: 22px;
		font-weight: 700;
	}

	.total span {
		display: block;
		font-size: 64px;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.start {
		border-color: transparent;
		font-weight: 800;
	}

	.message {
		margin: 0;
		padding: 12px 16px;
		border-radius: 8px;
		background: #ffd166;
		color: #073b4c;
		font-weight: 600;
	}

	.wizard :global(:is(input, textarea, button)) {
		padding: 8px 12px;
		border: 1px solid currentColor;
		border-radius: 8px;
		background: rgb(255 255 255 / 0.12);
		color: inherit;
		font: inherit;
	}

	.wizard :global(button) {
		cursor: pointer;
	}

	.wizard :global(button:disabled) {
		opacity: 0.4;
		cursor: default;
	}
</style>
