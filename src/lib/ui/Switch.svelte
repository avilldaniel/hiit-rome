<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	// A checkbox drawn as a toggle; it keeps checkbox behavior and announces itself as a switch.
	let { checked = $bindable(false), class: className, ...rest }: Omit<HTMLInputAttributes, 'type'> = $props();
</script>

<input type="checkbox" role="switch" class={['switch', className]} bind:checked {...rest} />

<style>
	.switch {
		appearance: none;
		position: relative;
		flex: none;
		width: 48px;
		height: 28px;
		margin: 0;
		border-radius: 99px;
		background: var(--line-strong);
		cursor: pointer;
		transition: background var(--dur-fast) var(--ease-out);
	}

	.switch::before {
		content: '';
		position: absolute;
		top: 3px;
		left: 3px;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: var(--surface);
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
		transition: transform var(--dur) var(--ease-out);
	}

	.switch:checked {
		background: var(--primary);
	}

	.switch:checked::before {
		transform: translateX(20px);
	}

	.switch:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
