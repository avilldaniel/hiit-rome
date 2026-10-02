<script lang="ts">
	import type { Workout } from '#lib/engine/workout.ts';
	import { shareUrl } from './share.ts';
	import { shareLink } from './share-link.ts';

	/** Shares a link to `workout`, saying briefly whether it was copied. */
	let { workout }: { workout: Workout } = $props();

	/** The link, made ahead of the tap, so sharing it starts while the browser still counts the gesture. */
	let link = $state<string | null>(null);
	$effect(() => {
		const current = workout;
		link = null;
		shareLink(current, location.origin)
			.then((made) => current === workout && (link = made))
			.catch(() => {});
	});

	/** How long the outcome stays up. */
	const NOTICE_MS = 3000;

	let notice = $state<string | null>(null);
	let forget: ReturnType<typeof setTimeout> | undefined;
	async function share() {
		let message: string | null;
		try {
			const outcome = await shareUrl(workout.name, link!);
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

<button type="button" aria-label="Share {workout.name}" disabled={!link} onclick={share}>Share</button>
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
