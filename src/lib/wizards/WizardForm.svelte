<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { formatClock } from '#lib/engine/format.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import type { Workout } from '#lib/engine/workout.ts';
	import Alert from '#lib/ui/Alert.svelte';
	import Band from '#lib/ui/Band.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Field from '#lib/ui/Field.svelte';
	import { thump } from '#lib/ui/motion.ts';
	import Strip from '#lib/ui/Strip.svelte';
	import type { Finish, OnFinish } from './registry.ts';

	/**
	 * The frame every Wizard's form sits in: its fields (`children`, in fieldsets), the Workout
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
	const timeline = $derived(buildTimeline(workout.items));
	// The total thumps each time a field changes it.
	const total = $derived(formatClock(timeline.totalMs));
	let totalElement: HTMLElement;
	let shownTotal = untrack(() => total);
	$effect(() => {
		if (total === shownTotal) return;
		shownTotal = total;
		thump(totalElement, 1.1);
	});

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

<div class="wizard">
	<Band hue="var(--hue-yellow)" back={{ href: '/wizard', label: 'Wizards' }} {title} />

	<!-- Never submitted: its buttons finish the Wizard themselves, once the browser finds every field valid. -->
	<form bind:this={form} onsubmit={(event) => event.preventDefault()}>
		<div class="fields" role="group" aria-label="{title} Wizard">
			{@render children()}
			<p class="hint">{hint}</p>
		</div>

		<section class="finish" aria-labelledby="your-workout">
			<h2 id="your-workout"><span class="sticker">Your Workout</span></h2>
			<Field label="Name" size="large">
				<input
					type="text"
					aria-label="Workout name"
					value={name}
					oninput={(event) => (typedName = event.currentTarget.value)}
					onchange={(event) => !event.currentTarget.value.trim() && (typedName = null)}
				/>
			</Field>
			<p class="total" bind:this={totalElement}>
				<span class="label">Total</span> <span data-testid="total">{total}</span>
			</p>
			<span class="strip"><Strip {timeline} /></span>
			{#if failed}
				<Alert>Your Workout couldn’t be saved. Try again.</Alert>
			{/if}
			<div class="actions">
				<Button variant="primary" size="large" icon="play" class="start" disabled={busy} onclick={() => finish('start')}
					>Start now</Button
				>
				<Button size="large" icon="edit" disabled={busy} onclick={() => finish('edit')}>Save & edit</Button>
			</div>
		</section>
	</form>
</div>

<style>
	.wizard {
		padding-bottom: var(--s9);
	}

	/* The fields, then a sticky, tilted "Your Workout" card beside them. */
	form {
		box-sizing: border-box;
		display: grid;
		grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
		align-items: start;
		gap: var(--s6);
		max-width: 1216px;
		margin: 0 auto;
		padding: var(--s7) var(--s6) 0;
		/* Numbers the fieldsets: 1, 2, 3. */
		counter-reset: fieldset;
	}

	.fields,
	.finish {
		display: grid;
		align-content: start;
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-lg);
		background: var(--surface);
		box-shadow: var(--shadow-raised);
	}

	.fields {
		padding: var(--s3) var(--s6) var(--s6);
	}

	.finish {
		position: sticky;
		top: var(--s5);
		gap: var(--s3);
		padding: var(--s5) var(--s6) var(--s6);
		rotate: 0.8deg;
	}

	.finish h2 {
		margin: 0;
		line-height: 1;
	}

	.sticker {
		display: inline-block;
		padding: var(--s1) var(--s3);
		border: 2px solid var(--line);
		border-radius: var(--r-full);
		background: var(--hue-yellow);
		font: 700 var(--fs-sm) / 1.4 var(--font-mono);
		rotate: -4deg;
		box-shadow: var(--shadow-sm);
	}

	.hint {
		max-width: 68ch;
		margin: var(--s5) 0 0;
		color: var(--muted);
		font-weight: 600;
	}

	.total {
		display: grid;
		gap: 2px;
		margin: var(--s2) 0 0;
	}

	.total .label {
		font-size: var(--fs-sm);
		font-weight: 700;
	}

	/* Huge, but it gives way on a short screen so the actions stay in view. */
	.total [data-testid='total'] {
		font: 900 clamp(72px, 13vh, 104px) / 0.95 var(--font-display);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.04em;
		white-space: nowrap;
	}

	.strip {
		display: grid;
	}

	.strip :global(.strip) {
		height: 34px;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s3);
		margin-top: var(--s3);
	}

	.actions :global(.start) {
		flex: 1;
	}

	@media (max-width: 1000px) {
		form {
			grid-template-columns: minmax(0, 1fr);
			padding: var(--s5) var(--s4) 0;
		}

		.fields {
			padding: var(--s2) var(--s4) var(--s5);
		}

		.finish {
			position: static;
			padding: var(--s4) var(--s4) var(--s5);
			rotate: 0deg;
		}

		.total [data-testid='total'] {
			font-size: var(--fs-title);
		}

		.actions :global(.button) {
			flex: 1 1 100%;
		}
	}
</style>
