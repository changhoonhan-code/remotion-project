import React from "react";
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { PieChartProps } from "./types";
import { describeArc } from "./utils/math";
import { useChartSlices } from "./hooks/useChartSlices";

/**
 * [원형 차트 컴포넌트]
 * SVG를 사용하여 각 조각을 렌더링하며, feTurbulence 필터를 통해 
 * 완벽한 원이 아닌 손으로 그린 듯한(Rough Edge) 효과를 줍니다.
 */
export const PieChart: React.FC<PieChartProps> = ({ data, size }) => {
  const frame = useCurrentFrame(); // Sequence 내부 상대적 프레임
  const center = size / 2;
  const radius = center * 0.85; // 다소 여유 있게 배치

  // 핵심 계산 로직은 커스텀 훅으로 위임
  const slices = useChartSlices(data);

  return (
    <div style={{ width: size, height: size, position: 'relative', mixBlendMode: 'multiply' }}>
      {/* 
        [ SVG 필터 및 패턴 정의 ]
        거친 질감(Rough Edge)과 입체적인 린넨(3D Linen) 질감을 생성하기 위한 핵심 부분입니다.
      */}
      <svg width="0" height="0" className="absolute opacity-0">
        <defs>
          {/* 1. [개별 손그림 필터] 조각이 맞닿는 시작/끝 경계선도 독립적으로 흔들리도록 조각마다 시드 부여 */}
          {slices.map((_, i) => (
            <filter key={`filter-${i}`} id={`rough-surface-${i}`} x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.04"
                numOctaves="3"
                seed={i * 77 + 1} // 조각마다 다른 노이즈 시드값 부여
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="6"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          ))}


          {/* 4. [동적 패턴] 각 슬라이스별 배경 이미지 패턴 */}
          {slices.map((slice, i) => {
            if (!slice.patternImage) {
              throw new Error(`PieChart: '${slice.label}' 조각에 필수로 요구되는 patternImage가 제공되지 않았습니다.`);
            }
            return (
              <pattern
                key={`pattern-${i}`}
                id={`slice-pattern-${i}`}
                patternUnits="userSpaceOnUse"
                width={size}
                height={size}
              >
                <image
                  href={slice.patternImage}
                  width={size}
                  height={size}
                  preserveAspectRatio="xMidYMid slice"
                />
              </pattern>
            );
          })}
        </defs>
      </svg>

      {/* 기존에 전체 SVG에 걸던 필터를 제거 (전체에 걸면 합쳐진 뒤 필터가 먹으므로 내부 경계선이 안 흔들림) */}
      <svg width={size} height={size}>
        <g>
          {slices.map((slice, i) => {
            // 외부 조각 데이터에 명시된 durationFrames(startFrame ~ endFrame) 동안 해당 조각을 0% -> 100%로 그려냅니다. Easing 적용으로 부드럽게 연출합니다.
            const sliceProgress = interpolate(
              frame,
              [slice.startFrame, slice.endFrame],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.25, 1, 0.5, 1) }
            );

            const endAngle = slice.start + (slice.end - slice.start) * sliceProgress;

            if (sliceProgress <= 0) return null;

            const pathD = describeArc(center, center, radius, slice.start, endAngle);

            return (
              /* Fragment를 제거하고 path 엘리먼트에 직접 key를 할당하여 중첩을 줄입니다. */
              <path
                key={i}
                d={pathD}
                fill={`url(#slice-pattern-${i})`}
                style={{
                  opacity: 0.98,
                  filter: `url(#rough-surface-${i})` // (핵심) 조각마다 다른 노이즈 필터를 주입!!
                }}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
};
