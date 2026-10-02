<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import WorkoutEditor from '#lib/editor/WorkoutEditor.svelte';
	import type { Workout } from '#lib/engine/workout.ts';
	import { deviceStore } from '#lib/store/device.ts';
	import type { StoredWorkout } from '#lib/store/workout-store.ts';

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
	const save = async (changed: Workout) => (await deviceStore()).save(changed);
</script>

<svelte:head>
	<title>Edit {workout?.name ?? 'Workout'} · hiit-rome</title>
</svelte:head>

{#if workout}
	{#key workout.id}
		<WorkoutEditor {workout} onsave={save} onstart={() => goto(`/session/${workout!.id}`)} />
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
