export type Word = {text: string; tag: string; line: number; emph: boolean; start: number; end: number};
export type Timing = {duration: number; words: Word[]};
export type Prop = {type: string; [k: string]: any};
export type Beat = {
  at: string; pose?: string; face?: string; eyebrow?: string; headline?: string; title?: string;
  number?: string; prop?: Prop; sfx?: string; write?: string; draw?: string; hand?: string;
  shot?: string; warm?: boolean;
};
export type ReelSpec = {
  id: string; day?: number; template: 'toon' | 'faces' | 'hands' | 'podcast' | 'tips';
  voice: string; music?: string; musicVolume?: number; hook: string; hookHighlight?: string;
  script: string; beats: Beat[]; cta?: {text: string; sub?: string};
  cover?: {kicker?: string; title: string; highlight?: string; after?: string; face?: string; pose?: string; hand?: string};
  podcast?: {show: string; episode: string; name: string; role: string; video?: string};
};
export type ResolvedBeat = Beat & {index: number; from: number; to: number; wordIndex: number};
export type ReelProps = {reel: ReelSpec; timing: Timing};
