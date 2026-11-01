/** Sudip's 28 expression cutouts (public/img/faces). Use the short name in reel files. */
export const FACES: Record<string, string> = {
  neutral: '01-neutral', thinking: '02-thinking', 'thumbs-up': '03-thumbs-up', confident: '04-confident',
  shocked: '05-shocked', 'pointing-serious': '06-pointing-serious', 'fist-pump': '07-fist-pump', explaining: '08-explaining',
  suspicious: '09-suspicious', idea: '10-idea', facepalm: '11-facepalm', please: '12-please', laughing: '13-laughing',
  cool: '14-cool', curious: '15-curious', announce: '16-announce', presenting: '17-presenting', 'pointing-you': '18-pointing-you',
  skeptical: '19-skeptical', 'big-smile': '20-big-smile', smug: '21-smug', smart: '22-smart', relaxed: '23-relaxed',
  hmm: '24-hmm', shrug: '25-shrug', 'mind-blown': '26-mind-blown', coffee: '27-coffee', ok: '28-ok',
};
export const faceSrc = (name?: string) => `img/faces/${FACES[name ?? 'neutral'] ?? FACES.neutral}.png`;

/** Automatic face for each ElevenLabs tone tag, used when a beat names no face. */
export const TAG_FACE: Record<string, string> = {
  curious: 'curious', sighs: 'facepalm', seriously: 'confident', confidently: 'presenting', excited: 'fist-pump',
  warmly: 'big-smile', laughs: 'laughing', mischievously: 'smug', sarcastic: 'skeptical', softly: 'please',
  thoughtfully: 'thinking', whispers: 'smart', exhales: 'relaxed', neutral: 'neutral', surprised: 'shocked',
};
export const autoFace = (tag?: string) => TAG_FACE[tag ?? 'neutral'] ?? 'neutral';

/** Cartoon poses (public/img/cartoon). */
export const POSES = ['smile', 'thinking', 'pointing', 'shocked', 'thumbs-up', 'explaining'];
export const TAG_POSE: Record<string, string> = {
  curious: 'thinking', sighs: 'thinking', seriously: 'explaining', confidently: 'pointing', excited: 'thumbs-up',
  warmly: 'smile', laughs: 'thumbs-up', mischievously: 'smile', sarcastic: 'shocked', softly: 'smile', thoughtfully: 'thinking',
};
