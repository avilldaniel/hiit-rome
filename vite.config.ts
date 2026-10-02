import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Static SPA with no server (ADR 0001, ADR 0002). Every URL falls back to the
			// client-rendered shell; revisit `fallback` once a host is chosen.
			adapter: adapter({ fallback: 'index.html' }),
			// The service worker answers every address with the one cached shell, so its asset URLs must not be
			// relative to the address it was first loaded from.
			paths: { relative: false }
		})
	],
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
