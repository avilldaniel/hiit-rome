<script lang="ts">
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
		<button type="button" onclick={() => answer(false)}>{cancelLabel}</button>
		<!-- Focused, so Esc then Enter confirms from across the room. -->
		<!-- svelte-ignore a11y_autofocus -->
		<button type="button" class="confirm" autofocus onclick={() => answer(true)}>{confirmLabel}</button>
	</div>
</dialog>

<style>
	dialog {
		padding: 4vh 3vw;
		border: none;
		border-radius: 1.5vh;
		background: var(--neutral-bg);
		color: var(--neutral-text);
		font-size: clamp(18px, 4vh, 44px);
		font-weight: 700;
		text-align: center;
	}

	dialog::backdrop {
		background: color-mix(in srgb, var(--neutral-bg) 70%, transparent);
	}

	p {
		margin: 0 0 4vh;
	}

	.actions {
		display: flex;
		gap: 2vw;
		justify-content: center;
	}

	button {
		padding: 1.5vh 2.5vw;
		border: 2px solid currentColor;
		border-radius: 1vh;
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.confirm {
		background: var(--neutral-text);
		color: var(--neutral-bg);
	}
</style>
