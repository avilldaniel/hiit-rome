<script lang="ts">
	import type { Snippet } from 'svelte';

	// The control goes in `children`: the label wraps it, so it names the control without an id. `inline` puts the
	// label beside the control; `hideLabel` keeps it for screen readers only, for a control whose purpose shows.
	// `large` is the Wizard's taller control, its text in the display face.
	let {
		label,
		inline = false,
		hideLabel = false,
		size = 'default',
		class: className,
		children
	}: {
		label: string;
		inline?: boolean;
		hideLabel?: boolean;
		size?: 'default' | 'large';
		class?: string;
		children: Snippet;
	} = $props();
</script>

<label class={['field', inline && 'inline', size === 'large' && 'large', className]}>
	<span class={['label', hideLabel && 'sr-only']}>{label}</span>
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

	/* Listed apart, not in the :is(), so the textarea rule below can still override its font. */
	.field :global(:is(input:not([type='checkbox'], [type='radio']), select)),
	.field :global(textarea) {
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

	.field :global(textarea) {
		display: block;
		padding: var(--s3);
		font: 500 var(--fs-body) / 1.5 var(--font-body);
		resize: vertical;
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

	.field :global(:is(input, textarea)::placeholder) {
		color: var(--muted);
		font-style: italic;
	}

	@media (hover: hover) {
		.field :global(:is(input, select, textarea):hover) {
			border-color: var(--line-strong);
		}
	}

	/* A control the browser won't accept yet, until it's put right. */
	.field :global([aria-invalid='true']) {
		border-color: var(--danger);
		outline: none;
		box-shadow: inset 0 0 0 1px var(--danger);
	}

	.field :global([aria-invalid='true']:focus-visible) {
		outline: 3px solid var(--focus);
	}

	/* Times and names alike, left-aligned. */
	.large :global(input:not([type='checkbox'], [type='radio'])) {
		min-height: 56px;
		font: 800 26px var(--font-display);
		letter-spacing: -0.01em;
		text-align: left;
	}
</style>
