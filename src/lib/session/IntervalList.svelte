<script lang="ts">
	import { formatClock } from '#lib/engine/format.ts';
	import type { IntervalListItem } from '#lib/engine/session.ts';

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
						<span class="chip" style:background-color={entry.colors.background}></span>
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
			<button type="button" class="close" onclick={close}>Close</button>
		</header>
		{@render rows(items, 0)}
	</div>
</dialog>

<style>
	dialog {
		inset: 0 0 0 auto;
		width: var(--rail-width);
		min-width: min(360px, 100vw);
		max-width: none;
		height: 100%;
		max-height: none;
		margin: 0;
		padding: 0;
		border: none;
		background: var(--neutral-bg);
		color: var(--neutral-text);
		box-shadow: -1vw 0 3vw rgb(0 0 0 / 0.35);
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
		padding: 3vh 1.5vw 6vh;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1vw;
		margin-bottom: 1.5vh;
	}

	h2,
	.round {
		margin: 0;
		font-size: clamp(12px, 2.4vh, 30px);
		font-weight: 700;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		opacity: 0.7;
	}

	.round {
		padding: 1.6vh 0.6vw 0.6vh;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	ul ul {
		padding-left: 1.2vw;
	}

	button {
		border: none;
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	button:focus-visible {
		outline: 0.15em solid var(--neutral-text);
		outline-offset: -0.15em;
	}

	.close {
		min-width: 44px;
		min-height: 44px;
		padding: 1vh 1.2vw;
		border-radius: 1vh;
		background: color-mix(in srgb, var(--neutral-text) 15%, transparent);
		font-size: clamp(14px, 2.4vh, 30px);
		font-weight: 700;
	}

	[data-entry] {
		display: flex;
		align-items: center;
		gap: 1vw;
		width: 100%;
		min-height: 44px;
		padding: 1vh 0.6vw;
		border-radius: 1vh;
		font-size: clamp(16px, 3.4vh, 40px);
		font-weight: 700;
		text-align: left;
	}

	[data-entry][aria-current='true'] {
		background: color-mix(in srgb, var(--neutral-text) 20%, transparent);
		box-shadow: inset 0.25em 0 0 var(--neutral-text);
	}

	.chip {
		flex: none;
		width: 0.9em;
		height: 0.9em;
		border-radius: 0.2em;
	}

	/* Names wrap rather than truncate, so near-identical ones stay distinguishable. */
	.name {
		flex: 1;
		min-width: 0;
		line-height: 1.1;
		overflow-wrap: anywhere;
	}

	.duration {
		flex: none;
		font-variant-numeric: tabular-nums;
	}

	/* Portrait: the rail sits below the main area, so the list rises from the foot of the screen. */
	@media (orientation: portrait) {
		dialog {
			inset: auto 0 0;
			width: 100%;
			height: 60vh;
		}
	}
</style>
