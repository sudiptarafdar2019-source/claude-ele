import {FPS} from '../brand';
import {ResolvedBeat, Timing} from '../types';
import {HOOK_SECONDS} from './timing';

/**
 * Turns the spoken words into a picture that changes every 1-2 seconds.
 * Each "shot" shows one big animated icon chosen from what is being said at that moment
 * (or from the beat's prop), so the video explains itself without on-screen text.
 */

/** spoken word (lower-case stem) -> lucide icon */
export const KEYWORDS: Record<string, string> = {
  // contact & messages
  enquir: 'inbox', inquir: 'inbox', message: 'message-circle', messag: 'message-circle', text: 'message-square-text', sms: 'message-square-text', chat: 'messages-square', dm: 'send',
  email: 'mail', mail: 'mail', inbox: 'inbox', reply: 'reply', replies: 'reply', respond: 'reply', call: 'phone-call', phone: 'smartphone', ring: 'phone-call', voicemail: 'voicemail',
  alert: 'bell-ring', notif: 'bell-ring', remind: 'alarm-clock', ping: 'bell-ring', form: 'clipboard-list', fill: 'clipboard-pen', book: 'calendar-check', booking: 'calendar-check', appointment: 'calendar-check', calendar: 'calendar-days', schedul: 'calendar-clock',
  // time & speed
  time: 'clock', hour: 'clock', minute: 'timer', second: 'timer', fast: 'zap', faster: 'zap', speed: 'zap', quick: 'zap', instant: 'zap', slow: 'turtle', wait: 'hourglass', week: 'calendar-range', day: 'sun', night: 'moon', today: 'calendar', late: 'clock-alert', first: 'medal',
  // money
  price: 'tag', cost: 'coins', cheap: 'piggy-bank', money: 'banknote', pay: 'credit-card', paid: 'credit-card', invoice: 'receipt', dollar: 'dollar-sign', budget: 'wallet', free: 'gift', sale: 'shopping-bag', sell: 'shopping-bag', revenue: 'trending-up', profit: 'trending-up', lose: 'trending-down', lost: 'trending-down', waste: 'trash-2',
  // people
  client: 'users', customer: 'users', people: 'users', person: 'user', team: 'users-round', staff: 'users-round', owner: 'store', business: 'store', shop: 'store', plumber: 'wrench', coach: 'dumbbell', consultant: 'briefcase', restaurant: 'utensils', salon: 'scissors', family: 'heart-handshake', friend: 'smile', trust: 'shield-check', review: 'star', reviews: 'star', rating: 'star', star: 'star',
  // web & tools
  website: 'globe', site: 'globe', page: 'layout-template', homepage: 'house', button: 'mouse-pointer-click', click: 'mouse-pointer-click', tap: 'pointer', link: 'link', google: 'search', search: 'search', seo: 'search-check', ai: 'sparkles', chatgpt: 'bot', bot: 'bot', robot: 'bot', automat: 'workflow', system: 'workflow', tool: 'wrench', tools: 'wrench', app: 'app-window', software: 'app-window', crm: 'contact', spreadsheet: 'sheet', data: 'database', list: 'list-checks', photo: 'camera', picture: 'image', video: 'video', reel: 'clapperboard', post: 'image-up', social: 'share-2', instagram: 'instagram', facebook: 'facebook', ads: 'megaphone', ad: 'megaphone', mobile: 'smartphone', laptop: 'laptop', computer: 'monitor',
  // ideas & feelings
  idea: 'lightbulb', think: 'brain', thing: 'box', mistake: 'circle-x', wrong: 'circle-x', fix: 'hammer', broken: 'unplug', problem: 'triangle-alert', easy: 'thumbs-up', simple: 'sparkle', hard: 'mountain', work: 'briefcase', job: 'briefcase', grow: 'sprout', growth: 'sprout', win: 'trophy', wins: 'trophy', winner: 'trophy', success: 'party-popper', happy: 'smile', love: 'heart', stress: 'frown', tired: 'battery-low', sleep: 'bed', busy: 'activity', save: 'bookmark', follow: 'user-plus', comment: 'message-circle', share: 'share-2', burn: 'flame', fire: 'flame', bonfire: 'flame', diwali: 'flame-kindling', light: 'lamp', secret: 'key-round', step: 'footprints', check: 'circle-check', test: 'flask-conical', result: 'chart-line', number: 'hash', goal: 'target', target: 'target', question: 'circle-help', answer: 'message-square-reply', start: 'rocket', launch: 'rocket', stop: 'octagon-x', hand: 'hand', manual: 'hand', repeat: 'repeat', again: 'repeat', every: 'repeat', world: 'earth', local: 'map-pin', map: 'map-pin', city: 'building-2', home: 'house', gift: 'gift', holiday: 'tree-pine', christmas: 'tree-pine', thanksgiving: 'drumstick', clock: 'clock', interest: 'heart', welcome: 'hand', name: 'id-card', real: 'badge-check', honest: 'badge-check', story: 'book-open', podcast: 'mic', voice: 'mic', listen: 'ear', show: 'eye', see: 'eye', look: 'eye',
};

const FALLBACK = ['sparkles', 'lightbulb', 'rocket', 'target', 'zap', 'heart', 'star', 'trending-up'];

export const iconForWord = (w: string): string | null => {
  const s = w.toLowerCase().replace(/[^a-z']/g, '').replace(/'s$/, '');
  if (s.length < 2) return null;
  if (KEYWORDS[s]) return KEYWORDS[s];
  for (const k of Object.keys(KEYWORDS)) if (k.length >= 4 && s.startsWith(k)) return KEYWORDS[k];
  if (s.endsWith('s') && KEYWORDS[s.slice(0, -1)]) return KEYWORDS[s.slice(0, -1)];
  return null;
};

export type Badge = 'check' | 'cross' | 'win' | undefined;
/** phone = this shot shows the beat's phone screen (phone beats alternate phone / picture so the frame keeps changing) */
export type Shot = {from: number; to: number; icon: string; sat: string[]; badge: Badge; layout: number; beat: number; key: string; phone: boolean};

/** icons a prop brings, in order (with an optional badge each) */
export const propIcons = (prop: any): {icon: string; badge?: Badge}[] => {
  if (!prop) return [];
  const out: {icon: string; badge?: Badge}[] = [];
  const fromText = (t?: string) => (t ? t.split(/\s+/).map(iconForWord).find(Boolean) ?? null : null);
  switch (prop.type) {
    case 'vs':
      if (prop.left) out.push({icon: prop.left.icon ?? 'circle', badge: prop.winner === 'left' ? 'win' : 'cross'});
      if (prop.right) out.push({icon: prop.right.icon ?? 'circle', badge: prop.winner === 'right' ? 'win' : 'cross'});
      break;
    case 'checklist':
      (prop.items ?? []).forEach((it: any) => out.push({icon: typeof it === 'string' ? fromText(it) ?? 'circle-check' : it.icon ?? 'circle-check', badge: prop.plain ? undefined : 'check'}));
      break;
    case 'icons': case 'chips': case 'tiles': case 'flow': case 'orbit':
      (prop.items ?? []).forEach((it: any) => out.push({icon: typeof it === 'string' ? fromText(it) ?? prop.icon ?? 'sparkles' : it.icon ?? fromText(it.label) ?? 'sparkles', badge: it.win ? 'win' : undefined}));
      break;
    case 'burn':
      out.push({icon: fromText(prop.text) ?? 'file-text', badge: 'cross'}, {icon: 'flame'});
      break;
    case 'countdown':
      out.push({icon: 'timer'});
      break;
    case 'numbers':
      out.push({icon: 'list-ordered'});
      break;
    case 'intro':
      out.push({icon: 'hand'});
      break;
    case 'cta':
      out.push({icon: prop.icon ?? 'user-plus'});
      break;
    default:
      if (prop.icon) out.push({icon: prop.icon});
      else { const t = fromText(prop.title ?? prop.text ?? prop.label); if (t) out.push({icon: t}); }
  }
  return out;
};

/** Build the shot list: a new picture every ~1.2-2 s, cut on word boundaries. */
export const autoShots = (timing: Timing, beats: ResolvedBeat[], endFrame: number): Shot[] => {
  const shots: Shot[] = [];
  const hookEnd = Math.round(HOOK_SECONDS * FPS);
  const words = timing.words;
  let last = '';
  let k = 0;
  for (const b of beats) {
    const pool = propIcons(b.prop);
    let pi = 0;
    const bw = words.filter((w) => Math.round(w.start * FPS) >= b.from - 3 && Math.round(w.start * FPS) < b.to);
    let start = Math.max(b.from, b.index === 0 ? 0 : b.from);
    let i = 0;
    while (start < b.to - 6) {
      // window of ~1.5 s, extended to the next word boundary
      let end = Math.min(b.to, start + Math.round(1.5 * FPS));
      const nextWord = bw.find((w) => Math.round(w.start * FPS) >= end);
      if (nextWord && Math.round(nextWord.start * FPS) - end < 0.5 * FPS) end = Math.round(nextWord.start * FPS);
      if (b.to - end < 0.9 * FPS) end = b.to; // don't leave a tiny tail
      const ww = bw.filter((w) => Math.round(w.start * FPS) >= start - 2 && Math.round(w.start * FPS) < end);
      let icon: string | null = null;
      let badge: Badge;
      // keyword in what is being said wins when it is a strong match, otherwise walk the prop's icons
      const spoken = ww.map((w) => iconForWord(w.text)).filter(Boolean) as string[];
      if (pool.length && (pi < pool.length || !spoken.length)) {
        const p = pool[Math.min(pi, pool.length - 1)];
        icon = p.icon; badge = p.badge; pi++;
      }
      if (!icon) icon = spoken.find((s) => s !== last) ?? spoken[0] ?? null;
      if (!icon) icon = shots.length ? shots[shots.length - 1].icon : FALLBACK[(k) % FALLBACK.length];
      const sat = Array.from(new Set(spoken.filter((s) => s !== icon))).slice(0, 2);
      shots.push({from: start, to: end, icon, sat, badge, layout: k % 4, beat: b.index, key: `${b.index}-${i}`, phone: b.prop?.type === 'phone' && i % 2 === 0});
      last = icon; start = end; i++; k++;
    }
  }
  // before the first beat starts (hook) the first shot covers it
  if (shots.length && shots[0].from > 0) shots[0].from = 0;
  if (shots.length) shots[shots.length - 1].to = Math.max(shots[shots.length - 1].to, endFrame);
  void hookEnd;
  return shots;
};

export const shotAt = (shots: Shot[], frame: number) => {
  let s = shots[0];
  for (const x of shots) if (x.from <= frame) s = x;
  return s;
};
