<script lang="ts">
	import { goto } from '$app/navigation';
	import { PALETTE } from '#lib/engine/palette.ts';
	import { blankWorkout } from '#lib/engine/workout.ts';
	import WorkoutCard from '#lib/home/WorkoutCard.svelte';
	import { deviceStore } from '#lib/store/device.ts';
	import type { StoredWorkout, WorkoutSort, WorkoutStore } from '#lib/store/workout-store.ts';

	/** How long a deletion can be undone. */
	const UNDO_MS = 8000;

	let search = $state('');
	let sort = $state<WorkoutSort>('recent');
	let workouts = $state.raw<StoredWorkout[] | null>(null);
	let failed = $state(false);
	/** Bumped after every change, so the list reloads. */
	let changes = $state(0);

	$effect(() => {
		const query = { search, sort };
		void changes;
		let current = true;
		deviceStore()
			.then((store) => store.list(query))
			.then((found) => current && ((workouts = found), (failed = false)))
			.catch(() => current && (failed = true));
		return () => (current = false);
	});

	/** Changes the store, then reloads the list. A change to a Workout already gone (e.g. a double click) just reloads. */
	async function change(action: (store: WorkoutStore) => Promise<unknown>) {
		try {
			await action(await deviceStore());
		} finally {
			changes++;
		}
	}

	let deleted = $state.raw<StoredWorkout | null>(null);
	let forget: ReturnType<typeof setTimeout> | undefined;
	async function remove(workout: StoredWorkout) {
		await change(async (store) => (deleted = await store.remove(workout.id))).catch(() => {});
		clearTimeout(forget);
		forget = setTimeout(() => (deleted = null), UNDO_MS);
	}
	async function undo() {
		const workout = deleted;
		deleted = null;
		clearTimeout(forget);
		if (workout) await change((store) => store.restore(workout));
	}
	$effect(() => () => clearTimeout(forget));

	async function create() {
		const workout = await (await deviceStore()).add(blankWorkout());
		await goto(`/edit/${workout.id}`);
	}
</script>

<svelte:head>
	<title>hiit-rome</title>
</svelte:head>

<div
	class="home"
	style:background-color={PALETTE.neutral.background}
	style:color={PALETTE.neutral.text}
	style:--start-bg={PALETTE.work.background}
	style:--start-text={PALETTE.work.text}
>
	<header>
		<p class="app">hiit-rome</p>
		<nav aria-label="Create">
			<button type="button" onclick={() => create().catch(() => (failed = true))}>New Workout</button>
			<a class="link" href="/wizard">Wizard</a>
			<a class="link" href="/library">Library</a>
			<a class="link" href="/countdown">Countdown</a>
			<a class="link" href="/settings">Settings</a>
		</nav>
	</header>

	<main>
		<div class="title-row">
			<h1>My Workouts</h1>
			<div class="filters">
				<input type="search" placeholder="Search" aria-label="Search Workouts" bind:value={search} />
				<label>
					Sort by
					<select bind:value={sort}>
						<option value="recent">Recently used</option>
						<option value="name">Name</option>
						<option value="duration">Duration</option>
					</select>
				</label>
			</div>
		</div>

		{#if failed}
			<p class="empty" role="alert">Your Workouts couldn’t be loaded. Try reloading the page.</p>
		{:else if workouts?.length}
			<ul class="cards">
				{#each workouts as workout (workout.id)}
					<li>
						<WorkoutCard
							{workout}
							onfavorite={() => change((store) => store.setFavorite(workout.id, !workout.favorite)).catch(() => {})}
							onduplicate={() => change((store) => store.duplicate(workout.id)).catch(() => {})}
							ondelete={() => remove(workout)}
						/>
					</li>
				{/each}
			</ul>
		{:else if workouts}
			<p class="empty">{search ? `No Workouts match “${search}”.` : 'No Workouts yet.'}</p>
		{/if}
	</main>

	{#if deleted}
		<div class="toast" role="status">
			Deleted “{deleted.name}”
			<button type="button" onclick={undo}>Undo</button>
		</div>
	{/if}
</div>

<style>
	.home {
		min-height: 100vh;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
	}

	header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		padding: 24px 32px;
	}

	.app {
		margin: 0;
		font-size: 20px;
		font-weight: 800;
		letter-spacing: 0.1em;
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	main {
		padding: 0 32px 96px;
	}

	.title-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		margin-bottom: 24px;
	}

	h1 {
		margin: 0;
		font-size: 36px;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
	}

	label {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	input,
	select,
	button,
	.link {
		padding: 8px 12px;
		border: 1px solid rgb(255 255 255 / 0.3);
		border-radius: 8px;
		background: rgb(255 255 255 / 0.08);
		color: inherit;
		font: inherit;
	}

	option {
		color: initial;
	}

	button {
		cursor: pointer;
	}

	.link {
		text-decoration: none;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 20px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.empty {
		font-size: 20px;
		opacity: 0.8;
	}

	.toast {
		position: fixed;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px 16px 12px 20px;
		border-radius: 12px;
		background: #fff;
		color: #073b4c;
		font-weight: 600;
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.3);
	}

	.toast button {
		border-color: currentColor;
		background: none;
		font-weight: 700;
		cursor: pointer;
	}
</style>
