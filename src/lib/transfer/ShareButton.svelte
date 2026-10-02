<script lang="ts">
	import type { Workout } from '#lib/engine/workout.ts';
	import { shareWorkout } from './share';

	/** Shares a link to `workout`, saying briefly whether it was copied. */
	let { workout }: { workout: Workout } = $props();

	/** How long the outcome stays up. */
	const NOTICE_MS = 3000;

	let notice = $state<string | null>(null);
	let forget: ReturnType<typeof setTimeout> | undefined;
	async function share() {
		let message: string | null;
		try {
			const outcome = await shareWorkout(workout);
			message = outcome === 'copied' ? 'Link copied' : null;
		} catch {
			message = 'Couldn’t share it. Try again.';
		}
		notice = message;
		clearTimeout(forget);
		forget = setTimeout(() => (notice = null), NOTICE_MS);
	}
	$effect(() => () => clearTimeout(forget));
</script>

<button type="button" aria-label="Share {workout.name}" onclick={share}>Share</button>
<span class="notice" role="status">{notice ?? ''}</span>

<style>
	.notice {
		align-self: center;
		font-weight: 600;
	}

	.notice:empty {
		display: none;
	}
</style>
