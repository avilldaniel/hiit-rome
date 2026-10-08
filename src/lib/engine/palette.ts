/**
 * The app's color palette: one token per Kind plus a neutral, each paired with a text color
 * that stays readable on it from across a room. The user may change these colors — when they
 * do, the contrast test re-checks every pair.
 *
 * Tokens are named by role rather than hue, so an Interval's color override ("use the Rest
 * color") survives a palette change.
 */
export const PALETTE_TOKENS = ['work', 'rest', 'warmup', 'cooldown', 'neutral'] as const;
export type PaletteToken = (typeof PALETTE_TOKENS)[number];

export interface ColorPair {
	background: string;
	text: string;
}

/** Each token's color, by name, as the trainer picks it. */
export const COLOR_NAME: Record<PaletteToken, string> = {
	work: 'Red',
	rest: 'Blue',
	warmup: 'Yellow',
	cooldown: 'Green',
	neutral: 'Black'
};

const INK = '#11161d';
const WHITE = '#ffffff';

export const PALETTE: Record<PaletteToken, ColorPair> = {
	work: { background: '#f0476a', text: INK },
	rest: { background: '#3b9fd6', text: INK },
	warmup: { background: '#f7b928', text: INK },
	cooldown: { background: '#1fc79a', text: INK },
	neutral: { background: INK, text: WHITE }
};

function relativeLuminance(hex: string): number {
	const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
	const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio between two `#rrggbb` colors, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
	const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}
