<script lang="ts">
	import { formatClock } from '#lib/engine/format.ts';
	import { PALETTE } from '#lib/engine/palette.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import type { Snippet } from 'svelte';
	import { dealIn } from '#lib/ui/motion.ts';
	import BreakableName from './BreakableName.svelte';
	import type { SessionStage } from './stage.ts';

	/**
	 * Up next as a stack of cream sticker cards: the next Interval biggest, with a fat Kind edge and a tilted NEXT
	 * sticker, then up to three more a size down in a loose offset stack. Names wrap and are never cut: a card that
	 * doesn't fit is dropped whole. The cards are dealt in afresh each time the Interval changes. `aside` sits at the
	 * end of the heading's row, such as the layout picker.
	 */
	let { stage, aside }: { stage: SessionStage; aside?: Snippet } = $props();

	const index = $derived(stage.index);
	const finish = PALETTE.cooldown;
</script>

<div class="head">
	<h2 class="title" id="up-next"><span class="sticker">Up next</span></h2>
	{@render aside?.()}
</div>
<ol class="cards" aria-labelledby="up-next" {@attach dealIn({ key: index, gap: 0.05 })}>
	{#if stage.isFinal}
		<li class="card first finish" style:--kc={finish.background}>
			<span class="edge"></span>
			<span class="body"><span class="name">Finish</span><span class="check" style:background={finish.background}><Icon name="check" /></span></span>
			<span class="tag" aria-hidden="true">Next</span>
		</li>
	{:else}
		{#each stage.upcoming.slice(0, 4) as entry, i (entry.index)}
			<li class={['card', i === 0 ? 'first' : 'later']} style:--kc={entry.colors.background} style:--i={i - 1}>
				<span class="edge"></span>
				<span class="body"><span class="name"><BreakableName text={entry.name} /></span><span class="dur">{formatClock(entry.durationMs)}</span></span>
				{#if i === 0}<span class="tag" aria-hidden="true">Next</span>{/if}
			</li>
		{/each}
	{/if}
</ol>

<style>
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: calc(16 * var(--tv));
	}

	.title {
		flex: none;
		margin: 0;
		line-height: 1;
	}

	.sticker {
		display: inline-block;
		white-space: nowrap;
		padding: calc(8 * var(--tv)) calc(24 * var(--tv));
		border: var(--ln2) solid var(--line);
		border-radius: var(--r-full);
		background: var(--surface);
		font: 700 calc(40 * var(--tv)) / 1.3 var(--font-mono);
		rotate: -3deg;
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--line);
	}

	/* A column that wraps: a card that doesn't fit moves to a second column, out of view, whole. */
	.cards {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		align-content: flex-start;
		gap: calc(22 * var(--tv)) 400px;
		margin: 0 calc(-12 * var(--tv));
		padding: calc(30 * var(--tv)) calc(24 * var(--tv)) calc(16 * var(--tv)) calc(12 * var(--tv));
		overflow: hidden;
		list-style: none;
	}

	.card {
		--edge: calc(20 * var(--tv));
		position: relative;
		box-sizing: border-box;
		display: grid;
		grid-template-columns: var(--edge) minmax(0, 1fr);
		width: 100%;
		border: var(--ln) solid var(--line);
		border-radius: var(--r-md-tv);
		background: var(--surface);
		color: var(--text);
		box-shadow: var(--o-md) var(--o-md) 0 var(--line);
	}

	.edge {
		border-right: var(--ln) solid var(--line);
		border-radius: calc(15 * var(--tv)) 0 0 calc(15 * var(--tv));
		background: var(--kc);
	}

	.body {
		min-width: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: baseline;
		column-gap: calc(20 * var(--tv));
		padding: calc(14 * var(--tv)) calc(20 * var(--tv)) calc(16 * var(--tv));
	}

	.name {
		min-width: 0;
		font: 800 calc(44 * var(--tv)) / 1.06 var(--font-body);
		letter-spacing: -0.025em;
		overflow-wrap: break-word;
	}

	.dur {
		font: 900 calc(44 * var(--tv)) / 1 var(--font-display);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.04em;
		white-space: nowrap;
	}

	/* The next Interval: biggest, with a fat Kind edge and a tilted NEXT sticker. */
	.first {
		--edge: calc(34 * var(--tv));
		rotate: -1deg;
		box-shadow: calc(12 * var(--tv)) calc(12 * var(--tv)) 0 var(--line);
	}

	.first .body {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: calc(4 * var(--tv)) calc(28 * var(--tv));
		padding: calc(30 * var(--tv)) calc(28 * var(--tv)) calc(22 * var(--tv));
	}

	.first .name {
		flex: 1 1 auto;
		font-size: calc(64 * var(--tv));
		line-height: 1.04;
		letter-spacing: -0.03em;
	}

	.first .dur {
		margin-left: auto;
		font-size: calc(64 * var(--tv));
	}

	.tag {
		position: absolute;
		top: calc(-28 * var(--tv));
		left: calc(64 * var(--tv));
		z-index: 2;
		padding: calc(6 * var(--tv)) calc(20 * var(--tv));
		border: var(--ln2) solid var(--line);
		border-radius: var(--r-full);
		background: var(--accent);
		color: var(--on-accent);
		font: 900 calc(32 * var(--tv)) / 1.1 var(--font-display);
		text-transform: uppercase;
		rotate: -6deg;
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--line);
	}

	.finish .body {
		align-items: center;
		flex-wrap: nowrap;
	}

	.finish .name {
		font-family: var(--font-display);
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: -0.02em;
	}

	.check {
		display: grid;
		place-items: center;
		width: calc(96 * var(--tv));
		height: calc(96 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: 50%;
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--line);
	}

	.check :global(.icon) {
		width: calc(56 * var(--tv));
		height: calc(56 * var(--tv));
		stroke-width: 3;
	}

	/* The rest: a loose offset stack, one size step down, still full contrast. */
	.later {
		width: calc(100% - (var(--i) * 14 + (2 - var(--i)) * 6) * var(--tv));
		margin-left: calc(var(--i) * 14 * var(--tv));
		rotate: calc((var(--i) - 1) * 0.7deg);
		z-index: calc(10 - var(--i));
	}

	@media (max-width: 768px), (orientation: portrait) {
		.cards {
			flex: none;
			flex-wrap: nowrap;
			overflow: visible;
		}
	}
</style>
