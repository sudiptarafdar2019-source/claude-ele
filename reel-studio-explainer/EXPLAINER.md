# Explainer template (polished hand explainer)

Clean flat-vector scenes on a bright Orbirise stage. A real hand points, taps and writes, and Sudip's own
photo appears for 1-2 reaction moments. **Any word written on screen pops in at the exact moment it is spoken.**
The only other text is the animated captions.

Example reel: `reels/websiteleave.json` -> sample `video-templates/samples/explainer-website-visitors-leave.mp4`.

## Make a new explainer reel
1. Put the ElevenLabs voice in `public/voice/<id>.mp3` (voice "Sudip T").
2. Copy `reels/websiteleave.json` to `reels/<id>.json`. Set `"template": "explainer"`, paste the exact voice
   script (with the [tags]) into `script`, and list the beats (below).
3. `WHISPER_MODEL=medium.en python scripts/transcribe.py reels/<id>.json` (word timings; medium is more exact).
4. `node scripts/stills.mjs <id> 60,300,600` to check frames, then `node scripts/render.mjs <id>`
   -> `out/<id>.mp4` + `out/<id>-cover.png`.

## Beats
Each beat: `{"at": "first words of the line", "show": "<scene>", "params": {...}}`.
A scene runs from its `at` words until the next beat. Aim for one beat per sentence (2-4 seconds).

`params.cues` renames the trigger words a scene listens for, e.g. the `visitors-leave` scene animates on the
words "people", "visit", "website", "just", "leave"; for a different line use
`"cues": {"website": "shop", "leave": "go"}`. A trigger word that is not said falls back to the scene start.

| Scene (`show`) | What it shows | Main params / trigger words |
|---|---|---|
| `visitors-leave` | 3 people walk to a phone website, get bored, walk out a door; hand points at the site | people, visit, website, just, leave |
| `chart-drop` | visitor chart climbs then drops, eye icon, hand points at the drop | happening |
| `timer` | a visitor walks in, phone pops, 3-second stopwatch | new, website, three, seconds |
| `timer-questions` | stopwatch counts down, visitor gets three "?" bubbles | asking, three (2nd), questions |
| `search-fail` | visitor searches the phone with a magnifier, red X, dashes away in a puff | find, answers, GONE |
| `question` | big number badge + visitor + speech bubble with the spoken question | `n` (1/2/3), `quote` (exact words said), `color` blue/gold/sky/green/coral, `pose` curious/self/lost (lost adds a signpost), `at` = word that says the number |
| `write-headline` | stop sign, hand writes the headline on the phone word by word, then crosses it out | `quote` (headline as said), don't, write |
| `rewrite-headline` | old headline slides away, new headline appears word by word with highlights and up to 3 icons | `old`, `quote`, `icons: [{"at": "word", "icon": "food/texas/books/calendar/door/wrench/check/x"}]`, `highlight` |
| `audience-top` | audience chip at the top of the site, chef waves, hand points at the top | who, help, right, top |
| `one-button` | cluttered buttons fall away, one clear button grows and shines | ONE, clear, button |
| `button-label` | button label appears word by word, hand taps, calendar check | `quote` (label as said) |
| `face` | Sudip photo moment on a brand disc with sparkles | `face` (name from TUTORIAL faces list), `side` left/right |
| `phone-check` | hand opens a phone, homepage loads, eye, "first screen" fold highlight | Open, homepage, phone, Only, first |
| `stranger-test` | stranger with phone + three "?" bubbles | stranger, answer, all, three, questions |
| `questions-fail` | "?" bubbles turn to red X, people walk out a door | not, why, people, leave |
| `comment-cta` | Sudip thumbs-up photo, comment box types the keyword, reply bubble, mini homepage | `word` (e.g. FIX), `face`, Comment, tell, change, homepage |

Old names used in the first reel still work (q1/q2/q3, welcome, simple, book, face-try, ...).

## Rules (Sudip's)
- Words on screen only when spoken at that moment, and always animated (scenes use the `Spoken` component).
- Proper flat design, not sketches. Light-skinned characters. Something changes every 1-2 s.
- Sudip's face 1-2 times per reel (`face` and/or `comment-cta`), always moving.
- Soft, few sound effects; music low.

## Adding a new scene
Add a function to `SCENES` in `src/templates/Explainer.tsx`. Build it from `src/components/flat/kit.tsx`
(Person, Phone + Site, Bubble, NumBadge, Stopwatch, icons, Hand, Burst, Ripple ...). Use `c.q('word')` for the
frame a word is said and `<Spoken ws={c.ws('exact phrase')} f={f} />` for on-screen words.
