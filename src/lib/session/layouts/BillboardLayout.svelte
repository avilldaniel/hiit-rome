<script lang="ts">
	import type { Snippet } from 'svelte';
	import { formatClock } from '#lib/engine/format.ts';
	import { PALETTE } from '#lib/engine/palette.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import { boing, dealIn } from '#lib/ui/motion.ts';
	import IntervalTitle from '../IntervalTitle.svelte';
	import KindPill from '../KindPill.svelte';
	import BreakableName from '../BreakableName.svelte';
	import SessionClock from '../SessionClock.svelte';
	import type { SessionStage } from '../stage.ts';

	/**
	 * The Billboard: three full-width poster bands stacked like a highway billboard, one fact per band, so every name
	 * gets the whole width. NOW (the Kind color) runs the name as a headline over the pill and a giant time; the
	 * progress bar is the seam below it. NEXT (cream) is one long line; LATER (ink) is a row of chips, with the Group
	 * and the time left as stickers at its end. The controls appear over the LATER chips.
	 */
	let { stage, deck, picker, list }: { stage: SessionStage; deck: Snippet; picker: Snippet; list: Snippet } =
		$props();

	const index = $derived(stage.index);
	const next = $derived(stage.isFinal ? null : stage.upcoming[0]);
	const later = $derived(stage.isFinal ? [] : stage.upcoming.slice(1));
	const finish = PALETTE.cooldown;
	const TILTS = [-1, 0.6, -0.6, 0.8];
</script>

<div class="billboard" {@attach dealIn({ selector: ':scope > [data-deal]', gap: 0.08 })}>
	<main
		class={['poster', 'now', stage.ink && 'ink']}
		style:background-color={stage.colors.background}
		style:color={stage.colors.text}
		data-deal
	>
		<span class="deco" aria-hidden="true"></span>
		<div class="picker">{@render picker()}</div>
		<IntervalTitle title={stage.title} long={stage.longTitle} />
		<div class="foot">
			{#if stage.pill}<KindPill text={stage.pill} hint={stage.hint} ink={stage.ink} />{/if}
			<SessionClock clock={stage.clock} pulseKey={stage.pulseKey} />
		</div>
		<div class="seam" aria-hidden="true" style:--seam={stage.ink ? 'var(--accent)' : stage.colors.background}>
			<i style:width="{stage.progress * 100}%"></i>
		</div>
	</main>

	<section
		class={['poster', 'next', stage.isFinal && 'finish']}
		style:--kc={next?.colors.background ?? finish.background}
		aria-labelledby="up-next"
		data-deal
	>
		<span class="edge"></span>
		<h2 class="tag" id="up-next">Up next</h2>
		<ol aria-labelledby="up-next" {@attach dealIn({ key: index })}>
			<li>
				{#if next}
					<span class="name"><BreakableName text={next.name} /></span>
					<span class="dur">{formatClock(next.durationMs)}</span>
				{:else}
					<span class="name">Finish</span>
					<span class="check"><Icon name="check" /></span>
				{/if}
			</li>
		</ol>
	</section>

	<div class={['poster', 'later-band', stage.isFinal && 'flag']} aria-hidden="true" data-deal></div>
	<ol class="later" aria-label="Later" {@attach dealIn({ key: index, gap: 0.05, delay: 0.05 })}>
		{#each later as entry, i (entry.index)}
			<li class="chip" style:--kc={entry.colors.background} style:--tilt="{TILTS[i % TILTS.length]}deg">
				<span class="chip-edge"></span>
				<span class="chip-body"><span class="chip-name"><BreakableName text={entry.name} /></span><span class="chip-dur">{formatClock(entry.durationMs)}</span></span>
			</li>
		{/each}
	</ol>

	<div class="meta">
		{#key stage.lines.join()}
			<p class="group" {@attach boing()}>
				{#each stage.lines as line (line)}<span>{line}</span>{/each}
			</p>
		{/key}
		<p class="left" data-testid="time-left"><span class="num">{stage.timeLeft}</span> left</p>
	</div>

	<div class="controls">{@render deck()}</div>

	{@render list()}
</div>

<style>
	.billboard {
		/* The Interval list opens over the NEXT and LATER bands, as two columns, so the time stays in view. */
		--gap: calc(18 * var(--tv));
		--list-inset: auto calc(26 * var(--tv)) calc(26 * var(--tv)) calc(12 * var(--tv));
		--list-width: auto;
		--list-height: calc(440 * var(--tv));
		--list-columns: 2;
		box-sizing: border-box;
		height: 100%;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-rows: minmax(0, 1fr) auto auto;
		grid-template-areas: 'now now' 'next next' 'later meta';
		row-gap: var(--gap);
		padding: calc(12 * var(--tv)) calc(26 * var(--tv)) calc(26 * var(--tv)) calc(12 * var(--tv));
		overflow: hidden;
		/* A halftone of ink dots on the cream. */
		background:
			radial-gradient(
					color-mix(in srgb, var(--line) 14%, transparent) calc(2.6 * var(--tv)),
					transparent calc(3.2 * var(--tv))
				)
				0 0 / calc(24 * var(--tv)) calc(24 * var(--tv)),
			var(--ground);
	}

	.poster {
		position: relative;
		border: var(--ln) solid var(--line);
		border-radius: var(--r-lg-tv);
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--line);
	}

	/* NOW: the name is the headline across the full width; the pill and the giant time share the foot. */
	.now {
		--pill-size: calc(68 * var(--tv));
		--pill-hint-size: calc(40 * var(--tv));
		--pill-tilt: -5deg;
		--name-size: calc(116 * var(--tv));
		--name-size-long: calc(84 * var(--tv));
		--clock-size: clamp(calc(400 * var(--tv)), 118cqh, calc(470 * var(--tv)));
		--clock-room: 72cqw;
		--clock-origin: right bottom;
		grid-area: now;
		z-index: 2;
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		padding: calc(18 * var(--tv)) calc(44 * var(--tv)) calc(28 * var(--tv)) calc(48 * var(--tv));
		transition:
			background-color var(--dur) ease,
			color var(--dur) ease;
	}

	.ink {
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--accent);
	}

	.deco {
		position: absolute;
		inset: 0;
		border-radius: calc(var(--r-lg-tv) - var(--ln));
		overflow: hidden;
		pointer-events: none;
	}

	.deco::before {
		content: '';
		position: absolute;
		left: calc(-160 * var(--tv));
		bottom: calc(-260 * var(--tv));
		width: calc(620 * var(--tv));
		height: calc(620 * var(--tv));
		border: var(--ln) solid currentColor;
		border-radius: 50%;
		opacity: 0.16;
		background: repeating-linear-gradient(
			-45deg,
			transparent 0 calc(20 * var(--tv)),
			currentColor calc(20 * var(--tv)) calc(26 * var(--tv))
		);
	}

	.now > :global(*:not(.deco, .seam, .picker)) {
		position: relative;
	}

	/* The layout picker: in the top corner, clear of the name. */
	.picker {
		position: absolute;
		top: calc(24 * var(--tv));
		right: calc(30 * var(--tv));
		z-index: 4;
	}

	.now > :global(.title) {
		flex: none;
	}

	.foot {
		flex: 1;
		min-height: 0;
		container-type: size;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: calc(36 * var(--tv));
	}

	.foot > :global(.pill) {
		flex: 0 1 auto;
		align-self: flex-end;
		min-width: 0;
		margin: 0 0 calc(30 * var(--tv)) calc(6 * var(--tv));
		transform-origin: left bottom;
	}

	.foot > :global(.pill:not(.ink)) {
		box-shadow: var(--o-md) var(--o-md) 0 var(--line);
	}

	/* On the ink, the pill is a pink sticker rather than an outline. */
	.foot > :global(.pill.ink) {
		border-color: var(--line);
		background: var(--accent);
		color: var(--on-accent);
		box-shadow: var(--o-md) var(--o-md) 0 var(--line);
	}

	.foot > :global(.clock) {
		flex: none;
		margin: 0 calc(-6 * var(--tv)) calc(-4 * var(--tv)) auto;
		line-height: 0.8;
	}

	/* The progress bar is the seam between NOW and NEXT. */
	.seam {
		position: absolute;
		left: calc(44 * var(--tv));
		right: calc(44 * var(--tv));
		bottom: calc(-1 * (var(--gap) / 2 + var(--ln) + 24 * var(--tv)));
		z-index: 3;
		box-sizing: border-box;
		height: calc(48 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: var(--r-full);
		background: var(--surface);
		overflow: hidden;
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--line);
	}

	.seam i {
		display: block;
		box-sizing: border-box;
		height: 100%;
		min-width: calc(18 * var(--tv));
		border-right: var(--ln) solid var(--line);
		background: repeating-linear-gradient(
			-45deg,
			var(--text) 0 calc(12 * var(--tv)),
			var(--seam) calc(12 * var(--tv)) calc(24 * var(--tv))
		);
	}

	/* NEXT: one long line across the full width, wrapping only if it must. */
	.next {
		grid-area: next;
		z-index: 1;
		display: grid;
		grid-template-columns: calc(48 * var(--tv)) auto minmax(0, 1fr);
		align-items: center;
		column-gap: calc(36 * var(--tv));
		min-width: 0;
		min-height: calc(200 * var(--tv));
		padding: 0 calc(40 * var(--tv)) 0 0;
		background: var(--ground);
		color: var(--text);
	}

	.edge {
		align-self: stretch;
		border-right: var(--ln) solid var(--line);
		border-radius: calc(var(--r-lg-tv) - var(--ln)) 0 0 calc(var(--r-lg-tv) - var(--ln));
		background: var(--kc);
	}

	.tag {
		width: min-content;
		margin: calc(12 * var(--tv)) 0 0;
		padding: calc(10 * var(--tv)) calc(22 * var(--tv));
		border: var(--ln2) solid var(--line);
		border-radius: var(--r-md-tv);
		background: var(--accent);
		color: var(--on-accent);
		font: 900 calc(40 * var(--tv)) / 1.02 var(--font-display);
		text-align: center;
		text-transform: uppercase;
		rotate: -7deg;
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--line);
	}

	.next ol {
		min-width: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.next li {
		display: flex;
		align-items: center;
		gap: calc(36 * var(--tv));
	}

	.name {
		flex: 1;
		min-width: 0;
		padding: calc(28 * var(--tv)) 0 calc(12 * var(--tv));
		font: 800 calc(80 * var(--tv)) / 1 var(--font-body);
		letter-spacing: -0.03em;
		text-wrap: balance;
		overflow-wrap: break-word;
	}

	.dur {
		flex: none;
		margin-top: calc(14 * var(--tv));
		padding: calc(12 * var(--tv)) calc(28 * var(--tv)) calc(10 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: var(--r-md-tv);
		background: var(--kc);
		font: 900 calc(80 * var(--tv)) / 1 var(--font-display);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.04em;
		white-space: nowrap;
		rotate: 2deg;
		box-shadow: var(--o-md) var(--o-md) 0 var(--line);
	}

	.finish .name {
		font-family: var(--font-display);
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: -0.02em;
	}

	.check {
		flex: none;
		display: grid;
		place-items: center;
		width: calc(124 * var(--tv));
		height: calc(124 * var(--tv));
		margin-top: calc(14 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: 50%;
		background: var(--kc);
		rotate: 6deg;
		box-shadow: var(--o-md) var(--o-md) 0 var(--line);
	}

	.check :global(.icon) {
		width: calc(72 * var(--tv));
		height: calc(72 * var(--tv));
		stroke-width: 3;
	}

	/* LATER: an ink strip of chips; a chip that doesn't fit wraps to a hidden second line, whole. */
	.later-band {
		grid-row: 3;
		grid-column: 1 / -1;
		min-height: calc(168 * var(--tv));
		background: var(--text);
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--hue-purple);
	}

	/* Before Finish, a chequered flag. */
	.flag {
		background: repeating-conic-gradient(var(--text) 0 25%, var(--ground) 0 50%) 0 0 / calc(56 * var(--tv))
			calc(56 * var(--tv));
	}

	.later {
		grid-area: later;
		contain: size;
		align-self: stretch;
		min-width: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		align-content: flex-start;
		gap: 2000px calc(28 * var(--tv));
		margin: 0;
		padding: calc(32 * var(--tv)) calc(16 * var(--tv)) 0 calc(36 * var(--tv));
		overflow: hidden;
		list-style: none;
	}

	.chip {
		display: grid;
		grid-template-columns: calc(24 * var(--tv)) minmax(0, auto);
		max-width: 100%;
		border: var(--ln2) solid var(--line);
		border-radius: var(--r-md-tv);
		background: var(--ground);
		color: var(--text);
		rotate: var(--tilt);
		box-shadow: var(--o-md) var(--o-md) 0 var(--hue-purple);
	}

	.chip-edge {
		border-right: var(--ln2) solid var(--line);
		border-radius: calc(var(--r-md-tv) - var(--ln2)) 0 0 calc(var(--r-md-tv) - var(--ln2));
		background: var(--kc);
	}

	.chip-body {
		min-width: 0;
		display: flex;
		align-items: baseline;
		gap: calc(22 * var(--tv));
		padding: calc(14 * var(--tv)) calc(26 * var(--tv)) calc(16 * var(--tv)) calc(20 * var(--tv));
	}

	.chip-name {
		min-width: 0;
		font: 800 calc(48 * var(--tv)) / 1.08 var(--font-body);
		letter-spacing: -0.02em;
		overflow-wrap: break-word;
	}

	.chip-dur {
		font: 900 calc(48 * var(--tv)) / 1 var(--font-display);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.04em;
		white-space: nowrap;
	}

	/* The Group and the time left: two overlapping stickers at the end of the LATER band. */
	.meta {
		grid-area: meta;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: center;
		min-width: 0;
		max-width: calc(640 * var(--tv));
		padding: calc(10 * var(--tv)) calc(34 * var(--tv)) calc(12 * var(--tv)) calc(16 * var(--tv));
	}

	.meta p {
		max-width: 100%;
		margin: 0;
		border: var(--ln2) solid var(--line);
		border-radius: var(--r-md-tv);
		color: var(--text);
		text-align: right;
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--line);
	}

	.meta .group {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		margin-right: calc(30 * var(--tv));
		padding: calc(4 * var(--tv)) calc(24 * var(--tv));
		background: var(--hue-yellow);
		font: 700 calc(40 * var(--tv)) / 1.15 var(--font-mono);
		rotate: 2deg;
	}

	.meta .left {
		margin-top: calc(-4 * var(--tv));
		padding: calc(8 * var(--tv)) calc(26 * var(--tv)) calc(6 * var(--tv));
		background: var(--surface);
		font: 900 calc(40 * var(--tv)) / 1 var(--font-display);
		white-space: nowrap;
		rotate: -2deg;
	}

	.num {
		font-size: calc(76 * var(--tv));
		font-variant-numeric: tabular-nums;
	}

	/* The controls: one row over the LATER chips, leaving the Group and the time left in view. */
	.controls {
		grid-area: later;
		align-self: center;
		justify-self: stretch;
		z-index: 40;
		min-width: 0;
		margin: 0 calc(4 * var(--tv)) 0 calc(14 * var(--tv));
	}

	.controls :global(.deck) {
		flex-wrap: nowrap;
		width: 100%;
	}

	/* Tiles share the band; Start, Pause or Resume takes a bigger share. */
	.controls :global(.deck .tile) {
		flex: 1 1 0;
	}

	.controls :global(.deck .main) {
		flex-grow: 1.8;
	}

	/* Portrait or narrow: the bands stack into one tall poster column; nothing is dropped. */
	@media (max-width: 768px), (orientation: portrait) {
		.billboard {
			--gap: calc(36 * var(--tv));
			height: auto;
			min-height: 100%;
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: auto;
			grid-template-areas: 'now' 'next' 'later' 'meta';
			padding: calc(24 * var(--tv)) calc(36 * var(--tv)) calc(520 * var(--tv)) calc(24 * var(--tv));
			overflow: visible;
		}

		.now {
			container-type: inline-size;
			min-height: min(50vh, calc(900 * var(--tv)));
			padding: calc(48 * var(--tv)) calc(40 * var(--tv)) calc(64 * var(--tv));
			--name-size: calc(104 * var(--tv));
			--name-size-long: calc(76 * var(--tv));
			--clock-size: calc(420 * var(--tv));
			--clock-room: 100cqi;
		}

		.foot {
			display: contents;
		}

		.foot > :global(.pill) {
			order: -1;
			align-self: flex-start;
			margin: 0 0 calc(32 * var(--tv));
		}

		.foot > :global(.clock) {
			align-self: flex-end;
			margin: auto 0 0;
			padding-top: calc(40 * var(--tv));
		}

		.next {
			grid-template-columns: calc(40 * var(--tv)) minmax(0, 1fr);
			grid-template-areas: 'edge tag' 'edge list';
			align-items: start;
			padding: 0 calc(36 * var(--tv)) calc(40 * var(--tv)) 0;
		}

		.edge {
			grid-area: edge;
		}

		.tag {
			grid-area: tag;
			width: auto;
			margin-top: calc(48 * var(--tv));
		}

		.next ol {
			grid-area: list;
		}

		.next li {
			flex-direction: column;
			align-items: stretch;
		}

		.dur,
		.check {
			align-self: flex-end;
		}

		.later-band {
			grid-row: 3 / 5;
			grid-column: 1;
		}

		.later {
			contain: none;
			flex-direction: column;
			flex-wrap: nowrap;
			align-items: stretch;
			gap: calc(24 * var(--tv));
			padding: calc(36 * var(--tv)) calc(32 * var(--tv)) calc(8 * var(--tv));
			overflow: visible;
		}

		.chip {
			rotate: 0deg;
		}

		.chip-body {
			justify-content: space-between;
		}

		.meta {
			align-items: flex-start;
			max-width: none;
			padding: calc(24 * var(--tv)) calc(32 * var(--tv)) calc(40 * var(--tv));
		}

		.meta p {
			text-align: left;
		}

		.controls {
			margin: 0;
		}

		.controls :global(.deck) {
			width: auto;
		}
	}
</style>
