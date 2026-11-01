import React from 'react';
import {icons} from 'lucide-react';

const pascal = (s: string) => s.split(/[-_ ]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
/** Any icon from lucide.dev by its name, e.g. "zap", "bell-ring", "message-square-reply". */
export const Icon: React.FC<{name: string; size?: number; color?: string; stroke?: number; style?: React.CSSProperties}> = ({
  name, size = 64, color = 'currentColor', stroke = 2.2, style,
}) => {
  const Cmp = (icons as any)[pascal(name)] ?? (icons as any).Sparkles;
  return <Cmp size={size} color={color} strokeWidth={stroke} style={style} />;
};
