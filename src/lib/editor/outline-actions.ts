import type { ItemChange } from '../engine/outline';

/** Where a dragged item would land: inside `parentId` (or the root), before `beforeId` (or at the end). */
export interface DropTarget {
	parentId: string | null;
	beforeId: string | null;
}

/** What the outline's rows can ask the editor to do. The editor owns the Workout; rows only render and ask. */
export interface OutlineActions {
	update(id: string, change: ItemChange): void;
	remove(id: string): void;
	duplicate(id: string): void;
	addInterval(parentId: string | null): void;
	addGroup(parentId: string | null): void;
	canHoldGroup(parentId: string | null): boolean;
	isEmpty(groupId: string): boolean;
	isCollapsed(groupId: string): boolean;
	toggleCollapsed(groupId: string): void;
	isSelected(intervalId: string): boolean;
	toggleSelected(intervalId: string): void;
	startDrag(id: string): void;
	endDrag(): void;
	/** Marks `target` as the one being hovered; whether the dragged item may drop there. */
	dragOver(target: DropTarget): boolean;
	dragLeave(target: DropTarget): void;
	drop(target: DropTarget): void;
	/** How `target` should look while something is dragged over it. */
	dropState(target: DropTarget): 'allowed' | 'refused' | null;
}
