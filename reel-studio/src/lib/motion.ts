import {interpolate, spring, Easing} from 'remotion';
import {FPS} from '../brand';

export const pop = (frame: number, delay = 0, damping = 12, mass = 0.6) =>
  spring({frame: frame - delay, fps: FPS, config: {damping, mass, stiffness: 180}});
export const ease = (frame: number, a: number, b: number, from = 0, to = 1, e = Easing.bezier(0.22, 1, 0.36, 1)) =>
  interpolate(frame, [a, b], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
/** deterministic pseudo-random */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
/** small camera shake that dies out */
export const shake = (frame: number, start: number, amp = 14, len = 10) => {
  const t = frame - start;
  if (t < 0 || t > len) return {x: 0, y: 0};
  const k = (1 - t / len) * amp;
  return {x: Math.sin(t * 2.7) * k, y: Math.cos(t * 3.3) * k * 0.6};
};
