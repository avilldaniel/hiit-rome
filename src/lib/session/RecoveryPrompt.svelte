<script lang="ts">
	import { formatClock } from '#lib/engine/format.ts';
	import { PALETTE } from '#lib/engine/palette.ts';
	import { restoreSession, view } from '#lib/engine/session.ts';
	import type { SavedSession } from '#lib/store/workout-store.ts';
	import Button from '#lib/ui/Button.svelte';

	let { saved, onresume, ondiscard }: { saved: SavedSession; onresume: (saved: SavedSession) => void; ondiscard: () => void } = $props();

	// Where it will come back: a restored Session is paused, so its view doesn't depend on the time.
	const where = $derived(view(restoreSession(saved.session), 0));
	// The swatch shows the Kind it comes back to; ink in the Lead-in.
	const swatch = $derived((where.current?.colors ?? PALETTE.neutral).background);
</script>

<main class="prompt">
	<div class="card">
		<h1>Resume where you left off?</h1>
		<p class="workout"><span class="swatch" style:background-color={swatch}></span>{saved.workoutName}</p>
		<p class="where" data-testid="recovery-position">
			{where.current ? `${where.current.name} · ${formatClock(where.remainingMs)} left` : 'Lead-in'}
		</p>
		<div class="actions">
			<Button onclick={ondiscard}>Discard</Button>
			<!-- Focused, so Enter resumes from across the room. -->
			<!-- svelte-ignore a11y_autofocus -->
			<Button variant="primary" autofocus onclick={() => onresume(saved)}>Resume</Button>
		</div>
	</div>
</main>

<style>
	.prompt {
		position: fixed;
		inset: 0;
		display: grid;
		place-items: center;
		padding: var(--s4);
		background: var(--ground);
		overflow-y: auto;
	}

	.card {
		box-sizing: border-box;
		display: grid;
		justify-items: center;
		gap: calc(16 * var(--tv));
		width: min(calc(1040 * var(--tv)), 100%);
		padding: calc(64 * var(--tv)) calc(64 * var(--tv)) calc(48 * var(--tv));
		border-radius: var(--r-xl);
		background: var(--surface);
		box-shadow: var(--shadow);
		text-align: center;
	}

	h1 {
		margin: 0;
		font-size: max(28px, calc(80 * var(--tv)));
		font-weight: 800;
		line-height: 1.05;
		letter-spacing: -0.02em;
		text-wrap: balance;
	}

	p {
		margin: 0;
	}

	.workout {
		display: inline-flex;
		align-items: center;
		gap: calc(12 * var(--tv));
		color: var(--muted);
		font-size: max(16px, calc(26 * var(--tv)));
		font-weight: 600;
	}

	.swatch {
		--swatch: max(14px, calc(20 * var(--tv)));
		flex: none;
		width: var(--swatch);
		height: var(--swatch);
		border-radius: calc(var(--swatch) * 0.3);
	}

	.where {
		font-family: var(--font-display);
		font-size: max(20px, calc(40 * var(--tv)));
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.01em;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--s4);
		margin-top: calc(24 * var(--tv));
	}

	.actions :global(.button) {
		min-height: 72px;
		padding: 0 var(--s7);
		border-radius: var(--r-lg);
		font-size: 24px;
	}
</style>
