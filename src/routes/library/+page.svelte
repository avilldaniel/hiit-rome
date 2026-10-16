<script lang="ts">
	import { formatClock } from '#lib/engine/format.ts';
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import Band from '#lib/ui/Band.svelte';
	import Chip from '#lib/ui/Chip.svelte';
	import { boing, dealIn, pressable } from '#lib/ui/motion.ts';
	import Strip from '#lib/ui/Strip.svelte';
	import { LEVEL_LABEL, LEVELS, SAMPLES, type Level } from '#lib/library/samples.ts';

	/** Each level's hue: its heading's sticker, and the level tag on its cards. */
	const LEVEL_HUE: Record<Level, string> = {
		beginner: 'var(--hue-lime)',
		intermediate: 'var(--hue-orange)',
		advanced: 'var(--hue-pink)'
	};
	/** Each card's tilt, in turn. */
	const TILTS = [-0.8, 0.6, -0.4, 0.9];

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
	<Band hue="var(--hue-teal)" back={{ href: '/', label: 'My Workouts' }} title="Library">
		<p class="intro">Ready-made Samples. Start one as it is, or add it to your Workouts and make it yours.</p>
	</Band>

	<main>
		{#each byLevel as { level, samples } (level)}
			<section aria-labelledby="level-{level}">
				<!-- The level as a pill sticker in its hue, with how many Samples it has. -->
				<h2 id="level-{level}" style:--hue={LEVEL_HUE[level]} {@attach boing(0, 0.6)}>
					<span>{LEVEL_LABEL[level]}</span>
					<span class="count" aria-hidden="true">{samples.length}</span>
				</h2>
				<ul class="cards" {@attach dealIn({ gap: 0.05 })}>
					{#each samples as { sample, timeline }, i (sample.workout.id)}
						<li>
							<a
								class="card pressable"
								href="/library/{sample.workout.id}"
								style:--tilt="{TILTS[i % TILTS.length]}deg"
								{@attach pressable}
							>
								<span class="strip-row"><Strip {timeline} /></span>
								<span class="title">
									<span class="name">{sample.workout.name}</span>
									<span class="duration" data-testid="duration">{formatClock(timeline.totalMs)}</span>
								</span>
								<!-- The hidden dot keeps the link's name "Level · Style", as it read before the chips. -->
								<span class="tags"
									><Chip hue={LEVEL_HUE[sample.level]}>{LEVEL_LABEL[sample.level]}</Chip><span class="sr-only">{' · '}</span
									><Chip>{sample.style}</Chip></span
								>
								<span class="blurb">{sample.blurb}</span>
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
		padding-bottom: var(--s9);
	}

	.intro {
		max-width: 60ch;
		margin: var(--s3) 0 0;
		font-size: var(--fs-lead);
		font-weight: 600;
	}

	main {
		box-sizing: border-box;
		display: grid;
		gap: var(--s7);
		max-width: 1216px;
		margin: 0 auto;
		padding: var(--s7) var(--s6) 0;
	}

	section {
		display: grid;
		justify-items: start;
		gap: var(--s5);
	}

	h2 {
		display: inline-flex;
		align-items: center;
		gap: var(--s3);
		margin: 0;
		padding: var(--s2) var(--s2) var(--s2) var(--s4);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-full);
		background: var(--hue);
		font-size: var(--fs-lead);
		font-weight: 900;
		text-transform: uppercase;
		rotate: -1.5deg;
		box-shadow: var(--shadow);
	}

	.count {
		display: grid;
		place-content: center;
		box-sizing: border-box;
		width: 32px;
		height: 32px;
		border: 2px solid var(--line);
		border-radius: var(--r-full);
		background: var(--surface);
		font: 700 var(--fs-sm) / 1 var(--font-mono);
	}

	.cards {
		justify-self: stretch;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--s5);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.cards li {
		display: flex;
	}

	/* A tilted sticker card that straightens up on hover. */
	.card {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: var(--s3);
		padding: var(--s4) var(--s4) var(--s5);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-lg);
		background: var(--surface);
		color: var(--text);
		text-decoration: none;
		rotate: var(--tilt);
		transition: rotate var(--dur) var(--ease-out);
	}

	@media (hover: hover) {
		.card:hover {
			rotate: 0deg;
		}
	}

	.strip-row :global(.strip) {
		height: 26px;
	}

	.title {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--s3);
	}

	.name {
		font: 700 var(--fs-body) / 1.2 var(--font-display);
	}

	/* The total, boxed and tilted. */
	.duration {
		flex: none;
		padding: 0 var(--s2);
		border: 2px solid var(--line);
		border-radius: var(--r-sm);
		background: var(--surface-2);
		font: 900 var(--fs-lead) / 1.2 var(--font-display);
		font-variant-numeric: tabular-nums;
		rotate: 2deg;
	}

	.tags {
		display: flex;
		gap: var(--s2);
	}

	.blurb {
		font-size: var(--fs-sm);
		font-weight: 600;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
	}

	@media (max-width: 1000px) {
		.cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 767px) {
		.intro {
			font-size: var(--fs-body);
		}

		main {
			gap: var(--s6);
			padding: var(--s6) var(--s4) 0;
		}

		.cards {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--s4);
		}

		h2 {
			font-size: var(--fs-body);
		}
	}
</style>
