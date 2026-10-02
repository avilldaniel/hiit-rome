<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import { watchForUpdate } from '#lib/platform/app-update.ts';
	import UpdateBanner from '#lib/platform/UpdateBanner.svelte';
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

	// A new version of the app, installed and waiting: switches to it and reloads. Null when there is none, or the
	// trainer chose to carry on with this one.
	let applyUpdate = $state.raw<(() => void) | null>(null);
	$effect(() => watchForUpdate((reload) => (applyUpdate = reload)));
	// Never offered mid-Session: a reload would interrupt the class. A Countdown plays as a Session too.
	const running = $derived(page.route.id?.startsWith('/session/') || page.route.id === '/countdown');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if recovery}
	<RecoveryPrompt saved={recovery} onresume={resume} ondiscard={discard} />
{:else if recovery === null}
	{@render children()}
	{#if applyUpdate && !running}
		<UpdateBanner onreload={applyUpdate} onlater={() => (applyUpdate = null)} />
	{/if}
{/if}
