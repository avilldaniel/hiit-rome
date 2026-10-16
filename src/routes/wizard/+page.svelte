<script lang="ts">
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import Band from '#lib/ui/Band.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { dealIn, pressable } from '#lib/ui/motion.ts';
	import Strip from '#lib/ui/Strip.svelte';
	import { WIZARDS } from '#lib/wizards/registry.ts';

	/** Each Wizard's card: its hue and its tilt. */
	const LOOKS: Record<string, { hue: string; tilt: number }> = {
		hiit: { hue: 'var(--hue-pink)', tilt: -1.5 },
		tabata: { hue: 'var(--hue-teal)', tilt: 1 },
		circuit: { hue: 'var(--hue-orange)', tilt: -0.8 },
		emom: { hue: 'var(--hue-purple)', tilt: 1.6 }
	};

	const cards = WIZARDS.map((wizard) => ({
		wizard,
		timeline: buildTimeline(wizard.defaultWorkout.items),
		look: LOOKS[wizard.style] ?? { hue: 'var(--hue-yellow)', tilt: 0 }
	}));
</script>

<svelte:head>
	<title>Wizards · hiit-rome</title>
</svelte:head>

<div class="wizards">
	<Band hue="var(--hue-yellow)" back={{ href: '/', label: 'My Workouts' }} title="Wizards">
		<p class="intro">Pick a style, punch in a few numbers, and get a Workout of your own: ready to start, or to fine-tune.</p>
	</Band>

	<main>
		<ul class="cards" {@attach dealIn({ gap: 0.06 })}>
			{#each cards as { wizard, timeline, look } (wizard.style)}
				<li>
					<!-- A tilted sticker: the Workout it makes on a colored panel, its title and blurb, and a go arrow. -->
					<a
						class="card pressable"
						href="/wizard/{wizard.style}"
						style:--hue={look.hue}
						style:--tilt="{look.tilt}deg"
						{@attach pressable}
					>
						<span class="top"><Strip {timeline} /></span>
						<h2>{wizard.title}</h2>
						<p>{wizard.blurb}</p>
						<span class="go" aria-hidden="true"><Icon name="right" /></span>
					</a>
				</li>
			{/each}
		</ul>
	</main>
</div>

<style>
	.wizards {
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
		max-width: 1216px;
		margin: 0 auto;
		padding: var(--s7) var(--s6) 0;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--s5);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.cards li {
		display: flex;
	}

	.card {
		--depth: 8px;
		position: relative;
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: var(--s4);
		padding: 0 0 var(--s8);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-lg);
		background: var(--surface);
		color: var(--text);
		text-decoration: none;
		rotate: var(--tilt);
		overflow: hidden;
		transition: rotate var(--dur) var(--ease-out);
	}

	@media (hover: hover) {
		.card:hover {
			rotate: 0deg;
		}
	}

	.top {
		padding: var(--s6) var(--s4) var(--s5);
		border-bottom: var(--stroke) solid var(--line);
		background: var(--hue);
	}

	.top :global(.strip) {
		height: 30px;
	}

	.card h2 {
		margin: 0;
		padding: 0 var(--s5);
		font-size: var(--fs-h2);
		font-weight: 900;
		line-height: 1;
		text-transform: uppercase;
	}

	.card p {
		margin: 0;
		padding: 0 var(--s5);
		font-weight: 600;
	}

	/* The way in: a blue coin that nudges right on hover. */
	.go {
		position: absolute;
		right: var(--s4);
		bottom: var(--s4);
		display: grid;
		place-content: center;
		box-sizing: border-box;
		width: 48px;
		height: 48px;
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-full);
		background: var(--primary);
		color: var(--on-primary);
		box-shadow: var(--shadow-sm);
		transition: translate var(--dur) var(--ease-out);
	}

	@media (hover: hover) {
		.card:hover .go {
			translate: 4px 0;
		}
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
			padding: var(--s6) var(--s4) 0;
		}

		.cards {
			grid-template-columns: minmax(0, 1fr);
		}

		.card {
			padding-bottom: var(--s5);
		}

		.top {
			padding: var(--s5) var(--s4) var(--s4);
		}

		.card p {
			padding-right: calc(var(--s8) + var(--s2));
		}
	}
</style>
