<script lang="ts" module>
	import type { SessionSnapshot } from '#lib/engine/session.ts';

	export type CountdownStart = { durationSec: number } | { restored: SessionSnapshot };
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { createCountdown } from '#lib/engine/countdown.ts';
	import { formatClock } from '#lib/engine/format.ts';
	import { PALETTE } from '#lib/engine/palette.ts';
	import { ADJUST_MS, restoreSession, type SessionCommand } from '#lib/engine/session.ts';
	import type { Settings } from '#lib/engine/settings.ts';
	import { toggleFullscreen } from '#lib/platform/screen.ts';
	import Button from '#lib/ui/Button.svelte';
	import { boing, spin } from '#lib/ui/motion.ts';
	import Panel from '#lib/ui/Panel.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import ControlBar from './ControlBar.svelte';
	import KindPill from './KindPill.svelte';
	import SessionClock from './SessionClock.svelte';
	import { SessionRunner } from './runner.svelte.ts';
	import { TouchControls } from './touch.svelte.ts';

	/**
	 * A new Countdown of `durationSec`, started at once, or one carried on from `restored`, a saved one, paused.
	 * `onsave` and `onclear` keep it as the active Session, as on the Session screen. `ondone` fires when it is
	 * ended, or its TIME is dismissed.
	 */
	let {
		countdown,
		settings,
		onsave,
		onclear,
		ondone
	}: {
		countdown: CountdownStart;
		settings: Settings;
		onsave?: (session: SessionSnapshot) => void;
		onclear?: () => void;
		ondone: () => void;
	} = $props();

	const runner = untrack(() => {
		const session =
			'restored' in countdown ? restoreSession(countdown.restored) : createCountdown(countdown.durationSec, settings.countdown);
		return new SessionRunner(session, settings.voiceId, { onsave: (s) => onsave?.(s), onclear: () => onclear?.() });
	});
	// A new Countdown starts at once: the Preset tap was the start.
	untrack(() => 'durationSec' in countdown && runner.act({ type: 'start' }));
	const countdownView = $derived(runner.view);
	const act = (command: SessionCommand) => runner.act(command);

	// Ended: there is no summary to show, so straight back.
	$effect(() => {
		if (countdownView.status === 'ended') ondone();
	});

	let confirming = $state<'end' | 'restart' | null>(null);
	const askToEnd = () => (confirming = 'end');
	const askToRestart = () => (confirming = countdownView.status === 'paused' ? 'restart' : null);
	function confirmed() {
		if (confirming) act({ type: confirming });
		confirming = null;
	}

	const KEYS: Record<string, SessionCommand> = {
		Space: { type: 'toggle' },
		ArrowUp: { type: 'adjust', deltaMs: ADJUST_MS },
		ArrowDown: { type: 'adjust', deltaMs: -ADJUST_MS }
	};
	const DISMISS_KEYS = ['Space', 'Enter', 'Escape'];

	function onkeydown(e: KeyboardEvent) {
		runner.unlockAudio();
		if (confirming || e.metaKey || e.ctrlKey || e.altKey) return;
		if (countdownView.timeUp) {
			if (DISMISS_KEYS.includes(e.code)) (e.preventDefault(), ondone());
			return;
		}
		const command = KEYS[e.code];
		if (command || e.code === 'Escape') e.preventDefault(); // Esc must not also cancel the dialog it opens
		if (e.repeat) return;
		if (command) act(command);
		else if (e.code === 'Escape') askToEnd();
		else if (e.code === 'KeyR') askToRestart();
		else if (e.code === 'KeyF') toggleFullscreen();
	}

	// Touch: tap anywhere to pause or resume, or to dismiss TIME.
	const touch = new TouchControls({
		onpress: () => runner.unlockAudio(),
		ontap: () => (countdownView.timeUp ? ondone() : act({ type: 'toggle' }))
	});

	const clock = $derived(formatClock(countdownView.remainingMs));
	// Changes once per final second, so the time thumps on each.
	const pulseKey = $derived(countdownView.finalSecond ? `${countdownView.finalSecond}` : 'steady');
	const ink = $derived(countdownView.colors.background === PALETTE.neutral.background);
	const paused = $derived(countdownView.status === 'paused');
	// TIME is a red sticker; on a red Countdown, a yellow one.
	const timeSticker = $derived(countdownView.colors.background === PALETTE.work.background ? 'var(--hue-yellow)' : PALETTE.work.background);
</script>

<!-- Saved once more on the way out, so a reload comes back to the very second. -->
<svelte:window {onkeydown} onpagehide={() => runner.save()} />

<!-- Taps are shortcuts for actions also on the keyboard and the control bar. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="screen tv-stage"
	data-testid="countdown"
	onpointerdown={touch.onpointerdown}
	onpointerup={touch.onpointerup}
	onpointermove={touch.onpointermove}
	onpointercancel={touch.onpointercancel}
>
	<Panel
		colors={countdownView.colors}
		{ink}
		class={['main', countdownView.timeUp && 'time-up', paused && 'decked']}
		data-testid="panel"
	>
		{#if countdownView.timeUp}
			<!-- A sunburst turning behind a TIME sticker, until dismissed. -->
			<div class="burst" aria-hidden="true"><div class="rays" {@attach spin(18)}></div></div>
			<h1 class="time-up-heading" style:background={timeSticker} {@attach boing()}>TIME</h1>
			<Button class="dismiss" variant="ink" size="prompt" icon="check" data-controls onclick={ondone}>Dismiss</Button>
		{:else}
			<KindPill text={paused ? 'Paused' : 'Countdown'} {ink} />
			<SessionClock {clock} {pulseKey} />
			<div class="progress" aria-hidden="true"><i style:width="{countdownView.progress * 100}%"></i></div>

			<div class="controls">
				<ControlBar
					status={countdownView.status}
					visible={touch.visible}
					pinned={paused}
					steps={false}
					onaction={act}
					onrestart={askToRestart}
					onend={askToEnd}
				/>
			</div>

			{#if confirming === 'end'}
				<ConfirmDialog
					message="End this Countdown?"
					confirmLabel="End Countdown"
					cancelLabel="Keep going"
					tone="danger"
					icon="stop"
					onconfirm={confirmed}
					oncancel={() => (confirming = null)}
				/>
			{:else if confirming === 'restart'}
				<ConfirmDialog
					message="Restart the Countdown from the beginning?"
					confirmLabel="Restart"
					icon="restart"
					onconfirm={confirmed}
					oncancel={() => (confirming = null)}
				/>
			{/if}
		{/if}
	</Panel>
</div>

<style>
	.screen {
		position: fixed;
		inset: 0;
		display: flex;
		box-sizing: border-box;
		padding: calc(24 * var(--tv));
		background: var(--ground);
		/* Taps are ours; there is nothing to scroll or zoom. */
		touch-action: none;
		user-select: none;
	}

	/* One big panel, its pill, time and progress centred. */
	.screen > :global(.main) {
		--pill-size: calc(48 * var(--tv));
		--clock-size: calc(520 * var(--tv));
		--clock-origin: center;
		flex: 1;
		align-items: center;
		padding: calc(48 * var(--tv)) calc(120 * var(--tv));
	}

	/* Paused keeps the controls on screen, so the time clears them. */
	.screen > :global(.decked) {
		padding-bottom: calc(200 * var(--tv));
	}

	.screen :global(.main > .pill) {
		align-self: center;
	}

	.screen :global(.main > .clock) {
		margin: calc(16 * var(--tv)) 0 calc(36 * var(--tv));
		line-height: 0.9;
		letter-spacing: -0.06em;
	}

	.progress {
		flex: none;
		box-sizing: border-box;
		width: min(calc(1300 * var(--tv)), 100%);
		height: calc(40 * var(--tv));
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

	/* The controls float at the foot of the panel. */
	.screen .controls {
		position: absolute;
		left: 50%;
		bottom: calc(32 * var(--tv));
		z-index: 40;
		translate: -50% 0;
	}

	/* TIME: a tilted sticker on a slowly turning sunburst, over the Countdown's color. */
	.screen > :global(.time-up) {
		gap: calc(64 * var(--tv));
	}

	/* Placed over the panel, so these outrank its children's `position: relative`. */
	.screen .burst {
		position: absolute;
		inset: -30%;
		pointer-events: none;
	}

	.rays {
		width: 100%;
		height: 100%;
		background: repeating-conic-gradient(from 0deg, var(--ground) 0 10deg, transparent 10deg 20deg);
		opacity: 0.55;
	}

	.time-up-heading {
		margin: 0;
		padding: 0 calc(64 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: var(--r-lg-tv);
		color: var(--text);
		font-size: min(calc(460 * var(--tv)), 28cqi);
		font-weight: 900;
		line-height: 1.05;
		letter-spacing: -0.02em;
		rotate: -3deg;
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--line);
	}

	.screen :global(.dismiss) {
		--depth: var(--o-md);
		min-height: max(56px, calc(120 * var(--tv)));
		padding: 0 calc(56 * var(--tv));
		border-width: var(--ln2);
		border-radius: calc(20 * var(--tv));
		font-size: max(17px, calc(44 * var(--tv)));
	}

	.screen :global(.dismiss .icon) {
		width: calc(48 * var(--tv));
		height: calc(48 * var(--tv));
	}

	/* Portrait or narrow: the panel fills the screen; the controls float at its foot. */
	@media (max-width: 768px), (orientation: portrait) {
		.screen {
			padding: calc(28 * var(--tv));
		}

		.screen > :global(.main) {
			padding: calc(48 * var(--tv)) calc(40 * var(--tv)) calc(420 * var(--tv));
		}

		.screen :global(.main > .clock) {
			--clock-room: 96cqi;
		}

		.screen > :global(.time-up) {
			padding-bottom: calc(48 * var(--tv));
		}

		.time-up-heading {
			padding: 0 calc(40 * var(--tv));
			font-size: min(calc(460 * var(--tv)), 24cqi);
		}
	}
</style>
