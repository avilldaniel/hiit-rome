<script lang="ts">
	import { untrack } from 'svelte';
	import { formatClock } from '#lib/engine/format.ts';
	import { PALETTE } from '#lib/engine/palette.ts';
	import { createSession, dispatch, view, type SessionAction } from '#lib/engine/session.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import type { Workout } from '#lib/engine/workout.ts';

	let { workout }: { workout: Workout } = $props();

	// The Session engine owns all timing; this component only renders its view and forwards actions.
	let session = $state.raw(
		untrack(() => createSession(buildTimeline(workout.items), { leadInMs: workout.leadInSec * 1000 }))
	);
	let now = $state(performance.now());
	const sessionView = $derived(view(session, now));

	$effect(() => {
		let frame = requestAnimationFrame(function tick() {
			now = performance.now();
			frame = requestAnimationFrame(tick);
		});
		return () => cancelAnimationFrame(frame);
	});

	function act(type: SessionAction['type']) {
		now = performance.now();
		session = dispatch(session, { type, at: now });
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.code === 'Space') {
			e.preventDefault();
			act('toggle');
		}
	}

	const STATUS_TITLE = { idle: 'Ready', 'lead-in': 'Get ready', paused: 'Get ready', completed: 'Workout complete' };
	const title = $derived(
		sessionView.current?.name ?? STATUS_TITLE[sessionView.status as keyof typeof STATUS_TITLE]
	);
	const kindLine = $derived(
		sessionView.status === 'paused'
			? ['Paused', sessionView.kindLabel].filter(Boolean).join(' · ')
			: sessionView.status === 'idle'
				? 'Press Space to start'
				: sessionView.kindLabel
	);
	// Re-keyed once per final second so the pulse animation replays.
	const pulseKey = $derived(
		sessionView.finalSecond ? `${sessionView.current?.index}-${sessionView.finalSecond}` : 'steady'
	);
</script>

<svelte:window {onkeydown} />

<div
	class="screen"
	data-testid="session"
	style:background-color={sessionView.colors.background}
	style:color={sessionView.colors.text}
>
	<main class="main">
		<p class="kind">{kindLine ?? ''}</p>
		<h1 class="name">{title}</h1>
		{#key pulseKey}
			<p class="digits" class:pulse={pulseKey !== 'steady'} data-testid="remaining">{formatClock(sessionView.remainingMs)}</p>
		{/key}
		<div class="bar" aria-hidden="true"><div class="fill" style:width="{sessionView.progress * 100}%"></div></div>
	</main>

	<aside class="rail" style:background-color={PALETTE.neutral.background} style:color={PALETTE.neutral.text}>
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
			<p class="time-left">{formatClock(sessionView.totalRemainingMs)} left</p>
		</div>
	</aside>
</div>

<style>
	.screen {
		position: fixed;
		inset: 0;
		display: grid;
		grid-template-columns: 1fr 31vw;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
		transition:
			background-color 0.2s,
			color 0.2s;
	}

	.main {
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

	/* The rail is always the neutral palette color (set inline), whatever the current Interval's color. */
	.rail {
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
