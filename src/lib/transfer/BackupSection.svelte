<script lang="ts">
	import { PALETTE } from '#lib/engine/palette.ts';
	import type { Settings } from '#lib/engine/settings.ts';
	import { deviceStore } from '#lib/store/device.ts';
	import { exportBackup, importBackup, readBackupFile, type Backup } from './backup.ts';

	/** Called once an import has replaced this device's Settings and Presets with the backup's. */
	let { onreplaced }: { onreplaced: (settings: Settings, presets: number[]) => void } = $props();

	let lastBackupAt = $state<number | null>();
	$effect(() => {
		deviceStore()
			.then((store) => store.lastBackupAt())
			.then((at) => (lastBackupAt = at))
			.catch(() => (lastBackupAt = null));
	});

	/** What the last export or import came to, for the trainer. */
	let outcome = $state<{ text: string; failed: boolean }>();

	async function exportFile() {
		try {
			const { filename, text, exportedAt } = await exportBackup(await deviceStore());
			const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
			const link = Object.assign(document.createElement('a'), { href: url, download: filename });
			link.click();
			// Give the browser a moment to start the download before letting go of the file.
			setTimeout(() => URL.revokeObjectURL(url), 10_000);
			lastBackupAt = exportedAt;
			outcome = { text: `Saved ${filename}.`, failed: false };
		} catch {
			outcome = { text: 'The backup couldn’t be made. Try reloading the page.', failed: true };
		}
	}

	/** A backup read from a file, waiting for the trainer to confirm the import. */
	let pending = $state.raw<Backup>();
	let replaceSettings = $state(false);
	let dialog = $state<HTMLDialogElement>();
	$effect(() => {
		if (pending) dialog?.showModal();
	});

	async function chooseFile(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		const file = input.files?.[0];
		// Cleared, so choosing the same file again still counts as a change.
		input.value = '';
		if (!file) return;
		const result = await readBackupFile(file);
		if ('error' in result) {
			outcome = { text: result.error, failed: true };
			return;
		}
		outcome = undefined;
		replaceSettings = false;
		pending = result.backup;
	}

	async function confirmImport() {
		const backup = pending!;
		const replaceSettingsAndPresets = replaceSettings;
		dialog?.close();
		try {
			const store = await deviceStore();
			const { added, skipped } = await importBackup(store, backup, { replaceSettingsAndPresets });
			if (replaceSettingsAndPresets) onreplaced(backup.settings, backup.presets);
			outcome = { text: importedText(added, skipped, replaceSettingsAndPresets), failed: false };
		} catch {
			outcome = { text: 'The backup couldn’t be imported, so nothing changed. Try reloading the page.', failed: true };
		}
	}

	const workouts = (n: number) => `${n} Workout${n === 1 ? '' : 's'}`;

	function importedText(added: number, skipped: number, replaced: boolean) {
		const parts = [`Added ${workouts(added)}`];
		if (skipped) parts.push(`${workouts(skipped)} already here ${skipped === 1 ? 'was' : 'were'} skipped`);
		if (replaced) parts.push('Settings and Presets replaced');
		return `${parts.join('; ')}.`;
	}

	const formatDate = (at: number | string) =>
		new Date(at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
</script>

<section aria-labelledby="backup-heading">
	<h2 id="backup-heading">Backup</h2>
	<p class="hint">
		Your Workouts live only on this device. Export a backup now and then, and import it here or on another device.
	</p>
	{#if lastBackupAt !== undefined}
		<p>Last backed up: {lastBackupAt === null ? 'never' : formatDate(lastBackupAt)}</p>
	{/if}
	<div class="row">
		<button type="button" onclick={exportFile}>Export backup</button>
		<label class="button">
			Import backup
			<input type="file" accept="application/json,.json" onchange={chooseFile} />
		</label>
	</div>
	{#if outcome}
		<p class:message={outcome.failed} role={outcome.failed ? 'alert' : 'status'}>{outcome.text}</p>
	{/if}
</section>

{#if pending}
	<dialog
		bind:this={dialog}
		aria-labelledby="import-heading"
		style:--neutral-bg={PALETTE.neutral.background}
		style:--neutral-text={PALETTE.neutral.text}
		onclose={() => (pending = undefined)}
	>
		<h2 id="import-heading">Import backup</h2>
		<p>
			This backup from {formatDate(pending.exportedAt)} has {workouts(pending.workouts.length)}. They’re added
			alongside yours, skipping any you already have; none of yours change.
		</p>
		<label>
			<input type="checkbox" bind:checked={replaceSettings} />
			Also replace my Settings and Presets with the backup’s
		</label>
		<div class="actions">
			<button type="button" onclick={() => dialog?.close()}>Cancel</button>
			<button type="button" class="confirm" onclick={confirmImport}>Import</button>
		</div>
	</dialog>
{/if}

<style>
	section {
		margin-bottom: 32px;
	}

	h2 {
		margin: 0 0 12px;
		font-size: 22px;
	}

	.hint {
		margin: 0 0 12px;
		opacity: 0.8;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
		min-height: 44px;
	}

	label {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	button,
	.button {
		padding: 8px 12px;
		border: 1px solid rgb(255 255 255 / 0.3);
		border-radius: 8px;
		background: rgb(255 255 255 / 0.08);
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.button:focus-within {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}

	/* Hidden, but still reachable from the keyboard through its label. */
	input[type='file'] {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	input[type='checkbox'] {
		width: 20px;
		height: 20px;
	}

	.message {
		padding: 12px 16px;
		border-radius: 8px;
		background: #ffd166;
		color: #073b4c;
		font-weight: 600;
	}

	dialog {
		max-width: 560px;
		padding: 24px 32px;
		border: none;
		border-radius: 12px;
		background: var(--neutral-bg);
		color: var(--neutral-text);
	}

	dialog::backdrop {
		background: color-mix(in srgb, var(--neutral-bg) 70%, transparent);
	}

	.actions {
		display: flex;
		gap: 16px;
		justify-content: flex-end;
		margin-top: 24px;
	}

	.confirm {
		background: var(--neutral-text);
		color: var(--neutral-bg);
	}
</style>
