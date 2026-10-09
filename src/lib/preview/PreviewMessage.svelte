<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Back } from '#lib/ui/BackLink.svelte';
	import PreviewPage from './PreviewPage.svelte';

	/** Shown on a preview page in place of a Workout that can't be found or opened. */
	let { back, title, children }: { back: Back; title: string; children: Snippet } = $props();
</script>

<PreviewPage {back}>
	<div class="preview-card message">
		<h1>{title}</h1>
		{@render children()}
	</div>
</PreviewPage>

<style>
	.message {
		max-width: 600px;
	}

	h1 {
		margin: 0;
		font-size: 48px;
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.05;
	}

	.message :global(p) {
		margin: 0;
		font-size: var(--fs-lead);
	}

	.message :global([role='alert']) {
		color: var(--danger);
		font-weight: 600;
	}

	.message :global(a) {
		color: var(--text);
		font-weight: 600;
		text-underline-offset: 4px;
	}
</style>
