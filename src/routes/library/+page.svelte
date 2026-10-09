<script lang="ts">
	import { formatClock } from '#lib/engine/format.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import BackLink from '#lib/ui/BackLink.svelte';
	import Chip from '#lib/ui/Chip.svelte';
	import Strip from '#lib/ui/Strip.svelte';
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

<div class="library">
	<header>
		<BackLink href="/" label="My Workouts" />
		<h1>Library</h1>
		<p class="intro">Ready-made Samples to start as they are, or add to your Workouts and make your own.</p>
	</header>

	<main>
		{#each byLevel as { level, samples } (level)}
			<section aria-labelledby="level-{level}">
				<h2 id="level-{level}">{LEVEL_LABEL[level]}</h2>
				<ul class="cards">
					{#each samples as { sample, timeline } (sample.workout.id)}
						<li>
							<a class="card" href="/library/{sample.workout.id}">
								<span class="strip-row"><Strip {timeline} /></span>
								<span class="body">
									<span class="title">
										<span class="name">{sample.workout.name}</span>
										<span class="duration" data-testid="duration">{formatClock(timeline.totalMs)}</span>
									</span>
									<!-- The hidden dot keeps the link's name "Level · Style", as it read before the chips. -->
									<span class="tags"
										><Chip>{LEVEL_LABEL[sample.level]}</Chip><span class="sr-only">{' · '}</span><Chip>{sample.style}</Chip></span
									>
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
		display: grid;
		gap: var(--s6);
		padding: var(--s7) var(--s8) var(--s9);
	}

	header {
		display: grid;
		gap: var(--s2);
	}

	h1 {
		margin: 0;
		font-size: var(--fs-title);
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.05;
	}

	.intro {
		max-width: 68ch;
		margin: 0;
		color: var(--muted);
		font-size: var(--fs-lead);
	}

	section {
		display: grid;
		gap: var(--s3);
	}

	section + section {
		margin-top: var(--s5);
	}

	h2 {
		margin: 0;
		font-size: var(--fs-h2);
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.05;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 20px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.card {
		display: grid;
		grid-template-rows: auto 1fr;
		height: 100%;
		box-sizing: border-box;
		border: 1px solid transparent;
		border-radius: var(--r-lg);
		background: var(--surface);
		box-shadow: var(--shadow);
		color: inherit;
		text-decoration: none;
		transition:
			transform var(--dur) var(--ease-out),
			border-color var(--dur) var(--ease-out);
	}

	@media (hover: hover) {
		.card:hover {
			border-color: var(--text);
			transform: translateY(-2px);
		}
	}

	.strip-row {
		display: grid;
		margin: var(--s4) var(--s5) 0;
	}

	.strip-row :global(.strip) {
		height: 6px;
	}

	.body {
		display: grid;
		align-content: start;
		gap: var(--s1);
		padding: var(--s3) var(--s5) var(--s5);
	}

	.title {
		display: flex;
		align-items: flex-start;
		gap: var(--s3);
	}

	.name,
	.duration {
		font: 800 24px/1.15 var(--font-display);
		letter-spacing: -0.02em;
	}

	.name {
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.duration {
		margin-left: auto;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.tags {
		display: flex;
		gap: var(--s2);
	}

	.blurb {
		display: -webkit-box;
		margin-top: var(--s1);
		overflow: hidden;
		font-size: 16px;
		line-height: 1.45;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	@media (max-width: 1500px) {
		.cards {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (max-width: 1000px) {
		.library {
			padding: var(--s5) var(--s4) var(--s7);
		}

		.cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 640px) {
		.cards {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
