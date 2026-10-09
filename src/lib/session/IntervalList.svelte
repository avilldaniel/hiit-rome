<script lang="ts">
	import { formatClock } from '#lib/engine/format.ts';
	import type { IntervalListItem } from '#lib/engine/session.ts';
	import Button from '#lib/ui/Button.svelte';

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
					<button
						type="button"
						data-entry
						aria-current={entry.index === currentIndex ? 'true' : undefined}
						onclick={() => onjump(entry.index)}
					>
						<span class="swatch" style:background-color={entry.colors.background}></span>
						<span class="name">{entry.name}</span>
						<span class="duration">{formatClock(entry.durationMs)}</span>
					</button>
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

<!-- A panel over the rail, so the main area stays in view, and the Session keeps running, while the trainer chooses. -->
<dialog bind:this={dialog} aria-labelledby="interval-list-title" oncancel={close} onclose={close} {onkeydown} {onclick}>
	<div class="panel">
		<header>
			<h2 id="interval-list-title">Intervals</h2>
			<Button onclick={close}>Close</Button>
		</header>
		{@render rows(items, 0)}
	</div>
</dialog>

<style>
	/* A white card over the rail, as tall as the rail. */
	dialog {
		inset: var(--gap) var(--gap) var(--gap) auto;
		box-sizing: border-box;
		width: calc(var(--rail-width) - 2 * var(--gap));
		min-width: min(360px, calc(100vw - 2 * var(--gap)));
		max-width: none;
		height: auto;
		max-height: none;
		margin: 0;
		padding: 0;
		border: none;
		border-radius: var(--r-xl);
		background: var(--surface);
		color: var(--text);
		box-shadow: var(--shadow);
		overflow-y: auto;
		overscroll-behavior: contain;
		/* The Session screen claims every touch for taps and swipes; this panel scrolls. */
		touch-action: pan-y;
	}

	dialog::backdrop {
		background: transparent;
	}

	/* Fills the dialog, so only a tap outside the panel reaches the dialog itself. */
	.panel {
		box-sizing: border-box;
		min-height: 100%;
		padding: calc(48 * var(--tv)) calc(32 * var(--tv)) calc(64 * var(--tv));
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--s4);
		margin-bottom: calc(16 * var(--tv));
		padding: 0 calc(8 * var(--tv));
	}

	h2 {
		margin: 0;
		font-size: max(20px, calc(40 * var(--tv)));
		font-weight: 800;
		letter-spacing: -0.01em;
	}

	.round {
		margin: 0;
		padding: calc(20 * var(--tv)) calc(8 * var(--tv)) calc(8 * var(--tv));
		color: var(--muted);
		font-family: var(--font-body);
		font-size: max(13px, calc(22 * var(--tv)));
		font-weight: 600;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	ul ul {
		padding-left: calc(20 * var(--tv));
	}

	[data-entry] {
		--swatch: calc(32 * var(--tv));
		display: grid;
		grid-template-columns: var(--swatch) minmax(0, 1fr) auto;
		column-gap: calc(16 * var(--tv));
		align-items: start;
		box-sizing: border-box;
		width: 100%;
		min-height: 44px;
		padding: calc(12 * var(--tv));
		border: none;
		border-radius: var(--r);
		background: transparent;
		color: inherit;
		font-family: var(--font-display);
		font-size: max(16px, calc(34 * var(--tv)));
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.01em;
		text-align: left;
		cursor: pointer;
	}

	@media (hover: hover) {
		[data-entry]:hover {
			background: var(--surface-2);
		}
	}

	[data-entry]:focus-visible {
		outline-offset: -3px;
	}

	[data-entry][aria-current='true'] {
		background: var(--surface-2);
		box-shadow: inset 4px 0 0 var(--text);
	}

	.swatch {
		width: var(--swatch);
		height: var(--swatch);
		margin-top: calc((1.1em - var(--swatch)) / 2);
		border-radius: calc(var(--swatch) * 0.3);
	}

	/* Names wrap rather than truncate, so near-identical ones stay distinguishable. */
	.name {
		overflow-wrap: anywhere;
	}

	.duration {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	/* Portrait: the rail sits below the main area, so the list rises from the foot of the screen. */
	@media (orientation: portrait) {
		dialog {
			inset: auto var(--gap) var(--gap);
			width: auto;
			height: 60vh;
		}
	}
</style>
