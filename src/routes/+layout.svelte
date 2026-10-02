<script lang="ts">
	import { goto } from '$app/navigation';
	import favicon from '#lib/assets/favicon.svg';
	import { resumeSaved, sessionPath } from '#lib/session/recovery.ts';
	import RecoveryPrompt from '#lib/session/RecoveryPrompt.svelte';
	import { deviceStore } from '#lib/store/device.ts';
	import type { SavedSession } from '#lib/store/workout-store.ts';

	let { children } = $props();

	// On opening the app, an unfinished Session is offered back before anything else; undefined while checking.
	let recovery = $state.raw<SavedSession | null>();
	deviceStore()
		.then((store) => store.savedSession())
		.then((saved) => (recovery = saved ?? null))
		.catch(() => (recovery = null));

	async function resume(saved: SavedSession) {
		resumeSaved(saved);
		// The Session screen opens once the prompt is gone, and carries on from the saved Session.
		await goto(sessionPath(saved));
		recovery = null;
	}
	async function discard() {
		recovery = null;
		await (await deviceStore()).clearSession().catch(() => {});
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if recovery}
	<RecoveryPrompt saved={recovery} onresume={resume} ondiscard={discard} />
{:else if recovery === null}
	{@render children()}
{/if}
