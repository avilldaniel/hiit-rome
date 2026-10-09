<script module lang="ts">
	/** The exercises the field suggests, as its placeholder, before the trainer types their own. */
	export const PLACEHOLDER_EXERCISES = ['Squats', 'Push-ups', 'Lunges'];
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import Field from '#lib/ui/Field.svelte';

	/** The exercises field of a Wizard's form: names one per line, blank lines ignored, and at least one needed. */
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

<Field label="Exercises" class="wide">
	<textarea
		bind:this={field}
		rows="8"
		placeholder={PLACEHOLDER_EXERCISES.join('\n')}
		value={initial}
		oninput={(event) => onchange(lines(event.currentTarget.value))}
	></textarea>
</Field>
