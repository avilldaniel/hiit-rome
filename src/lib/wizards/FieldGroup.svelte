<script lang="ts">
	import type { Snippet } from 'svelte';

	/** A titled set of a Wizard's fields, two to a row; a field marked `.wide` takes a whole row. */
	let { legend, children }: { legend: string; children: Snippet } = $props();
</script>

<fieldset>
	<legend>{legend}</legend>
	{@render children()}
</fieldset>

<style>
	fieldset {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--s4) var(--s5);
		min-width: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}

	fieldset + :global(fieldset) {
		padding-top: var(--s6);
		border-top: 1px solid var(--line);
	}

	/* Floated, so it's laid out as a row of the grid rather than drawn on the fieldset's border. */
	legend {
		float: left;
		grid-column: 1 / -1;
		margin-bottom: calc(var(--s3) - var(--s4));
		padding: 0;
		font: 800 22px var(--font-display);
		letter-spacing: -0.01em;
	}

	fieldset :global(.wide) {
		grid-column: 1 / -1;
	}
</style>
