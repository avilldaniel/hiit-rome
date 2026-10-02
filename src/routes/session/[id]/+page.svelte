<script lang="ts">
	import { page } from '$app/state';
	import { startBlocker } from '#lib/engine/outline.ts';
	import { deviceStore } from '#lib/store/device.ts';
	import type { StoredWorkout } from '#lib/store/workout-store.ts';
	import SessionScreen from '#lib/session/SessionScreen.svelte';

	const id = $derived(page.params.id!);
	let workout = $state.raw<StoredWorkout | null | undefined>();
	$effect(() => {
		const wanted = id;
		workout = undefined;
		deviceStore()
			.then((store) => store.get(wanted))
			.catch(() => undefined)
			.then((found) => wanted === id && (workout = found ?? null));
	});
	const blocker = $derived(workout && startBlocker(workout.items));
	// Bookkeeping only: a Workout deleted meanwhile (in another tab) has nothing to update.
	const markUsed = () => void deviceStore().then((store) => store.markUsed(id)).catch(() => {});
</script>

<svelte:head>
	<title>{workout?.name ?? 'Session'} · hiit-rome</title>
</svelte:head>

{#if workout && blocker}
	<main class="missing">
		<h1>{workout.name} can’t start yet</h1>
		<p>{blocker}</p>
		<a href="/edit/{workout.id}">Edit {workout.name}</a>
	</main>
{:else if workout}
	{#key workout.id}
		<SessionScreen {workout} onstart={markUsed} />
	{/key}
{:else if workout === null}
	<main class="missing">
		<h1>Workout not found</h1>
		<p>It may have been deleted.</p>
		<a href="/">Back to My Workouts</a>
	</main>
{/if}

<style>
	.missing {
		padding: 10vh 6vw;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
	}
</style>
