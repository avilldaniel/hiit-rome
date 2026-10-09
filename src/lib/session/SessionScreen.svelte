<script lang="ts">
	import { untrack } from 'svelte';
	import { formatClock } from '#lib/engine/format.ts';
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
	import Panel, { timeWidthEm } from '#lib/ui/Panel.svelte';
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
	const clock = $derived(formatClock(sessionView.remainingMs));
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
	onpointerdown={touch.onpointerdown}
	onpointerup={touch.onpointerup}
	onpointermove={touch.onpointermove}
	onpointercancel={touch.onpointercancel}
>
	{#if sessionView.summary}
		<SessionSummary summary={sessionView.summary} ended={sessionView.status === 'ended'} workoutName={workout.name} />
	{:else}
		<Panel as="main" colors={sessionView.colors} class="main">
			<p class="eyebrow">{kindLine ?? ''}</p>
			<h1 class="name">{title}</h1>
			{#key pulseKey}
				<p class="time" class:pulse={pulseKey !== 'steady'} style:--time-em={timeWidthEm(clock)} data-testid="remaining">
					{clock}
				</p>
			{/key}
			<div class="bar" aria-hidden="true"><div style:width="{sessionView.progress * 100}%"></div></div>

			<ControlBar
				status={sessionView.status}
				visible={touch.visible}
				onaction={act}
				onopenlist={toggleList}
				onrestart={askToRestart}
				onend={askToEnd}
			/>
		</Panel>

		<aside class="rail">
			<h2 class="rail-title" id="up-next">Up next</h2>
			<ol aria-labelledby="up-next">
				{#if sessionView.isFinal}
					<li><span class="swatch"></span><span class="item-name">Finish</span></li>
				{:else}
					{#each sessionView.upcoming as entry (entry.index)}
						<li>
							<span class="swatch" style:background-color={entry.colors.background}></span>
							<span class="item-name">{entry.name}</span>
							<span class="item-duration">{formatClock(entry.durationMs)}</span>
						</li>
					{/each}
				{/if}
			</ol>
			<div class="rail-foot">
				{#each sessionView.header.length ? sessionView.header : [workout.name] as line (line)}
					<p class="line">{line}</p>
				{/each}
				<p class="time-left" data-testid="time-left">{formatClock(sessionView.totalRemainingMs)} <small>left</small></p>
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
		/* The gap around the panel and the rail; the rail's width is shared with the Interval list, which opens over it. */
		--gap: calc(24 * var(--tv));
		--rail-width: calc(640 * var(--tv));
		position: fixed;
		inset: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr) var(--rail-width);
		background: var(--ground);
		color: var(--text);
		/* Taps and swipes are ours; there is nothing to scroll or zoom. */
		touch-action: none;
		user-select: none;
	}

	.screen > :global(.main) {
		margin: var(--gap) 0 var(--gap) var(--gap);
		padding: 0 calc(64 * var(--tv)) 0 calc(96 * var(--tv));
	}

	.eyebrow {
		min-height: 1.2em;
		opacity: 0.85;
	}

	.name {
		margin: 0;
		font-size: max(24px, calc(120 * var(--tv)));
		font-weight: 800;
		line-height: 1.05;
		letter-spacing: -0.02em;
	}

	.time {
		--time-size: calc(460 * var(--tv));
	}

	/* The rail is always a white card, whatever the current Interval's color. */
	.rail {
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		margin: var(--gap);
		padding: calc(64 * var(--tv)) calc(48 * var(--tv));
		border-radius: var(--r-xl);
		background: var(--surface);
		box-shadow: var(--shadow);
	}

	.rail-title {
		margin: 0;
		color: var(--muted);
		font-family: var(--font-body);
		font-size: max(14px, calc(24 * var(--tv)));
		font-weight: 600;
	}

	ol {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: calc(16 * var(--tv));
		min-height: 0;
		margin: calc(24 * var(--tv)) 0 0;
		padding: 0;
		list-style: none;
		overflow: hidden;
	}

	/* The swatch is a fixed square pinned to the first line, so a wrapping name never stretches it. */
	li {
		--swatch: calc(40 * var(--tv));
		display: grid;
		grid-template-columns: var(--swatch) minmax(0, 1fr) auto;
		column-gap: calc(16 * var(--tv));
		align-items: start;
		color: var(--muted);
		font-family: var(--font-display);
		font-size: max(16px, calc(40 * var(--tv)));
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.01em;
	}

	li:first-child {
		--swatch: calc(48 * var(--tv));
		padding-bottom: calc(16 * var(--tv));
		margin-bottom: calc(8 * var(--tv));
		border-bottom: 1px solid var(--line);
		color: var(--text);
		font-size: max(20px, calc(60 * var(--tv)));
	}

	.swatch {
		width: var(--swatch);
		height: var(--swatch);
		margin-top: calc((1.1em - var(--swatch)) / 2);
		border-radius: calc(var(--swatch) * 0.3);
	}

	.item-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* The next Interval's name is never truncated; it wraps instead. */
	li:first-child .item-name {
		overflow: visible;
		white-space: normal;
	}

	.item-duration {
		white-space: nowrap;
	}

	.rail-foot {
		display: flex;
		flex-direction: column;
		gap: calc(8 * var(--tv));
		margin-top: calc(24 * var(--tv));
	}

	.rail-foot p {
		margin: 0;
	}

	.line {
		font-size: max(16px, calc(32 * var(--tv)));
		font-weight: 700;
		line-height: 1.2;
	}

	.time-left {
		font-family: var(--font-display);
		font-size: max(24px, calc(72 * var(--tv)));
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		white-space: nowrap;
	}

	.time-left small {
		color: var(--muted);
		font-size: 0.5em;
	}

	@media (orientation: portrait) {
		.screen {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr auto;
		}

		.screen > :global(.main) {
			margin: var(--gap) var(--gap) 0;
			padding: calc(48 * var(--tv));
		}

		/* The narrow width sets --tv here, which would leave the time small in a tall panel. */
		.time {
			--time-size: 30vw;
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
