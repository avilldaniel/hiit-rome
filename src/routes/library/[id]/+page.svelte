<script lang="ts">
	import { page } from '$app/state';
	import { formatClock, formatDuration } from '#lib/engine/format.ts';
	import { PALETTE } from '#lib/engine/palette.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import { KIND_LABEL, type Item } from '#lib/engine/workout.ts';
	import { copySample, findSample, LEVEL_LABEL } from '#lib/library/samples.ts';
	import { deviceStore } from '#lib/store/device.ts';
	import type { StoredWorkout } from '#lib/store/workout-store.ts';

	const sample = $derived(findSample(page.params.id!));
	const timeline = $derived(sample && buildTimeline(sample.workout.items));

	/** The trainer's own copy, once added; the Sample itself stays as it is. */
	let added = $state.raw<StoredWorkout | null>(null);
	let failed = $state(false);
	$effect(() => {
		void sample;
		added = null;
		failed = false;
	});

	async function add() {
		try {
			added = await (await deviceStore()).add(copySample(sample!));
		} catch {
			failed = true;
		}
	}
</script>

<svelte:head>
	<title>{sample?.workout.name ?? 'Sample'} · hiit-rome</title>
</svelte:head>

{#snippet outline(items: readonly Item[])}
	<ul class="items">
		{#each items as item (item.id)}
			<li>
				{#if item.type === 'interval'}
					<span class="interval" style:border-color={PALETTE[item.color ?? item.kind].background}>
						<span class="name">{item.name.trim() || KIND_LABEL[item.kind]}</span>
						<span class="kind">{KIND_LABEL[item.kind]}</span>
						<span class="time">{formatDuration(item.durationSec * 1000)}</span>
					</span>
				{:else}
					<div class="group">
						<p class="group-title">
							{#if item.name}{item.name} <span class="rounds">× {item.rounds}</span>{:else}{item.rounds} Rounds{/if}
						</p>
						{@render outline(item.items)}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

<div
	class="preview"
	style:background-color={PALETTE.neutral.background}
	style:color={PALETTE.neutral.text}
	style:--start-bg={PALETTE.work.background}
	style:--start-text={PALETTE.work.text}
>
	<header>
		<a class="back" href="/library">← Library</a>
	</header>

	{#if sample && timeline}
		<main>
			<div class="title-row">
				<div>
					<h1>{sample.workout.name}</h1>
					<p class="tags">{LEVEL_LABEL[sample.level]} · {sample.style}</p>
				</div>
				<p class="total">Total <span data-testid="total">{formatClock(timeline.totalMs)}</span></p>
			</div>
			<p class="blurb">{sample.blurb}</p>

			<div class="actions">
				<a class="start" href="/session/{sample.workout.id}">Start</a>
				<button type="button" onclick={add}>Add to My Workouts</button>
			</div>
			{#if added}
				<p class="status" role="status">
					Added “{added.name}” to My Workouts. <a href="/edit/{added.id}">Edit your copy</a>
				</p>
			{:else if failed}
				<p class="status" role="alert">It couldn’t be added. Try again.</p>
			{/if}

			<h2>Outline</h2>
			{@render outline(sample.workout.items)}
		</main>
	{:else}
		<main>
			<h1>Sample not found</h1>
			<p><a href="/library">Back to the Library</a></p>
		</main>
	{/if}
</div>

<style>
	.preview {
		min-height: 100vh;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
	}

	header {
		padding: 24px 32px;
	}

	a {
		color: inherit;
		font-weight: 600;
	}

	main {
		max-width: 800px;
		padding: 0 32px 96px;
	}

	.title-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: baseline;
		gap: 16px;
	}

	h1 {
		margin: 0;
		font-size: 36px;
	}

	.tags {
		margin: 8px 0 0;
		font-weight: 600;
		opacity: 0.8;
	}

	.total {
		margin: 0;
		font-size: 24px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.blurb {
		font-size: 18px;
		opacity: 0.8;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 24px 0 8px;
	}

	.actions a,
	.actions button {
		padding: 10px 18px;
		border: 1px solid rgb(255 255 255 / 0.3);
		border-radius: 8px;
		background: none;
		color: inherit;
		font: inherit;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
	}

	.actions .start {
		border-color: transparent;
		background: var(--start-bg);
		color: var(--start-text);
	}

	.status {
		margin: 8px 0;
	}

	h2 {
		margin: 32px 0 12px;
		font-size: 24px;
	}

	.items {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.interval {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 16px;
		align-items: baseline;
		padding: 8px 12px;
		border-left: 6px solid;
		border-radius: 6px;
		background: rgb(255 255 255 / 0.06);
	}

	.kind {
		opacity: 0.7;
	}

	.time {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}

	.group {
		padding: 8px 0 8px 16px;
		border-left: 2px solid rgb(255 255 255 / 0.3);
	}

	.group-title {
		margin: 0 0 8px;
		font-weight: 700;
	}

	.rounds {
		opacity: 0.8;
	}
</style>
