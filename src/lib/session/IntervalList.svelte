<script lang="ts">
	import { formatClock } from '#lib/engine/format.ts';
	import type { IntervalListItem } from '#lib/engine/session.ts';
	import Button from '#lib/ui/Button.svelte';
	import { boing } from '#lib/ui/motion.ts';
	import BreakableName from './BreakableName.svelte';

	let {
		items,
		currentIndex,
		onjump,
		onclose
	}: {
		items: IntervalListItem[];
		/** The entry playing now, highlighted; null during the Lead-in. */
		currentIndex: number | null;
		onjump: (index: number) => void;
		onclose: () => void;
	} = $props();

	let dialog: HTMLDialogElement;
	const entryButtons = () => [...dialog.querySelectorAll<HTMLButtonElement>('button[data-entry]')];

	// Opens on the entry playing now (the first during the Lead-in), so a nearby jump is a few presses away.
	$effect(() => {
		dialog.showModal();
		const start = dialog.querySelector<HTMLButtonElement>('[aria-current="true"]') ?? entryButtons()[0];
		start.focus();
		start.scrollIntoView({ block: 'center' });
	});

	const MOVES: Record<string, (at: number, last: number) => number> = {
		ArrowDown: (at, last) => Math.min(at + 1, last),
		ArrowUp: (at) => Math.max(at - 1, 0),
		Home: () => 0,
		End: (_, last) => last
	};

	// Arrows move between entries, skipping the Round headings; Enter jumps, as on any button; Esc closes the dialog.
	function onkeydown(e: KeyboardEvent) {
		const move = MOVES[e.code];
		if (!move) return;
		e.preventDefault();
		const buttons = entryButtons();
		buttons[move(buttons.indexOf(document.activeElement as HTMLButtonElement), buttons.length - 1)].focus();
	}

	// Closed by Esc (`cancel`, or just `close` when the browser skips `cancel`), the Close button, or a tap outside.
	// The Session screen removes the dialog at once: the browser's `close` event can lag behind the next key press.
	let closed = false;
	function close() {
		if (closed) return;
		closed = true;
		onclose();
	}

	// A tap outside the panel lands on the dialog itself, by way of its backdrop.
	function onclick(e: MouseEvent) {
		if (e.target === dialog) close();
	}
</script>

{#snippet rows(items: IntervalListItem[], depth: number)}
	<ul>
		{#each items as item}
			<li>
				{#if item.type === 'round'}
					<svelte:element this={`h${Math.min(depth + 3, 6)}`} class="round">{item.label}</svelte:element>
					{@render rows(item.items, depth + 1)}
				{:else}
					{@const { entry } = item}
					{@const now = entry.index === currentIndex}
					<button
						type="button"
						data-entry
						aria-current={now ? 'true' : undefined}
						style:--now-fill={now ? entry.colors.background : undefined}
						style:--now-ink={now ? entry.colors.text : undefined}
						onclick={() => onjump(entry.index)}
					>
						<span class="swatch" style:background-color={entry.colors.background}></span>
						<span class="name"><BreakableName text={entry.name} /></span>
						<span class="duration">{formatClock(entry.durationMs)}</span>
						{#if now}<span class="now" aria-hidden="true">Now</span>{/if}
					</button>
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

<!-- A panel over the layout's Up next, so the time stays in view, and the Session keeps running, while the trainer chooses. -->
<dialog bind:this={dialog} aria-labelledby="interval-list-title" oncancel={close} onclose={close} {onkeydown} {onclick}>
	<div class="panel" {@attach boing(0, 0.9)}>
		<header>
			<h2 id="interval-list-title">Intervals</h2>
			<Button class="close" icon="close" onclick={close}>Close</Button>
		</header>
		{@render rows(items, 0)}
	</div>
</dialog>

<style>
	/*
	 * A white sticker over the layout's Up next (`--list-inset`, from the layout), sized in TV pixels. Its rows are
	 * Manrope; the one playing now is filled in its Kind color, with a Now sticker.
	 */
	dialog {
		inset: var(--list-inset, calc(24 * var(--tv)) calc(24 * var(--tv)) calc(24 * var(--tv)) auto);
		box-sizing: border-box;
		width: var(--list-width, calc(700 * var(--tv)));
		height: var(--list-height, auto);
		min-width: min(360px, calc(100vw - 48px));
		max-width: none;
		max-height: none;
		margin: 0;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--text);
		overflow: visible;
	}

	dialog::backdrop {
		background: transparent;
	}

	/* Fills the dialog, so only a tap outside the panel reaches the dialog itself. */
	.panel {
		box-sizing: border-box;
		height: 100%;
		display: flex;
		flex-direction: column;
		padding: calc(32 * var(--tv)) calc(24 * var(--tv)) calc(24 * var(--tv)) calc(32 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: var(--r-lg-tv);
		background: var(--surface);
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--line);
		overflow-y: auto;
		overscroll-behavior: contain;
		/* The Session screen claims every touch for taps and swipes; this panel scrolls. */
		touch-action: pan-y;
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: calc(16 * var(--tv));
		margin-bottom: calc(20 * var(--tv));
	}

	h2 {
		margin: 0;
		font-size: max(20px, calc(52 * var(--tv)));
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: -0.01em;
	}

	header :global(.close) {
		--depth: var(--o-sm);
		min-height: max(44px, calc(80 * var(--tv)));
		padding: 0 calc(28 * var(--tv));
		border-width: var(--ln2);
		font-size: max(14px, calc(32 * var(--tv)));
	}

	.round {
		margin: 0;
		padding: calc(24 * var(--tv)) calc(8 * var(--tv)) calc(8 * var(--tv));
		font: 700 max(13px, calc(32 * var(--tv))) / 1.15 var(--font-mono);
		text-transform: uppercase;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* A wide, short list (the Billboard's) flows into columns, `--list-columns`. */
	.panel > ul {
		column-count: var(--list-columns, 1);
		column-gap: calc(40 * var(--tv));
	}

	[data-entry],
	.round {
		break-inside: avoid;
	}

	ul ul {
		padding-left: calc(44 * var(--tv));
	}

	[data-entry] {
		--swatch: calc(32 * var(--tv));
		position: relative;
		display: grid;
		grid-template-columns: var(--swatch) minmax(0, 1fr) auto;
		column-gap: calc(18 * var(--tv));
		align-items: baseline;
		box-sizing: border-box;
		width: 100%;
		min-height: 44px;
		padding: calc(12 * var(--tv)) calc(16 * var(--tv));
		border: var(--ln2) solid transparent;
		border-radius: calc(14 * var(--tv));
		background: transparent;
		color: inherit;
		font: 800 max(16px, calc(36 * var(--tv))) / 1.12 var(--font-body);
		letter-spacing: -0.02em;
		text-align: left;
		cursor: pointer;
		transition: translate var(--dur) var(--ease-out);
	}

	@media (hover: hover) {
		[data-entry]:hover {
			border-color: var(--line);
			translate: calc(6 * var(--tv)) 0;
		}
	}

	[data-entry]:focus-visible {
		outline-offset: -3px;
	}

	[data-entry][aria-current='true'] {
		grid-template-columns: var(--swatch) minmax(0, 1fr) auto auto;
		border: var(--ln) solid var(--line);
		background: var(--now-fill);
		color: var(--now-ink);
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--line);
	}

	.swatch {
		align-self: start;
		box-sizing: border-box;
		width: var(--swatch);
		height: var(--swatch);
		margin-top: calc(4 * var(--tv));
		border: var(--ln2) solid var(--line);
		border-radius: calc(8 * var(--tv));
	}

	/* Names wrap rather than truncate, so near-identical ones stay distinguishable. */
	.name {
		overflow-wrap: anywhere;
	}

	.duration {
		font-family: var(--font-display);
		font-weight: 900;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.04em;
		white-space: nowrap;
	}

	.now {
		align-self: center;
		padding: calc(4 * var(--tv)) calc(16 * var(--tv));
		border: var(--ln2) solid var(--line);
		border-radius: var(--r-full);
		background: var(--accent);
		color: var(--on-accent);
		font: 700 max(12px, calc(28 * var(--tv))) / 1.3 var(--font-mono);
		rotate: 8deg;
	}

	/* Portrait or narrow: the list covers the screen, inset. */
	@media (max-width: 768px), (orientation: portrait) {
		dialog {
			inset: calc(24 * var(--tv));
			width: auto;
			height: auto;
		}

		.panel > ul {
			column-count: 1;
		}
	}
</style>
