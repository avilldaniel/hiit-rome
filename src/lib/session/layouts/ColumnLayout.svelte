<script lang="ts">
	import type { Snippet } from 'svelte';
	import { dealIn } from '#lib/ui/motion.ts';
	import IntervalTitle from '../IntervalTitle.svelte';
	import KindPill from '../KindPill.svelte';
	import SessionClock from '../SessionClock.svelte';
	import type { SessionStage } from '../stage.ts';
	import UpNextStack from '../UpNextStack.svelte';

	/**
	 * The Column: the current Interval as a giant sticker in its Kind color, beside a wide purple Up next column of
	 * cream cards (about 62:38). The controls float at the foot of the panel; the Interval list opens over the column.
	 */
	let { stage, deck, picker, list }: { stage: SessionStage; deck: Snippet; picker: Snippet; list: Snippet } =
		$props();
</script>

<div class="column" {@attach dealIn({ selector: ':scope > :is(main, aside)', gap: 0.08 })}>
	<main
		class={['panel', stage.ink && 'ink', stage.pinned && 'decked']}
		style:background-color={stage.colors.background}
		style:color={stage.colors.text}
	>
		{#if stage.pill}<KindPill text={stage.pill} hint={stage.hint} ink={stage.ink} />{/if}
		<IntervalTitle title={stage.title} long={stage.longTitle} />
		<SessionClock clock={stage.clock} pulseKey={stage.pulseKey} />
		<div class="progress" aria-hidden="true"><i style:width="{stage.progress * 100}%"></i></div>
	</main>

	<div class="controls">{@render deck()}</div>

	<aside class="rail" aria-labelledby="up-next">
		<UpNextStack {stage} aside={picker} />
		<div class="foot">
			{#each stage.lines as line (line)}
				<p class="line">{line}</p>
			{/each}
			<p class="left" data-testid="time-left"><span class="num">{stage.timeLeft}</span> left</p>
		</div>
	</aside>

	{@render list()}
</div>

<style>
	.column {
		/* The Interval list opens over the Up next column. */
		--list-inset: calc(24 * var(--tv)) calc(24 * var(--tv)) calc(24 * var(--tv)) auto;
		--list-width: calc((100vw - 72 * var(--tv)) * 0.38);
		box-sizing: border-box;
		height: 100%;
		display: grid;
		grid-template-columns: minmax(0, 62fr) minmax(0, 38fr);
		grid-template-rows: minmax(0, 1fr);
		gap: calc(24 * var(--tv));
		padding: calc(24 * var(--tv));
		overflow: hidden;
	}

	/* The panel: a giant sticker in the Kind color, with a hatched disc tucked in its corner. */
	.panel {
		--pill-size: calc(48 * var(--tv));
		--name-size: calc(110 * var(--tv));
		--name-size-long: calc(80 * var(--tv));
		--clock-size: calc(420 * var(--tv));
		grid-area: 1 / 1;
		position: relative;
		container-type: inline-size;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: calc(20 * var(--tv));
		min-width: 0;
		min-height: 0;
		padding: calc(48 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: var(--r-lg-tv);
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--line);
		overflow: hidden;
		transition:
			background-color var(--dur) ease,
			color var(--dur) ease;
	}

	.panel::before {
		content: '';
		position: absolute;
		right: calc(-140 * var(--tv));
		bottom: calc(-170 * var(--tv));
		width: calc(580 * var(--tv));
		height: calc(580 * var(--tv));
		border: var(--ln) solid currentColor;
		border-radius: 50%;
		opacity: 0.18;
		background: repeating-linear-gradient(
			-45deg,
			transparent 0 calc(20 * var(--tv)),
			currentColor calc(20 * var(--tv)) calc(26 * var(--tv))
		);
	}

	.panel > :global(*) {
		position: relative;
	}

	.ink {
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--accent);
	}

	/* Ready and paused keep the controls on screen, so the content clears them. */
	.decked {
		padding-bottom: calc(200 * var(--tv));
	}

	.panel :global(.title) {
		margin-top: calc(8 * var(--tv));
	}

	.panel :global(.clock) {
		margin: calc(-4 * var(--tv)) 0 calc(8 * var(--tv));
	}

	/* A chunky outlined bar, filling with stripes in the panel's own color. */
	.progress {
		flex: none;
		box-sizing: border-box;
		height: calc(36 * var(--tv));
		border: var(--ln) solid currentColor;
		border-radius: var(--r-full);
		background: color-mix(in srgb, currentColor 12%, transparent);
		overflow: hidden;
	}

	.progress i {
		display: block;
		box-sizing: border-box;
		height: 100%;
		min-width: calc(14 * var(--tv));
		border-right: var(--ln) solid currentColor;
		background: repeating-linear-gradient(
			-45deg,
			currentColor 0 calc(12 * var(--tv)),
			color-mix(in srgb, currentColor 75%, transparent) calc(12 * var(--tv)) calc(20 * var(--tv))
		);
	}

	.controls {
		grid-area: 1 / 1;
		align-self: end;
		justify-self: center;
		z-index: 40;
		max-width: calc(100% - 16 * var(--tv));
		margin-bottom: calc(28 * var(--tv));
	}

	/* Up next: a wide purple column of cream sticker cards, with an ink foot. */
	.rail {
		grid-area: 1 / 2;
		display: flex;
		flex-direction: column;
		gap: calc(20 * var(--tv));
		min-width: 0;
		min-height: 0;
		padding: calc(28 * var(--tv)) calc(24 * var(--tv)) calc(24 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: var(--r-lg-tv);
		background: var(--hue-purple);
		color: var(--text);
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--line);
	}

	.foot {
		flex: none;
		display: flex;
		flex-direction: column;
		gap: calc(6 * var(--tv));
		padding: calc(18 * var(--tv)) calc(28 * var(--tv)) calc(20 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: var(--r-md-tv);
		background: var(--text);
		color: var(--ground);
	}

	.foot p {
		margin: 0;
	}

	.line {
		font: 700 calc(40 * var(--tv)) / 1.15 var(--font-mono);
		overflow-wrap: break-word;
	}

	.left {
		font: 900 calc(40 * var(--tv)) / 1 var(--font-display);
		white-space: nowrap;
	}

	.num {
		font-size: calc(72 * var(--tv));
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.02em;
	}

	/* Portrait or narrow: Up next stacks under the panel at full width; the controls float at the foot of the screen. */
	@media (max-width: 768px), (orientation: portrait) {
		.column {
			height: auto;
			min-height: 100%;
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: auto auto;
			gap: calc(40 * var(--tv));
			padding: calc(28 * var(--tv)) calc(28 * var(--tv)) calc(500 * var(--tv));
			overflow: visible;
		}

		.panel {
			min-height: min(62vh, calc(1100 * var(--tv)));
			padding: calc(48 * var(--tv)) calc(40 * var(--tv));
		}

		.decked {
			padding-bottom: calc(48 * var(--tv));
		}

		.rail {
			grid-area: 2 / 1;
		}

		.controls {
			margin: 0;
		}
	}
</style>
