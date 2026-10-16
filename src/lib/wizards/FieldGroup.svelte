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
	/* A numbered set of fields under a dashed rule; the number is a tilted yellow coin. */
	fieldset {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--s4) var(--s5);
		min-width: 0;
		margin: 0;
		padding: var(--s5) 0;
		border: 0;
		border-bottom: var(--stroke) dashed var(--line);
		counter-increment: fieldset;
	}

	/* Floated, so it's laid out as a row of the grid rather than drawn on the fieldset's border. */
	legend {
		float: left;
		display: flex;
		align-items: center;
		gap: var(--s3);
		grid-column: 1 / -1;
		margin-bottom: calc(var(--s3) - var(--s4));
		padding: 0;
		font: 900 var(--fs-lead) var(--font-display);
		text-transform: uppercase;
	}

	legend::before {
		content: counter(fieldset);
		display: grid;
		place-content: center;
		box-sizing: border-box;
		width: 34px;
		height: 34px;
		border: 2px solid var(--line);
		border-radius: var(--r-full);
		background: var(--hue-yellow);
		font: 700 var(--fs-sm) / 1 var(--font-mono);
		rotate: -8deg;
	}

	fieldset :global(.wide) {
		grid-column: 1 / -1;
	}

	@media (max-width: 767px) {
		fieldset {
			gap: var(--s3);
		}
	}
</style>
