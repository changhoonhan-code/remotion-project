import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const NoiseOverlay: React.FC<{
  opacity?: number;
  blendMode?: React.CSSProperties['mixBlendMode'];
  zIndex?: number;
  grainSize?: number; // 입자 배율 (기본값 1.0)
  baseFrequency?: number; // 입자 세밀도 (낮을수록 굵어짐, 기본값 0.8)
}> = ({
  opacity = 0.25,
  blendMode = 'multiply',
  zIndex = 999,
  grainSize = 1.4,
  baseFrequency = 0.4
}) => {
    const frame = useCurrentFrame();

    // grainSize를 통해 전체적인 텍스처 배율을 조절합니다.
    const bgSize = 200 * grainSize;

    // baseFrequency가 변하면 노이즈 입자의 밀도와 굵기가 실시간으로 변합니다.
    const noiseSvgStr = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${baseFrequency}' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

    const noiseTick = Math.floor(frame / 2);
    const noiseOffsetX = (noiseTick * 137) % 200;
    const noiseOffsetY = (noiseTick * 193) % 200;

    return (
      <AbsoluteFill style={{
        pointerEvents: 'none',
        backgroundImage: noiseSvgStr,
        backgroundSize: `${bgSize}px ${bgSize}px`,
        backgroundPosition: `${noiseOffsetX}px ${noiseOffsetY}px`,
        mixBlendMode: blendMode,
        opacity: opacity,
        zIndex: zIndex,
      }} />
    );
  };
