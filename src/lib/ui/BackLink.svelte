<script module lang="ts">
	/** Where a page leads back to, such as the Library. */
	export type Back = { href: string; label: string };
</script>

<script lang="ts">
	import Icon from './Icon.svelte';
	import { pressable } from './motion.ts';

	/** A link back to where the trainer came from. Its name keeps the arrow the text link had, e.g. "← Library". */
	let { href, label }: Back = $props();
</script>

<a class="back pressable" {href} aria-label="← {label}" {@attach pressable}><Icon name="left" size={18} />{label}</a>

<style>
	/* A white pill with a small hard shadow. */
	.back {
		--depth: 2px;
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		box-sizing: border-box;
		width: max-content;
		min-height: 44px;
		padding: 0 var(--s3) 0 var(--s2);
		border: 2px solid var(--line);
		border-radius: var(--r-full);
		background: var(--surface);
		color: var(--text);
		font-size: var(--fs-sm);
		font-weight: 700;
		text-decoration: none;
		white-space: nowrap;
	}
</style>
