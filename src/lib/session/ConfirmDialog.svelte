<script lang="ts">
	import Button from '#lib/ui/Button.svelte';
	import type { IconName } from '#lib/ui/Icon.svelte';
	import { boing } from '#lib/ui/motion.ts';

	/**
	 * A question read from across the room, such as "End this Session?". The confirming choice is focused, so Esc then
	 * Enter confirms; `tone` and `icon` dress it (red with a stop for ending). `stacked` puts the choices one above the
	 * other, full width, for long labels.
	 */
	let {
		message,
		confirmLabel,
		cancelLabel = 'Cancel',
		tone = 'primary',
		icon,
		stacked = false,
		onconfirm,
		oncancel
	}: {
		message: string;
		confirmLabel: string;
		cancelLabel?: string;
		tone?: 'primary' | 'danger' | 'ink';
		icon?: IconName;
		stacked?: boolean;
		onconfirm: () => void;
		oncancel: () => void;
	} = $props();

	let dialog: HTMLDialogElement;
	let answered = false;

	$effect(() => dialog.showModal());

	// Answered from the buttons, or cancelled by Esc (`cancel`, or just `close` when the browser skips `cancel`).
	function answer(confirm: boolean) {
		if (answered) return;
		answered = true;
		// The dialog is about to be removed; a focused button inside it would swallow the Session's keys.
		if (dialog.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
		if (dialog.open) dialog.close();
		if (confirm) onconfirm();
		else oncancel();
	}
</script>

<dialog class={['tv-stage', stacked && 'stacked']} bind:this={dialog} oncancel={() => answer(false)} onclose={() => answer(false)}>
	<div class="card" {@attach boing(0, 0.6)}>
		<p>{message}</p>
		<div class="actions">
			<Button size="prompt" onclick={() => answer(false)}>{cancelLabel}</Button>
			<!-- Focused, so Esc then Enter confirms from across the room. -->
			<!-- svelte-ignore a11y_autofocus -->
			<Button
				class={tone === 'danger' ? 'danger-fill' : undefined}
				variant={tone === 'ink' ? 'ink' : tone === 'danger' ? 'default' : 'primary'}
				size="prompt"
				{icon}
				autofocus
				onclick={() => answer(true)}>{confirmLabel}</Button
			>
		</div>
	</div>
</dialog>

<style>
	/* A white sticker in the middle of the screen, sized in TV pixels. */
	dialog {
		box-sizing: border-box;
		width: min(calc(1040 * var(--tv)), calc(100vw - 2 * var(--s4)));
		max-width: none;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--text);
		overflow: visible;
	}

	dialog::backdrop {
		background: color-mix(in srgb, var(--text) 55%, transparent);
	}

	.card {
		padding: calc(56 * var(--tv)) calc(64 * var(--tv));
		border: var(--ln) solid var(--line);
		border-radius: var(--r-lg-tv);
		background: var(--surface);
		box-shadow: var(--o-lg) var(--o-lg) 0 var(--line);
	}

	p {
		margin: 0;
		font: 900 max(22px, calc(56 * var(--tv))) / 1.1 var(--font-display);
		letter-spacing: -0.01em;
		text-transform: uppercase;
		text-wrap: balance;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: calc(24 * var(--tv));
		margin-top: calc(48 * var(--tv));
	}

	.actions :global(.button) {
		--depth: var(--o-md);
		min-height: max(48px, calc(100 * var(--tv)));
		padding: 0 calc(44 * var(--tv));
		border-width: var(--ln2);
		border-radius: calc(20 * var(--tv));
		font-size: max(16px, calc(36 * var(--tv)));
		line-height: 1.1;
		text-align: center;
		white-space: normal;
	}

	.actions :global(.button .icon) {
		width: calc(40 * var(--tv));
		height: calc(40 * var(--tv));
	}

	.actions :global(.danger-fill) {
		--fill: var(--danger);
		--ink: var(--surface);
	}

	.stacked {
		text-align: center;
	}

	.stacked .actions {
		flex-direction: column;
		align-items: stretch;
	}
</style>
