<script lang="ts">
	import type { Snippet } from 'svelte';
	import Message from './Message.svelte';

	/** A page with only a `Message` on it, such as a Workout that can't be found or started, or an error. */
	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<main>
	<Message {title}>{@render children()}</Message>
</main>

<style>
	main {
		padding: var(--s7) var(--s8);
	}

	@media (max-width: 1100px) {
		main {
			padding: var(--s5) var(--s4) var(--s7);
		}
	}
</style>
