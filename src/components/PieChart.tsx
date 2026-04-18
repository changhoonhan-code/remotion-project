import React, { useMemo } from "react";
import { interpolate, useCurrentFrame, Easing } from "remotion";

/**
 * 차트 슬라이스 한 조각의 상세 데이터를 정의합니다.
 */
interface ChartSlice {
  label: string;
  value: number; // 0 ~ 100 사이의 퍼센트
  color: string; // 현재 사용되지 않지만 데이터 스키마상 유지
  patternImage: string; // (필수) 배경 이미지 패턴 경로
  durationFrames: number; // (추가) 이 조각이 그려지는 데 할당할 프레임 수
}

interface PieChartProps {
  data: ChartSlice[];
  size: number;
}

/**
 * [원형 차트 컴포넌트]
 * SVG를 사용하여 각 조각을 렌더링하며, feTurbulence 필터를 통해 
 * 완벽한 원이 아닌 손으로 그린 듯한(Rough Edge) 효과를 줍니다.
 */
export const PieChart: React.FC<PieChartProps> = ({ data, size }) => {
  const frame = useCurrentFrame(); // Sequence 내부 상대적 프레임
  const center = size / 2;
  const radius = center * 0.85; // 다소 여유 있게 배치

  // 각 조각의 시작 각도와 종료 각도, 그리고 개별 애니메이션 타이밍 프레임을 계산하여 메모이제이션합니다.
  const slices = useMemo(() => {
    const startAngle = -Math.PI / 2; // 상단(12시 방향)에서 무조건 동시 시작

    // 배열의 역순으로(가장 상단에 올 작은 조각부터) 값을 누적합 합니다.
    // 첫번째 조각(가장 큰 조각)은 가장 아래에 깔리며, 누적값이 100이 되어 완전한 원이 됩니다.
    let accumulatedValue = 0;
    const evaluatedSlices = [...data].reverse().map((d) => {
      accumulatedValue += d.value;
      return {
        ...d,
        targetValue: accumulatedValue // 이 조각이 그려야 할 12시 기준 목표 퍼센트
      };
    }).reverse();

    return evaluatedSlices.map((d) => {
      const endAngle = startAngle + (d.targetValue / 100) * 2 * Math.PI;
      
      // 모든 조각이 동시에 그려지기 시작하도록 startFrame을 0으로 고정합니다.
      const startFrame = 0;
      const endFrame = d.durationFrames; // 프레임 단위입니다. (Root.tsx에서 30이었던 값이 2, 3 등으로 입력된 경우 매우 빠름)

      return { ...d, start: startAngle, end: endAngle, startFrame, endFrame };
    });
  }, [data]);

  /**
   * 폴라 좌표(각도, 반지름)를 데카르트 좌표(x, y)로 환산하는 헬퍼 함수
   */
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInRadians: number) => {
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  /**
   * SVG Path의 'd' 속성을 생성하는 함수 부채꼴 모양을 만듭니다.
   */
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    // [중요 버그 수정]: 완전한 360도 원(Math.PI * 2)을 그릴 때 시작점과 끝점이 같아져 SVG Path가 사라지는 이슈 방지
    let effectiveEndAngle = endAngle;
    if (endAngle - startAngle >= Math.PI * 2) {
      effectiveEndAngle = startAngle + Math.PI * 2 - 0.0001;
    }

    const start = polarToCartesian(x, y, radius, effectiveEndAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = effectiveEndAngle - startAngle <= Math.PI ? "0" : "1";

    return [
      "M", x, y,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z",
    ].join(" ");
  };

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
