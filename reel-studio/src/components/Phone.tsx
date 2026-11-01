import React from 'react';
import {C, fonts} from '../brand';
import {ease, pop} from '../lib/motion';
import {itemFrames} from '../lib/timing';
import {Icon} from './Icon';
import {Prop} from '../types';

/** A clean phone mockup. Screens: notifications, chat, website. */
export const Phone: React.FC<{prop: Prop; f: number; dur: number; width?: number}> = ({prop, f, dur, width = 470}) => {
  const h = width * 2.05;
  return (
    <div style={{width, height: h, borderRadius: width * 0.13, background: '#0B0F1A', padding: width * 0.035, boxShadow: '0 40px 90px rgba(7,19,48,0.35), inset 0 0 0 3px #2A3350'}}>
      <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: width * 0.105, overflow: 'hidden', background: prop.screen === 'website' ? '#fff' : 'linear-gradient(180deg,#1b2a55 0%, #0b1533 100%)'}}>
        <div style={{position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: width * 0.3, height: 30, borderRadius: 20, background: '#000', zIndex: 5}} />
        <div style={{position: 'absolute', top: 16, left: 30, fontFamily: fonts.body, fontWeight: 600, fontSize: 22, color: prop.screen === 'website' ? C.navy : '#fff', zIndex: 4}}>9:41</div>
        {prop.screen === 'notifications' && <Notifs prop={prop} f={f} dur={dur} w={width} />}
        {prop.screen === 'chat' && <Chat prop={prop} f={f} dur={dur} w={width} />}
        {prop.screen === 'website' && <Site prop={prop} f={f} dur={dur} w={width} />}
      </div>
    </div>
  );
};

export const notifFrames = (prop: Prop, dur: number) => itemFrames(prop.items?.length ?? 0, dur, 8, 18);
const Notifs: React.FC<{prop: Prop; f: number; dur: number; w: number}> = ({prop, f, dur, w}) => {
  const fr = notifFrames(prop, dur);
  const k = w / 430;
  return (
    <div style={{position: 'absolute', top: 110, left: 18, right: 18, display: 'flex', flexDirection: 'column', gap: 16}}>
      <div style={{textAlign: 'center', fontFamily: fonts.heading, fontWeight: 600, fontSize: w * 0.16, color: 'rgba(255,255,255,0.92)', marginBottom: 20}}>9:41</div>
      {prop.items.map((it: any, i: number) => {
        const s = pop(f, fr[i], 13);
        return (
          <div key={i} style={{transform: `translateY(${(1 - s) * -40}px) scale(${0.9 + 0.1 * s})`, opacity: s, background: 'rgba(255,255,255,0.92)', borderRadius: 26, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start', boxShadow: '0 10px 30px rgba(0,0,0,0.25)'}}>
            <div style={{width: 52, height: 52, borderRadius: 14, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <Icon name={/mail|email/i.test(it.app) ? 'mail' : /insta/i.test(it.app) ? 'instagram' : /alert/i.test(it.app) ? 'bell-ring' : 'message-circle'} size={30} color="#fff" />
            </div>
            <div style={{fontFamily: fonts.body, color: C.navy, minWidth: 0}}>
              <div style={{fontSize: 17 * k, fontWeight: 600, color: C.mist, textTransform: 'uppercase', letterSpacing: '0.04em'}}>{it.app} · now</div>
              <div style={{fontSize: 27 * k, fontWeight: 700, marginTop: 2}}>{it.title}</div>
              <div style={{fontSize: 24 * k, color: C.ink, marginTop: 2, lineHeight: 1.25}}>{it.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const chatFrames = (prop: Prop, dur: number) => itemFrames(prop.messages?.length ?? 0, dur, 8, 28);
const Chat: React.FC<{prop: Prop; f: number; dur: number; w: number}> = ({prop, f, dur}) => {
  const fr = chatFrames(prop, dur);
  return (
    <div style={{position: 'absolute', inset: 0, background: '#F2F4F8'}}>
      <div style={{height: 150, background: '#fff', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 18, fontFamily: fonts.body, fontWeight: 700, fontSize: 26, color: C.navy}}>Messages</div>
      <div style={{padding: 22, display: 'flex', flexDirection: 'column', gap: 16}}>
        {prop.messages.map((m: any, i: number) => {
          const s = pop(f, fr[i], 13);
          const me = m.from === 'me';
          return (
            <div key={i} style={{alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '82%', transform: `scale(${s})`, transformOrigin: me ? 'right bottom' : 'left bottom', opacity: s, background: me ? C.blue : '#fff', color: me ? '#fff' : C.navy, borderRadius: 28, padding: '16px 22px', fontFamily: fonts.body, fontSize: 25, lineHeight: 1.3, boxShadow: '0 6px 18px rgba(10,22,51,0.08)'}}>{m.text}</div>
          );
        })}
      </div>
    </div>
  );
};

export const tapFrame = (dur: number) => Math.min(Math.round(dur * 0.55), 40);
const Site: React.FC<{prop: Prop; f: number; dur: number; w: number}> = ({prop, f, dur, w}) => {
  const s = prop.site;
  const k = w / 470;
  const hiOn = ease(f, 10, 20);
  const ring = (key: string) => (prop.highlight === key ? {boxShadow: `0 0 0 ${6 * hiOn}px ${C.gold}`, borderRadius: 14} : {});
  const tf = tapFrame(dur);
  const pressed = prop.tap && f >= tf && f < tf + 8;
  const cross = prop.crossHeadline ? ease(f, 12, 22) : 0;
  return (
    <div style={{position: 'absolute', inset: 0, fontFamily: fonts.body}}>
      <div style={{height: 120 * k, borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'flex-end', padding: `0 ${26 * k}px ${16 * k}px`, justifyContent: 'space-between'}}>
        <span style={{fontWeight: 800, fontSize: 24 * k, color: C.navy, fontFamily: fonts.heading}}>{s.name}</span>
        <Icon name="menu" size={30 * k} color={C.navy} />
      </div>
      <div style={{padding: `${34 * k}px ${28 * k}px`, display: 'flex', flexDirection: 'column', gap: 22 * k}}>
        {s.tag && <div style={{alignSelf: 'flex-start', padding: `${8 * k}px ${16 * k}px`, background: '#EAF1FF', color: C.blue, fontWeight: 700, fontSize: 20 * k, ...ring('tag')}}>{s.tag}</div>}
        <div style={{position: 'relative', fontFamily: fonts.heading, fontWeight: 800, fontSize: (s.headline.length > 30 ? 38 : 46) * k, lineHeight: 1.1, color: C.navy, letterSpacing: '-0.02em', padding: 4, ...ring('headline')}}>
          {s.headline}
          {cross > 0 && <div style={{position: 'absolute', left: 0, top: '50%', height: 8 * k, width: `${cross * 100}%`, background: C.red, borderRadius: 6, transform: 'rotate(-4deg)'}} />}
        </div>
        <div style={{fontSize: 22 * k, color: C.mist, lineHeight: 1.35}}>{s.sub}</div>
        <div style={{alignSelf: 'flex-start', marginTop: 8 * k, padding: `${18 * k}px ${30 * k}px`, borderRadius: 999, background: /submit/i.test(s.button) ? '#9AA3B5' : C.blue, color: '#fff', fontWeight: 700, fontSize: 24 * k, transform: `scale(${pressed ? 0.93 : 1})`, ...ring('button'), ...(prop.highlight === 'button' ? {borderRadius: 999} : {})}}>{s.button}</div>
        <div style={{height: 180 * k, borderRadius: 18 * k, background: 'linear-gradient(135deg,#EAF1FF,#F5F8FC)', marginTop: 10 * k}} />
      </div>
      {prop.firstScreen && (
        <div style={{position: 'absolute', left: 10, right: 10, top: 10, height: '62%', border: `5px dashed ${C.gold}`, borderRadius: 30, opacity: ease(f, 12, 22)}} />
      )}
    </div>
  );
};
