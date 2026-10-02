<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { startBlocker } from '#lib/engine/outline.ts';
	import type { SessionSnapshot } from '#lib/engine/session.ts';
	import type { Settings } from '#lib/engine/settings.ts';
	import type { Workout } from '#lib/engine/workout.ts';
	import { findSample } from '#lib/library/samples.ts';
	import EndCurrentPrompt from '#lib/session/EndCurrentPrompt.svelte';
	import { resumeSaved, sessionPath, takeResumed } from '#lib/session/recovery.ts';
	import SessionScreen from '#lib/session/SessionScreen.svelte';
	import { deviceStore, workoutWithSettings } from '#lib/store/device.ts';
	import type { SavedSession } from '#lib/store/workout-store.ts';

	const id = $derived(page.params.id!);
	let workout = $state.raw<Workout | null | undefined>();
	let settings = $state.raw<Settings>();
	/** The saved Session to carry on from, when the trainer chose to resume one. */
	let restored = $state.raw<SessionSnapshot>();
	/** Another Session or Countdown still under way, to end (or go back to) before this one starts. */
	let current = $state.raw<SavedSession>();
	$effect(() => {
		const wanted = id;
		workout = undefined;
		current = undefined;
		const resuming = (restored = takeResumed(`/session/${wanted}`));
		// Best effort: if it can't be checked, this one just starts.
		const underWay = resuming ? undefined : deviceStore().then((store) => store.savedSession()).catch(() => undefined);
		Promise.all([workoutWithSettings(wanted), underWay])
			.then(([loaded, saved]) => ((settings = loaded.settings), (current = saved), loaded.workout ?? findSample(wanted)?.workout))
			.catch(() => undefined)
			.then((found) => {
				if (wanted !== id) return;
				workout = found ?? null;
				// Its Workout was deleted meanwhile: there is nothing to resume, so don't offer it again.
				if (!found && resuming) clear();
			});
	});
	async function endCurrent() {
		// Gone for good before this one starts.
		await deviceStore()
			.then((store) => store.clearSession())
			.catch(() => {});
		current = undefined;
	}
	function backToCurrent(saved: SavedSession) {
		current = undefined;
		// Already on its screen: carry on from it here.
		if (sessionPath(saved) === page.url.pathname) return void (restored = saved.session);
		resumeSaved(saved);
		void goto(sessionPath(saved));
	}
	const blocker = $derived(workout && startBlocker(workout.items));
	// Bookkeeping only: a Workout deleted meanwhile (in another tab) has nothing to update, and a Sample,
	// played straight from the Library, is never marked.
	const markUsed = () => {
		if (!findSample(id)) void deviceStore().then((store) => store.markUsed(id)).catch(() => {});
	};
	// Saved as it goes, to be offered back after a reload or crash; at worst, the trainer starts over.
	const save = (session: SessionSnapshot) =>
		void deviceStore()
			.then((store) => store.saveSession({ workoutId: id, workoutName: workout!.name, session }))
			.catch(() => {});
	const clear = () => void deviceStore().then((store) => store.clearSession()).catch(() => {});
</script>

<svelte:head>
	<title>{workout?.name ?? 'Session'} · hiit-rome</title>
</svelte:head>

{#if workout && blocker}
	<main class="missing">
		<h1>{workout.name} can’t start yet</h1>
		<p>{blocker}</p>
		<a href="/edit/{workout.id}">Edit {workout.name}</a>
	</main>
{:else if workout && current}
	<EndCurrentPrompt {current} starting={workout.name} onend={endCurrent} onback={() => backToCurrent(current!)} />
{:else if workout && settings}
	{#key workout.id}
		<SessionScreen {workout} {settings} {restored} onstart={markUsed} onsave={save} onclear={clear} />
	{/key}
{:else if workout === null}
	<main class="missing">
		<h1>Workout not found</h1>
		<p>It may have been deleted.</p>
		<a href="/">Back to My Workouts</a>
	</main>
{/if}

<style>
	.missing {
		padding: 10vh 6vw;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
	}
</style>
