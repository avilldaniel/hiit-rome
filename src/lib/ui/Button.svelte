<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import Icon, { type IconName } from './Icon.svelte';
	import { pressable } from './motion.ts';

	type Props = {
		variant?: 'default' | 'primary' | 'accent' | 'ink' | 'ghost' | 'danger';
		/** `prompt` is for a choice read from across the room: the Resume prompt, confirm dialogs and Dismiss. */
		size?: 'small' | 'default' | 'large' | 'prompt';
		icon?: IconName;
		/** The label. Leave it out for an icon-only button, which then takes its name from `aria-label`. */
		children?: Snippet;
	} & ((HTMLButtonAttributes & { href?: undefined }) | (Omit<HTMLAnchorAttributes, 'type'> & { href: string }));

	let { variant = 'default', size = 'default', icon, children, class: className, ...rest }: Props = $props();

	const classes = $derived([
		'button',
		'pressable',
		variant,
		size !== 'default' && size,
		!children && 'icon-only',
		className
	]);
</script>

{#snippet content()}
	{#if icon}<Icon name={icon} size={size === 'large' || size === 'prompt' ? 24 : 20} />{/if}
	{@render children?.()}
{/snippet}

<!-- An ink-outlined sticker of a button: it lifts on hover and squashes into its shadow when pressed. -->
{#if rest.href !== undefined}
	<a class={classes} {...rest as HTMLAnchorAttributes} {@attach pressable}>{@render content()}</a>
{:else}
	<button type="button" class={classes} {...rest as HTMLButtonAttributes} {@attach pressable}>{@render content()}</button>
{/if}

<style>
	.button {
		--fill: var(--surface);
		--ink: var(--text);
		appearance: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--s2);
		box-sizing: border-box;
		min-height: 48px;
		padding: 0 var(--s4);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r);
		background: var(--fill);
		color: var(--ink);
		font: 700 var(--fs-body) / 1 var(--font-body);
		white-space: nowrap;
		text-decoration: none;
		cursor: pointer;
		transition: background-color var(--dur) ease;
	}

	.primary {
		--fill: var(--primary);
		--ink: var(--on-primary);
	}

	.accent {
		--fill: var(--accent);
		--ink: var(--on-accent);
	}

	.ink {
		--fill: var(--text);
		--ink: var(--ground);
	}

	/* No shadow to sink into: a dashed outline that nudges when pressed. */
	.ghost {
		--fill: transparent;
		--depth: 0px;
		border-style: dashed;
	}

	.danger {
		--ink: var(--danger);
	}

	.icon-only {
		--depth: 2px;
		width: 44px;
		min-height: 44px;
		padding: 0;
		border-width: 2px;
	}

	.small {
		--depth: 2px;
		min-height: 40px;
		padding: 0 var(--s3);
		font-size: var(--fs-sm);
	}

	.large {
		min-height: 60px;
		padding: 0 var(--s5);
		font-size: var(--fs-lead);
	}

	.prompt {
		min-height: 76px;
		padding: 0 var(--s7);
		border-radius: var(--r-lg);
		font-size: 24px;
		font-weight: 800;
	}

	.large.icon-only {
		width: 60px;
		padding: 0;
	}

	.button:disabled,
	.button[aria-disabled='true'] {
		--depth: 2px;
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* A pressed toggle, such as Favorite, fills yellow with a filled icon. */
	.button[aria-pressed='true'] {
		--fill: var(--hue-yellow);
		--ink: var(--favorite);
	}

	.button[aria-pressed='true'] :global(.icon) {
		fill: currentColor;
	}

	@media (max-width: 767px) {
		.large {
			min-height: 56px;
			font-size: var(--fs-body);
		}
	}
</style>
