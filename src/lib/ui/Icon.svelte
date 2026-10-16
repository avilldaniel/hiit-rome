<script module lang="ts">
	// The stroke icons, drawn on a 24×24 grid with Pop's heavy ink line.
	const PATHS = {
		play: '<path d="M7 4.5v15l12-7.5z"/>',
		star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8L3.5 9.7l5.9-.8z"/>',
		copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
		edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
		trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
		share: '<path d="M12 15V3M7.5 7.5L12 3l4.5 4.5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
		search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
		grip: '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
		chevron: '<path d="M9 6l6 6-6 6"/>',
		down: '<path d="M6 9l6 6 6-6"/>',
		left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
		plus: '<path d="M12 5v14M5 12h14"/>',
		'plus-box': '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
		speaker: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>',
		'down-tray': '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19h14"/>',
		'up-tray': '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5"/><path d="M5 19h14"/>',
		pause: '<path d="M8 5v14M16 5v14"/>',
		previous: '<path d="M18 6l-9 6 9 6z"/><path d="M6 6v12"/>',
		next: '<path d="M6 6l9 6-9 6z"/><path d="M18 6v12"/>',
		minus: '<path d="M5 12h14"/>',
		list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
		restart: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/>',
		stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
		close: '<path d="M6 6l12 12M18 6L6 18"/>',
		right: '<path d="M5 12h14M13 6l6 6-6 6"/>',
		check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
		layout: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M13 4v16M13 12h7"/>',
		wand: '<path d="M5 19L15.5 8.5"/><path d="M14 4.5v2M19.5 10h-2M17.8 6.2l-1.4 1.4M10 5l.6 1.6M19 14l-1.6-.6"/>',
		book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19M9 7h6"/>',
		timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5"/>',
		sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
		grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
		alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
		reload: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/>',
		spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>'
	};

	export type IconName = keyof typeof PATHS;
</script>

<script lang="ts">
	let { name, size = 20 }: { name: IconName; size?: number } = $props();
</script>

<!-- Decorative: the control it sits in carries the name. -->
<svg class="icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{@html PATHS[name]}</svg>

<style>
	.icon {
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
