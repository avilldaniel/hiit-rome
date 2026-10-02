<script lang="ts">
	import { formatClock } from '#lib/engine/format.ts';
	import { PALETTE } from '#lib/engine/palette.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import TimelineStrip from '#lib/home/TimelineStrip.svelte';
	import { LEVEL_LABEL, LEVELS, SAMPLES } from '#lib/library/samples.ts';

	// The Timeline is the source of truth for the total duration and the Interval sequence.
	const byLevel = LEVELS.map((level) => ({
		level,
		samples: SAMPLES.filter((s) => s.level === level).map((sample) => ({
			sample,
			timeline: buildTimeline(sample.workout.items)
		}))
	}));
</script>

<svelte:head>
	<title>Library · hiit-rome</title>
</svelte:head>

<div class="library" style:background-color={PALETTE.neutral.background} style:color={PALETTE.neutral.text}>
	<header>
		<a class="back" href="/">← My Workouts</a>
		<h1>Library</h1>
	</header>

	<main>
		<p class="intro">Ready-made Samples to start as they are, or add to your Workouts and make your own.</p>
		{#each byLevel as { level, samples } (level)}
			<section aria-labelledby="level-{level}">
				<h2 id="level-{level}">{LEVEL_LABEL[level]}</h2>
				<ul class="cards">
					{#each samples as { sample, timeline } (sample.workout.id)}
						<li>
							<a class="card" href="/library/{sample.workout.id}">
								<TimelineStrip {timeline} />
								<span class="body">
									<span class="title">
										<span class="name">{sample.workout.name}</span>
										<span class="duration" data-testid="duration">{formatClock(timeline.totalMs)}</span>
									</span>
									<span class="tags">{LEVEL_LABEL[sample.level]} · {sample.style}</span>
									<span class="blurb">{sample.blurb}</span>
								</span>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</main>
</div>

<style>
	.library {
		min-height: 100vh;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 24px;
		padding: 24px 32px;
	}

	.back {
		color: inherit;
		font-weight: 600;
	}

	h1 {
		margin: 0;
		font-size: 36px;
	}

	main {
		padding: 0 32px 96px;
	}

	.intro {
		margin: 0 0 8px;
		font-size: 20px;
		opacity: 0.8;
	}

	h2 {
		margin: 32px 0 16px;
		font-size: 24px;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 20px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.card {
		display: flex;
		flex-direction: column;
		height: 100%;
		border-radius: 12px;
		background: rgb(255 255 255 / 0.08);
		color: inherit;
		text-decoration: none;
		overflow: hidden;
	}

	.card:hover,
	.card:focus-visible {
		background: rgb(255 255 255 / 0.16);
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 16px;
	}

	.title {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 16px;
	}

	.name {
		font-size: 22px;
		font-weight: 700;
		overflow-wrap: anywhere;
	}

	.duration {
		font-size: 20px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.tags {
		font-weight: 600;
		opacity: 0.8;
	}

	.blurb {
		opacity: 0.8;
	}
</style>
