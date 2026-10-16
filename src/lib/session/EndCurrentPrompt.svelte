<script lang="ts">
	import type { SavedSession } from '#lib/store/workout-store.ts';
	import ConfirmDialog from './ConfirmDialog.svelte';

	/**
	 * Only one Session or Countdown is active at a time: before `starting` another, the trainer ends the `current` one,
	 * or goes back to it.
	 */
	let {
		current,
		starting,
		onend,
		onback
	}: { current: SavedSession; starting: string; onend: () => void; onback: () => void } = $props();
</script>

<div class="backdrop tv-stage">
	<ConfirmDialog
		message="{current.workoutName} is still under way. End it to start {starting}?"
		confirmLabel="End {current.workoutName}"
		cancelLabel="Back to {current.workoutName}"
		tone="ink"
		stacked
		onconfirm={onend}
		oncancel={onback}
	/>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: var(--ground);
	}
</style>
