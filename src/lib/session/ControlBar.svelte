<script lang="ts">
	import { ADJUST_MS, type SessionCommand, type SessionView } from '#lib/engine/session.ts';
	import Button from '#lib/ui/Button.svelte';

	let {
		status,
		visible,
		steps = true,
		onaction,
		onopenlist,
		onrestart,
		onend
	}: {
		status: SessionView['status'];
		visible: boolean;
		/** Previous, next and the Interval list; a Countdown, with only one Interval, has none. */
		steps?: boolean;
		onaction: (command: SessionCommand) => void;
		onopenlist?: () => void;
		onrestart: () => void;
		onend: () => void;
	} = $props();

	const playLabel = $derived(status === 'idle' ? 'Start' : status === 'paused' ? 'Resume' : 'Pause');
</script>

<!-- Every Session action, for touch. The screen ignores pointer events that start here. -->
<nav class="controls" class:visible aria-label="Session controls" data-controls inert={!visible}>
	{#if steps}
		<Button size="large" onclick={() => onaction({ type: 'previous' })}>Previous</Button>
	{/if}
	<Button size="large" onclick={() => onaction({ type: 'adjust', deltaMs: -ADJUST_MS })}>−30 s</Button>
	<Button size="large" variant="primary" onclick={() => onaction({ type: 'toggle' })}>{playLabel}</Button>
	<Button size="large" onclick={() => onaction({ type: 'adjust', deltaMs: ADJUST_MS })}>+30 s</Button>
	{#if steps}
		<Button size="large" onclick={() => onaction({ type: 'next' })}>Next</Button>
	{/if}
	{#if steps && status !== 'idle'}
		<Button size="large" onclick={onopenlist}>Intervals</Button>
	{/if}
	{#if status === 'paused'}
		<Button size="large" onclick={onrestart}>Restart</Button>
	{/if}
	{#if status !== 'idle'}
		<Button size="large" onclick={onend}>End</Button>
	{/if}
</nav>

<style>
	/* A white card floating at the foot of the panel, over whatever color it has. */
	.controls {
		position: absolute;
		left: 50%;
		bottom: calc(32 * var(--tv));
		translate: -50% 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--s2);
		box-sizing: border-box;
		width: max-content;
		max-width: calc(100% - 2 * var(--s4));
		padding: var(--s2);
		border-radius: var(--r-lg);
		background: var(--surface);
		box-shadow: var(--shadow);
		color: var(--text);
		opacity: 0;
		transition: opacity var(--dur) var(--ease-out);
		pointer-events: none;
	}

	/* Tighter than a large button's usual padding, so all eight fit on one row at 1280 px. */
	.controls :global(.button) {
		padding: 0 var(--s4);
	}

	/* Stacked portrait layout: the main area is too short to overlay, so float over the foot of the screen. */
	@media (orientation: portrait) {
		.controls {
			position: fixed;
		}
	}

	.controls.visible {
		opacity: 1;
		pointer-events: auto;
	}
</style>
