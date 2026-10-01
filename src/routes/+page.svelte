<script lang="ts">
	import { demoWorkout } from '#lib/demo-workout.ts';
	import SessionScreen from '#lib/session/SessionScreen.svelte';
</script>

<svelte:head>
	<title>{demoWorkout.name} · hiit-rome</title>
</svelte:head>

<SessionScreen workout={demoWorkout} />
