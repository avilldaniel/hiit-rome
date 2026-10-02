<script lang="ts">
	import { PALETTE } from '#lib/engine/palette.ts';
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

<div
	class="backdrop"
	style:background-color={PALETTE.neutral.background}
	style:--neutral-bg={PALETTE.neutral.background}
	style:--neutral-text={PALETTE.neutral.text}
>
	<ConfirmDialog
		message="{current.workoutName} is still under way. End it to start {starting}?"
		confirmLabel="End {current.workoutName}"
		cancelLabel="Back to {current.workoutName}"
		onconfirm={onend}
		oncancel={onback}
	/>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
	}
</style>
