<script lang="ts">
	import { animate } from 'motion';
	import { SESSION_LAYOUTS, type SessionLayout } from '#lib/engine/settings.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import { BOUNCE } from '#lib/ui/motion.ts';

	/**
	 * The Session's layout, as a small sticker the layout tucks into a free corner. It shows and hides with the
	 * controls. Picking one hands focus back to the Session, so Space and the arrows run it again.
	 */
	let { layout, shown, onlayout }: { layout: SessionLayout; shown: boolean; onlayout: (layout: SessionLayout) => void } =
		$props();

	let picker: HTMLElement;
	$effect(() => {
		const animation = shown
			? animate(picker, { opacity: 1, scale: 1 }, BOUNCE)
			: animate(picker, { opacity: 0, scale: 0.8 }, { duration: 0.18, ease: 'easeIn' });
		return () => animation.stop();
	});

	function choose(event: Event & { currentTarget: HTMLSelectElement }) {
		onlayout(event.currentTarget.value as SessionLayout);
		event.currentTarget.blur();
	}
</script>

<label class="picker" bind:this={picker} data-controls inert={!shown}>
	<Icon name="layout" />
	<span class="caption">Layout</span>
	<select value={layout} onchange={choose}>
		{#each SESSION_LAYOUTS as option (option.id)}
			<option value={option.id}>{option.label}</option>
		{/each}
	</select>
</label>

<style>
	/* A pale yellow sticker: an icon, a mono caption and the layout's name to pick from. */
	.picker {
		display: inline-flex;
		align-items: center;
		gap: calc(10 * var(--tv));
		box-sizing: border-box;
		min-height: max(40px, calc(72 * var(--tv)));
		padding: 0 calc(18 * var(--tv));
		border: var(--ln2) solid var(--line);
		border-radius: var(--r-full);
		background: var(--surface-2);
		color: var(--text);
		rotate: 2deg;
		box-shadow: var(--o-sm) var(--o-sm) 0 var(--line);
		opacity: 0;
		cursor: pointer;
	}

	.picker :global(.icon) {
		width: max(18px, calc(32 * var(--tv)));
		height: max(18px, calc(32 * var(--tv)));
	}

	.caption {
		font: 700 max(11px, calc(22 * var(--tv))) / 1 var(--font-mono);
		text-transform: uppercase;
	}

	select {
		appearance: none;
		padding: 0 calc(34 * var(--tv)) 0 0;
		border: none;
		background:
			linear-gradient(45deg, transparent 50%, currentColor 50%) right calc(10 * var(--tv)) center / calc(10 * var(--tv))
				calc(10 * var(--tv)) no-repeat,
			linear-gradient(135deg, currentColor 50%, transparent 50%) right 0 center / calc(10 * var(--tv))
				calc(10 * var(--tv)) no-repeat;
		color: inherit;
		font: 800 max(14px, calc(30 * var(--tv))) / 1.1 var(--font-body);
		cursor: pointer;
	}
</style>
