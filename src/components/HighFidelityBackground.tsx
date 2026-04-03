import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

/**
 * [종이 질감 및 격자 배경 컴포넌트]
 * 레퍼런스 영상의 아날로그적인 느낌을 재현하기 위해 따뜻한 톤, 미세한 격자, 
 * 그리고 애니메이션되는 노이즈를 결합합니다.
 */
export const HighFidelityBackground: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill className="bg-[#F9F7F2]">
      {/* 1. 미세한 격자 (Grid) 레이어 */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          opacity: 0.8,
        }}
      />

      {/* 2. 종이 질감 및 입체 직물 필터 (SVG) */}
      <svg className="hidden">
        <defs>
          <filter id="paper-texture">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.6"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="0.05" />
              <feFuncG type="linear" slope="0.05" />
              <feFuncB type="linear" slope="0.05" />
            </feComponentTransfer>
          </filter>

          {/* 배경용 3D 린넨 그림자 패턴 */}
          <pattern id="bg-linen-shadow" width="3" height="3" patternUnits="userSpaceOnUse">
             <path d="M 3 0 L 0 0 0 3" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
          </pattern>

          {/* 배경용 3D 린넨 하이라이트 패턴 (오프셋) */}
          <pattern id="bg-linen-highlight" width="3" height="3" patternUnits="userSpaceOnUse" x="0.5" y="0.5">
             <path d="M 3 0 L 0 0 0 3" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" />
          </pattern>
        </defs>
      </svg>

      {/* 3. 직물 질감 레이어 (Shadow + Highlight) */}
      <AbsoluteFill
        style={{
          backgroundImage: "url(#bg-linen-shadow)",
          mixBlendMode: "multiply",
          opacity: 0.4,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: "url(#bg-linen-highlight)",
          mixBlendMode: "screen",
          opacity: 0.6,
        }}
      />

      {/* 4. 노이즈 레이어 (믹스 블렌드 모드 활용) */}
      <AbsoluteFill
        style={{
          filter: "url(#paper-texture)",
          opacity: 0.15,
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }}
      />

      {/* 5. 미세한 깜빡임 효과 (Film Grain 느낌) */}
      <AbsoluteFill
        style={{
          backgroundColor: "#000",
          opacity: (Math.sin(frame * 0.5) * 0.005) + 0.01,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
