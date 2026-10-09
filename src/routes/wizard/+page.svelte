<script lang="ts">
	import { buildTimeline } from '#lib/engine/timeline.ts';
	import BackLink from '#lib/ui/BackLink.svelte';
	import Strip from '#lib/ui/Strip.svelte';
	import { WIZARDS } from '#lib/wizards/registry.ts';

	const cards = WIZARDS.map((wizard) => ({ wizard, timeline: buildTimeline(wizard.defaultWorkout.items) }));
</script>

<svelte:head>
	<title>Wizards · hiit-rome</title>
</svelte:head>

<div class="wizards">
	<header>
		<BackLink href="/" label="My Workouts" />
		<h1>Wizards</h1>
	</header>

	<main>
		<p class="intro">Fill in a short form and get a Workout of your own, ready to start or fine-tune.</p>
		<ul class="cards">
			{#each cards as { wizard, timeline } (wizard.style)}
				<li>
					<a class="card" href="/wizard/{wizard.style}">
						<span class="strip"><Strip {timeline} /></span>
						<h2>{wizard.title}</h2>
						<p>{wizard.blurb}</p>
					</a>
				</li>
			{/each}
		</ul>
	</main>
</div>

<style>
	.wizards {
		display: grid;
		gap: var(--s2);
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

	main {
		display: grid;
		gap: var(--s6);
	}

	.intro {
		max-width: 68ch;
		margin: 0;
		color: var(--muted);
		font-size: var(--fs-lead);
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--s5);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.card {
		display: grid;
		align-content: start;
		gap: var(--s4);
		box-sizing: border-box;
		height: 100%;
		min-height: 320px;
		padding: var(--s6);
		border: 1px solid transparent;
		border-radius: var(--r-xl);
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

	.strip {
		display: grid;
		margin-bottom: var(--s4);
	}

	.strip :global(.strip) {
		height: 12px;
	}

	h2 {
		margin: 0;
		font-size: 48px;
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.05;
	}

	.card p {
		margin: 0;
		color: var(--muted);
		font-size: var(--fs-lead);
		line-height: 1.5;
	}

	@media (max-width: 1100px) {
		.cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.card {
			min-height: 0;
		}
	}

	@media (max-width: 1000px) {
		.wizards {
			padding: var(--s5) var(--s4) var(--s7);
		}

		h1 {
			font-size: 48px;
		}
	}

	@media (max-width: 640px) {
		.cards {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
