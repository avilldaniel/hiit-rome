<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { Workout } from '#lib/engine/workout.ts';
	import { deviceStore } from '#lib/store/device.ts';
	import { WIZARDS, type Next } from '#lib/wizards/wizards.ts';

	const wizard = $derived(WIZARDS.find((w) => w.style === page.params.style));

	async function finish(workout: Workout, next: Next) {
		const saved = await (await deviceStore()).add(workout);
		await goto(next === 'start' ? `/session/${saved.id}` : `/edit/${saved.id}`);
	}
</script>

<svelte:head>
	<title>{wizard?.title ?? 'Unknown'} Wizard · hiit-rome</title>
</svelte:head>

{#if wizard}
	{#key wizard.style}
		<wizard.form title={wizard.title} onfinish={finish} />
	{/key}
{:else}
	<main class="missing">
		<h1>Wizard not found</h1>
		<a href="/wizard">Back to Wizards</a>
	</main>
{/if}

<style>
	.missing {
		padding: 10vh 6vw;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
	}
</style>
