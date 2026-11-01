export type Word = {text: string; tag: string; line: number; emph: boolean; start: number; end: number};
export type Timing = {duration: number; words: Word[]};
export type Prop = {type: string; [k: string]: any};
export type Beat = {
  at: string; pose?: string; face?: string; eyebrow?: string; headline?: string; title?: string;
  number?: string; show?: string | string[]; prop?: Prop; sfx?: string; write?: string; draw?: string; hand?: string;
  shot?: string; warm?: boolean;
  /** story template: who is on screen, who talks, bubble text, background */
  cast?: {who: string; do?: string; mood?: string}[]; speaker?: string; say?: string; think?: string; scene?: string;
};
export type ReelSpec = {
  id: string; day?: number; template: 'toon' | 'faces' | 'hands' | 'podcast' | 'tips' | 'story'; scene?: string;
  voice: string; music?: string; musicVolume?: number;
  /** volume controls: voice 0-2 (1 = normal), music 0-1 (0.07 = default), sfx 0-1 (0 = no effect sounds, 0.6 = default) */
  mix?: {voice?: number; music?: number; sfx?: number};
  /** voice polish: studio (default), warm (podcast default), clean, none */
  voiceFx?: 'studio' | 'warm' | 'clean' | 'none'; hook: string; hookHighlight?: string;
  script: string; beats: Beat[]; cta?: {text: string; sub?: string};
  cover?: {kicker?: string; title: string; highlight?: string; after?: string; face?: string; pose?: string; hand?: string};
  podcast?: {show: string; episode: string; name: string; role: string; video?: string};
};
export type ResolvedBeat = Beat & {index: number; from: number; to: number; wordIndex: number};
export type ReelProps = {reel: ReelSpec; timing: Timing};
