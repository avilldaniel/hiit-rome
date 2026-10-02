<script lang="ts">
	import { page } from '$app/state';
	import { deviceStore } from '#lib/store/device.ts';
	import type { StoredWorkout } from '#lib/store/workout-store.ts';
	import SessionScreen from '#lib/session/SessionScreen.svelte';

	const id = page.params.id!;
	let workout = $state<StoredWorkout | null | undefined>();
	deviceStore()
		.then((store) => store.get(id))
		.then((found) => (workout = found ?? null));
	const markUsed = () => void deviceStore().then((store) => store.markUsed(id));
</script>

<svelte:head>
	<title>{workout?.name ?? 'Session'} · hiit-rome</title>
</svelte:head>

{#if workout}
	<SessionScreen {workout} onstart={markUsed} />
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
