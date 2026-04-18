import React, { useMemo } from 'react';
import { interpolate, Easing, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CircleAnimationOptions } from './CircleOverlay';

interface PenHighlightProps {
    centerX: number;        // 화면 상의 중심 X 좌표 (픽셀)
    centerY: number;        // 화면 상의 중심 Y 좌표 (픽셀)
    width: number;          // 형광펜의 가로 폭 (픽셀)
    height: number;         // 형광펜의 세로 폭 (픽셀)
    drawProgress: number;   // 그리기 진행률 (0: 시작 안 함, 1: 완료)
    startTime?: number;     // 긋기 시작 시간 (초)
    drawDuration?: number;  // 긋기 지속 시간 (초)
    options?: CircleAnimationOptions;
}

/**
 * [학습 포인트] 잉크 물성을 완벽 재현한 PenHighlight (v6):
 * 1. 블렌딩 모드: mix-blend-mode="multiply"와 높은 투명도를 통해 잉크가 종이에 스며든 효과.
 * 2. 끝마무리: strokeLinecap="round"와 SVG 거칠기 필터로 펜 끝이 뭉개진 자연스러운 느낌 구현.
 * 3. 잉크 맺힘(Ink Pooling): 끝나는 지점에 맺히는 원형 그라데이션으로 현실적인 마커 디테일 추가.
 * 4. 불규칙한 힘: stroke-width에 사인함수 노이즈를 주어 두께가 미세하게 울렁거리게 표현합니다.
 */
export const PenHighlight: React.FC<PenHighlightProps> = ({
    centerX,
    centerY,
    width,
    height,
    drawProgress,
    startTime,
    drawDuration,
    options = {}
}) => {
    const {
        stroke = "#F4FF40",
        opacity = 0.85,
        mixBlendMode = "multiply",
        widthScale = 1.05,
        heightScale = 1.0,
    } = options;

    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const startFrame = Math.round(startTime! * fps) || 0;
    const durationFrames = Math.round(drawDuration! * fps) || 30;
    const relativeFrame = frame - startFrame;

    const filterId = useMemo(() => `wet-ink-${Math.random().toString(36).substring(2, 9)}`, []);
    const gradId = useMemo(() => `ink-pool-${Math.random().toString(36).substring(2, 9)}`, []);

    if (relativeFrame < 0) return null;

    // [핵심 1] 오버슈트(Overshoot)의 미학: spring 엔진 적용
    // 살짝 더 나갔다가 0.1초만에 멈추는 손맛 찰랑거림 구현 (stiffness: 50, damping: 10)
    const springProgress = spring({
        fps,
        frame: relativeFrame,
        config: {
            stiffness: 50,
            damping: 14,
        },
        durationInFrames: durationFrames > 10 ? durationFrames : undefined,
    });

    const scaledWidth = width * widthScale;
    const scaledHeight = height * heightScale;

    // 형광펜(하이라이터) 특유의 직각 형태(butt)를 사용하기 위해 오프셋을 0으로 처리
    const capOffset = 0;
    const startX = centerX - scaledWidth / 2 + capOffset;
    const targetEndX = centerX + scaledWidth / 2 - capOffset;
    const pathLength = Math.max(0.1, targetEndX - startX);

    // SVG 오버슈트를 잘리지 않고 제대로 표현하기 위해, 캔버스의 Path 길이를 미리 길게(1.3배) 열어둡니다.
    const physicalEndX = startX + pathLength * 1.3;

    // [핵심 2] 잉크가 번지는 느낌을 위해 stroke-width 에도 Easing 적용
    // 너무 많이 붓지 않고, 처음 압력이 살짝 들어갈 때만 0.9배에서 시작하여 1배로 일정하게 유지되도록 다듬음
    const baseDynamicWidth = interpolate(
        relativeFrame,
        [0, durationFrames * 0.1, durationFrames],
        [scaledHeight * 0.9, scaledHeight, scaledHeight],
        {
            easing: Easing.out(Easing.quad),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp'
        }
    );

    // 불규칙한 두께: 사람이 그을 때 힘이 미세하게 흔들리는 시뮬레이션
    // 흔들림 빈도(PI * 2: 한 번만 커졌다 작아짐)와 폭(0.03: 3% 변동)을 줄여서 더 단단하게 긋는 느낌을 줌.
    const pressureNoise = Math.sin(springProgress * Math.PI * 2) * 0.03;
    const dynamicStrokeWidth = baseDynamicWidth * (1 + pressureNoise);

    // SVG dasharray를 사용해 선 긋기 길이를 결정 (overshoot 시 pathLength보다 커질 수 있음)
    const drawingLine = Math.max(0, springProgress * pathLength);
    const dashArray = `${drawingLine} 10000`;

    // 잉크 맺힘(Ink Pooling)이 쫓아가는 현재 펜 끝 좌표
    const currentX = startX + drawingLine;
    const poolOpacity = interpolate(springProgress, [0.8, 1], [0, 0.4], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp' // 오버슈트 되어도 pool 투명도를 유지
    });
    const poolRadius = dynamicStrokeWidth * 0.45; // 선 바깥으로 튀어나가지 않게 반경 축소

    return (
        <svg style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            zIndex: 10, pointerEvents: 'none',
            mixBlendMode, // <--- [핵심] 부모 HTML(이미지)과 합성되려면 최상위에 있어야 함!
            opacity       // <--- [핵심] 최상위에 있어야 Stacking Context 버그를 우회할 수 있음!
        }}>
            <defs>
                {/* [학습 포인트] 끝부분 뭉개기 필터: 과한 잉크 넘침을 방지하기 위해 scale을 1.5로 줄여 깔끔한 마커 느낌 유지 */}
                <filter id={filterId} filterUnits="userSpaceOnUse" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="2" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
                </filter>

                {/* 잉크 맺힘용 번짐 그라데이션 */}
                <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={stroke} stopOpacity="1" />
                    <stop offset="60%" stopColor={stroke} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                </radialGradient>
            </defs>

            <g>
                {/* 메인 형광펜 획 */}
                <path
                    d={`M ${startX} ${centerY} L ${physicalEndX} ${centerY}`}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={dynamicStrokeWidth}
                    strokeLinecap="butt" // <--- 둥근 모양(round) 대신 각진 하이라이터 모양(butt)으로 변경
                    strokeDasharray={dashArray}
                    filter={`url(#${filterId})`}
                />

                {/* [학습 포인트] 형광펜 특유의 각진 느낌을 살리기 위해, 끝부분에 동그랗게 맺히던 잉크(circle) 렌더링은 제거했습니다. */}
            </g>
        </svg>
    );
};
