<script lang="ts">
	import Button from '#lib/ui/Button.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { boing } from '#lib/ui/motion.ts';

	let { onreload, onlater }: { onreload: () => void; onlater: () => void } = $props();

	// A toast shown meanwhile, such as an Undo, rises above the banner, since in a narrower window it would cover it.
	let height = $state(0);
	$effect(() => {
		const root = document.documentElement.style;
		root.setProperty('--toast-lift', `calc(${height}px + var(--s3))`);
		return () => root.removeProperty('--toast-lift');
	});
</script>

<!-- A tilted purple card in the corner, slapped on as it appears. -->
<aside class="update" role="status" bind:clientHeight={height} {@attach boing(0, 0.6)}>
	<span class="icon"><Icon name="spark" size={22} /></span>
	<p>A new version of the app is ready.</p>
	<div class="actions">
		<Button variant="ghost" size="small" class="later" onclick={onlater}>Later</Button>
		<Button variant="primary" size="small" icon="reload" onclick={onreload}>Reload</Button>
	</div>
</aside>

<style>
	.update {
		position: fixed;
		right: var(--s5);
		bottom: var(--s5);
		z-index: 30;
		box-sizing: border-box;
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: var(--s3) var(--s4);
		width: 360px;
		max-width: calc(100vw - 2 * var(--s4));
		padding: var(--s4);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-lg);
		background: var(--hue-purple);
		color: var(--text);
		box-shadow: var(--shadow-raised);
		rotate: -1.5deg;
	}

	.icon {
		display: grid;
		place-content: center;
		box-sizing: border-box;
		width: 44px;
		height: 44px;
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-full);
		background: var(--hue-yellow);
	}

	p {
		margin: 0;
		font-weight: 700;
	}

	.actions {
		grid-column: 1 / -1;
		display: flex;
		justify-content: flex-end;
		gap: var(--s2);
	}

	.actions :global(.later) {
		--fill: var(--surface);
	}

	@media (max-width: 767px) {
		.update {
			left: var(--s4);
			right: var(--s4);
			bottom: var(--s4);
			width: auto;
		}
	}
</style>
