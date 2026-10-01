import { describe, expect, it } from 'vitest';
import { formatClock } from './format';

describe('formatClock', () => {
	it('shows whole seconds rounded up, as m:ss', () => {
		expect(formatClock(20_000)).toBe('0:20');
		expect(formatClock(19_001)).toBe('0:20');
		expect(formatClock(1)).toBe('0:01');
		expect(formatClock(0)).toBe('0:00');
		expect(formatClock(1_700_000)).toBe('28:20');
	});
});
