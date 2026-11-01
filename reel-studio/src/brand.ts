
import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fonts are stored in public/fonts so renders never depend on the internet.
const load = (family: string, file: string, weight: string, style = 'normal') =>
  loadFont({family, url: staticFile(`fonts/${file}`), weight, style});
load('Plus Jakarta Sans', 'PlusJakartaSans-800.woff2', '200 800');
load('Inter', 'Inter-400.woff2', '100 900');
load('Instrument Serif', 'InstrumentSerif-400-italic.woff2', '400', 'italic');
load('Kalam', 'Kalam-400.woff2', '400');
load('Kalam', 'Kalam-700.woff2', '700');

export const fonts = {
  heading: "'Plus Jakarta Sans', sans-serif",
  body: "'Inter', sans-serif",
  serif: "'Instrument Serif', serif",
  hand: "'Kalam', cursive",
};

// Orbirise brand tokens (brand/website-theme.md)
export const C = {
  blue: '#0052FF', blueHover: '#0041CC', navy: '#0A1633', sky: '#19A7FF', skyText: '#5CC1FF',
  ink: '#3D4A63', mist: '#64708A', cloud: '#F5F8FC', space: '#071330', card: '#0E1C40',
  line: '#E3E8F0', lineDark: '#1E2C52', gold: '#E8B04B', goldLight: '#F2C66D', goldText: '#8A5F10',
  ivory: '#FBF8F2', white: '#FFFFFF', bodyDark: '#B8C3D9', red: '#FF4D5E', green: '#1FC77E',
};
export const grad = `linear-gradient(135deg, ${C.blue} 0%, ${C.sky} 100%)`;
export const W = 1080;
export const H = 1920;
export const FPS = 30;
