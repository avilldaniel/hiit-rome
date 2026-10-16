<script lang="ts">
	import { untrack } from 'svelte';
	import {
		ADJUST_MS,
		createSession,
		intervalList,
		restoreSession,
		type SessionCommand,
		type SessionSnapshot
	} from '#lib/engine/session.ts';
	import { sessionOptions, type SessionLayout, type Settings } from '#lib/engine/settings.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import type { Workout } from '#lib/engine/workout.ts';
	import { toggleFullscreen } from '#lib/platform/screen.ts';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import ControlBar from './ControlBar.svelte';
	import IntervalList from './IntervalList.svelte';
	import LayoutPicker from './LayoutPicker.svelte';
	import BillboardLayout from './layouts/BillboardLayout.svelte';
	import ColumnLayout from './layouts/ColumnLayout.svelte';
	import DialLayout from './layouts/DialLayout.svelte';
	import DiptychLayout from './layouts/DiptychLayout.svelte';
	import { SessionRunner } from './runner.svelte.ts';
	import { sessionStage } from './stage.ts';
	import SessionSummary from './SessionSummary.svelte';
	import { TouchControls } from './touch.svelte.ts';

	/**
	 * The Session runs with the effective `settings`: the global defaults overlaid with the Workout's overrides, or
	 * carries on from `restored`, a saved Session, paused.
	 * `onstart` fires each time the Session leaves idle (its first start, or after a restart).
	 * `onsave` is handed the active Session to keep, on every change and every few seconds while it runs, and
	 * `onclear` fires once it is over. It is laid out as the Settings say; `onlayout` is handed a layout the trainer
	 * picks from the controls, to keep.
	 */
	let {
		workout,
		settings,
		restored,
		onstart,
		onsave,
		onclear,
		onlayout
	}: {
		workout: Workout;
		settings: Settings;
		restored?: SessionSnapshot;
		onstart?: () => void;
		onsave?: (session: SessionSnapshot) => void;
		onclear?: () => void;
		onlayout?: (layout: SessionLayout) => void;
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

	// What every layout draws; the layout can change mid-Session, from the controls.
	const stage = $derived(sessionStage(sessionView, workout.name));
	const LAYOUTS = { column: ColumnLayout, billboard: BillboardLayout, diptych: DiptychLayout, dial: DialLayout };
	let layout = $state(untrack(() => settings.sessionLayout));
	const Layout = $derived(LAYOUTS[layout]);
	function chooseLayout(next: SessionLayout) {
		layout = next;
		onlayout?.(next);
	}

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
		// So does the layout choice, while it has focus: its arrows pick a layout, not ±30 s.
		if ((e.target as Element | null)?.closest?.('select')) return;
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
</script>

<!-- Saved once more on the way out, so a reload comes back to the very second. -->
<svelte:window {onkeydown} onpagehide={() => runner.save()} />

{#snippet deck()}
	<ControlBar
		status={sessionView.status}
		visible={touch.visible}
		pinned={stage.pinned}
		onaction={act}
		onopenlist={toggleList}
		onrestart={askToRestart}
		onend={askToEnd}
	/>
{/snippet}

{#snippet picker()}
	<LayoutPicker {layout} shown={touch.visible || stage.pinned} onlayout={chooseLayout} />
{/snippet}

{#snippet list()}
	{#if listOpen}
		<IntervalList
			items={intervalList(runner.session)}
			currentIndex={sessionView.current?.index ?? null}
			onjump={jumpTo}
			onclose={() => (listOpen = false)}
		/>
	{/if}
{/snippet}

<!-- Taps and swipes are shortcuts for actions also on the keyboard and the control bar. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="screen tv-stage"
	data-testid="session"
	data-layout={layout}
	onpointerdown={touch.onpointerdown}
	onpointerup={touch.onpointerup}
	onpointermove={touch.onpointermove}
	onpointercancel={touch.onpointercancel}
>
	{#if sessionView.summary}
		<SessionSummary summary={sessionView.summary} ended={sessionView.status === 'ended'} workoutName={workout.name} />
	{:else}
		<Layout {stage} {deck} {picker} {list} />

		{#if confirming === 'end'}
			<ConfirmDialog
				message="End this Session?"
				confirmLabel="End Session"
				cancelLabel="Keep going"
				tone="danger"
				icon="stop"
				onconfirm={confirmed}
				oncancel={() => (confirming = null)}
			/>
		{:else if confirming === 'restart'}
			<ConfirmDialog
				message="Restart the Session from the beginning?"
				confirmLabel="Restart"
				icon="restart"
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
		background: var(--ground);
		color: var(--text);
		/* Taps and swipes are ours; there is nothing to scroll or zoom. */
		touch-action: none;
		user-select: none;
	}

	/* Portrait or narrow: the layouts stack, taller than the screen, so it scrolls up and down; swipes stay sideways. */
	@media (max-width: 768px), (orientation: portrait) {
		.screen {
			overflow-y: auto;
			touch-action: pan-y;
		}
	}
</style>
