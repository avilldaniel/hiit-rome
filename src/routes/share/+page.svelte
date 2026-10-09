<script lang="ts">
	import { page } from '$app/state';
	import { copyWorkout, type Workout } from '#lib/engine/workout.ts';
	import PreviewMessage from '#lib/preview/PreviewMessage.svelte';
	import WorkoutPreview from '#lib/preview/WorkoutPreview.svelte';
	import { deviceStore } from '#lib/store/device.ts';
	import { readShareLink, type ShareLinkResult } from '#lib/transfer/share-link.ts';
	import { startShared } from '#lib/transfer/shared.ts';
	import Chip from '#lib/ui/Chip.svelte';

	const back = { href: '/', label: 'My Workouts' };

	/** The link's Workout, once read from the fragment (which never reached a server). */
	let read = $state.raw<ShareLinkResult>();
	$effect(() => {
		const hash = page.url.hash;
		read = undefined;
		readShareLink(hash)
			.catch(() => ({ error: 'This link couldn’t be opened.' }))
			.then((result) => hash === page.url.hash && (read = result));
	});
	// Each copy gets its own ids, so adding it twice keeps two.
	const add = (workout: Workout) => async () => (await deviceStore()).add(copyWorkout(workout));
</script>

<svelte:head>
	<title>{read && 'workout' in read ? read.workout.name : 'Shared Workout'} · hiit-rome</title>
</svelte:head>

{#if read && 'workout' in read}
	{@const workout = read.workout}
	<WorkoutPreview {workout} {back} onstart={() => startShared(workout)} onadd={add(workout)}>
		{#snippet chips()}
			<Chip>Shared with you</Chip>
		{/snippet}
	</WorkoutPreview>
{:else if read}
	<PreviewMessage {back} title="This link can’t be opened">
		<p role="alert">{read.error}</p>
		<p><a href="/">Go to My Workouts</a></p>
	</PreviewMessage>
{/if}
