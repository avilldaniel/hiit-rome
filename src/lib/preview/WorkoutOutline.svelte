<script lang="ts">
	import { formatDuration } from '#lib/engine/format.ts';
	import { PALETTE } from '#lib/engine/palette.ts';
	import { KIND_LABEL, type Item } from '#lib/engine/workout.ts';

	/** A read-only outline of a Workout, as its preview shows it before it's started or added. */
	let { items }: { items: readonly Item[] } = $props();
</script>

{#snippet outline(items: readonly Item[])}
	<ul class="items">
		{#each items as item (item.id)}
			<li>
				{#if item.type === 'interval'}
					<span class="interval" style:border-color={PALETTE[item.color ?? item.kind].background}>
						<span class="name">{item.name.trim() || KIND_LABEL[item.kind]}</span>
						<span class="kind">{KIND_LABEL[item.kind]}</span>
						<span class="time">{formatDuration(item.durationSec * 1000)}</span>
					</span>
				{:else}
					<div class="group">
						<p class="group-title">
							{#if item.name}{item.name} <span class="rounds">× {item.rounds}</span>{:else}{item.rounds} Rounds{/if}
						</p>
						{@render outline(item.items)}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

{@render outline(items)}

<style>
	.items {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.interval {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 16px;
		align-items: baseline;
		padding: 8px 12px;
		border-left: 6px solid;
		border-radius: 6px;
		background: rgb(255 255 255 / 0.06);
	}

	.kind {
		opacity: 0.7;
	}

	.time {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}

	.group {
		padding: 8px 0 8px 16px;
		border-left: 2px solid rgb(255 255 255 / 0.3);
	}

	.group-title {
		margin: 0 0 8px;
		font-weight: 700;
	}

	.rounds {
		opacity: 0.8;
	}
</style>
