<script lang="ts">
	import { formatDuration } from '#lib/engine/format.ts';
	import { PALETTE } from '#lib/engine/palette.ts';
	import { KIND_LABEL, type Item } from '#lib/engine/workout.ts';
	import Pill from '#lib/ui/Pill.svelte';

	/** A read-only outline of a Workout, as its preview shows it before it's started or added. */
	let { items }: { items: readonly Item[] } = $props();
</script>

{#snippet outline(items: readonly Item[])}
	<ul class="items">
		{#each items as item (item.id)}
			<li>
				{#if item.type === 'interval'}
					{@const colors = PALETTE[item.color ?? item.kind]}
					<span class="interval" style:--kind={PALETTE[item.kind].background}>
						<span class="time" style:background-color={colors.background} style:color={colors.text}>
							{formatDuration(item.durationSec * 1000)}
						</span>
						<span class="name">{item.name.trim() || KIND_LABEL[item.kind]}</span>
						<span class="kind">{KIND_LABEL[item.kind]}</span>
					</span>
				{:else}
					<div class="group">
						<p class="group-title">
							{#if item.name}<span class="group-name">{item.name}</span> <Pill>× {item.rounds}</Pill>{:else}<Pill
									>{item.rounds} Rounds</Pill
								>{/if}
						</p>
						<div class="group-body">{@render outline(item.items)}</div>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

{@render outline(items)}

<style>
	.items {
		display: grid;
		gap: var(--s2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.interval {
		display: grid;
		grid-template-columns: 104px minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--s4);
		padding: var(--s2) var(--s5) var(--s2) var(--s2);
		border-radius: var(--r);
		background: var(--surface);
		box-shadow: var(--shadow);
	}

	.time {
		display: grid;
		place-items: center;
		height: 52px;
		border-radius: var(--r-sm);
		font: 800 var(--fs-h2) var(--font-display);
		font-variant-numeric: tabular-nums;
	}

	.name {
		overflow: hidden;
		font-size: var(--fs-lead);
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.kind {
		padding: var(--s1) var(--s3);
		border-radius: 99px;
		background: color-mix(in oklab, var(--kind) 18%, var(--surface));
		font-size: 15px;
		font-weight: 600;
		white-space: nowrap;
	}

	.group {
		display: grid;
		gap: var(--s2);
		padding: var(--s3);
		border: 1px solid var(--line);
		border-radius: var(--r-lg);
		background: color-mix(in oklab, var(--surface) 50%, var(--ground));
	}

	.group .group {
		background: color-mix(in oklab, var(--surface) 80%, var(--ground));
	}

	.group-title {
		display: flex;
		align-items: center;
		gap: var(--s3);
		min-height: 44px;
		margin: 0;
		padding: 0 var(--s2);
	}

	.group-name {
		font: 800 22px var(--font-display);
		letter-spacing: -0.01em;
	}

	.group-body {
		padding-left: var(--s6);
	}
</style>
