<script lang="ts">
	import { page } from '$app/state';
	import type { Workout } from '#lib/engine/workout.ts';
	import PreviewPage from '#lib/preview/PreviewPage.svelte';
	import WorkoutPreview from '#lib/preview/WorkoutPreview.svelte';
	import { deviceStore } from '#lib/store/device.ts';
	import { readShareLink, type ReadShareLink } from '#lib/transfer/share-link.ts';
	import { startShared } from '#lib/transfer/shared.ts';

	/** The link's Workout, once read from the fragment (which never reached a server). */
	let read = $state.raw<ReadShareLink>();
	$effect(() => {
		const hash = page.url.hash;
		read = undefined;
		readShareLink(hash)
			.catch(() => ({ error: 'This link couldn’t be opened.' }))
			.then((result) => hash === page.url.hash && (read = result));
	});
	// Each copy gets its own id, so adding it twice keeps two.
	const add = (workout: Workout) => async () => (await deviceStore()).add({ ...workout, id: crypto.randomUUID() });
</script>

<svelte:head>
	<title>{read && 'workout' in read ? read.workout.name : 'Shared Workout'} · hiit-rome</title>
</svelte:head>

<PreviewPage back={{ href: '/', label: 'My Workouts' }}>
	{#if read && 'workout' in read}
		{@const workout = read.workout}
		<WorkoutPreview {workout} onstart={() => startShared(workout)} onadd={add(workout)}>
			{#snippet details()}
				<p class="from">Shared with you</p>
			{/snippet}
		</WorkoutPreview>
	{:else if read}
		<h1>This link can’t be opened</h1>
		<p role="alert">{read.error}</p>
		<p><a href="/">Go to My Workouts</a></p>
	{/if}
</PreviewPage>

<style>
	.from {
		margin: 8px 0 0;
		font-weight: 600;
		opacity: 0.8;
	}
</style>
