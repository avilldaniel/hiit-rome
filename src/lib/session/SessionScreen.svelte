<script lang="ts">
	import { untrack } from 'svelte';
	import { formatClock } from '#lib/engine/format.ts';
	import { PALETTE } from '#lib/engine/palette.ts';
	import {
		ADJUST_MS,
		createSession,
		intervalList,
		restoreSession,
		type SessionCommand,
		type SessionSnapshot
	} from '#lib/engine/session.ts';
	import { sessionOptions, type Settings } from '#lib/engine/settings.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import type { Workout } from '#lib/engine/workout.ts';
	import { toggleFullscreen } from '#lib/platform/screen.ts';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import ControlBar from './ControlBar.svelte';
	import IntervalList from './IntervalList.svelte';
	import { SessionRunner } from './runner.svelte.ts';
	import SessionSummary from './SessionSummary.svelte';
	import { TouchControls } from './touch.svelte.ts';

	/**
	 * The Session runs with the effective `settings`: the global defaults overlaid with the Workout's overrides, or
	 * carries on from `restored`, a saved Session, paused.
	 * `onstart` fires each time the Session leaves idle (its first start, or after a restart).
	 * `onsave` is handed the active Session to keep, on every change and every few seconds while it runs, and
	 * `onclear` fires once it is over.
	 */
	let {
		workout,
		settings,
		restored,
		onstart,
		onsave,
		onclear
	}: {
		workout: Workout;
		settings: Settings;
		restored?: SessionSnapshot;
		onstart?: () => void;
		onsave?: (session: SessionSnapshot) => void;
		onclear?: () => void;
	} = $props();

	const runner = untrack(
		() =>
			new SessionRunner(
				restored ? restoreSession(restored) : createSession(buildTimeline(workout.items), sessionOptions(workout, settings)),
				settings.voiceId,
				{ onstart: () => onstart?.(), onsave: (session) => onsave?.(session), onclear: () => onclear?.() }
			)
	);
	const sessionView = $derived(runner.view);
	const finished = $derived(sessionView.summary !== null);
	const act = (command: SessionCommand) => runner.act(command);

	// Ending and restarting both ask first.
	let confirming = $state<'end' | 'restart' | null>(null);
	const askToEnd = () => (confirming = sessionView.status === 'idle' ? null : 'end');
	const askToRestart = () => (confirming = sessionView.status === 'paused' ? 'restart' : null);
	function confirmed() {
		if (confirming) act({ type: confirming });
		confirming = null;
	}

	// The Interval list, for jumping; the Session keeps running while it is open.
	let listOpen = $state(false);
	const toggleList = () => (listOpen = !listOpen && sessionView.status !== 'idle');
	function jumpTo(index: number) {
		act({ type: 'jump', index });
		listOpen = false;
	}

	const KEYS: Record<string, SessionCommand> = {
		Space: { type: 'toggle' },
		ArrowRight: { type: 'next' },
		ArrowLeft: { type: 'previous' },
		ArrowUp: { type: 'adjust', deltaMs: ADJUST_MS },
		ArrowDown: { type: 'adjust', deltaMs: -ADJUST_MS }
	};

	function onkeydown(e: KeyboardEvent) {
		runner.unlockAudio();
		// An open dialog handles its own keys; browser shortcuts (e.g. ⌘R) stay the browser's.
		if (confirming || finished || e.metaKey || e.ctrlKey || e.altKey) return;
		// So does the Interval list, but Space still pauses and resumes there, and J closes it.
		if (listOpen && e.code !== 'Space' && e.code !== 'KeyJ') return;
		const command = KEYS[e.code];
		if (command || e.code === 'Escape') e.preventDefault(); // Esc must not also cancel the dialog it opens
		if (e.repeat) return;
		if (command) act(command);
		else if (e.code === 'Escape') askToEnd();
		else if (e.code === 'KeyR') askToRestart();
		else if (e.code === 'KeyJ') toggleList();
		else if (e.code === 'KeyF') toggleFullscreen();
	}

	// Touch: tap anywhere to pause or resume, swipe left for next and right for previous.
	const touch = new TouchControls({
		onpress: () => runner.unlockAudio(),
		disabled: () => finished,
		ontap: () => act({ type: 'toggle' }),
		onswipe: (direction) => act({ type: direction === 'left' ? 'next' : 'previous' })
	});

	const STATUS_TITLE = { idle: 'Ready', 'lead-in': 'Get ready', paused: 'Get ready' };
	const title = $derived(
		sessionView.current?.name ?? STATUS_TITLE[sessionView.status as keyof typeof STATUS_TITLE]
	);
	const STATUS_LINE: Partial<Record<typeof sessionView.status, string>> = {
		idle: 'Press Space or tap to start',
		'resume-lead-in': 'Get ready'
	};
	const kindLine = $derived(
		sessionView.status === 'paused'
			? ['Paused', sessionView.kindLabel].filter(Boolean).join(' · ')
			: (STATUS_LINE[sessionView.status] ?? sessionView.kindLabel)
	);
	// Re-keyed once per final second so the pulse animation replays.
	const pulseKey = $derived(
		sessionView.finalSecond ? `${sessionView.status}-${sessionView.current?.index}-${sessionView.finalSecond}` : 'steady'
	);
</script>

<!-- Saved once more on the way out, so a reload comes back to the very second. -->
<svelte:window {onkeydown} onpagehide={() => runner.save()} />

<!-- Taps and swipes are shortcuts for actions also on the keyboard and the control bar. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="screen"
	data-testid="session"
	style:background-color={sessionView.colors.background}
	style:color={sessionView.colors.text}
	style:--neutral-bg={PALETTE.neutral.background}
	style:--neutral-text={PALETTE.neutral.text}
	onpointerdown={touch.onpointerdown}
	onpointerup={touch.onpointerup}
	onpointermove={touch.onpointermove}
	onpointercancel={touch.onpointercancel}
>
	{#if sessionView.summary}
		<SessionSummary summary={sessionView.summary} ended={sessionView.status === 'ended'} workoutName={workout.name} />
	{:else}
		<main class="main">
			<p class="kind">{kindLine ?? ''}</p>
			<h1 class="name">{title}</h1>
			{#key pulseKey}
				<p class="digits" class:pulse={pulseKey !== 'steady'} data-testid="remaining">
					{formatClock(sessionView.remainingMs)}
				</p>
			{/key}
			<div class="bar" aria-hidden="true"><div class="fill" style:width="{sessionView.progress * 100}%"></div></div>

			<ControlBar
				status={sessionView.status}
				visible={touch.visible}
				onaction={act}
				onopenlist={toggleList}
				onrestart={askToRestart}
				onend={askToEnd}
			/>
		</main>

		<aside class="rail">
			<h2 class="rail-title" id="up-next">Up next</h2>
			<ol aria-labelledby="up-next">
				{#if sessionView.isFinal}
					<li><span class="item-name">Finish</span></li>
				{:else}
					{#each sessionView.upcoming as entry (entry.index)}
						<li>
							<span class="chip" style:background-color={entry.colors.background}></span>
							<span class="item-name">{entry.name}</span>
							<span class="item-duration">{formatClock(entry.durationMs)}</span>
						</li>
					{/each}
				{/if}
			</ol>
			<div class="rail-foot">
				{#each sessionView.header.length ? sessionView.header : [workout.name] as line (line)}
					<p>{line}</p>
				{/each}
				<p class="time-left" data-testid="time-left">{formatClock(sessionView.totalRemainingMs)} left</p>
			</div>
		</aside>

		{#if listOpen}
			<IntervalList
				items={intervalList(runner.session)}
				currentIndex={sessionView.current?.index ?? null}
				onjump={jumpTo}
				onclose={() => (listOpen = false)}
			/>
		{/if}

		{#if confirming === 'end'}
			<ConfirmDialog
				message="End this Session?"
				confirmLabel="End Session"
				cancelLabel="Keep going"
				onconfirm={confirmed}
				oncancel={() => (confirming = null)}
			/>
		{:else if confirming === 'restart'}
			<ConfirmDialog
				message="Restart the Session from the beginning?"
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
		display: grid;
		/* Shared with the Interval list, which opens over the rail. */
		--rail-width: 31vw;
		grid-template-columns: 1fr var(--rail-width);
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
		transition:
			background-color 0.2s,
			color 0.2s;
		/* Taps and swipes are ours; there is nothing to scroll or zoom. */
		touch-action: none;
		user-select: none;
	}

	.main {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 2vh;
		padding: 4vh 4vw;
		min-width: 0;
	}

	.kind {
		margin: 0;
		min-height: 1.2em;
		font-size: clamp(14px, 4vh, 48px);
		font-weight: 700;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		opacity: 0.85;
	}

	.name {
		margin: 0;
		font-size: clamp(24px, 10vh, 140px);
		font-weight: 800;
		line-height: 1.05;
	}

	.digits {
		margin: 0;
		font-size: min(44vh, 19vw);
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

	/* The rail is always the neutral palette color, whatever the current Interval's color. */
	.rail {
		background-color: var(--neutral-bg);
		color: var(--neutral-text);
		display: flex;
		flex-direction: column;
		gap: 2vh;
		padding: 4vh 2vw;
		min-width: 0;
	}

	.rail-title {
		margin: 0;
		font-size: clamp(12px, 3vh, 36px);
		font-weight: 700;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		opacity: 0.7;
	}

	ol {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1.6vh;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		align-items: center;
		gap: 1vw;
		min-width: 0;
		font-size: clamp(14px, 4vh, 48px);
		font-weight: 700;
		opacity: 0.7;
	}

	li:first-child {
		align-items: flex-start;
		font-size: clamp(18px, 5.5vh, 68px);
		opacity: 1;
	}

	.chip {
		flex: none;
		width: 1em;
		height: 1em;
		border-radius: 0.2em;
	}

	.item-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* The next Interval's name is never truncated; it wraps instead. */
	li:first-child .item-name {
		overflow: visible;
		white-space: normal;
		line-height: 1.05;
	}

	.item-duration {
		flex: none;
		font-variant-numeric: tabular-nums;
	}

	.rail-foot {
		display: flex;
		flex-direction: column;
		gap: 1vh;
		font-size: clamp(14px, 4vh, 48px);
		font-weight: 700;
	}

	.rail-foot p {
		margin: 0;
	}

	.time-left {
		font-size: clamp(18px, 7vh, 90px);
		font-variant-numeric: tabular-nums;
	}

	@media (orientation: portrait) {
		.screen {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr auto;
		}

		.digits {
			font-size: 30vw;
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
	}
</style>
