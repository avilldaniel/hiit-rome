<script lang="ts">
	import { page } from '$app/state';
	import { copySample, findSample, LEVEL_LABEL } from '#lib/library/samples.ts';
	import PreviewPage from '#lib/preview/PreviewPage.svelte';
	import WorkoutPreview from '#lib/preview/WorkoutPreview.svelte';
	import { deviceStore } from '#lib/store/device.ts';

	const sample = $derived(findSample(page.params.id!));
	const add = async () => (await deviceStore()).add(copySample(sample!));
</script>

<svelte:head>
	<title>{sample?.workout.name ?? 'Sample'} · hiit-rome</title>
</svelte:head>

<PreviewPage back={{ href: '/library', label: 'Library' }}>
	{#if sample}
		<WorkoutPreview workout={sample.workout} onadd={add}>
			{#snippet details()}
				<p class="tags">{LEVEL_LABEL[sample.level]} · {sample.style}</p>
				<p class="blurb">{sample.blurb}</p>
			{/snippet}
		</WorkoutPreview>
	{:else}
		<h1>Sample not found</h1>
		<p><a href="/library">Back to the Library</a></p>
	{/if}
</PreviewPage>

<style>
	.tags {
		margin: 8px 0 0;
		font-weight: 600;
		opacity: 0.8;
	}

	.blurb {
		font-size: 18px;
		opacity: 0.8;
	}
</style>
