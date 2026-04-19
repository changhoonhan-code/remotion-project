import React, { useMemo } from 'react';
import rough from 'roughjs';
import { Easing, interpolate } from 'remotion';

import { DrawingAnimationOptions } from './types';
interface CircleOverlayProps {
    centerX: number;        // 화면 상의 중심 X 좌표 (픽셀)
    centerY: number;        // 화면 상의 중심 Y 좌표 (픽셀)
    width: number;          // 타원의 가로 폭 (픽셀)
    height: number;         // 타원의 세로 폭 (픽셀)
    drawProgress: number;   // 그리기 진행률 (0: 시작 안 함, 1: 완료)
    options?: DrawingAnimationOptions; // 상세 스타일 옵션
}

export const CircleOverlay: React.FC<CircleOverlayProps> = ({
    centerX,
    centerY,
    width,
    height,
    drawProgress,
    options = {}
}) => {
    // 옵션들이 넘어오지 않았을 때 사용할 기본값들을 설정합니다 (비구조화 할당과 기본값 설정)
    const {
        stroke = "#FF0033",
        strokeWidth = 6,
        roughness = 1.5,
        bowing = 1.2,
        opacity = 0.85,
        mixBlendMode = "multiply",
        rotation = 180,
        isClockwise = true,
        startPoint = 0.0,
        endPoint = 1.1,
        widthScale = 1.05,
        heightScale = 1.8,
    } = options;

    const svgPathData = useMemo(() => {
        const generator = rough.generator();
        // [학습 포인트] 배율(Scale) 적용:
        // 전달받은 width와 height에 사용자가 설정한 배율을 곱하여 최종 크기를 결정합니다.
        // 이를 통해 하이라이트가 텍스트 영역보다 얼마나 더 크게 그려질지 세밀하게 조정할 수 있습니다.
        const scaledWidth = width * widthScale;
        const scaledHeight = height * heightScale;

        // 원형(ellipse) 모양의 거친 선 데이터를 생성합니다.
        const customShape = generator.ellipse(
            centerX, centerY, scaledWidth, scaledHeight,
            {
                roughness,
                bowing,
                disableMultiStroke: true, // 여러 번 덧칠하지 않고 한 줄로만 그리도록 설정
            }
        );
        // 생성된 모양을 SVG 경로 데이터(d 속성용 문자열)로 변환합니다.
        const paths = generator.toPaths(customShape);
        return paths.length > 0 ? paths[0].d : '';
    }, [centerX, centerY, width, height, widthScale, heightScale, roughness, bowing]);

    /**
     * [학습 포인트] 시작점 점(Dot) 예외 처리:
     * 애니메이션이 시작되기 전(drawProgress === 0)에는 아예 하이라이트를 그리지 않습니다.
     * 이렇게 하면 SVG 끝점 처리(linecap: round)로 인해 생기는 미세한 잔상을 완벽히 차단할 수 있습니다.
     */
    if (drawProgress <= 0) return null;

    /**
     * [학습 포인트] *** 점(Dot) 현상 해결 및 그리기 구간 계산 ***
     * 
     * 이전 방식(`0 ${startGap} ${drawingLine} 1000`)의 문제점:
     * 맨 앞의 `0`은 길이가 0인 실선을 의미하는데, `stroke-linecap: round`가 적용되면 
     * 0 길이의 선이라도 양쪽 끝을 둥글게(Cap) 처리하면서 원형의 점이 생겨버립니다.
     * 
     * 패턴 공식: [0] [시작공백] [실제그려지는선] [나머지공백]
     * 1. 0: 처음부터 실선이 시작되는 것을 방지하기 위해 0길이의 실선을 둡니다.
     * 2. startPoint * 100: 경로의 0부터 시작점까지를 '공백'으로 채워 선을 숨깁니다.
     * 3. drawProgress * (endPoint - startPoint) * 100: 시작점부터 진행률에 따라 자라나는 '실선'을 만듭니다.
     * 4. 1000: 나머지 경로를 모두 '공백'으로 처리하여 그 이후에는 선이 안 보이게 합니다.
     */
    // [학습 포인트] Easing 커스텀 (Stroke Dash Easing):
    // Out-Quart 느낌의 베지어 곡선을 적용하여, 처음엔 팍 그려지고 끝에서 미세하게 속도가 줄어들게 만듭니다.
    const easedProgress = Easing.bezier(0.33, 1, 0.68, 1)(drawProgress);

    const drawingLine = easedProgress * (endPoint - startPoint) * 100;
    const currentDashArray = `${drawingLine} 1000`;
    const currentOffset = -(startPoint * 100);

    // [학습 포인트] 선 굵기 애니메이션 (Stroke Width Animation):
    // 시작할 때 펜을 꾹 누름(1.5배) -> 중간에 빠르게 휘두름(0.5배) -> 끝날 때 다시 멈춤(1.1배)
    const dynamicStrokeWidth = interpolate(
        easedProgress,
        [0, 0.5, 1],
        [strokeWidth * 1.5, strokeWidth * 0.5, strokeWidth * 1.1],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp'
        }
    );

    const transformStyle: React.CSSProperties = {
        transformOrigin: `${centerX}px ${centerY}px`,
        transform: `rotate(${rotation}deg) scaleX(${isClockwise ? 1 : -1})`,
        mixBlendMode,
        opacity,
        filter: 'url(#rough-paper)' // SVG 거칠기 필터 적용
    };

    return (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
            {/* [학습 포인트] Roughness 필터 추가: 
                feTurbulence와 feDisplacementMap을 사용해 매끈한 선이 아니라
                종이 위에 그려진듯한 미세한 노이즈와 왜곡을 부여합니다. */}
            <defs>
                <filter id="rough-paper" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
                </filter>
            </defs>
            {svgPathData && (
                <path
                    d={svgPathData} fill="none"
                    stroke={stroke} strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth={dynamicStrokeWidth}
                    pathLength="100"
                    strokeDasharray={currentDashArray}
                    strokeDashoffset={currentOffset}
                    style={transformStyle}
                />
            )}
        </svg>
    );
};
