<script lang="ts">
	import type { Snippet } from 'svelte';

	// The control goes in `children`: the label wraps it, so it names the control without an id. `inline` puts the
	// label beside the control; `hideLabel` keeps it for screen readers only, for a control whose purpose shows.
	let {
		label,
		inline = false,
		hideLabel = false,
		children
	}: { label: string; inline?: boolean; hideLabel?: boolean; children: Snippet } = $props();
</script>

<label class={['field', inline && 'inline']}>
	<span class={['label', hideLabel && 'hidden']}>{label}</span>
	{@render children()}
</label>

<style>
	.field {
		display: grid;
		gap: var(--s1);
	}

	.inline {
		display: flex;
		align-items: center;
		gap: var(--s2);
	}

	.label {
		font-size: 14px;
		font-weight: 600;
		color: var(--muted);
		white-space: nowrap;
	}

	.hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	.field :global(:is(input:not([type='checkbox'], [type='radio']), select)) {
		box-sizing: border-box;
		width: 100%;
		min-height: 44px;
		padding: 0 var(--s3);
		border: 1px solid var(--line);
		border-radius: var(--r-sm);
		background-color: var(--surface);
		color: var(--text);
		font: 500 17px/1 var(--font-body);
		font-variant-numeric: tabular-nums;
	}

	.field :global(select) {
		appearance: none;
		padding-right: 36px;
		background-image:
			linear-gradient(45deg, transparent 50%, currentColor 50%),
			linear-gradient(135deg, currentColor 50%, transparent 50%);
		background-position:
			calc(100% - 18px) 50%,
			calc(100% - 13px) 50%;
		background-size: 5px 5px;
		background-repeat: no-repeat;
		cursor: pointer;
	}

	.field :global(input::placeholder) {
		color: var(--muted);
		font-style: italic;
	}

	@media (hover: hover) {
		.field :global(:is(input, select):hover) {
			border-color: var(--line-strong);
		}
	}
</style>
