import React, { useMemo } from 'react';
import rough from 'roughjs';
import { CircleAnimationOptions } from './CircleOverlay';

interface PenHighlightProps {
    centerX: number;        // 화면 상의 중심 X 좌표 (픽셀)
    centerY: number;        // 화면 상의 중심 Y 좌표 (픽셀)
    width: number;          // 형광펜의 가로 폭 (픽셀)
    height: number;         // 형광펜의 세로 폭 (픽셀)
    drawProgress: number;   // 그리기 진행률 (0: 시작 안 함, 1: 완료)
    options?: CircleAnimationOptions; 
}

/**
 * [학습 포인트] 가장자리만 불규칙한 PenHighlight (v5):
 * 1. 내부를 'solid'하게 채워 텍스트 가독성을 최적으로 유지합니다.
 * 2. Rough.js의 높은 roughness 수치를 적용하여 테두리(가장자리)만 울퉁불퉁하게 표현합니다.
 * 3. 별도의 외곽선(stroke) 없이 채우기 영역의 경계 자체가 불규칙하게 보이도록 설계했습니다.
 */
export const PenHighlight: React.FC<PenHighlightProps> = ({
    centerX,
    centerY,
    width,
    height,
    drawProgress,
    options = {}
}) => {
    const {
        stroke = "#F4FF40",   // 선명한 형광 노란색
        roughness = 2.8,      // 가장자리의 불규칙성을 위해 높게 설정 (피드백 반영)
        bowing = 2.0,         // 직선이 아닌 약간 휘어진 느낌
        opacity = 0.45,       // 텍스트 가독성을 위한 적절한 투명도
        mixBlendMode = "multiply",
        widthScale = 1.05,
        heightScale = 1.0,
    } = options;

    const { fillPaths } = useMemo(() => {
        const generator = rough.generator();
        const scaledWidth = width * widthScale;
        const scaledHeight = height * heightScale;
        
        const x = centerX - scaledWidth / 2;
        const y = centerY - scaledHeight / 2;

        // [핵심] solid 스타일을 사용하여 내부는 꽉 채우고, roughness로 가장자리만 왜곡합니다.
        const customShape = generator.rectangle(x, y, scaledWidth, scaledHeight, {
            fill: stroke,
            fillStyle: 'solid',
            roughness,
            bowing,
            stroke: 'none',   // 테두리 실선은 제거하여 더 자연스러운 번짐 효과 유도
        });

        const paths = generator.toPaths(customShape);
        return {
            fillPaths: paths.map(p => p.d)
        };
    }, [centerX, centerY, width, height, widthScale, heightScale, stroke, roughness, bowing]);

    // [핵심] 순차적 긋기 효과를 위한 ClipPath 전용 고유 ID 생성 (Hook 규칙에 따라 상단에 위치)
    const clipPathId = useMemo(() => `highlighter-clip-v5-${Math.random().toString(36).substr(2, 9)}`, []);

    if (drawProgress <= 0) return null;

    const scaledWidth = width * widthScale;
    const clipWidth = drawProgress * scaledWidth;
    const clipStartX = centerX - scaledWidth / 2;

    return (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
            <defs>
                <clipPath id={clipPathId}>
                    <rect x={clipStartX} y={0} width={clipWidth} height="100%" />
                </clipPath>
            </defs>
            
            <g clipPath={`url(#${clipPathId})`} style={{ mixBlendMode, opacity }}>
                {fillPaths.map((d, i) => (
                    <path
                        key={`fill-${i}`}
                        d={d}
                        fill={stroke}
                        stroke="none"
                    />
                ))}
            </g>
        </svg>
    );
};
