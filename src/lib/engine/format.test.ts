import { describe, expect, it } from 'vitest';
import { formatClock, formatDuration, parseDuration } from './format';

describe('formatClock', () => {
	it('shows whole seconds rounded up, as m:ss', () => {
		expect(formatClock(20_000)).toBe('0:20');
		expect(formatClock(19_001)).toBe('0:20');
		expect(formatClock(1)).toBe('0:01');
		expect(formatClock(0)).toBe('0:00');
		expect(formatClock(1_700_000)).toBe('28:20');
	});
});

describe('formatDuration', () => {
	it('shows a measured time to the nearest second, as m:ss', () => {
		expect(formatDuration(20_000.000_001)).toBe('0:20');
		expect(formatDuration(19_999.9)).toBe('0:20');
		expect(formatDuration(400)).toBe('0:00');
		expect(formatDuration(4_530_000)).toBe('75:30');
	});
});

describe('parseDuration', () => {
	it('reads plain seconds or m:ss as whole seconds', () => {
		expect(parseDuration('90')).toBe(90);
		expect(parseDuration('1:30')).toBe(90);
		expect(parseDuration(' 0:05 ')).toBe(5);
		expect(parseDuration('99:59')).toBe(5999);
	});

	it('rejects anything that is not a time', () => {
		for (const text of ['', 'abc', '1:3', '1:60', '1.5', '-5', '1:30:00', ':30']) {
			expect(parseDuration(text), text).toBeNull();
		}
	});
});
