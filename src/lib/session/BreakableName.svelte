<script lang="ts">
	/** A name that may break after each slash ("Hold/Pulse/Single"), rather than mid-word, when it wraps. */
	let { text }: { text: string } = $props();

	const parts = $derived(text.split('/'));
</script>

{#each parts as part, i}{#if i > 0}/<wbr />{/if}{part}{/each}
