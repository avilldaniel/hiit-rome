<script lang="ts">
	import Button from '#lib/ui/Button.svelte';

	let {
		message,
		confirmLabel,
		cancelLabel = 'Cancel',
		onconfirm,
		oncancel
	}: { message: string; confirmLabel: string; cancelLabel?: string; onconfirm: () => void; oncancel: () => void } =
		$props();

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

<dialog bind:this={dialog} oncancel={() => answer(false)} onclose={() => answer(false)}>
	<p>{message}</p>
	<div class="actions">
		<Button size="prompt" onclick={() => answer(false)}>{cancelLabel}</Button>
		<!-- Focused, so Esc then Enter confirms from across the room. -->
		<!-- svelte-ignore a11y_autofocus -->
		<Button variant="primary" size="prompt" autofocus onclick={() => answer(true)}>{confirmLabel}</Button>
	</div>
</dialog>

<style>
	/* A centered card, as the Resume prompt. */
	dialog {
		box-sizing: border-box;
		max-width: min(calc(1040 * var(--tv)), calc(100vw - 2 * var(--s4)));
		padding: calc(48 * var(--tv)) calc(64 * var(--tv));
		border: none;
		border-radius: var(--r-xl);
		background: var(--surface);
		box-shadow: var(--shadow);
		color: var(--text);
		text-align: center;
	}

	dialog::backdrop {
		background: color-mix(in srgb, var(--text) 55%, transparent);
	}

	p {
		margin: 0 0 calc(40 * var(--tv));
		font-family: var(--font-display);
		font-size: max(22px, calc(48 * var(--tv)));
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.01em;
		text-wrap: balance;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s4);
		justify-content: center;
	}
</style>
