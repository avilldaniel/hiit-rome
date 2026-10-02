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
	import ConfirmDialog from './ConfirmDialog.svelte';
	import ControlBar from './ControlBar.svelte';
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

	// Re-keyed once per final second so the pulse animation replays.
	const pulseKey = $derived(countdownView.finalSecond ? `${countdownView.finalSecond}` : 'steady');
</script>

<!-- Saved once more on the way out, so a reload comes back to the very second. -->
<svelte:window {onkeydown} onpagehide={() => runner.save()} />

<!-- Taps are shortcuts for actions also on the keyboard and the control bar. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="screen"
	data-testid="countdown"
	style:background-color={countdownView.colors.background}
	style:color={countdownView.colors.text}
	style:--neutral-bg={PALETTE.neutral.background}
	style:--neutral-text={PALETTE.neutral.text}
	onpointerdown={touch.onpointerdown}
	onpointerup={touch.onpointerup}
	onpointermove={touch.onpointermove}
	onpointercancel={touch.onpointercancel}
>
	{#if countdownView.timeUp}
		<h1 class="time">TIME</h1>
		<button type="button" class="dismiss" data-controls onclick={ondone}>Dismiss</button>
	{:else}
		<p class="label">{countdownView.status === 'paused' ? 'Paused' : 'Countdown'}</p>
		{#key pulseKey}
			<p class="digits" class:pulse={pulseKey !== 'steady'} data-testid="remaining">
				{formatClock(countdownView.remainingMs)}
			</p>
		{/key}
		<div class="bar" aria-hidden="true"><div class="fill" style:width="{countdownView.progress * 100}%"></div></div>

		<ControlBar
			status={countdownView.status}
			visible={touch.visible}
			steps={false}
			onaction={act}
			onrestart={askToRestart}
			onend={askToEnd}
		/>

		{#if confirming === 'end'}
			<ConfirmDialog
				message="End this Countdown?"
				confirmLabel="End Countdown"
				cancelLabel="Keep going"
				onconfirm={confirmed}
				oncancel={() => (confirming = null)}
			/>
		{:else if confirming === 'restart'}
			<ConfirmDialog
				message="Restart the Countdown from the beginning?"
				confirmLabel="Restart"
				onconfirm={confirmed}
				oncancel={() => (confirming = null)}
			/>
		{/if}
	{/if}
</div>

<style>
	.screen {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 2vh;
		padding: 4vh 6vw;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
		transition:
			background-color 0.2s,
			color 0.2s;
		/* Taps are ours; there is nothing to scroll or zoom. */
		touch-action: none;
		user-select: none;
	}

	.label {
		margin: 0;
		font-size: clamp(14px, 4vh, 48px);
		font-weight: 700;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		opacity: 0.85;
	}

	.digits {
		margin: 0;
		font-size: min(56vh, 28vw);
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		line-height: 0.88;
		letter-spacing: -0.02em;
		white-space: nowrap;
	}

	.bar {
		height: 2vh;
		margin-top: 2vh;
		border-radius: 99px;
		background: rgb(0 0 0 / 0.2);
		overflow: hidden;
	}

	.fill {
		height: 100%;
		background: currentColor;
	}

	.time {
		margin: 0;
		font-size: min(56vh, 30vw);
		font-weight: 800;
		line-height: 1;
		text-align: center;
		animation: blink 1s steps(1) infinite;
	}

	.dismiss {
		align-self: center;
		min-height: 44px;
		padding: 1.5vh 3vw;
		border: 2px solid currentColor;
		border-radius: 1vh;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: clamp(18px, 4vh, 44px);
		font-weight: 700;
		cursor: pointer;
	}

	@media (orientation: portrait) {
		.digits {
			font-size: 30vw;
		}
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	@keyframes pulse {
		0% {
			transform: scale(1.14);
		}
		70% {
			transform: scale(1);
		}
	}

	@keyframes flash {
		0% {
			opacity: 0.3;
		}
		100% {
			opacity: 1;
		}
	}

	.pulse {
		transform-origin: left center;
		animation: pulse 0.6s ease-out;
	}

	@media (prefers-reduced-motion: reduce) {
		.pulse {
			animation: flash 0.6s ease-out;
		}

		/* Still flashing, but gently. */
		.time {
			animation: flash 2s ease-in-out infinite alternate;
		}
	}
</style>
