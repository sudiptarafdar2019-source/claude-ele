import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../brand';

/** Flat cartoon backgrounds for the story template. Floor line is at y = 1300. */
export const SCENES = ['studio', 'office', 'shop', 'street', 'home'] as const;
const FLOOR = 1300;

const Floor: React.FC<{color: string; line?: string}> = ({color, line = 'rgba(10,22,51,0.08)'}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: FLOOR, bottom: 0, background: color, borderTop: `6px solid ${line}`}} />
);

const Plant: React.FC<{x: number; s?: number}> = ({x, s = 1}) => (
  <svg style={{position: 'absolute', left: x, top: FLOOR - 300 * s}} width={180 * s} height={300 * s} viewBox="0 0 180 300">
    <path d="M90 200 C40 160 20 90 50 40 C70 100 80 140 90 200 Z" fill="#2FB67C" />
    <path d="M90 200 C140 160 160 80 130 30 C110 100 100 140 90 200 Z" fill="#23996A" />
    <path d="M90 210 C60 150 70 80 92 20 C110 80 116 150 90 210 Z" fill="#3CCB8C" />
    <path d="M50 200 L130 200 L118 300 L62 300 Z" fill="#E8B04B" />
  </svg>
);

export const Scene: React.FC<{name?: string}> = ({name = 'studio'}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 10;
  switch (name) {
    case 'office':
      return (
        <AbsoluteFill style={{background: 'linear-gradient(180deg, #E3ECFF 0%, #F2F6FF 100%)'}}>
          {/* window with city */}
          <div style={{position: 'absolute', left: 90, top: 720, width: 460, height: 480, borderRadius: 28, background: 'linear-gradient(180deg, #8FD3FF, #D6F0FF)', border: '14px solid #fff', overflow: 'hidden', boxShadow: '0 20px 40px rgba(10,22,51,0.08)'}}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{position: 'absolute', bottom: 0, left: i * 110 - 10 + drift * 0.3, width: 90, height: 180 + ((i * 73) % 160), background: i % 2 ? '#3F6FD8' : '#5B86E8', borderRadius: '8px 8px 0 0'}} />
            ))}
            <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 14, background: '#fff'}} />
            <div style={{position: 'absolute', top: 0, bottom: 0, left: '50%', width: 14, background: '#fff'}} />
          </div>
          {/* shelf + frame */}
          <div style={{position: 'absolute', right: 90, top: 900, width: 300, height: 16, borderRadius: 8, background: '#C9D6F2'}} />
          <div style={{position: 'absolute', right: 120, top: 790, width: 90, height: 110, borderRadius: 10, background: C.blue}} />
          <div style={{position: 'absolute', right: 230, top: 830, width: 60, height: 70, borderRadius: 10, background: C.gold}} />
          <div style={{position: 'absolute', right: 130, top: 980, width: 200, height: 200, borderRadius: 999, border: '10px solid #fff', background: 'radial-gradient(circle, #0052FF 0 18%, transparent 19%), #DCE6FF'}} />
          <Plant x={840} s={1.1} />
          <Floor color="#C9D6F2" />
        </AbsoluteFill>
      );
    case 'shop':
      return (
        <AbsoluteFill style={{background: 'linear-gradient(180deg, #FFF3DE 0%, #FFF9EF 100%)'}}>
          {/* awning */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 150, display: 'flex'}}>
            {Array.from({length: 9}).map((_, i) => (
              <div key={i} style={{flex: 1, background: i % 2 ? '#fff' : C.blue, borderRadius: '0 0 60px 60px'}} />
            ))}
          </div>
          {/* shelves */}
          {[820, 1000].map((y) => (
            <React.Fragment key={y}>
              <div style={{position: 'absolute', left: 80, right: 80, top: y, height: 18, borderRadius: 9, background: '#D9A066'}} />
              {Array.from({length: 7}).map((_, i) => (
                <div key={i} style={{position: 'absolute', left: 110 + i * 125, top: y - 90 - (i % 3) * 10, width: 80, height: 90 + (i % 3) * 10, borderRadius: i % 2 ? 40 : 14, background: ['#E8B04B', '#FF8A65', '#19A7FF', '#2FB67C'][i % 4]}} />
              ))}
            </React.Fragment>
          ))}
          {/* counter */}
          <div style={{position: 'absolute', left: 60, right: 60, top: 1090, height: 210, borderRadius: '30px 30px 0 0', background: '#B8763F'}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 40, borderRadius: '30px 30px 0 0', background: '#D9A066'}} />
          </div>
          <Floor color="#E9C9A0" />
        </AbsoluteFill>
      );
    case 'street':
      return (
        <AbsoluteFill style={{background: 'linear-gradient(180deg, #7CC7FF 0%, #CDEBFF 70%)'}}>
          <div style={{position: 'absolute', left: 140 + drift, top: 300, width: 220, height: 80, borderRadius: 60, background: '#fff', opacity: 0.9}} />
          <div style={{position: 'absolute', right: 120 - drift, top: 420, width: 180, height: 64, borderRadius: 60, background: '#fff', opacity: 0.8}} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{position: 'absolute', bottom: 1920 - FLOOR, left: i * 190 - 30, width: 170, height: 300 + ((i * 97) % 220), background: ['#2C4FB8', '#3E63CF', '#24419C'][i % 3], borderRadius: '10px 10px 0 0'}}>
              {Array.from({length: 8}).map((_, k) => (
                <div key={k} style={{position: 'absolute', left: 24 + (k % 2) * 70, top: 30 + Math.floor(k / 2) * 80, width: 46, height: 50, borderRadius: 6, background: (k + i) % 3 ? 'rgba(255,255,255,0.25)' : '#FFD27A'}} />
              ))}
            </div>
          ))}
          <Floor color="#9AA6BD" line="#7E8AA3" />
        </AbsoluteFill>
      );
    case 'home':
      return (
        <AbsoluteFill style={{background: 'linear-gradient(180deg, #FCEFE8 0%, #FFF7F2 100%)'}}>
          <div style={{position: 'absolute', left: 120, top: 720, width: 280, height: 320, borderRadius: 20, border: '14px solid #fff', background: 'linear-gradient(180deg, #FFC48A, #FF8A65)'}} />
          <div style={{position: 'absolute', right: 140, top: 780, width: 16, height: 520, background: '#0A1633'}} />
          <div style={{position: 'absolute', right: 70, top: 720, width: 160, height: 120, borderRadius: '80px 80px 10px 10px', background: C.gold}} />
          <div style={{position: 'absolute', left: 80, right: 80, top: 1000, height: 300, borderRadius: '60px 60px 20px 20px', background: '#5B86E8'}}>
            <div style={{position: 'absolute', left: 30, right: 30, top: -60, height: 160, borderRadius: 50, background: '#3F6FD8'}} />
          </div>
          <Floor color="#E7CDB8" />
        </AbsoluteFill>
      );
    default:
      return (
        <AbsoluteFill style={{background: 'linear-gradient(180deg, #EAF1FF 0%, #F7FAFF 100%)'}}>
          <div style={{position: 'absolute', left: '50%', top: 760, width: 1300, height: 1300, marginLeft: -650, marginTop: -650, borderRadius: 999, border: '3px solid rgba(0,82,255,0.10)', transform: `rotate(${frame * 0.1}deg)`}}>
            <div style={{position: 'absolute', left: '50%', top: -12, width: 24, height: 24, borderRadius: 99, background: C.blue}} />
          </div>
          <div style={{position: 'absolute', left: '50%', top: 760, width: 860, height: 860, marginLeft: -430, marginTop: -430, borderRadius: 999, border: '3px solid rgba(0,82,255,0.08)'}} />
          <Plant x={60} s={0.9} />
          <Floor color="#DCE6FA" />
        </AbsoluteFill>
      );
  }
};
