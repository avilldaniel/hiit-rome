<script lang="ts">
	import type { Snippet } from 'svelte';
	import { PALETTE } from '#lib/engine/palette.ts';

	/** The page a Workout is previewed on before it's started or added, with a link back to where it came from. */
	let { back, children }: { back: { href: string; label: string }; children: Snippet } = $props();
</script>

<div
	class="preview"
	style:background-color={PALETTE.neutral.background}
	style:color={PALETTE.neutral.text}
	style:--start-bg={PALETTE.work.background}
	style:--start-text={PALETTE.work.text}
>
	<header>
		<a class="back" href={back.href}>← {back.label}</a>
	</header>
	<main>
		{@render children()}
	</main>
</div>

<style>
	.preview {
		min-height: 100vh;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
	}

	header {
		padding: 24px 32px;
	}

	.preview :global(a) {
		color: inherit;
		font-weight: 600;
	}

	.preview :global(h1) {
		margin: 0;
		font-size: 36px;
	}

	main {
		max-width: 800px;
		padding: 0 32px 96px;
	}
</style>
