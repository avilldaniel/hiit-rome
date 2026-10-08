import { describe, expect, it } from 'vitest';
import { COLOR_NAME, contrastRatio, PALETTE, PALETTE_TOKENS } from './palette';

describe('contrastRatio', () => {
	it('matches known WCAG values', () => {
		expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1);
		expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
		expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
	});
});

describe('palette', () => {
	it('pairs every color with text readable at large sizes (at least 3:1)', () => {
		for (const token of PALETTE_TOKENS) {
			const { background, text } = PALETTE[token];
			expect(contrastRatio(background, text), token).toBeGreaterThanOrEqual(3);
		}
	});

	it('puts ink text on every Kind color, and white on the ink neutral', () => {
		for (const token of PALETTE_TOKENS.filter((t) => t !== 'neutral')) {
			expect(PALETTE[token].text, token).toBe('#11161d');
		}
		expect(PALETTE.neutral).toEqual({ background: '#11161d', text: '#ffffff' });
		expect(COLOR_NAME.neutral).toBe('Black');
	});
});
