<script lang="ts">
	import { formatClock } from '#lib/engine/format.ts';
	import { PALETTE } from '#lib/engine/palette.ts';
	import { restoreSession, view } from '#lib/engine/session.ts';
	import type { SavedSession } from '#lib/store/workout-store.ts';

	let { saved, onresume, ondiscard }: { saved: SavedSession; onresume: (saved: SavedSession) => void; ondiscard: () => void } = $props();

	// Where it will come back: a restored Session is paused, so its view doesn't depend on the time.
	const where = $derived(view(restoreSession(saved.session), 0));
</script>

<main class="prompt" style:--neutral-bg={PALETTE.neutral.background} style:--neutral-text={PALETTE.neutral.text}>
	<h1>Resume where you left off?</h1>
	<p class="workout">{saved.workoutName}</p>
	<p data-testid="recovery-position">
		{where.current ? `${where.current.name} · ${formatClock(where.remainingMs)} left` : 'Lead-in'}
	</p>
	<div class="actions">
		<button type="button" onclick={ondiscard}>Discard</button>
		<!-- Focused, so Enter resumes from across the room. -->
		<!-- svelte-ignore a11y_autofocus -->
		<button type="button" class="resume" autofocus onclick={() => onresume(saved)}>Resume</button>
	</div>
</main>

<style>
	.prompt {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2vh;
		padding: 4vh 6vw;
		background: var(--neutral-bg);
		color: var(--neutral-text);
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
		font-size: clamp(18px, 4vh, 44px);
		font-weight: 700;
		text-align: center;
	}

	h1 {
		margin: 0;
		font-size: clamp(24px, 8vh, 110px);
		font-weight: 800;
	}

	p {
		margin: 0;
	}

	.workout {
		opacity: 0.7;
	}

	.actions {
		display: flex;
		gap: 2vw;
		margin-top: 4vh;
	}

	button {
		padding: 1.5vh 2.5vw;
		border: 2px solid currentColor;
		border-radius: 1vh;
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.resume {
		background: var(--neutral-text);
		color: var(--neutral-bg);
	}
</style>
