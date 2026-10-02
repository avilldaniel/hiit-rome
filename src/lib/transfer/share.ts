/** How a share went: through the device's share sheet, copied to the clipboard, or called off by the trainer. */
export type ShareOutcome = 'shared' | 'copied' | 'cancelled';

/**
 * Shares `url`, a link to the Workout called `title`: with the native share sheet where there is one, otherwise by
 * copying it. Call it straight from the tap, with the link already made: the browser allows both only during the gesture.
 */
export async function shareUrl(title: string, url: string): Promise<ShareOutcome> {
	const data = { title, url };
	if (navigator.canShare?.(data)) {
		try {
			await navigator.share(data);
			return 'shared';
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
			// Refused for another reason: copying may still work.
		}
	}
	await navigator.clipboard.writeText(url);
	return 'copied';
}
