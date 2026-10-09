<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Back } from '#lib/ui/BackLink.svelte';
	import Message from '#lib/ui/Message.svelte';
	import PreviewPage from './PreviewPage.svelte';

	/** Shown on a preview page in place of a Workout that can't be found or opened. */
	let { back, title, children }: { back: Back; title: string; children: Snippet } = $props();
</script>

<PreviewPage {back}>
	<Message class="preview-card" {title}>{@render children()}</Message>
</PreviewPage>
