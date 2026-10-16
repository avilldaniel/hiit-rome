<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	// A checkbox drawn as a chunky toggle. It stays a checkbox to assistive tech, as the visual-only redesign keeps every role.
	let { checked = $bindable(false), class: className, ...rest }: Omit<HTMLInputAttributes, 'type'> = $props();
</script>

<input type="checkbox" class={['switch', className]} bind:checked {...rest} />

<style>
	/* An ink-outlined track with a small hard shadow; when on, it fills blue and the knob slides across, yellow. */
	.switch {
		appearance: none;
		position: relative;
		flex: none;
		box-sizing: border-box;
		width: 60px;
		height: 34px;
		margin: 0;
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-full);
		background: var(--surface-2);
		box-shadow: var(--shadow-sm);
		cursor: pointer;
		transition: background-color var(--dur) ease;
	}

	.switch::before {
		content: '';
		position: absolute;
		top: 3px;
		left: 3px;
		box-sizing: border-box;
		width: 22px;
		height: 22px;
		border: 2px solid var(--line);
		border-radius: 50%;
		background: var(--surface);
		transition:
			translate var(--dur) var(--ease-out),
			background-color var(--dur) ease;
	}

	.switch:checked {
		background: var(--primary);
	}

	.switch:checked::before {
		translate: 26px 0;
		background: var(--hue-yellow);
	}

	.switch:active::before {
		scale: 0.85;
	}

	.switch:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
