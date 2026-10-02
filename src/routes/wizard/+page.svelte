<script lang="ts">
	import { PALETTE } from '#lib/engine/palette.ts';
	import { WIZARDS } from '#lib/wizards/registry.ts';
</script>

<svelte:head>
	<title>Wizards · hiit-rome</title>
</svelte:head>

<div class="wizards" style:background-color={PALETTE.neutral.background} style:color={PALETTE.neutral.text}>
	<header>
		<a class="back" href="/">← My Workouts</a>
		<h1>Wizards</h1>
	</header>

	<main>
		<p class="intro">Fill in a short form and get a Workout of your own, ready to start or fine-tune.</p>
		<ul class="cards">
			{#each WIZARDS as wizard (wizard.style)}
				<li>
					<a class="card" href="/wizard/{wizard.style}">
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
		margin: 0 0 24px;
		font-size: 20px;
		opacity: 0.8;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 20px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.card {
		display: block;
		height: 100%;
		box-sizing: border-box;
		padding: 24px;
		border-radius: 12px;
		background: rgb(255 255 255 / 0.08);
		color: inherit;
		text-decoration: none;
	}

	.card:hover,
	.card:focus-visible {
		background: rgb(255 255 255 / 0.16);
	}

	h2 {
		margin: 0 0 8px;
		font-size: 28px;
	}

	.card p {
		margin: 0;
		opacity: 0.8;
	}
</style>
