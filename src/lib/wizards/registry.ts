import type { Component } from 'svelte';
import type { Workout } from '../engine/workout';
import CircuitForm from './CircuitForm.svelte';
import EmomForm from './EmomForm.svelte';
import HiitForm from './HiitForm.svelte';
import TabataForm from './TabataForm.svelte';

/** How a Wizard is finished: "Start now" (a Session of its Workout) or "Save & edit" (the editor). */
export type Finish = 'start' | 'edit';
/** Saves a Wizard's Workout as one of the trainer's own, then starts or edits it. */
export type OnFinish = (workout: Workout, how: Finish) => Promise<void>;

/** What every Wizard's form is given. */
export interface WizardProps {
	title: string;
	onfinish: OnFinish;
}

export interface Wizard {
	/** Its place in the URL. */
	style: string;
	title: string;
	blurb: string;
	form: Component<WizardProps>;
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
