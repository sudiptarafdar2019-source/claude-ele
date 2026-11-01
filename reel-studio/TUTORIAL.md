# Orbirise Reel Studio: easy tutorial

This is your video-making system for 9:16 reels (Instagram Reels, TikTok, YouTube Shorts, Facebook Reels). You give it a voiceover and a short "reel file", and it builds a finished, branded video plus a cover image. The motion, cuts, sound effects, music, captions and end card are all done for you.

**Visual-only style:** the only text on screen is the animated captions. Everything else is explained with moving pictures (animated icons, your photo, cartoons, a drawing hand), and the picture changes every 1 to 2 seconds.

---

## 1. What you have

### Six video templates

| # | Template | Looks like | Best for | Sample |
|---|---|---|---|---|
| 1 | **Cartoon Story** (`story`) | Light-skinned animated cartoon characters (you, Maya the business owner, Leo the customer) act out the script in a cartoon shop, office, street or home. Your character's mouth moves with your voice, everyone blinks and breathes, arms change gesture every shot, speech and thought bubbles show pictures (not words), and animated pictures pop up beside them | Stories and simple ideas ("the plumber who replies first") | `samples/day04-cartoon-story.mp4` |
| 2 | **Face Reactions** (`faces`) | Dark navy, your real photo cutout changing expression with the tone of each line. Your photo slides between four positions (left, right, centre, big close-up) every 1-2 seconds, with a big animated picture beside it for what you're saying | Lists, mistakes, myths, anything with attitude | `samples/day05-face-reactions.mp4` |
| 3 | **Hand Explainer** (`hands`) | White board, a real hand sketches a picture for each idea, then circles, underlines, ticks or crosses it, and taps buttons on a phone | Tutorials and step-by-step "do this on your website" | `samples/day02-hand-explainer.mp4` |
| 4 | **Podcast Clip** (`podcast`) | Your studio photo in a podcast frame, the camera angle and zoom change every 1-2 seconds, live waveform, a big animated picture under the captions | Founder stories, opinions, calm talks | `samples/day08-podcast.mp4` |
| 5 | **Quick Tips** (`tips`) | Orbit Blue background with orbit rings, your moving photo and a big animated picture for each step (same moving layout as Face Reactions, on blue) | "3 things to...", checklists, tools | `samples/day01-quick-tips.mp4` |
| 6 | **Cartoon Card** (`toon`) | Now plays as Cartoon Story, so old reel files still work | | |

Every template has a matching **cover** (`covers/`).

### Built into every video
- **Pictures instead of text**: every 1.5 seconds or so (always on a word boundary) a new animated picture appears. It is picked from what you are saying at that moment ("phone" shows a phone, "money" shows cash, "Google" shows search; about 200 words are known, see `src/lib/visuals.ts`), or from the beat's `prop`. A `vs` prop shows a red cross on the loser and a trophy on the winner, a `checklist` shows green ticks. Phone beats switch between the phone screen and a picture so nothing sits still.
- **Animated captions**: 1 to 3 words at a time, each word pops in exactly when you say it, the spoken word is highlighted, and words you wrote in CAPS in the script get the accent colour.
- **Caption safe area**: captions always sit between 45% and 80% of the screen height, away from the Instagram/TikTok buttons on the right and the caption text at the bottom.
- **Cuts and motion**: calm and smooth. A very small push-in on each new beat, a slow drift, soft fades and gentle springs (no shaking, no hard bounces).
- **Sound design (soft)**: a soft swell at the start, a quiet swoosh on scene changes, gentle ticks and pops when things appear, one soft chime at the end. Sounds are never closer than 0.4 seconds apart, and none play on face changes. Background music sits well under your voice and lifts a little on the end card.
- **Studio voice**: your voiceover is automatically polished before rendering (low-cut, warmth, clarity, gentle compression, de-essing and a very small room sound), then the whole mix is levelled to -14 LUFS for social media.
- **Progress bar** across the top, **name pill** with a live voice waveform, and an **end card** with the Orbirise logo and three animated follow / save / share icons.
- **Orbirise branding**: Orbit Blue `#0052FF`, Midnight Navy, Sky `#19A7FF`, Solar Gold `#E8B04B` on dark, Plus Jakarta Sans headings, Instrument Serif italic accents, the official logo.

---

## 2. The easiest way: ask Claude

In this project, just write something like:

> Make the Day 9 reel with the Quick Tips template.

or

> Make Day 13 as a Face Reactions reel and Day 14 as a Cartoon reel.

Claude will generate the voice in your cloned ElevenLabs voice (or use an mp3 you upload), write the reel file, time it, render the video and cover, and send them to you. You can then ask for changes in plain words: "use the shocked face on the second line", "show a phone on the second line", "less music".

---

## 3. How a reel is made (the 4 steps)

```
 voiceover.mp3 ──► 1. put it in public/voice/
 reel file     ──► 2. write reels/day09.json
                   3. node scripts/prepare.mjs day09                    (word timings + voice polish)
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
- `hook` and `hookHighlight` are only used for the cover now (no hook text on the video itself).

### Step 3: timing
```
node scripts/prepare.mjs day09
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
| `show` | faces, tips | The animated scene behind your photo. One name, or a list that splits the beat, e.g. `["visitor-leaves","say-what-you-do"]`. Scenes: `bonfire`, `burn-welcome`, `burn-slider`, `burn-stock`, `burn-form`, `burn-button`, `visitor-leaves`, `say-what-you-do`, `one-message`, `real-photo`, `people-buy`, `short-form`, `what-button`, `good-button`, `more-contacts`, `comment`, `website`, `customer`, `visit`, `call`, `message`, `money`, `search`, `review`, `wait`, `grow`. Leave it out and a scene is picked from what you say ("website" shows a webpage, "customer" shows a customer walking in, "visiting" shows someone walking into a shop) |
| `cast` | story | Who is on screen: `[{"who":"sudip","do":"point","mood":"happy"},{"who":"maya","do":"phone","mood":"worried"}]` (1 to 3 characters, list below) |
| `say`, `think` | story | Turns on a speech bubble (`say`) or thought bubble (`think`). The bubble shows the animated picture, not the words |
| `speaker` | story | Who lip-syncs to the voice (default `sudip`). Use `"none"` for narration with nobody talking |
| `scene` | story | Background: `studio`, `office`, `shop`, `street`, `home` (or set `"scene"` once for the whole reel) |
| `headline`, `eyebrow`, `title`, `number` | (cover only) | No longer shown on the video (visual-only style). Safe to leave in old reel files |
| `pose` | toon | Cartoon pose: `smile`, `thinking`, `pointing`, `shocked`, `thumbs-up`, `explaining` |
| `face` | faces, tips | Your expression (list below). Leave it out and the tone tag picks one for you |
| `write`, `draw` | hands | No longer written on screen. The hand sketches the picture for each moment and picks a circle/underline/tick/cross mark itself |
| `hand` | hands | `thumbs-up` pops a thumbs-up hand in |
| `shot` | podcast | Ignored now: the camera angle changes on its own every 1-2 seconds |
| `warm` | podcast | Golden light and floating embers (festive or emotional moments) |
| `prop` | all | Picks the pictures for that beat (its icons come first, then pictures from your words). `phone` props show the phone screen |
| `sfx` | all | Replace the cut sound (`"swell"`, `"chime"`, `"tick"`, `"pop"`), or `"none"` for silence on that cut |

### Your face expressions (`face`)
See `catalog/faces-catalog.jpg`. These are fresh photos made from your pictures (same navy blazer and white shirt), cut out cleanly with hair strands kept.

Real photos (19): `neutral`, `thinking`, `thumbs-up`, `confident`, `shocked`, `pointing-serious`, `fist-pump`, `explaining`, `suspicious`, `idea`, `facepalm`, `please`, `laughing`, `cool`, `curious`, `announce`, `presenting`, `skeptical`, `mind-blown`

These names also work and use the closest photo until their own is made: `pointing-you` → pointing-serious, `big-smile` → thumbs-up, `smug` → cool, `smart` → idea, `relaxed` → neutral, `hmm` → thinking, `shrug` → presenting, `coffee` → neutral, `ok` → thumbs-up.

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

### Cartoon characters (`story` template)
See `catalog/cartoon-cast.png`. They are drawn in code, so they cost nothing to use and can do any of these:

| Character | `who` | Look |
|---|---|---|
| Sudip | `sudip` | You: navy blazer, white shirt, dark swept hair. He lip-syncs to your voice |
| Maya | `maya` | Small business owner: blue apron, gold sweater, glasses, hair bun |
| Leo | `leo` | The customer: sky-blue hoodie, navy cap, usually on his phone |

- **Gestures (`do`)**: `idle`, `wave`, `point`, `point-up`, `explain`, `thumbs-up`, `shrug`, `think`, `phone`, `cheer`, `crossed`, `present`
- **Moods (`mood`)**: `neutral`, `happy`, `excited`, `surprised`, `worried`, `thinking`, `sad`. Leave `mood` out for Sudip and the script's tone tag picks it.
- Characters who weren't in the last beat walk in from the side. Characters who stay move smoothly to their new spot and pose.
- A `phone` prop sits on the right with the characters on the left. Other props sit above the characters.

### Props (`prop`)
In the visual-only style a prop is not drawn as a text card any more. It chooses the pictures for its beat: its icons are shown one after another (with ticks, crosses or a trophy where it makes sense), then pictures from your words take over. Only `phone` props are still drawn (as a phone screen), and phone beats switch between the phone and a picture. Icons are any name from [lucide.dev/icons](https://lucide.dev/icons) (e.g. `zap`, `bell-ring`, `calendar-days`, `wallet`).

| type | Example | Sounds |
|---|---|---|
| `phone` + `screen: "notifications"` | `{"type":"phone","screen":"notifications","items":[{"app":"Email","title":"New enquiry","text":"Are you free Friday?"}]}` | soft pop per alert |
| `phone` + `screen: "chat"` | `{"type":"phone","screen":"chat","messages":[{"from":"me","text":"Hi!"},{"from":"them","text":"Thanks!"}]}` | soft pop per bubble |
| `phone` + `screen: "website"` | `{"type":"phone","screen":"website","site":{"name":"Bright Books","tag":"For restaurant owners","headline":"We help...","sub":"...","button":"Book a free call"},"highlight":"button","tap":true}` | soft tick on tap. Extras: `highlight` (`tag`/`headline`/`button`), `tap`, `crossHeadline`, `firstScreen` |
| `stat` | `{"type":"stat","value":"< 1 hr","label":"reply time that wins","icon":"timer"}` | soft chime |
| `card` | `{"type":"card","icon":"camera","title":"A real photo of YOU","text":"People buy from people"}` | |
| `step` | `{"type":"step","icon":"bell-ring","title":"Reminder","text":"Sent the day before"}` | |
| `checklist` | `{"type":"checklist","items":["Name","Email","One question"]}` (add `"preDone":3` to show all ticked, `"plain":true` for numbers instead of ticks) | soft tick per item |
| `vs` | `{"type":"vs","left":{"label":"Price","icon":"tag"},"right":{"label":"Speed","icon":"zap"},"winner":"right"}` | soft chime |
| `icons` | `{"type":"icons","items":[{"icon":"trophy","label":"Replied first","win":true},{"icon":"clock","label":"Later"}]}` | soft pops |
| `burn` | `{"type":"burn","text":"Welcome to our website"}` (crossed out, then burns; `"button":true` for a button) | soft swell |
| `button` | `{"type":"button","text":"Get my free quote"}` | soft chime |
| `numbers` | `{"type":"numbers","items":["1","2","3","4","5"],"label":"Which one is on your site?"}` | soft ticks |
| `countdown` | `{"type":"countdown","from":3}` | soft tick per number |
| `chips` / `chip` | `{"type":"chips","items":["US","UK","Canada"],"icon":"heart"}` | soft pops |
| `intro` | `{"type":"intro","name":"Sudip Tarafdar","role":"Founder, Orbirise","text":"..."}` | |
| `tiles` | four boxes; add `"broken":true` to show them disconnected | |
| `orbit` | items circle around an Orbirise orb (connected system) | soft swell |
| `flow` | 3 steps joined by arrows | soft tick per step |
| `cta` | `{"type":"cta","text":"Comment FIX","icon":"message-circle"}` | |

### Volume controls (`mix`)
Add a `mix` block to any reel file:

```json
"mix": {"voice": 1, "music": 0.07, "sfx": 0.6}
```

| Setting | Default | Meaning |
|---|---|---|
| `voice` | `1` | Your voice. `1.2` = a bit louder, `0.9` = a bit softer |
| `music` | `0.07` | Background music. `0` = no music, `0.04` = very quiet, `0.1` = more present |
| `sfx` | `0.6` | All effect sounds. `0` = no effect sounds at all, `0.3` = very subtle, `1` = full |

The final video is always levelled to -14 LUFS, so these only change the balance between voice, music and effects.

### Voice polish (`voiceFx`)
`"voiceFx": "studio"` (default: clear, close mic), `"warm"` (default for podcast: fuller and warmer, a little more room), `"clean"` (just levelled), `"none"` (your mp3 untouched). The polished file is made automatically in `public/voice/fx/`.

### Music (`music`)
`music/upbeat-tech.mp3` (tips, hands), `music/playful.mp3` (cartoon, faces), `music/lofi-warm.mp3` (podcast).

### Sound effects (`public/sfx/`)
A small soft set: `soft-swoosh` (scene change), `soft-swell` (start and big reveals), `soft-tick` (list items, taps, countdowns), `soft-pop` and `soft-pop-2` (things appearing, chat bubbles, alerts), `soft-chime` and `soft-chime-2` (end card, stats, buttons) and a quiet `marker` (hand writing). They are placed automatically.

---

## 5. Covers

Each reel's `cover` block makes the thumbnail:

```json
"cover": {"kicker": "Day 5 · Bonfire Night", "title": "5 things to", "highlight": "BURN", "after": "from your website", "face": "announce"}
```

- `title` (2 to 4 words) + `highlight` (1 to 2 words, shown big in gold or blue) + optional `after` (small italic line).
- Picture: `face` (faces and tips templates), `pose` (story: Sudip's gesture, with Maya and Leo beside him; toon: cartoon pose), `hand` (hand explainer), studio photo (podcast).
- All text sits in the centre area, so it still reads when Instagram crops the cover to 4:5 or 3:4 on your grid. Upload `out/dayXX-cover.png` as the reel cover.

---

## 6. Rules that keep reels looking pro

1. **One idea per beat**, one beat every 3 to 6 seconds. More cuts = more retention, but never shorter than about 1.5 seconds.
2. **No text on screen except captions.** Explain with pictures: if a word must be seen, it goes in the captions (write it in CAPS).
3. **Something changes every 1 to 2 seconds.** The system does this for you; to steer which picture shows, say the thing ("phone", "Google", "money") or give the beat a prop with the icons you want.
4. **Write emphasis words in CAPS in the script** ("your SPEED"). They get spoken with stress and highlighted in the captions.
5. **Match the template to the script**: lists → Quick Tips or Face Reactions; how-to → Hand Explainer; story → Cartoon Story or Podcast.
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

Rendering, timing, captions, sound effects, music and the cartoon characters are free. The only per-reel cost is the ElevenLabs voice (about 900 credits for a 50-second script; generating 1 take instead of 2 halves it). Real lip-sync for the podcast template is optional (about $6.70 per minute with HeyGen Avatar IV in ElevenLabs); without it the podcast template uses camera cuts and motion on your photo. To use a lip-sync clip, save it as `public/video/dayXX.mp4` and add `"video": "video/dayXX.mp4"` inside the reel's `podcast` block.

## 9. Folder map

```
reel-studio/
  reels/          one .json per reel (+ .timing.json made by transcribe)
  public/voice/   voiceovers          public/music/  3 music beds
  public/sfx/     sound effects        public/fonts/  brand fonts
  public/img/faces/    19 expression cutouts     public/img/cartoon/  6 old cartoon poses (toon)
  public/img/hands/    4 realistic hands         public/img/podcast/  2 studio angles
  public/img/brand/    Orbirise logos
  src/templates/  Story, Faces, Hands, Podcast, Tips, Toon     src/Cover.tsx  covers
  src/components/ Character (cartoon cast), Scenes, Speaker (your talking face),
                  captions, props, phone, sound          scripts/  prepare, transcribe, voice-fx, render, stills
  out/            finished videos and covers
```
