<script lang="ts">
	import type { Snippet } from 'svelte';
	import { formatClock } from '#lib/engine/format.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import type { Workout } from '#lib/engine/workout.ts';
	import BackLink from '#lib/ui/BackLink.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Field from '#lib/ui/Field.svelte';
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
	<header>
		<BackLink href="/wizard" label="Wizards" />
		<h1>{title}</h1>
	</header>

	<!-- Never submitted: its buttons finish the Wizard themselves, once the browser finds every field valid. -->
	<form bind:this={form} onsubmit={(event) => event.preventDefault()}>
		<div class="fields" role="group" aria-label="{title} Wizard">
			{@render children()}
			<p class="hint">{hint}</p>
		</div>

		<section class="finish" aria-label="Your Workout">
			<Field label="Name" size="large">
				<input
					type="text"
					aria-label="Workout name"
					value={name}
					oninput={(event) => (typedName = event.currentTarget.value)}
					onchange={(event) => !event.currentTarget.value.trim() && (typedName = null)}
				/>
			</Field>
			<p class="total"><span class="label">Total</span> <span data-testid="total">{formatClock(timeline.totalMs)}</span></p>
			<span class="strip"><Strip {timeline} /></span>
			{#if failed}
				<p class="message" role="alert">Your Workout couldn’t be saved. Try again.</p>
			{/if}
			<div class="actions">
				<Button variant="primary" size="large" icon="play" disabled={busy} onclick={() => finish('start')}>Start now</Button>
				<Button size="large" icon="edit" disabled={busy} onclick={() => finish('edit')}>Save & edit</Button>
			</div>
		</section>
	</form>
</div>

<style>
	.wizard {
		display: grid;
		gap: var(--s6);
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

	/* The summary column gives way on a smaller screen, so the fields keep room for two to a row. */
	form {
		display: grid;
		grid-template-columns: minmax(0, 1fr) clamp(400px, 36vw, 680px);
		align-items: start;
		gap: var(--s7);
	}

	.fields,
	.finish {
		display: grid;
		align-content: start;
		padding: var(--s7);
		background: var(--surface);
		box-shadow: var(--shadow);
	}

	.fields {
		gap: var(--s6);
		border-radius: var(--r-lg);
	}

	.finish {
		gap: var(--s5);
		border-radius: var(--r-xl);
	}

	.hint {
		max-width: 68ch;
		margin: 0;
		color: var(--muted);
		font-size: 16px;
	}

	.total {
		display: grid;
		gap: 2px;
		margin: 0;
	}

	.total .label {
		color: var(--muted);
		font-size: 16px;
		font-weight: 600;
	}

	/* Huge on a TV, but it gives way on a short screen so the actions stay in view. */
	.total [data-testid='total'] {
		font: 800 clamp(80px, 14.8vh, 160px) / 0.95 var(--font-display);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.04em;
		white-space: nowrap;
	}

	.strip {
		display: grid;
	}

	.strip :global(.strip) {
		height: 16px;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s3);
	}

	.message {
		margin: 0;
		color: var(--danger);
		font-weight: 600;
	}

	@media (max-width: 1000px) {
		.wizard {
			padding: var(--s5) var(--s4) var(--s7);
		}

		h1 {
			font-size: 48px;
		}

		form {
			grid-template-columns: minmax(0, 1fr);
		}

		.fields,
		.finish {
			padding: var(--s5);
		}
	}
</style>
