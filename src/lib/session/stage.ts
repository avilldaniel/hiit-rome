import { formatClock } from '#lib/engine/format.ts';
import { PALETTE, type ColorPair } from '#lib/engine/palette.ts';
import type { SessionView } from '#lib/engine/session.ts';
import type { TimelineEntry } from '#lib/engine/timeline.ts';

/**
 * What every Session layout draws, worked out once from the engine's view: the Session screen hands it to whichever
 * layout the trainer chose. Layouts only arrange it; none of them keeps time.
 */
export interface SessionStage {
	status: SessionView['status'];
	/** The current Interval's place in the Workout, or -1 before the first: a layout replays its entrance when it changes. */
	index: number;
	/** The heading: the Interval's name, or "Ready" or "Get ready". */
	title: string;
	/** A name past ~40 characters, which takes a step down in size. */
	longTitle: boolean;
	/** The Kind pill: the Kind, "Paused · Kind", "Get ready" or the start hint; null when the name already says it. */
	pill: string | null;
	/** The pill is the hint for starting, drawn smaller. */
	hint: boolean;
	clock: string;
	/** Changes once per final second, so the time thumps on each. */
	pulseKey: string;
	colors: ColorPair;
	/** The current Interval's own color, even while paused shows the ink; null before the first Interval. */
	ownColor: string | null;
	/** The panel is in the neutral ink: ready, in a Lead-in, or paused (or an Interval colored black). */
	ink: boolean;
	/** How far through the current Interval or Lead-in, 0 to 1. */
	progress: number;
	upcoming: TimelineEntry[];
	/** The current Interval is the last: "Finish" is next. */
	isFinal: boolean;
	/** The next Interval's colors, or null when Finish is next. */
	next: ColorPair | null;
	/** Where the Session is in its Groups ("Tabata 2 of 2", "Round 3 of 8"), or the Workout's name outside any. */
	lines: string[];
	/** The time left in the whole Workout, as m:ss. */
	timeLeft: string;
	/** Ready or paused: the controls stay on screen. */
	pinned: boolean;
}

const LONG_TITLE = 40;
const STATUS_TITLE: Partial<Record<SessionView['status'], string>> = { idle: 'Ready', 'lead-in': 'Get ready', paused: 'Get ready' };
const STATUS_LINE: Partial<Record<SessionView['status'], string>> = {
	idle: 'Press Space or tap to start',
	'resume-lead-in': 'Get ready'
};

export function sessionStage(view: SessionView, workoutName: string): SessionStage {
	const title = view.current?.name ?? STATUS_TITLE[view.status] ?? '';
	const pill =
		view.status === 'paused'
			? ['Paused', view.kindLabel].filter(Boolean).join(' · ')
			: (STATUS_LINE[view.status] ?? view.kindLabel);
	return {
		status: view.status,
		index: view.current?.index ?? -1,
		title,
		longTitle: title.length > LONG_TITLE,
		pill: pill || null,
		hint: view.status === 'idle',
		clock: formatClock(view.remainingMs),
		pulseKey: view.finalSecond
			? `${view.status}-${view.current?.index}-${view.finalSecond}`
			: 'steady',
		colors: view.colors,
		ownColor: view.current?.colors.background ?? null,
		ink: view.colors.background === PALETTE.neutral.background,
		progress: view.progress,
		upcoming: view.upcoming,
		isFinal: view.isFinal,
		next: view.isFinal ? null : (view.upcoming[0]?.colors ?? null),
		lines: view.header.length ? view.header : [workoutName],
		timeLeft: formatClock(view.totalRemainingMs),
		pinned: view.status === 'idle' || view.status === 'paused'
	};
}
