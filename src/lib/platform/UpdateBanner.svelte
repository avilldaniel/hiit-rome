<script lang="ts">
	import Button from '#lib/ui/Button.svelte';
	import Toast from '#lib/ui/Toast.svelte';

	let { onreload, onlater }: { onreload: () => void; onlater: () => void } = $props();

	// A toast shown meanwhile, such as an Undo, rises above the banner, since in a narrower window it would cover it.
	let height = $state(0);
	$effect(() => {
		const root = document.documentElement.style;
		root.setProperty('--toast-lift', `calc(${height}px + var(--s3))`);
		return () => root.removeProperty('--toast-lift');
	});
</script>

<Toast placement="end" bind:height>
	<p>A new version of the app is ready.</p>
	<Button variant="ghost" onclick={onlater}>Later</Button>
	<Button variant="primary" onclick={onreload}>Reload</Button>
</Toast>
