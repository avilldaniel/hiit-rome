<script lang="ts">
	import { page } from '$app/state';
	import { copySample, findSample, LEVEL_LABEL } from '#lib/library/samples.ts';
	import PreviewMessage from '#lib/preview/PreviewMessage.svelte';
	import WorkoutPreview from '#lib/preview/WorkoutPreview.svelte';
	import { deviceStore } from '#lib/store/device.ts';
	import Chip from '#lib/ui/Chip.svelte';

	const back = { href: '/library', label: 'Library' };
	const sample = $derived(findSample(page.params.id!));
	const add = async () => (await deviceStore()).add(copySample(sample!));
</script>

<svelte:head>
	<title>{sample?.workout.name ?? 'Sample'} · hiit-rome</title>
</svelte:head>

{#if sample}
	<WorkoutPreview workout={sample.workout} {back} description={sample.blurb} onadd={add}>
		{#snippet chips()}
			<!-- The hidden dot keeps the text "Level · Style", as it read before the chips. -->
			<Chip>{LEVEL_LABEL[sample.level]}</Chip><span class="sr-only">{' · '}</span><Chip>{sample.style}</Chip>
		{/snippet}
	</WorkoutPreview>
{:else}
	<PreviewMessage {back} title="Sample not found">
		<p><a href="/library">Back to the Library</a></p>
	</PreviewMessage>
{/if}
