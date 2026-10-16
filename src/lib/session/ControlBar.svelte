<script lang="ts">
	import { ADJUST_MS, type SessionCommand, type SessionView } from '#lib/engine/session.ts';
	import Button from '#lib/ui/Button.svelte';
	import { reveal } from '#lib/ui/motion.ts';

	let {
		status,
		visible,
		pinned = false,
		steps = true,
		onaction,
		onopenlist,
		onrestart,
		onend
	}: {
		status: SessionView['status'];
		/** Shown for a moment after a touch or a mouse move. */
		visible: boolean;
		/** Kept on screen regardless, while ready or paused. */
		pinned?: boolean;
		/** Previous, next and the Interval list; a Countdown, with only one Interval, has none. */
		steps?: boolean;
		onaction: (command: SessionCommand) => void;
		onopenlist?: () => void;
		onrestart: () => void;
		onend: () => void;
	} = $props();

	const playLabel = $derived(status === 'idle' ? 'Start' : status === 'paused' ? 'Resume' : 'Pause');
	const shown = $derived(visible || pinned);

	// Springs up into place as it shows, and drops away as it hides.
	let deck: HTMLElement;
	$effect(() => {
		const animation = reveal(deck, shown, { rise: 24 });
		return () => animation.stop();
	});
</script>

<!-- Every Session action, for touch, as chunky tiles. The screen ignores pointer events that start here. -->
<nav class="deck" bind:this={deck} aria-label="Session controls" data-controls inert={!shown}>
	{#if steps}
		<Button class="tile" icon="previous" onclick={() => onaction({ type: 'previous' })}>Previous</Button>
	{/if}
	<Button class="tile" icon="minus" onclick={() => onaction({ type: 'adjust', deltaMs: -ADJUST_MS })}>−30 s</Button>
	<Button
		class="tile main"
		variant={status === 'paused' ? 'accent' : 'primary'}
		icon={status === 'idle' || status === 'paused' ? 'play' : 'pause'}
		onclick={() => onaction({ type: 'toggle' })}>{playLabel}</Button
	>
	<Button class="tile" icon="plus" onclick={() => onaction({ type: 'adjust', deltaMs: ADJUST_MS })}>+30 s</Button>
	{#if steps}
		<Button class="tile" icon="next" onclick={() => onaction({ type: 'next' })}>Next</Button>
	{/if}
	{#if steps && status !== 'idle'}
		<Button class="tile" icon="list" onclick={onopenlist}>Intervals</Button>
	{/if}
	{#if status === 'paused'}
		<Button class="tile" icon="restart" onclick={onrestart}>Restart</Button>
	{/if}
	{#if status !== 'idle'}
		<Button class="tile" variant="danger" icon="stop" onclick={onend}>End</Button>
	{/if}
</nav>

<style>
	/* A pale yellow tray of chunky tiles, sized in TV pixels; the screen's layout places it. */
	.deck {
		box-sizing: border-box;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: stretch;
		gap: calc(8 * var(--tv));
		width: max-content;
		max-width: 100%;
		padding: calc(12 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: calc(28 * var(--tv));
		background: var(--surface-2);
		color: var(--text);
		box-shadow: var(--o-md) var(--o-md) 0 var(--line);
		opacity: 0;
		pointer-events: none;
	}

	.deck:not([inert]) {
		pointer-events: auto;
	}

	.deck :global(.tile) {
		--depth: var(--o-sm);
		flex-direction: column;
		gap: calc(6 * var(--tv));
		min-height: calc(112 * var(--tv));
		padding: calc(10 * var(--tv)) calc(10 * var(--tv));
		border-width: var(--ln2);
		border-radius: calc(16 * var(--tv));
		font-size: max(12px, calc(27 * var(--tv)));
		line-height: 1;
	}

	.deck :global(.tile .icon) {
		width: calc(38 * var(--tv));
		height: calc(38 * var(--tv));
	}

	/* Start, Pause and Resume: wider, the icon beside the label, filled. */
	.deck :global(.main) {
		flex-direction: row;
		gap: calc(10 * var(--tv));
		min-width: calc(170 * var(--tv));
		padding: 0 calc(20 * var(--tv));
		font-size: max(14px, calc(32 * var(--tv)));
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.deck :global(.main .icon) {
		width: calc(40 * var(--tv));
		height: calc(40 * var(--tv));
		fill: currentColor;
	}

	/* Portrait or narrow: a grid floating over the foot of the screen, Start/Pause first and full width. */
	@media (max-width: 768px), (orientation: portrait) {
		.deck {
			position: fixed;
			left: calc(20 * var(--tv));
			right: calc(20 * var(--tv));
			bottom: calc(20 * var(--tv));
			z-index: 40;
			display: grid;
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: calc(12 * var(--tv));
			width: auto;
		}

		.deck :global(.tile) {
			min-width: 0;
			min-height: max(52px, calc(112 * var(--tv)));
			padding: calc(8 * var(--tv)) calc(4 * var(--tv));
		}

		.deck :global(.main) {
			grid-column: 1 / -1;
			order: -1;
			min-height: max(52px, calc(100 * var(--tv)));
		}

	}
</style>
