<script lang="ts">
	import type { Snippet } from 'svelte';
	import { PALETTE } from '#lib/engine/palette.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import { timeWidthEm } from '#lib/ui/Panel.svelte';
	import { boing, dealIn, spin } from '#lib/ui/motion.ts';
	import IntervalTitle from '../IntervalTitle.svelte';
	import KindPill from '../KindPill.svelte';
	import SessionClock from '../SessionClock.svelte';
	import type { SessionStage } from '../stage.ts';
	import UpNextStack from '../UpNextStack.svelte';

	/**
	 * The Dial: the Interval drains clockwise around a giant ring the whole room can read at a glance, even before the
	 * digits. The ring is a horseshoe whose opening tucks under the name's banner, so no progress hides behind it; a
	 * knob rides the drain edge, and a coin at the finish shows the next Interval's color. The time sits on a solid disc
	 * in the middle, never on the ring. Up next is a purple tray on the right, with the Group and the time left as coins
	 * at its foot. In the final seconds, sticker rays burst behind the dial. It is laid out on a fixed 1920×1080 stage
	 * that letterboxes to any screen.
	 */
	let { stage, deck, picker, list }: { stage: SessionStage; deck: Snippet; picker: Snippet; list: Snippet } =
		$props();

	// A name that won't fit one line over the dial runs its banner the full width of the screen.
	const wide = $derived(stage.title.length > 14);
	const final = $derived(stage.pulseKey !== 'steady');
	// The ring keeps the Interval's own color while paused; before the first Interval, pink.
	const fill = $derived(stage.ink ? (stage.ownColor ?? 'var(--accent)') : stage.colors.background);
	const coin = $derived(stage.next?.background ?? PALETTE.cooldown.background);
</script>

<div class="dial-screen" {@attach dealIn({ selector: ':scope > .stage > [data-deal]', gap: 0.08 })}>
	<div class="stage">
		{#if final}
			<div class="burst" aria-hidden="true" style:--rays={stage.colors.background} {@attach boing(0, 0.6)}>
				<div class="rays" {@attach spin(40)}></div>
			</div>
		{/if}

		<main
			class={['now', stage.ink && 'ink', wide && 'wide']}
			style:--kind={stage.colors.background}
			style:--on={stage.colors.text}
			style:--fill={fill}
			style:--p={stage.progress}
			data-deal
		>
			<div class="ribbon"><IntervalTitle title={stage.title} long={stage.longTitle} /></div>
			<div class="dial">
				<div class="disc">
					{#if stage.pill}<KindPill text={stage.pill} hint={stage.hint} ink={stage.ink} />{/if}
					<SessionClock clock={stage.clock} pulseKey={stage.pulseKey} />
				</div>
				<span class="knob" aria-hidden="true"></span>
				{#key coin}
					<span class="coin" style:--next={coin} aria-hidden="true" {@attach boing()}>
						<Icon name={stage.isFinal ? 'check' : 'play'} />
					</span>
				{/key}
			</div>
		</main>

		<div class="controls">{@render deck()}</div>

		<aside class={['rail', wide && 'low']} aria-labelledby="up-next" data-deal>
			<UpNextStack {stage} aside={picker} />
			<div class="coins">
				{#key stage.lines.join()}
					<p class="coin-group" {@attach boing()}>
						{#each stage.lines as line (line)}<span>{line}</span>{/each}
					</p>
				{/key}
				<p class="coin-left" data-testid="time-left" style:--time-em={timeWidthEm(stage.timeLeft)}>
					<span class="num">{stage.timeLeft}</span> left
				</p>
			</div>
		</aside>
	</div>

	{@render list()}
</div>

<style>
	/* The screen: cream with a halftone, and the fixed stage centred in it. */
	.dial-screen {
		/* The Interval list opens over the Up next tray, wherever the letterboxed stage puts it. */
		--off-x: calc((100vw - 1920 * var(--tv)) / 2);
		--off-y: calc((100vh - 1080 * var(--tv)) / 2);
		--list-inset: calc(var(--off-y) + 24 * var(--tv)) calc(var(--off-x) + 24 * var(--tv))
			calc(var(--off-y) + 24 * var(--tv)) auto;
		--list-width: calc(630 * var(--tv));
		position: relative;
		height: 100%;
		display: grid;
		place-items: center;
		overflow: hidden;
		background: var(--ground)
			radial-gradient(color-mix(in srgb, var(--line) 10%, transparent) calc(3 * var(--tv)), transparent calc(3.6 * var(--tv)))
			0 0 / calc(30 * var(--tv)) calc(30 * var(--tv));
	}

	.stage {
		position: relative;
		width: calc(1920 * var(--tv));
		height: calc(1080 * var(--tv));
	}

	/* The Interval: the banner and the dial. The ring's drained track is hatched ink; on the ink, hatched cream. */
	.now {
		--drained: var(--line);
		--drained-2: color-mix(in srgb, var(--kind) 40%, var(--line));
		--pill-size: calc(48 * var(--tv));
		--pill-tilt: -3deg;
		--name-size: calc(110 * var(--tv));
		--name-size-long: calc(80 * var(--tv));
		--clock-size: calc(400 * var(--tv));
		--clock-room: 88cqw;
		--clock-origin: center;
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.now > * {
		pointer-events: auto;
	}

	.ink {
		--drained: var(--ground);
		--drained-2: color-mix(in srgb, var(--fill) 35%, var(--ground));
	}

	/* The name: a tilted banner across the top of the dial. */
	.ribbon {
		position: absolute;
		left: calc(24 * var(--tv));
		top: calc(22 * var(--tv));
		z-index: 5;
		box-sizing: border-box;
		width: calc(1216 * var(--tv));
		padding: calc(20 * var(--tv)) calc(48 * var(--tv)) calc(24 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: calc(28 * var(--tv));
		background: var(--kind);
		color: var(--on);
		rotate: -1.5deg;
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--line);
		transition:
			background-color var(--dur) ease,
			color var(--dur) ease;
	}

	.ink .ribbon {
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--accent);
	}

	.wide .ribbon {
		right: calc(24 * var(--tv));
		width: auto;
		rotate: -1deg;
	}

	/*
	 * The dial: a thick ink ring whose Kind fill drains clockwise as `--p` grows. It is a horseshoe of
	 * 360° − 2 × `--gap`, its opening under the banner; ticks every 8°, and the drained track hatched.
	 */
	.dial {
		--gap: 52deg;
		--arc: calc(360deg - 2 * var(--gap));
		--th: calc(var(--gap) + var(--p) * var(--arc));
		/* The ring's middle, as an ellipse's radii in TV pixels, for placing the knob and the coin on it. */
		--ra: 576;
		--rb: 473;
		position: absolute;
		left: calc(24 * var(--tv));
		top: calc(50 * var(--tv));
		box-sizing: border-box;
		width: calc(1216 * var(--tv));
		height: calc(1010 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: 50%;
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--line);
		background:
			repeating-conic-gradient(
				from var(--gap),
				color-mix(in srgb, var(--line) 50%, transparent) 0 0.5deg,
				transparent 0.5deg 8deg
			),
			conic-gradient(
				from var(--gap),
				transparent 0 calc(var(--p) * var(--arc)),
				var(--line) 0 calc(var(--p) * var(--arc) + 1.4deg),
				var(--fill) 0 var(--arc),
				var(--line) 0
			),
			repeating-linear-gradient(
				-45deg,
				var(--drained) 0 calc(14 * var(--tv)),
				var(--drained-2) calc(14 * var(--tv)) calc(22 * var(--tv))
			);
	}

	.wide .dial {
		--gap: 66deg;
	}

	/* The time sits on a solid disc in the Kind color, never on the ring. */
	.disc {
		position: absolute;
		inset: calc(54 * var(--tv));
		container-type: size;
		border: var(--ln) solid var(--line);
		border-radius: 50%;
		background: var(--kind);
		color: var(--on);
		overflow: hidden;
		transition:
			background-color var(--dur) ease,
			color var(--dur) ease;
	}

	.disc::before {
		content: '';
		position: absolute;
		right: calc(-120 * var(--tv));
		bottom: calc(-150 * var(--tv));
		width: calc(560 * var(--tv));
		height: calc(560 * var(--tv));
		border: var(--ln) solid currentColor;
		border-radius: 50%;
		opacity: 0.14;
		background: repeating-linear-gradient(
			-45deg,
			transparent 0 calc(20 * var(--tv)),
			currentColor calc(20 * var(--tv)) calc(26 * var(--tv))
		);
	}

	.disc > :global(.clock) {
		position: absolute;
		left: 50%;
		top: 50%;
		translate: calc(-50% - 0.03em) -50%;
		line-height: 1;
		letter-spacing: -0.07em;
	}

	/* The pill: a badge pinned inside the ring, above the time. */
	.disc > :global(.pill) {
		position: absolute;
		left: 50%;
		top: calc(92 * var(--tv));
		z-index: 1;
		max-width: calc(760 * var(--tv));
		text-align: center;
		translate: -50% 0;
	}

	.wide .disc > :global(.pill) {
		top: calc(190 * var(--tv));
	}

	/* The knob rides the drain edge; the coin past the finish shows the next Interval's color. */
	.knob,
	.coin {
		--r: calc(1 / sqrt(pow(sin(var(--a)) / var(--ra), 2) + pow(cos(var(--a)) / var(--rb), 2)));
		position: absolute;
		left: calc(50% + sin(var(--a)) * var(--r) * var(--tv));
		top: calc(50% - cos(var(--a)) * var(--r) * var(--tv));
		box-sizing: border-box;
		border: var(--ln) solid var(--line);
		border-radius: 50%;
		translate: -50% -50%;
	}

	.knob {
		--a: var(--th);
		z-index: 2;
		width: calc(92 * var(--tv));
		height: calc(92 * var(--tv));
		background: radial-gradient(var(--line) 0 calc(14 * var(--tv)), var(--surface) calc(15 * var(--tv)));
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--line);
	}

	.coin {
		--a: calc(360deg - var(--gap) + 7deg);
		z-index: 6;
		display: grid;
		place-items: center;
		width: calc(84 * var(--tv));
		height: calc(84 * var(--tv));
		background: var(--next);
		color: var(--text);
		rotate: -10deg;
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--line);
	}

	.coin :global(.icon) {
		width: calc(44 * var(--tv));
		height: calc(44 * var(--tv));
		fill: currentColor;
		stroke-width: 3;
	}

	/* The final seconds: a burst of sticker rays in the Kind color, turning slowly behind the dial. */
	.burst {
		position: absolute;
		left: calc(632 * var(--tv));
		top: calc(555 * var(--tv));
		width: calc(2800 * var(--tv));
		height: calc(2800 * var(--tv));
		margin: calc(-1400 * var(--tv)) 0 0 calc(-1400 * var(--tv));
		pointer-events: none;
	}

	.rays {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: repeating-conic-gradient(
			var(--line) 0 0.6deg,
			var(--rays) 0.6deg 8deg,
			var(--line) 8deg 8.6deg,
			transparent 8.6deg 16deg
		);
	}

	/* The controls float at the foot of the dial. */
	.controls {
		position: absolute;
		left: calc(632 * var(--tv));
		bottom: calc(26 * var(--tv));
		z-index: 40;
		width: max-content;
		max-width: calc(1190 * var(--tv));
		translate: -50% 0;
	}

	.controls :global(.deck) {
		flex-wrap: nowrap;
	}

	/* Up next: a purple tray of cream sticker cards on the right, with two coins at its foot. */
	.rail {
		position: absolute;
		left: calc(1266 * var(--tv));
		right: calc(24 * var(--tv));
		top: calc(24 * var(--tv));
		bottom: calc(24 * var(--tv));
		z-index: 3;
		display: flex;
		flex-direction: column;
		gap: calc(18 * var(--tv));
		min-width: 0;
		min-height: 0;
		padding: calc(26 * var(--tv)) calc(24 * var(--tv)) calc(22 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: var(--r-lg-tv);
		background: var(--hue-purple);
		color: var(--text);
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--line);
	}

	.low {
		top: calc(290 * var(--tv));
	}

	.coins {
		flex: none;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: calc(12 * var(--tv));
		margin: 0 calc(-6 * var(--tv)) 0 calc(-10 * var(--tv));
	}

	.coins p {
		position: relative;
		flex: none;
		box-sizing: border-box;
		width: calc(290 * var(--tv));
		min-height: calc(290 * var(--tv));
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: calc(4 * var(--tv));
		margin: 0;
		padding: calc(34 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: 50%;
		text-align: center;
		box-shadow: var(--o-md) var(--o-md) 0 var(--line);
	}

	.coins p::before {
		content: '';
		position: absolute;
		inset: calc(12 * var(--tv));
		border: var(--ln2) dashed currentColor;
		border-radius: 50%;
		opacity: 0.45;
		pointer-events: none;
	}

	.coin-group {
		background: var(--hue-yellow);
		color: var(--text);
		font: 700 calc(40 * var(--tv)) / 1.15 var(--font-mono);
		overflow-wrap: break-word;
		rotate: -7deg;
	}

	.coins .coin-left {
		container-type: inline-size;
		background: var(--text);
		color: var(--ground);
		font: 900 calc(40 * var(--tv)) / 1 var(--font-display);
		rotate: 6deg;
		box-shadow: var(--o-md) var(--o-md) 0 var(--accent);
	}

	/* As large as 72 TV pixels, but never wider than the coin. */
	.num {
		font-size: min(calc(72 * var(--tv)), calc(100cqi / var(--time-em)));
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	/* Portrait or narrow: the banner, a round dial, then Up next, stacked at full width. */
	@media (max-width: 768px), (orientation: portrait) {
		.dial-screen {
			height: auto;
			min-height: 100%;
			display: block;
			padding: calc(28 * var(--tv)) calc(28 * var(--tv)) calc(520 * var(--tv));
		}

		.stage {
			width: auto;
			height: auto;
			display: flex;
			flex-direction: column;
			gap: calc(44 * var(--tv));
		}

		.now {
			position: relative;
			inset: auto;
			display: flex;
			flex-direction: column;
			--name-size: calc(100 * var(--tv));
			--name-size-long: calc(72 * var(--tv));
			--clock-size: calc(290 * var(--tv));
		}

		.ribbon,
		.wide .ribbon {
			position: relative;
			left: auto;
			right: auto;
			top: auto;
			width: auto;
			margin: 0 calc(8 * var(--tv));
			padding: calc(20 * var(--tv)) calc(36 * var(--tv)) calc(24 * var(--tv));
		}

		/* A true circle here, with a small start and finish notch at the top. */
		.dial,
		.wide .dial {
			--gap: 14deg;
			--ra: 420;
			--rb: 420;
			position: relative;
			left: auto;
			top: auto;
			width: 100%;
			height: auto;
			aspect-ratio: 1;
			margin-top: calc(-18 * var(--tv));
		}

		.disc > :global(.clock) {
			top: calc(50% + 40 * var(--tv));
		}

		.disc > :global(.pill),
		.wide .disc > :global(.pill) {
			top: calc(150 * var(--tv));
			max-width: calc(560 * var(--tv));
		}

		.burst {
			left: 50%;
			top: calc(560 * var(--tv));
		}

		.rail,
		.low {
			position: relative;
			left: auto;
			right: auto;
			top: auto;
			bottom: auto;
		}

		.coins {
			justify-content: space-around;
		}

		.controls {
			position: static;
			translate: none;
		}
	}
</style>
