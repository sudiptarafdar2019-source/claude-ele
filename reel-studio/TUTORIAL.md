# Orbirise Reel Studio: easy tutorial

This is your video-making system for 9:16 reels (Instagram Reels, TikTok, YouTube Shorts, Facebook Reels). You give it a voiceover and a short "reel file", and it builds a finished, branded video plus a cover image. The motion, cuts, sound effects, music, captions and end card are all done for you.

---

## 1. What you have

### Five video templates

| # | Template | Looks like | Best for | Sample |
|---|---|---|---|---|
| 1 | **Cartoon Explainer** (`toon`) | Light background, cartoon you in a card, one big keyword at the top, a phone or info card beside you | Stories and simple ideas ("the plumber who replies first") | `samples/day04-cartoon.mp4` |
| 2 | **Face Reactions** (`faces`) | Dark navy, your real face cutout at the bottom changing expression with the tone of each line, big faded number behind | Lists, mistakes, myths, anything with attitude | `samples/day05-face-reactions.mp4` |
| 3 | **Hand Explainer** (`hands`) | White board, a real hand writes the key words, circles and underlines them, and taps buttons on a phone | Tutorials and step-by-step "do this on your website" | `samples/day02-hand-explainer.mp4` |
| 4 | **Podcast Clip** (`podcast`) | Your studio photo in a podcast frame, two camera angles, close-ups, live waveform, name lower third | Founder stories, opinions, calm talks | `samples/day08-podcast.mp4` |
| 5 | **Quick Tips** (`tips`) | Orbit Blue background with orbit rings, big "01 / 02 / 03" steps with icons, your face reacting in the corner | "3 things to...", checklists, tools | `samples/day01-quick-tips.mp4` |

Every template has a matching **cover** (`covers/`).

### Built into every video
- **Hook text** for the first 2.4 seconds (big, with an impact sound and a small shake).
- **Animated captions**: 1 to 3 words at a time, each word pops in exactly when you say it, the spoken word is highlighted, and words you wrote in CAPS in the script get the accent colour.
- **Caption safe area**: captions always sit between 45% and 80% of the screen height, away from the Instagram/TikTok buttons on the right and the caption text at the bottom.
- **Cuts and motion**: a punch-in zoom on every new beat, a slow push-in, floating background orbs, and pop/slide animations on everything.
- **Sound design**: whoosh on cuts, pop when your face or pose changes, notification pings on phone alerts, ding on checklist ticks, click on taps and countdowns, marker sounds when the hand writes, a riser and hit before the end card. Background music is mixed low under your voice and lifts at the end.
- **Progress bar** across the top, **name pill** with a live voice waveform, and an **end card** with the Orbirise logo and your call to action.
- **Orbirise branding**: Orbit Blue `#0052FF`, Midnight Navy, Sky `#19A7FF`, Solar Gold `#E8B04B` on dark, Plus Jakarta Sans headings, Instrument Serif italic accents, the official logo.

---

## 2. The easiest way: ask Claude

In this project, just write something like:

> Make the Day 9 reel with the Quick Tips template.

or

> Make Day 13 as a Face Reactions reel and Day 14 as a Cartoon reel.

Claude will generate the voice in your cloned ElevenLabs voice (or use an mp3 you upload), write the reel file, time it, render the video and cover, and send them to you. You can then ask for changes in plain words: "use the shocked face on the second line", "make the headline say 'Missed calls'", "less music".

---

## 3. How a reel is made (the 4 steps)

```
 voiceover.mp3 ──► 1. put it in public/voice/
 reel file     ──► 2. write reels/day09.json
                   3. python scripts/transcribe.py reels/day09.json   (word timings)
                   4. node scripts/render.mjs day09                    (video + cover)
                   ──► out/day09.mp4  and  out/day09-cover.png
```

### Step 1: the voiceover
Generate the voice block from the scripts document in ElevenLabs (your voice "Sudip T", model Eleven v4 or v3). Download the mp3 and save it as `public/voice/day09.mp3`. The tone tags you use (`[curious]`, `[sighs]`, `[excited]` ...) are kept in the reel file and also choose your facial expressions automatically.

### Step 2: the reel file
Copy one of the sample files in `reels/` and change it. Here is a short example:

```json
{
  "id": "day09",
  "day": 9,
  "template": "tips",
  "voice": "voice/day09.mp3",
  "music": "music/upbeat-tech.mp3",
  "hook": "Automation tools for under $20 a month",
  "hookHighlight": "under $20",
  "script": "[curious] Paste the exact voice block you used in ElevenLabs here...",
  "cta": {"text": "Follow for Day 10", "sub": "Google's AI answers"},
  "cover": {"kicker": "Day 9 · Cheap tools", "title": "My automation stack for", "highlight": "under $20", "face": "smart"},
  "beats": [
    {"at": "Paste the first few words of a line", "title": "Big title", "prop": {"type": "stat", "value": "$20", "label": "a month, all in", "icon": "wallet"}},
    {"at": "One.", "number": "01", "prop": {"type": "step", "icon": "mail", "title": "Email tool", "text": "Replies on its own"}}
  ]
}
```

- `script` must be the exact voice block you generated (tags included). That is how captions match the audio word for word.
- Each **beat** is one visual "shot". `at` is the first few words of where that shot starts (copy them from the script). The shot lasts until the next beat starts. Aim for one beat every 3 to 6 seconds.
- `hook` is the on-screen hook text; `hookHighlight` is the part shown in the accent colour.

### Step 3: timing
```
python scripts/transcribe.py reels/day09.json
```
This listens to your mp3 (free, runs on the computer, no upload) and writes `reels/day09.timing.json` with the start and end of every word. It prints a match score; anything above 90% is good. If it is low, the script in the reel file doesn't match what the voice actually said.

### Step 4: render
```
node scripts/render.mjs day09
```
You get `out/day09.mp4` (1080x1920, 30 fps, H.264, ready to upload) and `out/day09-cover.png`. To only redo the cover: `node scripts/render.mjs day09 --cover-only`.

To preview and scrub through a reel while you edit it, run `npm run studio` and open the link it prints.

---

## 4. What you can put in a beat

| Field | Used by | What it does |
|---|---|---|
| `at` | all | Words where this shot starts (required) |
| `headline`, `eyebrow` | toon, faces | Big keyword, and the small italic line above it (toon) |
| `title` | tips | Big title at the top |
| `number` | faces, tips | Big number (faces: faded number + "No. 1" badge; tips: "01 of 03" with step dots) |
| `pose` | toon | Cartoon pose: `smile`, `thinking`, `pointing`, `shocked`, `thumbs-up`, `explaining` |
| `face` | faces, tips | Your expression (list below). Leave it out and the tone tag picks one for you |
| `write`, `draw` | hands | Words the hand writes, then a drawing: `underline`, `circle`, `box`, `arrow`, `check`, `cross`, `none` |
| `hand` | hands | `thumbs-up` pops a thumbs-up hand in |
| `shot` | podcast | Camera: `a-wide`, `a-close`, `b-wide`, `b-close` |
| `warm` | podcast | Golden light and floating embers (festive or emotional moments) |
| `prop` | all | The "thing" on screen (list below) |
| `sfx` | all | Replace the cut sound, e.g. `"impact"` for a big reveal |

### Your 28 face expressions (`face`)
See `catalog/faces-catalog.jpg`.

`neutral`, `thinking`, `thumbs-up`, `confident`, `shocked`, `pointing-serious`, `fist-pump`, `explaining`, `suspicious`, `idea`, `facepalm`, `please`, `laughing`, `cool`, `curious`, `announce`, `presenting`, `pointing-you`, `skeptical`, `big-smile`, `smug`, `smart`, `relaxed`, `hmm`, `shrug`, `mind-blown`, `coffee`, `ok`

**Automatic tone matching** (when a beat has no `face`):

| Tag in the script | Face |
|---|---|
| `[curious]` | curious |
| `[sighs]` | facepalm |
| `[seriously]` | confident |
| `[confidently]` | presenting |
| `[excited]` | fist-pump |
| `[warmly]` | big-smile |
| `[laughs]` | laughing |
| `[mischievously]` | smug |
| `[sarcastic]` | skeptical |
| `[softly]` | please |
| `[thoughtfully]` | thinking |

Good manual picks: "Follow / comment" → `pointing-you`; a shocking fact → `shocked` or `mind-blown`; a list item → `explaining` or `ok`; "save this" → `thumbs-up`; a joke → `laughing`; "who knows?" → `shrug`.

### Props (`prop`)
Icons are any name from [lucide.dev/icons](https://lucide.dev/icons) (e.g. `zap`, `bell-ring`, `calendar-days`, `wallet`).

| type | Example | Sounds |
|---|---|---|
| `phone` + `screen: "notifications"` | `{"type":"phone","screen":"notifications","items":[{"app":"Email","title":"New enquiry","text":"Are you free Friday?"}]}` | ping per alert |
| `phone` + `screen: "chat"` | `{"type":"phone","screen":"chat","messages":[{"from":"me","text":"Hi!"},{"from":"them","text":"Thanks!"}]}` | pop per bubble |
| `phone` + `screen: "website"` | `{"type":"phone","screen":"website","site":{"name":"Bright Books","tag":"For restaurant owners","headline":"We help...","sub":"...","button":"Book a free call"},"highlight":"button","tap":true}` | click on tap. Extras: `highlight` (`tag`/`headline`/`button`), `tap`, `crossHeadline`, `firstScreen` |
| `stat` | `{"type":"stat","value":"< 1 hr","label":"reply time that wins","icon":"timer"}` | soft ding |
| `card` | `{"type":"card","icon":"camera","title":"A real photo of YOU","text":"People buy from people"}` | |
| `step` | `{"type":"step","icon":"bell-ring","title":"Reminder","text":"Sent the day before"}` | |
| `checklist` | `{"type":"checklist","items":["Name","Email","One question"]}` (add `"preDone":3` to show all ticked, `"plain":true` for numbers instead of ticks) | ding per tick |
| `vs` | `{"type":"vs","left":{"label":"Price","icon":"tag"},"right":{"label":"Speed","icon":"zap"},"winner":"right"}` | ding |
| `icons` | `{"type":"icons","items":[{"icon":"trophy","label":"Replied first","win":true},{"icon":"clock","label":"Later"}]}` | pops |
| `burn` | `{"type":"burn","text":"Welcome to our website"}` (crossed out, then burns; `"button":true` for a button) | marker + whoosh |
| `button` | `{"type":"button","text":"Get my free quote"}` | ding |
| `numbers` | `{"type":"numbers","items":["1","2","3","4","5"],"label":"Which one is on your site?"}` | clicks |
| `countdown` | `{"type":"countdown","from":3}` | tick per number |
| `chips` / `chip` | `{"type":"chips","items":["US","UK","Canada"],"icon":"heart"}` | pops |
| `intro` | `{"type":"intro","name":"Sudip Tarafdar","role":"Founder, Orbirise","text":"..."}` | |
| `tiles` | four boxes; add `"broken":true` to show them disconnected | |
| `orbit` | items circle around an Orbirise orb (connected system) | riser |
| `flow` | 3 steps joined by arrows | swipe per step |
| `cta` | `{"type":"cta","text":"Comment FIX","icon":"message-circle"}` | |

### Music (`music`)
`music/upbeat-tech.mp3` (tips, hands), `music/playful.mp3` (cartoon, faces), `music/lofi-warm.mp3` (podcast). Change the level with `"musicVolume": 0.06` (default 0.085; podcast 0.1).

### Sound effects (`public/sfx/`)
`whoosh`, `whoosh-2`, `swipe`, `swipe-2`, `click`, `click-2`, `pop`, `ding`, `ding-2`, `notify`, `notify-2`, `riser`, `riser-long`, `impact`, `impact-2`, `marker`, `marker-2`, `typing`, `typing-2`. They are placed automatically; use a beat's `sfx` only to override the cut sound.

---

## 5. Covers

Each reel's `cover` block makes the thumbnail:

```json
"cover": {"kicker": "Day 5 · Bonfire Night", "title": "5 things to", "highlight": "BURN", "after": "from your website", "face": "announce"}
```

- `title` (2 to 4 words) + `highlight` (1 to 2 words, shown big in gold or blue) + optional `after` (small italic line).
- Picture: `face` (faces and tips templates), `pose` (cartoon), `hand` (hand explainer), studio photo (podcast).
- All text sits in the centre area, so it still reads when Instagram crops the cover to 4:5 or 3:4 on your grid. Upload `out/dayXX-cover.png` as the reel cover.

---

## 6. Rules that keep reels looking pro

1. **One idea per beat**, one beat every 3 to 6 seconds. More cuts = more retention, but never shorter than about 1.5 seconds.
2. **On-screen words = names of things only** (a keyword, a number, a tool, a button). The captions carry the rest.
3. **Headlines: 1 to 4 words.** Hook: under 8 words.
4. **Write emphasis words in CAPS in the script** ("your SPEED"). They get spoken with stress and highlighted in the captions.
5. **Match the template to the script**: lists → Quick Tips or Face Reactions; how-to → Hand Explainer; story → Cartoon or Podcast.
6. **Keep real numbers real.** Don't put stats on screen that the script can't back up.

---

## 7. Setting it up on your own computer (optional)

You only need this if you want to render without Claude.

1. Install [Node.js 22](https://nodejs.org) and [Python 3.11+](https://python.org) and [FFmpeg](https://ffmpeg.org).
2. Copy the `reel-studio` folder to your computer, open a terminal in it, and run:
   ```
   npm install
   pip install faster-whisper numpy
   ```
3. Then follow steps 1 to 4 above. The first transcribe downloads a small speech model (~500 MB) once.

## 8. Costs

Rendering, timing, captions, sound effects and music are free. The only per-reel cost is the ElevenLabs voice (about 900 credits for a 50-second script; generating 1 take instead of 2 halves it). Real lip-sync for the podcast template is optional (about $6.70 per minute with HeyGen Avatar IV in ElevenLabs); without it the podcast template uses camera cuts and motion on your photo. To use a lip-sync clip, save it as `public/video/dayXX.mp4` and add `"video": "video/dayXX.mp4"` inside the reel's `podcast` block.

## 9. Folder map

```
reel-studio/
  reels/          one .json per reel (+ .timing.json made by transcribe)
  public/voice/   voiceovers          public/music/  3 music beds
  public/sfx/     sound effects        public/fonts/  brand fonts
  public/img/faces/    28 expression cutouts     public/img/cartoon/  6 cartoon poses
  public/img/hands/    4 realistic hands         public/img/podcast/  2 studio angles
  public/img/brand/    Orbirise logos
  src/templates/  Toon, Faces, Hands, Podcast, Tips     src/Cover.tsx  covers
  src/components/ captions, props, phone, sound          scripts/  transcribe, render, stills
  out/            finished videos and covers
```
