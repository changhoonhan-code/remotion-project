import React from 'react';
import { AbsoluteFill } from 'remotion';

/**
 * 카메라가 비출 수 있는 대상(Target)의 타입 정의입니다.
 */
export type CameraTarget =
    | 'center'         // 전체 카드 중앙
    | { x: number; y: number }; // 이미지상의 특정 비율 (0 ~ 1) 지점

/**
 * 카메라 타임라인을 구성하는 각 키프레임(Keyframe)의 상세 옵션입니다.
 */
export interface CameraKeyframe {
    time: number;           // 해당 키프레임에 도달할 시간 (초 단위)
    targetCoords: CameraTarget; // 어디를 비출지 (중앙 또는 좌표 객체)
    scale: number;          // 줌 배율 (1.0이면 기본, 3.0이면 300% 줌)

    // 이동 스타일(이징) 제어
    easingType?: 'snap' | 'smooth' | 'bezier'; // 보간 방식의 종류
    bezierPoints?: [number, number, number, number]; // 'bezier' 선택 시 [x1, y1, x2, y2] 베지어 좌표
}

interface CameraLayerProps {
    currentTx: number;      // 외부에서 계산된 현재 X축 이동량
    currentTy: number;      // 외부에서 계산된 현재 Y축 이동량
    currentScale: number;   // 외부에서 계산된 현재 줌 배율
    children: React.ReactNode;
}

/**
 * [리팩토링] 카메라 워킹 레이어 (Presenter)
 * 이제 직접 좌표를 계산하지 않고, 부모로부터 받은 최종 변환값을 적용하여 자식들을 렌더링만 합니다.
 */
export const CameraLayer: React.FC<CameraLayerProps> = ({
    currentTx,
    currentTy,
    currentScale,
    children
}) => {
    return (
        <AbsoluteFill style={{
            transformOrigin: '0 0', // 줌과 이동의 기준을 왼쪽 상단 끝으로 잡음 (계산 편의성)
            transform: `translateX(${currentTx}px) translateY(${currentTy}px) scale(${currentScale})`,
            zIndex: 2,
        }}>
            {children}
        </AbsoluteFill>
    );
};
