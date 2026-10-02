import type { Component } from 'svelte';
import type { Workout } from '../engine/workout';
import CircuitForm from './CircuitForm.svelte';
import EmomForm from './EmomForm.svelte';
import HiitForm from './HiitForm.svelte';
import TabataForm from './TabataForm.svelte';

/** Where a finished Wizard goes once its Workout is saved: a Session of it, or the editor. */
export type Next = 'start' | 'edit';
/** Saves a Wizard's Workout as one of the trainer's own, then goes on to `next`. */
export type OnFinish = (workout: Workout, next: Next) => Promise<void>;

export interface Wizard {
	/** Its place in the URL. */
	style: string;
	title: string;
	blurb: string;
	form: Component<{ title: string; onfinish: OnFinish }>;
}

/** Every Wizard, in the order the picker offers them. */
export const WIZARDS: Wizard[] = [
	{ style: 'hiit', title: 'HIIT', blurb: 'Work and Rest, repeated for a number of Rounds.', form: HiitForm },
	{
		style: 'tabata',
		title: 'Tabata',
		blurb: '20 s on, 10 s off, 8 Rounds: one Tabata, or several in a row.',
		form: TabataForm
	},
	{
		style: 'circuit',
		title: 'Circuit',
		blurb: 'A list of exercises, each its own Interval, with Rest between, for a number of Rounds.',
		form: CircuitForm
	},
	{
		style: 'emom',
		title: 'EMOM',
		blurb: 'Every minute on the minute: one exercise per minute, for a number of Rounds.',
		form: EmomForm
	}
];
