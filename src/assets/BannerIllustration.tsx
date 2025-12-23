// src/assets/BannerIllustration.tsx
// Simple music-themed SVG illustration for Home banner
import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

type Props = {
  width?: number;
  height?: number;
};

export default function BannerIllustration({ width = 300, height = 200 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 300 200" fill="none">
      {/* Background elements */}
      <Circle cx="240" cy="40" r="30" fill="#e6eeff" opacity="0.5" />
      <Circle cx="60" cy="160" r="25" fill="#fff0e6" opacity="0.5" />
      
      {/* Music note 1 */}
      <Path
        d="M80 100 L80 60 L110 55 L110 95 M80 100 C80 105.5 74.5 110 67.5 110 C60.5 110 55 105.5 55 100 C55 94.5 60.5 90 67.5 90 C74.5 90 80 94.5 80 100 Z"
        fill="#2f6dfd"
      />
      
      {/* Music note 2 */}
      <Path
        d="M120 85 L120 45 L150 40 L150 80 M120 85 C120 90.5 114.5 95 107.5 95 C100.5 95 95 90.5 95 85 C95 79.5 100.5 75 107.5 75 C114.5 75 120 79.5 120 85 Z"
        fill="#ffd166"
      />
      
      {/* Headphone arc */}
      <Path
        d="M170 100 C170 75 190 55 215 55 C240 55 260 75 260 100"
        stroke="#2f6dfd"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Headphone left cup */}
      <Rect x="165" y="100" width="15" height="25" rx="7" fill="#2f6dfd" />
      
      {/* Headphone right cup */}
      <Rect x="250" y="100" width="15" height="25" rx="7" fill="#2f6dfd" />
      
      {/* Waveform bars */}
      <Rect x="40" y="140" width="8" height="20" rx="4" fill="#e0e7ff" />
      <Rect x="52" y="130" width="8" height="30" rx="4" fill="#e0e7ff" />
      <Rect x="64" y="135" width="8" height="25" rx="4" fill="#e0e7ff" />
      <Rect x="76" y="125" width="8" height="35" rx="4" fill="#e0e7ff" />
      <Rect x="88" y="140" width="8" height="20" rx="4" fill="#e0e7ff" />
      
      {/* Play button circle */}
      <Circle cx="215" cy="145" r="22" fill="#ffd166" />
      <Path
        d="M210 135 L225 145 L210 155 Z"
        fill="#fff"
      />
    </Svg>
  );
}
