<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { Workout } from '#lib/engine/workout.ts';
	import { deviceStore } from '#lib/store/device.ts';
	import MessagePage from '#lib/ui/MessagePage.svelte';
	import { WIZARDS, type Finish } from '#lib/wizards/registry.ts';

	const wizard = $derived(WIZARDS.find((w) => w.style === page.params.style));

	async function finish(workout: Workout, how: Finish) {
		const saved = await (await deviceStore()).add(workout);
		await goto(how === 'start' ? `/session/${saved.id}` : `/edit/${saved.id}`);
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
	<MessagePage title="Wizard not found">
		<p><a href="/wizard">Back to Wizards</a></p>
	</MessagePage>
{/if}
