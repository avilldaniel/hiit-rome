<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import Icon, { type IconName } from './Icon.svelte';

	type Props = {
		variant?: 'default' | 'primary' | 'ghost' | 'danger';
		/** `prompt` is for a choice read from across the room: the Resume prompt, confirm dialogs and Dismiss. */
		size?: 'default' | 'large' | 'prompt';
		icon?: IconName;
		/** The label. Leave it out for an icon-only button, which then takes its name from `aria-label`. */
		children?: Snippet;
	} & ((HTMLButtonAttributes & { href?: undefined }) | (Omit<HTMLAnchorAttributes, 'type'> & { href: string }));

	let { variant = 'default', size = 'default', icon, children, class: className, ...rest }: Props = $props();

	const classes = $derived([
		'button',
		variant,
		size !== 'default' && size,
		!children && 'icon-only',
		className
	]);
</script>

{#snippet content()}
	{#if icon}<Icon name={icon} />{/if}
	{@render children?.()}
{/snippet}

{#if rest.href !== undefined}
	<a class={classes} {...rest as HTMLAnchorAttributes}>{@render content()}</a>
{:else}
	<button type="button" class={classes} {...rest as HTMLButtonAttributes}>{@render content()}</button>
{/if}

<style>
	.button {
		appearance: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--s2);
		box-sizing: border-box;
		min-height: 44px;
		padding: 0 var(--s4);
		border: 1px solid var(--line);
		border-radius: var(--r);
		background: var(--surface);
		color: var(--text);
		font: 600 16px/1 var(--font-body);
		white-space: nowrap;
		text-decoration: none;
		cursor: pointer;
		transition:
			background var(--dur-fast) var(--ease-out),
			border-color var(--dur-fast) var(--ease-out),
			transform var(--dur-fast) var(--ease-out);
	}

	.primary {
		border-color: transparent;
		background: var(--primary);
		color: var(--on-primary);
	}

	.ghost {
		border-color: transparent;
		background: transparent;
	}

	.danger {
		color: var(--danger);
	}

	.icon-only {
		width: 44px;
		padding: 0;
	}

	.large {
		min-height: 56px;
		padding: 0 var(--s5);
		font-size: 18px;
	}

	.prompt {
		min-height: 72px;
		padding: 0 var(--s7);
		border-radius: var(--r-lg);
		font-size: 24px;
	}

	.large.icon-only {
		width: 56px;
		padding: 0;
	}

	.button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	@media (hover: hover) {
		.button:not(:disabled):hover {
			border-color: var(--text);
		}

		.primary:not(:disabled):hover {
			border-color: transparent;
			background: var(--primary-hover);
		}

		.ghost:not(:disabled):hover {
			border-color: transparent;
			background: color-mix(in srgb, var(--text) 7%, transparent);
		}
	}

	.button:not(:disabled):active {
		transform: translateY(1px);
	}

	/* A pressed toggle, such as Favorite, shows its state in the favorite color with a filled star. */
	.button[aria-pressed='true'] {
		color: var(--favorite);
	}

	.button[aria-pressed='true'] :global(.icon) {
		fill: currentColor;
	}
</style>
