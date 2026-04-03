import React, { useMemo } from "react";
import { interpolate } from "remotion";

/**
 * 차트 슬라이스 한 조각의 상세 데이터를 정의합니다.
 */
export interface ChartSlice {
  label: string;
  value: number; // 0 ~ 100 사이의 퍼센트
  color: string;
  patternImage?: string; // (선택사항) 배경 이미지 패턴 경로
}

interface PieChartProps {
  data: ChartSlice[];
  size: number;
  drawProgress: number; // 0 (없음) ~ 1 (완성)
}

/**
 * [원형 차트 컴포넌트]
 * SVG를 사용하여 각 조각을 렌더링하며, feTurbulence 필터를 통해 
 * 완벽한 원이 아닌 손으로 그린 듯한(Rough Edge) 효과를 줍니다.
 */
export const PieChart: React.FC<PieChartProps> = ({ data, size, drawProgress }) => {
  const center = size / 2;
  const radius = center * 0.85; // 다소 여유 있게 배치

  // 각 조각의 시작 각도와 끝 각도를 계산하여 메모이제이션합니다.
  const slices = useMemo(() => {
    let currentAngle = -Math.PI / 2; // 상단(12시 방향)에서 시작
    return data.map((d) => {
      const sliceAngle = (d.value / 100) * 2 * Math.PI;
      const start = currentAngle;
      const end = currentAngle + sliceAngle;
      currentAngle += sliceAngle;
      return { ...d, start, end };
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
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";

    return [
      "M", x, y,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z",
    ].join(" ");
  };

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      {/* 
        [ SVG 필터 및 패턴 정의 ]
        거친 질감(Rough Edge)과 입체적인 린넨(3D Linen) 질감을 생성하기 위한 핵심 부분입니다.
      */}
      <svg width="0" height="0" className="absolute opacity-0">
        <defs>
          <filter id="rough-surface">
            {/* 
              자연스러운 손그림 느낌을 위해 주파수(baseFrequency)를 낮추고 
              디테일(numOctaves)을 조절합니다. 
            */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.03"
              numOctaves="3"
              result="noise"
            />
            {/* 스케일을 적절히 조절하여 외곽선만 살짝 구불구불하게 만듭니다. */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>


          {/* 4. [동적 패턴] 각 슬라이스별 배경 이미지 패턴 */}
          {slices.map((slice, i) => {
            if (!slice.patternImage) return null;
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

      <svg width={size} height={size} style={{ filter: "url(#rough-surface)" }}>
        <g>
          {slices.map((slice, i) => {
            // 레퍼런스 스타일: 전체가 한 번에 그려지는 게 아니라,
            // drawProgress가 0~1로 갈 때 각 조각이 순차적으로 차오르게 구현.
            const sliceProgress = interpolate(
              drawProgress,
              [i / slices.length, (i + 1) / slices.length],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            const endAngle = slice.start + (slice.end - slice.start) * sliceProgress;

            if (sliceProgress <= 0) return null;

            const pathD = describeArc(center, center, radius, slice.start, endAngle);

            return (
              <React.Fragment key={i}>
                {/* 1. 베이스 컬러 또는 이미지 패턴 레이어 */}
                <path
                  d={pathD}
                  fill={`url(#slice-pattern-${i})`}
                  style={{
                    opacity: 0.98,
                  }}
                />
              </React.Fragment>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
