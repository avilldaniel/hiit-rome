# Directions

hiit-rome is a timer a trainer runs on a TV or laptop that the class watches from across the room. Every direction keeps the Kind color (Work, Rest, Warm-up, Cool-down) as the thing the class reads first. They differ in everything around it. Layout freedom is `restructure`, there's no dark toggle (the app ships one theme), and every direction starts from scratch with nothing kept.

## 1. Scoreboard (scoreboard)

**Thesis:** The app is stadium equipment. It runs dark, the numbers are huge and condensed, and everything else stays out of the way.

- **Palette strategy:** dark-first. Near-black ground (`#0b0d10`), lit with high-chroma Kind colors and one scoreboard-yellow primary (`#ffd400`). The app ships this one theme, so `color.light` holds the default dark palette and `color.dark` is a deeper OLED-black variant.
- **Type pairing:** Barlow Condensed 700/800 for times, titles and labels (uppercase, tracked, tabular figures), Barlow for body text, and JetBrains Mono for small meta (interval counts, axis ticks, keyboard hints).
- **Layout idiom:** the sidebar becomes a slim **top bar**: wordmark, then the nav as uppercase segment tabs, then New Workout on the right. My Workouts becomes a dense **standings table**: one row per Workout with its Timeline strip, name, Intervals, a big right-aligned time, and inline row actions. The Session panel fills the whole screen edge to edge, and Up next moves from the side rail to a **ticker strip** along the bottom. The editor reads like a spreadsheet: column headers (Name · Kind · Duration · Color), with the Timeline pinned under the header bar.
- **Signature moves:**
  1. Times are set like LED scoreboard digits: Barlow Condensed 800, tabular, with a soft glow in the current Kind color on the Session and Countdown screens.
  2. Thin 1px grid rules and a 2–6px radius. Nothing is soft, and depth comes from borders, not shadows.
  3. The Kind label shows as a tall colored "lane" tab on the left edge of every row and tile, like a lane marker.
- **nativeFeel:** n/a (web)

## 2. Index (index)

**Thesis:** A Swiss typographic system. A strict grid, black on white, one signal orange, and type does the work that cards and shadows do today.

- **Palette strategy:** monochrome plus one accent. Everything is black, white and grey, with signal orange `#ff4d00` as the only hue. Kinds are told apart by **value and pattern**: Work is orange, Rest solid black, Warm-up light grey, and Cool-down mid grey with diagonal hatching. The trainer's color picks (`pick-*`) are the only other hues, and they appear only where the trainer chose them.
- **Type pairing:** Archivo 800/900 for display (tight, huge, flush left), IBM Plex Sans for body text, and IBM Plex Mono for numerals in lists, counts and the time axis.
- **Layout idiom:** a persistent **numbered index column** on the left of every non-Session screen (`01 My Workouts`, `02 Wizard`, `03 Library`, `04 Countdown`, `05 Settings`, with New Workout above it), so the nav is no longer home-only. Content sits on a visible 12-column grid. My Workouts becomes an **editorial list**: full-width rows divided by hairlines, the name large on the left, a hairline Timeline under it, and the time in a right column. The editor splits into two panes: the outline on the left (8 columns), and a sticky right pane (4 columns) holding the Timeline, which turns vertical, plus Workout settings. The Session is white with black numerals and a full-height Kind bar along the left edge. Only Work floods the whole panel orange.
- **Signature moves:**
  1. Zero radius and zero shadow everywhere. Structure comes from 1px rules and the grid.
  2. Section numbers and labels in mono caps (`02 — CUES`), with headings in Archivo at extreme size contrast (96px titles over 14px meta).
  3. Hatched Cool-down and the black/grey/orange Kind scheme make every Timeline strip read like a printed chart.
- **nativeFeel:** n/a (web)

## 3. Clay (clay)

**Thesis:** A calm studio, not a gym. Warm paper, earthy Kind colors and a soft serif, so the app feels like a well-run yoga or pilates room.

- **Palette strategy:** warm neutrals. A paper ground (`#f4eee4`) with cream surfaces, terracotta as the primary, and olive as the accent. The Kind colors are softened earth tones: terracotta Work, slate-blue Rest, ochre Warm-up and sage Cool-down.
- **Type pairing:** Fraunces (soft, high optical size, 600) for titles and **for the giant timer**, and DM Sans for body text and controls.
- **Layout idiom:** the sidebar becomes a **centered top nav of pill tabs**, with New Workout as a terracotta pill on the right. My Workouts gets a **"pick up where you left off" hero**: the most recently used Workout large, with Start, and the rest in a roomy two-column grid of soft cards below it. The editor's outline becomes a **vertical spine**: Intervals hang off a continuous line with Kind-colored nodes, and Groups are rounded bays along it. Workout settings slide in as a right-hand drawer. The Session panel is a huge rounded "window" of the Kind color, with Up next as a soft card overlapping its bottom-right corner. Settings becomes one reading column with a sticky section index on the left.
- **Signature moves:**
  1. The countdown is set in Fraunces at display size, and the serif digits are the identity of the brand.
  2. Big radii (16–28px), warm, low and diffuse shadows, and generous whitespace. Motion is slow (320ms) and eased.
  3. Organic Timeline strips: segments are pill-shaped with gaps, like beads on a string.
- **nativeFeel:** n/a (web)

## 4. Pop (pop)

**Thesis:** Loud, playful neo-brutalism. Thick ink outlines, hard offset shadows, and a different saturated color for every destination. A workout should feel like a game.

- **Palette strategy:** saturated multi-hue. A cream ground, a 2–3px ink outline on everything, electric blue-violet (`#3b2bff`) as the primary and hot pink as the accent. Each nav destination owns a hue (`hue-yellow` Wizard, `hue-teal` Library, `hue-orange` Countdown, `hue-purple` Settings, `hue-lime` My Workouts), and that hue colors the destination's header band.
- **Type pairing:** Unbounded 800/900 for display (wide, rounded and chunky; uppercase titles, giant numerals), Manrope 500–800 for body text, and Space Mono for counts and tags.
- **Layout idiom:** the sidebar becomes a row of **big launch tiles** across the top of My Workouts. Each destination (New Workout, Wizard, Library, Countdown, Settings) is a colored, outlined, offset-shadow block with an icon. Workout cards become **sticker cards**: a thick outline, a hard shadow, the Timeline as a chunky bar, and a big Start button. Every other screen opens with a full-width header band in its destination's hue. The editor shows Groups as **colored trays** with outlined Interval "chips". In the Session, the controls sit on a permanent chunky deck under the panel, and Up next is a stack of offset cards.
- **Signature moves:**
  1. Every interactive element has a 2–3px ink outline and a hard `4px 4px 0` shadow that collapses to `0 0` when pressed.
  2. Color-coded destinations: the hue you click on a launch tile is the hue the destination screen opens in.
  3. Rubber-band motion (an overshoot ease) and slightly rotated stickers for badges such as Favorite, the count and "Link copied".
- **Session, built for a TV across the room** (refine 1): the Session is mirrored to a TV, so it's read from 3–6m away. Every Session size is set in TV pixels (`--tv` = 1px of a 1920×1080 design) and scales with the screen. Up next becomes a wide column, about 38% of the width, and no upcoming name is ever cut off: names wrap instead. Upcoming items stand apart from the current Interval through their surface (cream sticker cards against the Kind-colored panel), a "NEXT" sticker, a Kind-colored edge and a smaller size. They are never dimmed or set small enough to be hard to read. The chunky control deck appears on demand, as in the source, so the time and names get the room.
- **nativeFeel:** n/a (web)

## 5. Pop · Billboard (pop-billboard)

**Thesis:** Pop, with the Session read like a highway billboard: stacked full-width bands, one fact per band, so every name gets the whole width of the screen.

- **Same system as 4. Pop:** identical tokens, fonts, outlines, offset shadows, stickers and motion. Every screen except Session is identical to Pop.
- **Session layout idiom (refine 2):** no side column. The screen is three full-width horizontal bands:
  1. NOW (Kind color, about 58% of the height): a tilted Kind pill and the current name on the left, with the giant time running to the right edge.
  2. NEXT (cream, about 24%): a "NEXT" sticker, then the next name in one long line across the full width (wrapping only if it must), with its duration at the right in a Kind-colored box.
  3. LATER (ink, about 18%): the following Intervals as a row of outlined chips, plus Group/Round and "<time> left" as stickers on the right.
- **Signature moves:** the full-width NEXT band makes long names read as one line; the thick progress bar is the seam between NOW and NEXT; the bands are offset by a hard shadow, like stacked posters.

## 6. Pop · Diptych (pop-diptych)

**Thesis:** Pop, with the Session as two posters side by side, NOW and NEXT. The room sees the next color coming before it arrives.

- **Same system as 4. Pop:** identical tokens, fonts and details. Every screen except Session is identical to Pop.
- **Session layout idiom (refine 2):** a vertical split.
  - NOW (left, about 60%): solid in the current Kind color, with the pill, the name and the giant time.
  - NEXT (right, about 40%): a poster with diagonal stripes in the *next* Interval's Kind color and cream, so it can't be mistaken for "now". It carries a huge tilted "NEXT" sticker, the next name in a cream sticker card, set large and wrapping, and its duration. Below it, the two Intervals after that are smaller outlined sticker rows.
  - Group/Round and "<time> left" are a sticker strip across the top edge of the screen.
- **Signature moves:** a solid panel for now and a striped one for next, so the difference is visible from the back of the room; the next color previewed at poster scale; a chunky ink gutter between the two posters, with the progress bar running down it.

## 7. Pop · Dial (pop-dial)

**Thesis:** Pop, with the Session as a giant game dial: the Interval drains around a ring the whole room can read at a glance, even without reading the digits.

- **Same system as 4. Pop:** identical tokens, fonts and details. Every screen except Session is identical to Pop.
- **Session layout idiom (refine 2):** a huge circular dial, nearly the full height, on the left half: a thick ink ring whose Kind-colored fill drains clockwise as a conic wedge, with the remaining time centered inside it. The current name sits on a big tilted sticker banner across the top of the dial, and the Kind pill is pinned to the ring like a badge. The right side holds Up next as large sticker cards in a wide column (names wrap, never cut). Group/Round and "<time> left" are round "coin" stickers in the corners.
- **Signature moves:** the ring is the progress bar; a burst of sticker rays appears during the final seconds; small coin stickers on the ring show where upcoming Intervals begin.
