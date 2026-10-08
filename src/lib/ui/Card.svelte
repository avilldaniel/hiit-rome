<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		as = 'div',
		children,
		class: className,
		...rest
	}: { as?: 'div' | 'article' | 'section' | 'aside'; children: Snippet } & HTMLAttributes<HTMLElement> = $props();
</script>

<svelte:element this={as} class={['card', className]} {...rest}>{@render children()}</svelte:element>

<style>
	.card {
		display: grid;
		align-content: start;
		gap: var(--s4);
		padding: var(--s6);
		border-radius: var(--r-lg);
		background: var(--surface);
		box-shadow: var(--shadow);
	}
</style>
