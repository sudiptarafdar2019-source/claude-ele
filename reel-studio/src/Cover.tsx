import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, fonts, grad} from './brand';
import {DarkBg, LightBg, Logo} from './components/Common';
import {faceSrc} from './lib/faces';
import {ReelProps} from './types';

/**
 * COVER TEMPLATES (1080x1920). All text sits inside the centre 1080x1350 area so the
 * cover still reads when Instagram crops it to 4:5 / 3:4 on your profile grid.
 * Style follows the reel's template.
 */
export const Cover: React.FC<ReelProps> = ({reel}) => {
  const cv = reel.cover ?? {title: reel.hook};
  const t = reel.template;
  const dark = t !== 'toon' && t !== 'hands';
  const fg = dark ? '#fff' : C.navy;
  const accent = dark ? C.gold : C.blue;
  const day = reel.day ? `DAY ${reel.day}` : '';
  const Title = (
    <div style={{fontFamily: fonts.heading, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.98, color: fg, textAlign: 'center'}}>
      <div style={{fontSize: 104}}>{cv.title}</div>
      {cv.highlight && <div style={{fontSize: cv.highlight.length > 10 ? 132 : 170, color: accent, textShadow: dark ? '0 10px 50px rgba(232,176,75,0.35)' : 'none'}}>{cv.highlight}</div>}
      {cv.after && <div style={{fontFamily: fonts.serif, fontStyle: 'italic', fontWeight: 400, letterSpacing: 0, fontSize: 80, color: dark ? C.bodyDark : C.ink, marginTop: 14}}>{cv.after}</div>}
    </div>
  );
  const Kicker = cv.kicker && (
    <div style={{display: 'inline-block', padding: '14px 30px', borderRadius: 999, background: dark ? 'rgba(255,255,255,0.1)' : '#EAF1FF', border: dark ? '2px solid rgba(255,255,255,0.18)' : 'none', color: dark ? C.gold : C.blue, fontFamily: fonts.body, fontWeight: 700, fontSize: 34, letterSpacing: '0.14em'}}>{cv.kicker.toUpperCase()}</div>
  );
  let hero: React.ReactNode = null;
  if (t === 'faces' || t === 'tips') hero = <Img src={staticFile(faceSrc(cv.face ?? 'pointing-you'))} style={{height: 900, filter: 'drop-shadow(0 0 4px #fff) drop-shadow(0 40px 60px rgba(0,0,0,0.5))'}} />;
  if (t === 'toon') hero = <Img src={staticFile(`img/cartoon/${cv.pose ?? 'pointing'}.png`)} style={{height: 820, filter: 'drop-shadow(0 40px 60px rgba(10,22,51,0.25))'}} />;
  if (t === 'hands') hero = <Img src={staticFile(`img/hands/${cv.hand ?? 'point-up'}.png`)} style={{height: 700, filter: 'drop-shadow(20px 40px 40px rgba(10,22,51,0.25))'}} />;
  return (
    <AbsoluteFill>
      {t === 'podcast' ? (
        <AbsoluteFill>
          <Img src={staticFile('img/podcast/wide-a.jpg')} style={{position: 'absolute', height: 1920, left: -1020}} />
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,19,48,0.2) 0%, rgba(7,19,48,0.35) 40%, rgba(7,19,48,0.96) 72%)'}} />
        </AbsoluteFill>
      ) : dark ? (
        t === 'tips' ? <AbsoluteFill style={{background: 'linear-gradient(165deg, #0047E0 0%, #0A1F5C 45%, #071330 100%)'}} /> : <DarkBg />
      ) : t === 'hands' ? (
        <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, #FFFFFF 0%, #F3F5F9 70%, #E7EBF2 100%)'}} />
      ) : (
        <LightBg />
      )}
      {hero && <div style={{position: 'absolute', bottom: -20, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>{hero}</div>}
      {t !== 'podcast' && hero && <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 360, background: dark ? 'linear-gradient(180deg, rgba(7,19,48,0), rgba(7,19,48,0.85))' : 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.7))'}} />}
      <div style={{position: 'absolute', top: t === 'podcast' ? 1010 : 360, left: 60, right: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
        {Kicker}
        {Title}
      </div>
      {t === 'podcast' && (
        <div style={{position: 'absolute', top: 330, left: 70, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 26px', borderRadius: 999, background: 'rgba(7,19,48,0.7)', color: '#fff', fontFamily: fonts.body, fontWeight: 700, fontSize: 30, letterSpacing: '0.12em'}}>
          <div style={{width: 16, height: 16, borderRadius: 99, background: C.red}} /> PODCAST
        </div>
      )}
      <div style={{position: 'absolute', top: t === 'podcast' ? 1560 : 200, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24}}>
        <div style={{padding: '12px 22px', borderRadius: 16, background: dark ? 'rgba(7,19,48,0.75)' : 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 20}}>
          <Logo dark={dark} width={240} />
          {day && <div style={{padding: '8px 18px', borderRadius: 10, background: grad, color: '#fff', fontFamily: fonts.heading, fontWeight: 800, fontSize: 30}}>{day}</div>}
        </div>
      </div>
    </AbsoluteFill>
  );
};
