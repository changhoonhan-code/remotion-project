import React, { useMemo } from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';

/**
 * 배경 레이어의 Props 정의
 */
export interface BackgroundLayerProps {
    src?: string;                // 배경 이미지 경로
    currentScale: number;        // 카메라의 현재 줌 배율 (카메라 연동용)
    cx: number;                  // 카메라의 현재 중심 X좌표 (픽셀)
    cy: number;                  // 카메라의 현재 중심 Y좌표 (픽셀)
    parallaxFactor?: number;     // 패러랙스 강도 (0: 고정, 1: 카메라와 완벽 일치. 기본값 0.15)
    opacity?: number;            // 배경 투명도
}

/**
 * [신규] 배경 이미지 레이어 컴포넌트
 * 카메라의 움직임에 반응하여 미세한 패러랙스(Parallax) 효과를 만들어냅니다.
 */
export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
    src = staticFile('background.webp'),
    currentScale,
    cx,
    cy,
    parallaxFactor = 0.15,
    opacity = 1,
}) => {
    // [학습 포인트] 패러랙스(Parallax) 수학적 원리:
    // 카메라가 타겟을 따라 cx, cy로 이동할 때, 배경은 그 반대 방향으로 아주 조금만 이동하게 하여
    // 배경이 콘텐츠보다 훨씬 멀리 있는 듯한 깊이감(Depth)을 줍니다.
    const transform = useMemo(() => {
        // 1. 줌 배율 결정 (카메라 줌의 parallaxFactor 배만큼만 확대)
        // 카메라가 2배(scale 2.0)가 될 때, 배경은 1.15배(parallaxFactor 0.15 기준)만 확대됨
        const bgScale = 1 + (currentScale - 1) * parallaxFactor;

        // 2. 이동량 결정 (카메라 중심점 이동의 반대 방향으로 미세하게 이동)
        // 중심점에서 벗어난 만큼의 일정 비율만 적용합니다.
        const offCenterX = cx * parallaxFactor * 0.5;
        const offCenterY = cy * parallaxFactor * 0.5;

        return {
            scale: bgScale,
            translateX: -offCenterX,
            translateY: -offCenterY,
        };
    }, [currentScale, cx, cy, parallaxFactor]);

    return (
        <AbsoluteFill style={{ zIndex: 0, overflow: 'hidden' }}>
            <div
                style={{
                    position: 'absolute',
                    top: '-100%',
                    left: '-100%',
                    width: '300%',
                    height: '300%',
                    backgroundImage: `url(${src})`,
                    backgroundRepeat: 'repeat',
                    backgroundPosition: 'center',
                    opacity,
                    // scale() 배율 효과를 빼고 이동(translate) 패러랙스만 남깁니다.
                    transform: `translateX(${transform.translateX}px) translateY(${transform.translateY}px)`,
                }}
            />
        </AbsoluteFill>
    );
};
