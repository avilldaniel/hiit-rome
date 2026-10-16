<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import { boing } from './motion.ts';

	/**
	 * A message that matters now, as a sticker: red for a failure (`role="alert"`), yellow for a warning, green for
	 * something done (`role="status"`).
	 */
	let { tone = 'danger', children }: { tone?: 'danger' | 'warn' | 'ok'; children: Snippet } = $props();
</script>

<p class={['alert', tone]} role={tone === 'ok' ? 'status' : 'alert'} {@attach boing(0, 0.8)}>
	<Icon name={tone === 'ok' ? 'check' : 'alert'} size={24} />
	<span>{@render children()}</span>
</p>

<style>
	.alert {
		display: flex;
		align-items: flex-start;
		gap: var(--s3);
		margin: 0;
		padding: var(--s4);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r);
		font-weight: 700;
		box-shadow: var(--shadow);
	}

	.alert :global(.icon) {
		margin-top: 1px;
	}

	.danger {
		background: var(--danger);
		color: var(--surface);
	}

	.warn {
		background: var(--hue-yellow);
		color: var(--text);
	}

	.ok {
		background: var(--hue-lime);
		color: var(--text);
	}
</style>
