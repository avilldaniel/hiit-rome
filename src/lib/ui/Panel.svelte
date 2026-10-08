<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ColorPair } from '#lib/engine/palette.ts';

	// The full-color inset panel behind the Session and Countdown: a Kind color, or the neutral ink while
	// ready, paused or in the Lead-in.
	let {
		colors,
		children,
		class: className,
		...rest
	}: { colors: ColorPair; children: Snippet } & HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
	class={['panel', className]}
	style:background-color={colors.background}
	style:color={colors.text}
	{...rest}
>
	{@render children()}
</div>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		justify-content: center;
		border-radius: var(--r-xl);
		font-variant-numeric: tabular-nums;
	}
</style>
