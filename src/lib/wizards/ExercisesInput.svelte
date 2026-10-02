<script lang="ts">
	import { untrack } from 'svelte';

	/** Exercise names, one per line; blank lines are ignored, and at least one is needed. */
	let { exercises, onchange }: { exercises: string[]; onchange: (exercises: string[]) => void } = $props();

	// Left as typed: tidying it into `exercises` on every keystroke would swallow a new line as it's started.
	const initial = untrack(() => exercises.join('\n'));
	const lines = (text: string) =>
		text
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);

	let field: HTMLTextAreaElement;
	// Marked for the browser's own validation, so the Wizard can't finish without an exercise.
	$effect(() => field.setCustomValidity(exercises.length ? '' : 'Add at least one exercise, one per line.'));
</script>

<textarea
	bind:this={field}
	aria-label="Exercises"
	rows="8"
	placeholder={'Squats\nPush-ups\nLunges'}
	value={initial}
	oninput={(event) => onchange(lines(event.currentTarget.value))}
></textarea>

<style>
	textarea {
		width: 100%;
		max-width: 24em;
		resize: vertical;
	}
</style>
