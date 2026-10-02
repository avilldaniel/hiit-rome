<script lang="ts">
	import type { OutlineActions } from './outline-actions.ts';

	/** Grip that drags the outline row `id` (its whole list item) to a new place. */
	let { id, label, actions }: { id: string; label: string; actions: OutlineActions } = $props();

	function start(event: DragEvent & { currentTarget: HTMLElement }) {
		if (!event.dataTransfer) return;
		event.dataTransfer.setData('text/plain', id);
		event.dataTransfer.effectAllowed = 'move';
		const row = event.currentTarget.closest('li');
		if (row) event.dataTransfer.setDragImage(row, 16, 16);
		actions.startDrag(id);
	}
</script>

<span
	class="handle"
	role="img"
	draggable="true"
	aria-label="Drag {label}"
	title="Drag to move"
	ondragstart={start}
	ondragend={() => actions.endDrag()}>⠿</span
>

<style>
	.handle {
		padding: 0 4px;
		font-size: 20px;
		line-height: 1;
		cursor: grab;
		user-select: none;
	}
</style>
