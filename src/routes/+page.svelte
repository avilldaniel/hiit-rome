<script lang="ts">
	import { goto } from '$app/navigation';
	import { PALETTE } from '#lib/engine/palette.ts';
	import { blankWorkout } from '#lib/engine/workout.ts';
	import WorkoutCard from '#lib/home/WorkoutCard.svelte';
	import { deviceStore } from '#lib/store/device.ts';
	import type { StoredWorkout, WorkoutSort, WorkoutStore } from '#lib/store/workout-store.ts';
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Field from '#lib/ui/Field.svelte';
	import Icon, { type IconName } from '#lib/ui/Icon.svelte';
	import Loading from '#lib/ui/Loading.svelte';
	import { boing, dealIn, pressable } from '#lib/ui/motion.ts';
	import Toast from '#lib/ui/Toast.svelte';

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

	/** Where the trainer can go from here, each in its own hue: the hue its screen opens in. */
	const DESTINATIONS: { href: string; label: string; icon: IconName; hue: string }[] = [
		{ href: '/wizard', label: 'Wizard', icon: 'wand', hue: 'var(--hue-yellow)' },
		{ href: '/library', label: 'Library', icon: 'book', hue: 'var(--hue-teal)' },
		{ href: '/countdown', label: 'Countdown', icon: 'timer', hue: 'var(--hue-orange)' },
		{ href: '/settings', label: 'Settings', icon: 'sliders', hue: 'var(--hue-purple)' }
	];
	/** Each card's tilt, in turn. */
	const TILTS = [-0.6, 0.8, -0.4, 0.5];

	async function create() {
		const workout = await (await deviceStore()).add(blankWorkout());
		await goto(`/edit/${workout.id}`);
	}
</script>

<svelte:head>
	<title>hiit-rome</title>
</svelte:head>

<div class="home">
	<header class="hero">
		<div class="hero-inner">
			<p class="brand">
				<span class="brand-mark" aria-hidden="true">
					{#each [PALETTE.warmup, PALETTE.work, PALETTE.rest, PALETTE.cooldown] as kind, i (i)}
						<i style:background-color={kind.background}></i>
					{/each}
				</span>
				hiit-rome
			</p>
			<h1>My Workouts</h1>
			{#if workoutCount !== null}
				{#key workoutCount}
					<p class="count" {@attach boing()}>
						{workoutCount}
						{workoutCount === 1 ? 'Workout' : 'Workouts'} on this device
					</p>
				{/key}
			{/if}
		</div>
	</header>

	<!-- The launch tiles: New Workout, then every destination, in its hue; this one pressed in. -->
	<nav class="launch" aria-label="Create" {@attach dealIn({ gap: 0.04 })}>
		<button type="button" class="tile new pressable" onclick={() => create().catch(() => (failed = true))} {@attach pressable}>
			<span class="tile-icon"><Icon name="plus" size={22} /></span>
			<span class="tile-label">New Workout</span>
		</button>
		<a class="tile here" href="/" aria-current="page" style:--hue="var(--hue-lime)">
			<span class="tile-icon"><Icon name="grid" size={22} /></span>
			<span class="tile-label">My Workouts</span>
			<span class="sticker here-sticker" aria-hidden="true">You’re here</span>
		</a>
		{#each DESTINATIONS as destination (destination.href)}
			<a class="tile pressable" href={destination.href} style:--hue={destination.hue} {@attach pressable}>
				<span class="tile-icon"><Icon name={destination.icon} size={22} /></span>
				<span class="tile-label">{destination.label}</span>
				<span class="tile-go"><Icon name="right" /></span>
			</a>
		{/each}
	</nav>

	<main>
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

		{#if failed}
			<Alert>Your Workouts couldn’t be loaded. Try reloading the page.</Alert>
		{:else if workouts?.length}
			<ul class="cards" {@attach dealIn({ gap: 0.03 })}>
				{#each workouts as workout, i (workout.id)}
					<li style:--tilt="{TILTS[i % TILTS.length]}deg">
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
			<div class="empty">
				<span class="doodle" aria-hidden="true" {@attach boing()}>{search ? '?' : '0'}</span>
				<div>
					<p class="empty-text">{search ? `No Workouts match “${search}”.` : 'No Workouts yet.'}</p>
					{#if !search}
						<p class="empty-sub">Smash New Workout up top, or grab a ready-made one from the Library.</p>
					{/if}
				</div>
			</div>
		{:else}
			<Loading />
		{/if}
	</main>

	{#if deleted}
		<Toast>
			Deleted “{deleted.name}”
			<Button variant="accent" size="small" onclick={undo}>Undo</Button>
		</Toast>
	{/if}
</div>

<style>
	.home {
		min-height: 100vh;
		padding-bottom: var(--s8);
	}

	/* The lime band: the brand, a giant title and the count as a tilted sticker. */
	.hero {
		position: relative;
		overflow: hidden;
		border-bottom: var(--stroke) solid var(--line);
		background: var(--hue-lime);
	}

	.hero::after {
		content: '';
		position: absolute;
		right: -40px;
		top: -60px;
		width: 260px;
		height: 260px;
		border: var(--stroke) solid var(--line);
		border-radius: 50%;
		background: repeating-linear-gradient(
			-45deg,
			transparent 0 10px,
			color-mix(in srgb, var(--line) 18%, transparent) 10px 13px
		);
		pointer-events: none;
	}

	.hero-inner {
		position: relative;
		z-index: 1;
		box-sizing: border-box;
		max-width: 1216px;
		margin: 0 auto;
		padding: var(--s5) var(--s6) calc(var(--s8) + var(--s6));
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: var(--s3);
		margin: 0;
		font: 900 var(--fs-lead) / 1 var(--font-display);
		letter-spacing: -0.02em;
	}

	.brand-mark {
		display: inline-flex;
		align-items: flex-end;
		gap: 3px;
	}

	.brand-mark i {
		box-sizing: border-box;
		width: 9px;
		border: 2px solid var(--line);
		border-radius: 3px;
	}

	.brand-mark i:nth-child(1) {
		height: 18px;
	}

	.brand-mark i:nth-child(2) {
		height: 26px;
	}

	.brand-mark i:nth-child(3) {
		height: 14px;
	}

	.brand-mark i:nth-child(4) {
		height: 22px;
	}

	h1 {
		margin: var(--s5) 0 0;
		font-size: calc(var(--fs-title) * 1.1);
		font-weight: 900;
		line-height: 1;
		letter-spacing: -0.03em;
		text-transform: uppercase;
	}

	.count {
		display: inline-flex;
		margin: var(--s4) 0 0;
		padding: var(--s1) var(--s4);
		border: 2px solid var(--line);
		border-radius: var(--r-full);
		background: var(--surface);
		font: 700 var(--fs-sm) / 1.4 var(--font-mono);
		rotate: -3deg;
		box-shadow: var(--shadow-sm);
	}

	/* The launch tiles overlap the band's edge. */
	.launch {
		position: relative;
		z-index: 2;
		box-sizing: border-box;
		display: grid;
		grid-template-columns: 1.45fr repeat(5, 1fr);
		gap: var(--s4);
		max-width: 1216px;
		margin: calc(-1 * var(--s8) - var(--s4)) auto 0;
		padding: 0 var(--s6);
	}

	.tile {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--s4);
		box-sizing: border-box;
		min-height: 128px;
		padding: var(--s4);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-lg);
		background: var(--hue, var(--surface));
		color: var(--text);
		font: inherit;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
	}

	.tile-icon {
		display: grid;
		place-content: center;
		box-sizing: border-box;
		width: 44px;
		height: 44px;
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-full);
		background: var(--surface);
	}

	.tile-label {
		font: 700 var(--fs-body) / 1.1 var(--font-display);
		letter-spacing: -0.01em;
		text-transform: uppercase;
	}

	.tile-go {
		position: absolute;
		right: var(--s4);
		top: var(--s4);
		transition: translate var(--dur) var(--ease-out);
	}

	@media (hover: hover) {
		.tile:hover .tile-go {
			translate: 4px 0;
		}
	}

	.new {
		--hue: var(--primary);
		color: var(--on-primary);
	}

	.new .tile-icon {
		background: var(--accent);
		color: var(--on-accent);
	}

	.new .tile-label {
		font-size: var(--fs-lead);
		font-weight: 900;
	}

	/* This screen's tile: pressed into its place, with a sticker. */
	.here {
		translate: 4px 4px;
	}

	.sticker {
		padding: var(--s1) var(--s3);
		border: 2px solid var(--line);
		border-radius: var(--r-full);
		background: var(--accent);
		color: var(--on-accent);
		font: 700 var(--fs-xs) / 1.4 var(--font-mono);
		white-space: nowrap;
		box-shadow: var(--shadow-sm);
	}

	.here-sticker {
		position: absolute;
		right: calc(-1 * var(--s2));
		top: calc(-1 * var(--s3));
		rotate: 7deg;
	}

	main {
		box-sizing: border-box;
		max-width: 1216px;
		margin: 0 auto;
		padding: var(--s7) var(--s6) 0;
	}

	.tools {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: var(--s4);
		margin-bottom: var(--s6);
	}

	.search {
		width: 340px;
	}

	/* The search icon sits inside the field. */
	.search :global(.field) {
		position: relative;
	}

	.search :global(.icon) {
		position: absolute;
		left: var(--s3);
		top: 50%;
		translate: 0 -50%;
		pointer-events: none;
	}

	/* Outranks the Field's own padding. */
	.tools .search :global(.field input) {
		padding-left: 44px;
		box-shadow: var(--shadow-sm);
	}

	.sort :global(.label) {
		font: 700 var(--fs-xs) / 1 var(--font-mono);
		text-transform: uppercase;
	}

	.tools .sort :global(.field select) {
		width: 200px;
		box-shadow: var(--shadow-sm);
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: var(--s6);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* Empty: a doodle and a line or two, on a tilted card. */
	.empty {
		display: flex;
		align-items: center;
		gap: var(--s5);
		padding: var(--s6);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-lg);
		background: var(--surface);
		box-shadow: var(--shadow-raised);
		rotate: -0.6deg;
	}

	.doodle {
		flex: none;
		display: grid;
		place-content: center;
		box-sizing: border-box;
		width: 96px;
		height: 96px;
		border: var(--stroke) solid var(--line);
		border-radius: 38% 62% 55% 45% / 48% 40% 60% 52%;
		background: var(--accent);
		font: 900 var(--fs-2xl) / 1 var(--font-display);
		rotate: -10deg;
		box-shadow: var(--shadow);
	}

	.empty-text {
		margin: 0;
		color: var(--muted);
		font: 700 var(--fs-h2) / 1.2 var(--font-display);
	}

	.empty-sub {
		margin: var(--s2) 0 0;
		font-weight: 600;
	}

	@media (max-width: 1100px) {
		.launch {
			grid-template-columns: repeat(3, 1fr);
		}

		.new {
			grid-column: span 3;
			flex-direction: row;
			align-items: center;
			justify-content: flex-start;
			min-height: 72px;
		}
	}

	@media (max-width: 767px) {
		.hero-inner {
			padding: var(--s4) var(--s4) var(--s8);
		}

		h1 {
			font-size: var(--fs-2xl);
		}

		.launch {
			grid-template-columns: 1fr 1fr;
			gap: var(--s3);
			margin-top: calc(-1 * var(--s7));
			padding: 0 var(--s4);
		}

		.tile {
			min-height: 92px;
			gap: var(--s2);
			padding: var(--s3);
		}

		.new {
			grid-column: 1 / -1;
		}

		.tile:last-child {
			grid-column: 1 / -1;
			flex-direction: row;
			align-items: center;
			justify-content: flex-start;
			min-height: 64px;
		}

		.tile-label {
			font-size: var(--fs-sm);
		}

		.tile-icon {
			width: 36px;
			height: 36px;
		}

		main {
			padding: var(--s6) var(--s4) 0;
		}

		.tools {
			flex-direction: column;
			align-items: stretch;
			gap: var(--s3);
		}

		.search {
			width: 100%;
		}

		.sort :global(.field) {
			display: flex;
		}

		.tools .sort :global(.field select) {
			flex: 1;
			width: auto;
		}

		.cards {
			grid-template-columns: minmax(0, 1fr);
		}

		.empty {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
