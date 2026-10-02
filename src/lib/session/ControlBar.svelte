<script lang="ts">
	import { ADJUST_MS, type SessionCommand, type SessionView } from '#lib/engine/session.ts';
	
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
		<button onclick={() => onaction({ type: 'previous' })}>Previous</button>
	{/if}
	<button onclick={() => onaction({ type: 'adjust', deltaMs: -ADJUST_MS })}>−30 s</button>
	<button class="play" onclick={() => onaction({ type: 'toggle' })}>{playLabel}</button>
	<button onclick={() => onaction({ type: 'adjust', deltaMs: ADJUST_MS })}>+30 s</button>
	{#if steps}
		<button onclick={() => onaction({ type: 'next' })}>Next</button>
	{/if}
	{#if steps && status !== 'idle'}
		<button onclick={onopenlist}>Intervals</button>
	{/if}
	{#if status === 'paused'}
		<button onclick={onrestart}>Restart</button>
	{/if}
	{#if status !== 'idle'}
		<button onclick={onend}>End</button>
	{/if}
</nav>

<style>
	.controls {
		position: absolute;
		left: 50%;
		bottom: 3vh;
		translate: -50% 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1vw;
		width: max-content;
		max-width: 92%;
		padding: 1.2vh 1.2vw;
		border-radius: 1.5vh;
		background: color-mix(in srgb, var(--neutral-bg) 85%, transparent);
		opacity: 0;
		transition: opacity 0.3s;
		pointer-events: none;
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

	button {
		min-width: 44px;
		min-height: 44px;
		padding: 1.2vh 1.6vw;
		border: none;
		border-radius: 1vh;
		background: color-mix(in srgb, var(--neutral-text) 15%, transparent);
		color: var(--neutral-text);
		font: inherit;
		font-size: clamp(14px, 2.6vh, 32px);
		font-weight: 700;
		white-space: nowrap;
		cursor: pointer;
	}

	.play {
		background: var(--neutral-text);
		color: var(--neutral-bg);
	}
</style>
