import type { ItemChange } from '../engine/outline';

/** What the outline's rows can ask the editor to do. The editor owns the Workout; rows only render and ask. */
export interface OutlineActions {
	update(id: string, change: ItemChange): void;
	remove(id: string): void;
	addInterval(parentId: string | null): void;
	addGroup(parentId: string | null): void;
	canHoldGroup(parentId: string | null): boolean;
	isEmpty(groupId: string): boolean;
	isCollapsed(groupId: string): boolean;
	toggleCollapsed(groupId: string): void;
}
