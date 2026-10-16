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
	 * The Diptych: NOW and NEXT as two posters side by side. NOW is solid in the current Kind color; NEXT is striped in
	 * the next Interval's color, so the room sees it coming before it arrives (and a chequered flag before Finish). Every
	 * word on NEXT sits on a solid card, never on the stripes. An ink gutter between them carries the progress, filling
	 * downwards; the Group and the time left are stickers on a strip of tape across the top.
	 */
	let { stage, deck, picker, list }: { stage: SessionStage; deck: Snippet; picker: Snippet; list: Snippet } =
		$props();

	const index = $derived(stage.index);
	const next = $derived(stage.isFinal ? null : stage.upcoming[0]);
	const later = $derived(stage.isFinal ? [] : stage.upcoming.slice(1, 3));
	const finish = PALETTE.cooldown;
</script>

<div class="diptych" {@attach dealIn({ selector: ':scope > [data-deal]', gap: 0.07 })}>
	<div class="tape" data-deal>
		{#key stage.lines.join()}
			<p class="group" {@attach boing()}>
				{#each stage.lines as line (line)}<span>{line}</span>{/each}
			</p>
		{/key}
		<div class="picker">{@render picker()}</div>
		<p class="left" data-testid="time-left"><span class="num">{stage.timeLeft}</span> left</p>
	</div>

	<main
		class={['panel', stage.ink && 'ink', stage.pinned && 'decked']}
		style:background-color={stage.colors.background}
		style:color={stage.colors.text}
		data-deal
	>
		{#if stage.pill}<KindPill text={stage.pill} hint={stage.hint} ink={stage.ink} />{/if}
		<IntervalTitle title={stage.title} long={stage.longTitle} />
		<SessionClock clock={stage.clock} pulseKey={stage.pulseKey} />
	</main>

	<div class="gutter" aria-hidden="true" data-deal>
		<span class="coin"><Icon name="right" /></span>
		<span class="bar">
			<i style:--p="{stage.progress * 100}%" style:background={stage.ink ? 'var(--accent)' : stage.colors.background}></i>
		</span>
	</div>

	<div class="controls">{@render deck()}</div>

	<aside class="poster" aria-labelledby="up-next" data-deal>
		<i
			class={['stripes', !next && 'flag']}
			style:--nk={next?.colors.background ?? finish.background}
			aria-hidden="true"
		></i>
		<div class="poster-in">
			<h2 class="head" id="up-next"><span class="up">Up</span> <span class="big">next</span></h2>
			<ol class="upnext" aria-labelledby="up-next" {@attach dealIn({ key: index, gap: 0.06 })}>
				{#if next}
					<li class="card" style:--kc={next.colors.background}>
						<span class="edge"></span>
						<span class="body">
							<span class="name"><BreakableName text={next.name} /></span>
							<span class="dur">{formatClock(next.durationMs)}</span>
						</span>
					</li>
					{#each later as entry (entry.index)}
						<li class="row" style:--kc={entry.colors.background}>
							<span class="row-edge"></span>
							<span class="row-name"><BreakableName text={entry.name} /></span>
							<span class="row-dur">{formatClock(entry.durationMs)}</span>
						</li>
					{/each}
				{:else}
					<li class="card finish" style:--kc={finish.background}>
						<span class="edge"></span>
						<span class="body">
							<span class="name">Finish</span>
							<span class="check"><Icon name="check" /></span>
						</span>
					</li>
				{/if}
			</ol>
		</div>
	</aside>

	{@render list()}
</div>

<style>
	.diptych {
		/* The Interval list opens over the NEXT poster. */
		--list-inset: calc(150 * var(--tv)) calc(40 * var(--tv)) calc(40 * var(--tv)) auto;
		--list-width: calc((100vw - 168 * var(--tv)) * 650 / 1760);
		box-sizing: border-box;
		height: 100%;
		display: grid;
		grid-template-columns: minmax(0, 1110fr) calc(64 * var(--tv)) minmax(0, 650fr);
		grid-template-rows: auto minmax(0, 1fr);
		column-gap: calc(20 * var(--tv));
		row-gap: calc(24 * var(--tv));
		padding: calc(18 * var(--tv)) calc(40 * var(--tv)) calc(40 * var(--tv)) calc(24 * var(--tv));
		overflow: hidden;
	}

	/* The tape: the Group and the time left as two stickers on a dashed strip. */
	.tape {
		grid-column: 1 / -1;
		grid-row: 1;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: calc(24 * var(--tv));
		min-width: 0;
		padding: calc(6 * var(--tv)) calc(8 * var(--tv));
	}

	.tape::before {
		content: '';
		position: absolute;
		left: calc(40 * var(--tv));
		right: calc(40 * var(--tv));
		top: 50%;
		border-top: var(--ln2) dashed var(--line);
		opacity: 0.45;
	}

	.picker {
		position: relative;
	}

	.tape p {
		position: relative;
		margin: 0;
		border: var(--ln) solid var(--line);
		border-radius: var(--r-full);
	}

	.group {
		display: flex;
		flex-wrap: wrap;
		column-gap: 0.6em;
		max-width: 60%;
		padding: calc(12 * var(--tv)) calc(30 * var(--tv));
		background: var(--hue-yellow);
		color: var(--text);
		font: 700 calc(40 * var(--tv)) / 1.1 var(--font-mono);
		overflow-wrap: break-word;
		rotate: -2deg;
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--line);
	}

	.left {
		display: inline-flex;
		align-items: baseline;
		gap: calc(14 * var(--tv));
		padding: calc(4 * var(--tv)) calc(34 * var(--tv)) calc(8 * var(--tv));
		background: var(--text);
		color: var(--ground);
		font: 900 calc(40 * var(--tv)) / 1 var(--font-display);
		white-space: nowrap;
		rotate: 2deg;
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--accent);
	}

	.num {
		font-size: calc(72 * var(--tv));
		font-variant-numeric: tabular-nums;
	}

	/* NOW: a giant sticker in the Kind color, its time anchored to the foot. */
	.panel {
		--pill-size: calc(48 * var(--tv));
		--name-size: calc(110 * var(--tv));
		--name-size-long: calc(80 * var(--tv));
		--clock-size: calc(430 * var(--tv));
		--clock-origin: left bottom;
		grid-area: 2 / 1;
		position: relative;
		container-type: inline-size;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		min-width: 0;
		min-height: 0;
		padding: calc(36 * var(--tv)) calc(40 * var(--tv)) calc(26 * var(--tv));
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
		right: calc(-150 * var(--tv));
		top: calc(-190 * var(--tv));
		width: calc(560 * var(--tv));
		height: calc(560 * var(--tv));
		border: var(--ln) solid currentColor;
		border-radius: 50%;
		opacity: 0.16;
		background: repeating-linear-gradient(
			-45deg,
			transparent 0 calc(20 * var(--tv)),
			currentColor calc(20 * var(--tv)) calc(26 * var(--tv))
		);
	}

	.panel > :global(*) {
		position: relative;
	}

	/* The pill rides the top; the name and the time sit at the foot. */
	.panel > :global(.pill) {
		margin-bottom: auto;
	}

	.panel > :global(.title) {
		margin-top: calc(24 * var(--tv));
	}

	.panel > :global(.clock) {
		margin: calc(10 * var(--tv)) 0 0 calc(-8 * var(--tv));
	}

	.ink {
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--accent);
	}

	/* Ready and paused keep the controls on screen, at the top, so the pill clears them. */
	.decked {
		padding-top: calc(196 * var(--tv));
	}

	/* The gutter: a chunky ink column; the progress runs down it, under an arrow from NOW to NEXT. */
	.gutter {
		grid-area: 2 / 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(14 * var(--tv));
		min-height: 0;
		padding: calc(10 * var(--tv)) 0 calc(14 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: var(--r-full);
		background: var(--line);
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--accent);
	}

	.coin {
		flex: none;
		display: grid;
		place-items: center;
		width: calc(44 * var(--tv));
		height: calc(44 * var(--tv));
		border-radius: 50%;
		background: var(--ground);
		color: var(--text);
	}

	.coin :global(.icon) {
		width: calc(30 * var(--tv));
		height: calc(30 * var(--tv));
		stroke-width: 3.2;
	}

	.bar {
		flex: 1;
		min-height: 0;
		box-sizing: border-box;
		width: calc(32 * var(--tv));
		border: var(--ln2) solid var(--ground);
		border-radius: var(--r-full);
		background: color-mix(in srgb, var(--ground) 16%, var(--line));
		overflow: hidden;
	}

	.bar i {
		display: block;
		position: relative;
		box-sizing: border-box;
		width: 100%;
		height: var(--p);
		min-height: calc(14 * var(--tv));
		border-bottom: var(--ln2) solid var(--ground);
	}

	.bar i::after {
		content: '';
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			-45deg,
			transparent 0 calc(10 * var(--tv)),
			color-mix(in srgb, var(--line) 24%, transparent) calc(10 * var(--tv)) calc(16 * var(--tv))
		);
	}

	/* The controls float at the top of the NOW poster, where only the pill is: the name and time stay in view. */
	.controls {
		grid-area: 2 / 1;
		align-self: start;
		justify-self: center;
		z-index: 40;
		max-width: calc(100% - 12 * var(--tv));
		margin-top: calc(26 * var(--tv));
	}

	/* NEXT: a poster striped in the next Interval's Kind color and cream. */
	.poster {
		grid-area: 2 / 3;
		position: relative;
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		border: var(--ln) solid var(--line);
		border-radius: var(--r-lg-tv);
		background: var(--ground);
		color: var(--text);
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--line);
		overflow: hidden;
	}

	.stripes {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			-45deg,
			var(--nk) 0 calc(42 * var(--tv)),
			var(--line) calc(42 * var(--tv)) calc(47 * var(--tv)),
			var(--ground) calc(47 * var(--tv)) calc(89 * var(--tv)),
			var(--line) calc(89 * var(--tv)) calc(94 * var(--tv))
		);
		transition: background var(--dur) ease;
	}

	.flag {
		background: repeating-conic-gradient(var(--line) 0 25%, var(--ground) 0 50%) 0 0 / calc(96 * var(--tv))
			calc(96 * var(--tv));
	}

	.poster-in {
		position: relative;
		z-index: 1;
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: calc(30 * var(--tv));
		padding: calc(26 * var(--tv)) calc(30 * var(--tv)) calc(24 * var(--tv)) calc(26 * var(--tv));
	}

	/* "Up next", as a huge ink sticker. */
	.head {
		align-self: flex-start;
		display: inline-flex;
		align-items: baseline;
		gap: calc(16 * var(--tv));
		margin: 0;
		padding: calc(10 * var(--tv)) calc(36 * var(--tv)) calc(14 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: var(--r-full);
		background: var(--text);
		color: var(--ground);
		font-weight: 900;
		line-height: 1;
		letter-spacing: -0.01em;
		text-transform: uppercase;
		rotate: -4deg;
		box-shadow: var(--o-md) var(--o-md) 0 var(--accent);
	}

	.up {
		font-size: calc(44 * var(--tv));
	}

	.big {
		font-size: calc(104 * var(--tv));
		letter-spacing: -0.03em;
	}

	/* A column that wraps: a row that doesn't fit moves to a hidden second column, whole. */
	.upnext {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		align-content: flex-start;
		gap: calc(26 * var(--tv)) 4000px;
		margin: 0;
		padding: 0;
		overflow: hidden;
		list-style: none;
	}

	/* The next Interval: a big cream card with a fat Kind edge and a Kind-filled duration. */
	.card {
		--edge: calc(34 * var(--tv));
		position: relative;
		box-sizing: border-box;
		display: grid;
		grid-template-columns: var(--edge) minmax(0, 1fr);
		width: 100%;
		border: var(--ln) solid var(--line);
		border-radius: var(--r-md-tv);
		background: var(--surface);
		rotate: -1deg;
		box-shadow: calc(12 * var(--tv)) calc(12 * var(--tv)) 0 var(--line);
	}

	.edge,
	.row-edge {
		align-self: stretch;
		border-right: var(--ln) solid var(--line);
		border-radius: calc(15 * var(--tv)) 0 0 calc(15 * var(--tv));
		background: var(--kc);
	}

	.body {
		min-width: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: calc(16 * var(--tv)) calc(24 * var(--tv));
		padding: calc(24 * var(--tv)) calc(24 * var(--tv)) calc(24 * var(--tv)) calc(26 * var(--tv));
	}

	.name {
		flex: 1 1 auto;
		min-width: 0;
		align-self: center;
		font: 800 calc(76 * var(--tv)) / 1.04 var(--font-body);
		letter-spacing: -0.03em;
		overflow-wrap: break-word;
	}

	.dur {
		margin-left: auto;
		padding: calc(8 * var(--tv)) calc(20 * var(--tv)) calc(10 * var(--tv));
		border: var(--ln2) solid var(--line);
		border-radius: calc(16 * var(--tv));
		background: var(--kc);
		font: 900 calc(80 * var(--tv)) / 1 var(--font-display);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		rotate: 2deg;
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--line);
	}

	.finish .body {
		align-items: center;
		flex-wrap: nowrap;
	}

	.finish .name {
		font: 900 calc(80 * var(--tv)) / 1.04 var(--font-display);
		text-transform: uppercase;
		letter-spacing: -0.02em;
	}

	.check {
		flex: none;
		display: grid;
		place-items: center;
		width: calc(110 * var(--tv));
		height: calc(110 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: 50%;
		background: var(--kc);
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--line);
	}

	.check :global(.icon) {
		width: calc(64 * var(--tv));
		height: calc(64 * var(--tv));
		stroke-width: 3;
	}

	/* The two after that: smaller outlined rows, still full contrast. */
	.row {
		--edge: calc(22 * var(--tv));
		box-sizing: border-box;
		display: grid;
		grid-template-columns: var(--edge) minmax(0, 1fr) auto;
		align-items: center;
		width: calc(100% - 14 * var(--tv));
		margin-left: calc(14 * var(--tv));
		border: var(--ln2) solid var(--line);
		border-radius: calc(18 * var(--tv));
		background: var(--surface);
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--line);
	}

	.row:nth-child(3) {
		width: calc(100% - 32 * var(--tv));
		margin-left: calc(32 * var(--tv));
		rotate: 0.6deg;
	}

	.row-edge {
		border-right-width: var(--ln2);
		border-radius: calc(14 * var(--tv)) 0 0 calc(14 * var(--tv));
	}

	.row-name {
		min-width: 0;
		padding: calc(12 * var(--tv)) calc(12 * var(--tv)) calc(14 * var(--tv)) calc(18 * var(--tv));
		font: 800 calc(46 * var(--tv)) / 1.06 var(--font-body);
		letter-spacing: -0.025em;
		overflow-wrap: break-word;
	}

	.row-dur {
		padding: 0 calc(20 * var(--tv)) 0 calc(4 * var(--tv));
		font: 900 calc(46 * var(--tv)) / 1 var(--font-display);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.04em;
		white-space: nowrap;
	}

	/* Portrait or narrow: the tape, NOW, a sideways gutter, then NEXT at full width. */
	@media (max-width: 768px), (orientation: portrait) {
		.diptych {
			height: auto;
			min-height: 100%;
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: auto auto auto auto;
			row-gap: calc(30 * var(--tv));
			padding: calc(24 * var(--tv)) calc(40 * var(--tv)) calc(500 * var(--tv)) calc(24 * var(--tv));
			overflow: visible;
		}

		.tape {
			grid-area: 1 / 1;
			flex-wrap: wrap;
			row-gap: calc(16 * var(--tv));
		}

		.group {
			max-width: 100%;
		}

		.panel {
			grid-area: 2 / 1;
			min-height: min(56vh, calc(1000 * var(--tv)));
			padding: calc(40 * var(--tv)) calc(36 * var(--tv)) calc(28 * var(--tv));
		}

		.decked {
			padding-top: calc(40 * var(--tv));
		}

		.gutter {
			grid-area: 3 / 1;
			flex-direction: row;
			height: calc(68 * var(--tv));
			padding: 0 calc(14 * var(--tv)) 0 calc(10 * var(--tv));
		}

		.coin {
			rotate: 90deg;
		}

		.bar {
			width: auto;
			height: calc(32 * var(--tv));
		}

		.bar i {
			width: var(--p);
			height: 100%;
			min-width: calc(14 * var(--tv));
			border-bottom: 0;
			border-right: var(--ln2) solid var(--ground);
		}

		.poster {
			grid-area: 4 / 1;
			min-height: calc(700 * var(--tv));
		}

		.upnext {
			flex: none;
			flex-wrap: nowrap;
			overflow: visible;
		}

		.controls {
			margin: 0;
		}
	}
</style>
