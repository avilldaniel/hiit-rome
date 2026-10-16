<script lang="ts">
	import type { Settings } from '#lib/engine/settings.ts';
	import { deviceStore } from '#lib/store/device.ts';
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { boing } from '#lib/ui/motion.ts';
	import NumberedCard from '#lib/ui/NumberedCard.svelte';
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

<NumberedCard number="06" title="Backup" hue="var(--hue-lime)" id="backup-heading">
	<p class="hint">
		Your Workouts live only on this device. Export a backup now and then, and import it here or on another device.
	</p>
	{#if lastBackupAt !== undefined}
		<p class="last">Last backed up: <b>{lastBackupAt === null ? 'never' : formatDate(lastBackupAt)}</b></p>
	{/if}
	<div class="row">
		<Button icon="down-tray" onclick={exportFile}>Export backup</Button>
		<!-- A label, not a Button, so the file input it holds takes its name and opens from it. -->
		<label class="import">
			<Icon name="up-tray" />
			Import backup
			<input type="file" accept="application/json,.json" onchange={chooseFile} />
		</label>
	</div>
	{#if outcome}
		{#key outcome}
			<Alert tone={outcome.failed ? 'danger' : 'ok'}>{outcome.text}</Alert>
		{/key}
	{/if}
</NumberedCard>

{#if pending}
	<dialog bind:this={dialog} aria-labelledby="import-heading" onclose={() => (pending = undefined)}>
		<div class="card" {@attach boing(0, 0.7)}>
			<h2 id="import-heading">Import backup</h2>
			<p>
				This backup from {formatDate(pending.exportedAt)} has {workouts(pending.workouts.length)}. They’re added
				alongside yours, skipping any you already have; none of yours change.
			</p>
			<label class="replace">
				<input class="checkbox" type="checkbox" bind:checked={replaceSettings} />
				Also replace my Settings and Presets with the backup’s
			</label>
			<div class="actions">
				<Button onclick={() => dialog?.close()}>Cancel</Button>
				<Button variant="primary" icon="up-tray" onclick={confirmImport}>Import</Button>
			</div>
		</div>
	</dialog>
{/if}

<style>
	p {
		margin: 0;
	}

	.hint {
		max-width: 68ch;
		color: var(--muted);
		font-weight: 600;
	}

	.last {
		font-weight: 600;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s3);
	}

	/* Drawn as a default Button: outlined in ink, on a hard shadow it squashes into when pressed. */
	.import {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--s2);
		box-sizing: border-box;
		min-height: 48px;
		padding: 0 var(--s4);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r);
		background: var(--surface);
		color: var(--text);
		font: 700 var(--fs-body) / 1 var(--font-body);
		white-space: nowrap;
		box-shadow: var(--shadow);
		cursor: pointer;
		transition:
			translate var(--dur) var(--ease-out),
			box-shadow var(--dur) var(--ease-out);
	}

	@media (hover: hover) {
		.import:hover {
			translate: -2px -2px;
			box-shadow: 6px 6px 0 var(--line);
		}
	}

	.import:active {
		translate: 4px 4px;
		box-shadow: 0 0 0 var(--line);
	}

	.import:focus-within {
		outline: 3px solid var(--focus);
		outline-offset: 3px;
	}

	/* Hidden, but still reachable from the keyboard through its label. */
	input[type='file'] {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	/* A white sticker over the page, as the other dialogs. */
	dialog {
		box-sizing: border-box;
		width: min(560px, calc(100vw - 2 * var(--s4)));
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
		padding: var(--s6);
		border: var(--stroke) solid var(--line);
		border-radius: var(--r-lg);
		background: var(--surface);
		box-shadow: var(--shadow-raised);
	}

	dialog h2 {
		margin: 0 0 var(--s4);
		font-size: var(--fs-h2);
		font-weight: 900;
		line-height: 1.15;
		text-transform: uppercase;
	}

	.replace {
		display: flex;
		align-items: center;
		gap: var(--s3);
		margin-top: var(--s5);
		font-weight: 700;
		cursor: pointer;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s3);
		justify-content: flex-end;
		margin-top: var(--s6);
	}

	@media (max-width: 767px) {
		.card {
			padding: var(--s5);
		}
	}
</style>
