<script lang="ts">
	import { page } from '$app/state';
	import MessagePage from '#lib/ui/MessagePage.svelte';
</script>

<!-- SvelteKit's own error page, such as for an address the app doesn't have, in the app's style. -->
<MessagePage title={String(page.status)}>
	<p>{page.error?.message}</p>
</MessagePage>
