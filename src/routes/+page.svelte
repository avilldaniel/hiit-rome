<script lang="ts">
	import { goto } from '$app/navigation';
	import { PALETTE } from '#lib/engine/palette.ts';
	import { blankWorkout } from '#lib/engine/workout.ts';
	import WorkoutCard from '#lib/home/WorkoutCard.svelte';
	import { deviceStore } from '#lib/store/device.ts';
	import type { StoredWorkout, WorkoutSort, WorkoutStore } from '#lib/store/workout-store.ts';
	import Button from '#lib/ui/Button.svelte';
	import Field from '#lib/ui/Field.svelte';
	import Icon from '#lib/ui/Icon.svelte';

	/** How long a deletion can be undone. */
	const UNDO_MS = 8000;

	let search = $state('');
	let sort = $state<WorkoutSort>('recent');
	let workouts = $state.raw<StoredWorkout[] | null>(null);
	/** How many Workouts are on this device, whatever the search. */
	let workoutCount = $state<number | null>(null);
	let failed = $state(false);
	/** Bumped after every change, so the list reloads. */
	let changes = $state(0);

	$effect(() => {
		const query = { search, sort };
		void changes;
		let current = true;
		deviceStore()
			.then((store) => Promise.all([store.list(query), store.list()]))
			.then(([found, all]) => current && ((workouts = found), (workoutCount = all.length), (failed = false)))
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

<div class="home">
	<header class="side">
		<p class="brand">
			<span class="brand-mark" aria-hidden="true">
				{#each [PALETTE.warmup, PALETTE.work, PALETTE.rest, PALETTE.cooldown] as kind, i (i)}
					<i style:background-color={kind.background}></i>
				{/each}
			</span>
			hiit-rome
		</p>
		<Button variant="primary" size="large" icon="plus" class="new" onclick={() => create().catch(() => (failed = true))}>
			New Workout
		</Button>
		<nav aria-label="Create">
			<a href="/" aria-current="page">My Workouts</a>
			<a href="/wizard">Wizard</a>
			<a href="/library">Library</a>
			<a href="/countdown">Countdown</a>
			<a href="/settings">Settings</a>
		</nav>
	</header>

	<main>
		<div class="head">
			<div>
				<h1>My Workouts</h1>
				{#if workoutCount !== null}
					<p class="count">{workoutCount} {workoutCount === 1 ? 'Workout' : 'Workouts'} on this device</p>
				{/if}
			</div>
			<div class="tools">
				<div class="search">
					<Field label="Search Workouts" hideLabel>
						<Icon name="search" />
						<input type="search" placeholder="Search" bind:value={search} />
					</Field>
				</div>
				<div class="sort">
					<Field label="Sort by" inline>
						<select bind:value={sort}>
							<option value="recent">Recently used</option>
							<option value="name">Name</option>
							<option value="duration">Duration</option>
						</select>
					</Field>
				</div>
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
			<Button onclick={undo}>Undo</Button>
		</div>
	{/if}
</div>

<style>
	.home {
		display: grid;
		grid-template-columns: clamp(240px, 15.625vw, 300px) minmax(0, 1fr);
		min-height: 100vh;
	}

	.side {
		position: sticky;
		top: 0;
		display: flex;
		flex-direction: column;
		gap: var(--s5);
		box-sizing: border-box;
		height: 100vh;
		padding: var(--s7) var(--s5);
		border-right: 1px solid var(--line);
		background: var(--surface);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: var(--s3);
		margin: 0;
		padding: 0 var(--s3);
		font: 800 var(--fs-h2) var(--font-display);
		letter-spacing: -0.02em;
	}

	.brand-mark {
		display: flex;
		gap: 3px;
		height: 22px;
	}

	.brand-mark i {
		width: 6px;
		border-radius: 2px;
	}

	.side :global(.new) {
		justify-content: flex-start;
		padding: 0 var(--s3);
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: var(--s1);
	}

	nav a {
		display: flex;
		align-items: center;
		min-height: 44px;
		padding: 0 var(--s3);
		border-radius: var(--r);
		color: var(--text);
		font-weight: 500;
		text-decoration: none;
	}

	@media (hover: hover) {
		nav a:hover {
			background: var(--surface-2);
		}
	}

	nav a[aria-current='page'] {
		background: var(--ground);
		font-weight: 700;
	}

	main {
		min-width: 0;
		padding: clamp(var(--s6), 3.33vw, var(--s8));
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: var(--s5);
		margin-bottom: var(--s6);
	}

	h1 {
		margin: 0;
		font-size: var(--fs-title);
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.05;
	}

	.count {
		margin: var(--s2) 0 0;
		color: var(--muted);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	.tools {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s3);
		margin-left: auto;
	}

	.search {
		position: relative;
		width: 320px;
		color: var(--muted);
	}

	.search :global(.icon) {
		position: absolute;
		z-index: 1;
		top: 50%;
		left: 12px;
		transform: translateY(-50%);
	}

	.tools .search :global(input) {
		padding-left: 42px;
	}

	.tools .sort :global(select) {
		width: 200px;
	}

	/* Three columns at full size, fewer when a card would get too narrow for its actions. */
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(max(400px, calc((100% - 2 * var(--s6)) / 3)), 1fr));
		gap: var(--s6);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.cards li {
		display: grid;
		min-width: 0;
	}

	.empty {
		margin: 0;
		color: var(--muted);
		font-size: var(--fs-lead);
	}

	.toast {
		position: fixed;
		bottom: var(--s5);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: var(--s4);
		padding: var(--s2) var(--s2) var(--s2) var(--s5);
		border-radius: var(--r);
		background: var(--surface);
		font-weight: 600;
		box-shadow: var(--shadow), 0 8px 24px rgb(17 22 29 / 0.12);
	}

	/* Below laptop width the sidebar sits on top. */
	@media (max-width: 900px) {
		.home {
			grid-template-columns: minmax(0, 1fr);
		}

		.side {
			position: static;
			height: auto;
			padding: var(--s5);
			border-right: none;
			border-bottom: 1px solid var(--line);
		}

		nav {
			flex-direction: row;
			flex-wrap: wrap;
		}

		.search {
			width: 100%;
		}

		.cards {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
