<script module lang="ts">
	/** Where a page leads back to, such as the Library. */
	export type Back = { href: string; label: string };
</script>

<script lang="ts">
	import Icon from './Icon.svelte';

	/** A link back to where the trainer came from. Its name keeps the arrow the text link had, e.g. "← Library". */
	let { href, label }: Back = $props();
</script>

<a class="back" {href} aria-label="← {label}"><Icon name="left" />{label}</a>

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		width: max-content;
		min-height: 44px;
		color: var(--text);
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
	}

	@media (hover: hover) {
		.back:hover {
			text-decoration: underline;
			text-underline-offset: 4px;
		}
	}
</style>
