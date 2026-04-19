import React from 'react';

/**
 * 동그라미/형광펜 등 오버레이 그리기 이펙트의 시각적 스타일과 애니메이션 방향을 제어하는 공용 옵션들입니다.
 */
export interface DrawingAnimationOptions {
    stroke?: string;         // 선의 색상
    strokeWidth?: number;    // 선의 두께
    roughness?: number;      // 선의 거칠기
    bowing?: number;         // 선이 휘어지는 정도
    opacity?: number;        // 선의 불투명도
    mixBlendMode?: React.CSSProperties['mixBlendMode']; // 배경과의 혼합 방식 (multiply 등)

    // 고급 제어 옵션
    rotation?: number;       // 시작 위치 회전 (도 단위)
    isClockwise?: boolean;   // 그리기 방향 (기본값: true)

    // 크기 제어 옵션 (텍스트 박스 대비 배율)
    widthScale?: number;     // 가로 폭 배율 (기본값: 1.05)
    heightScale?: number;    // 세로 폭 배율 (기본값: 1.8)

    // 구간 제어 옵션 (0 ~ 1.0 비율)
    startPoint?: number;     // 전체 경로 중 그리기 시작할 지점 (0이면 처음)
    endPoint?: number;       // 전체 경로 중 그리기가 끝날 지점 (1이면 끝)
}
