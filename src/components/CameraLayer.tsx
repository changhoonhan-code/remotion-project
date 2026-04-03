import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, Easing } from 'remotion';

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
    width: number;          // 비디오 전체 너비 (1920 등)
    height: number;         // 비디오 전체 높이 (1080 등)
    currentSec: number;     // 현재 재생 시간 (프레임을 fps로 나눈 값)
    timeline: CameraKeyframe[]; // 카메라 워킹 시나리오 배열
    targets: {              // 각 타겟의 실제 계산된 픽셀 좌표 정보를 담은 객체
        highlights: { x: number, y: number, size: { width: number, height: number } }[]; // 각 하이라이트 정보
        cardCenter: { x: number; y: number }; // 카드 전체의 중심점
        imgRenderWidth: number;  // 렌더링된 이미지의 너비
        imgRenderHeight: number; // 렌더링된 이미지의 높이
        imgOffsetY: number;      // 이미지를 중앙에 두기 위한 Y축 오프셋
    };
    children: React.ReactNode;
}

export const CameraLayer: React.FC<CameraLayerProps> = ({
    width,
    height,
    currentSec,
    timeline,
    targets,
    children
}) => {
    /**
     * [학습 포인트] 카메라 변환(Transform) 계산 프로세스:
     * 1. 모든 키프레임을 실제 픽셀 좌표(cx, cy)로 변환합니다.
     * 2. 현재 시간이 어느 두 키프레임 사이에 있는지 찾습니다.
     * 3. 그 사이의 진행률(0~1)을 이징 함수를 적용해 계산합니다.
     * 4. 타겟 지점이 화면 정중앙(width/2, height/2)에 오도록 행렬 변환을 수행합니다.
     */
    const { currentTx, currentTy, currentScale } = useMemo(() => {
        if (timeline.length === 0) return { currentTx: 0, currentTy: 0, currentScale: 1 };

        // 1. 키프레임별 목표 지점을 실제 픽셀 좌표로 환산
        const parsedKeyframes = timeline.map(kf => {
            let cx = targets.cardCenter.x;
            let cy = targets.cardCenter.y;

            if (kf.targetCoords === 'center') {
                cx = targets.cardCenter.x;
                cy = targets.cardCenter.y;
            } else if (typeof kf.targetCoords === 'object') {
                cx = targets.imgRenderWidth * kf.targetCoords.x;
                cy = targets.imgOffsetY + (targets.imgRenderHeight * kf.targetCoords.y);
            }

            return {
                time: kf.time,
                cx, cy, scale: kf.scale,
                easingType: kf.easingType || 'smooth',
                bezierPoints: kf.bezierPoints
            };
        });

        // 2. 현재 시간을 포함하는 구간(K1과 K2)을 탐색
        let currentK = 0;
        while (currentK < parsedKeyframes.length - 1 && currentSec > parsedKeyframes[currentK + 1].time) {
            currentK++;
        }
        const k1 = parsedKeyframes[currentK];
        const k2 = parsedKeyframes[currentK + 1];

        // 3. 두 키프레임 사이의 이동 보간 진행률 계산
        let progress = 0;
        if (k2 && k2.time > k1.time) {
            // [상세 옵션 지점] 사용자가 입력한 이징 타입을 설정합니다.
            let easingFn = Easing.inOut(Easing.cubic);
            if (k2.easingType === 'snap') {
                easingFn = Easing.bezier(0.1, 1.0, 0.3, 1.0); // 훅 튀어나가는 느낌 (Vox 저널리즘 스타일)
            } else if (k2.easingType === 'bezier' && k2.bezierPoints) {
                easingFn = Easing.bezier(...k2.bezierPoints); // 커스텀 물리 효과
            }

            // Remotion의 interpolate를 사용하여 부드러운 0~1 값을 얻습니다.
            progress = interpolate(currentSec, [k1.time, k2.time], [0, 1], {
                extrapolateRight: 'clamp',
                easing: easingFn
            });
        }

        // 4. 보간된 현재 좌표(cx, cy)와 줌 스케일(s) 결정
        const nextCx = k2 ? k2.cx : k1.cx;
        const nextCy = k2 ? k2.cy : k1.cy;
        const nextScale = k2 ? k2.scale : k1.scale;

        const cx = k1.cx + (nextCx - k1.cx) * progress;
        const cy = k1.cy + (nextCy - k1.cy) * progress;
        const s = k1.scale + (nextScale - k1.scale) * progress;

        /**
         * [핵심 수학적 원리] 화면 중앙 정렬 변환:
         * 목표 지점(cx, cy)을 줌(scale)이 반영된 상태에서 화면의 정중앙에 가져오기 위한 계산입니다.
         * (width/2) 만큼 이동시킨 뒤, 타겟 좌표에 배율을 곱한 값을 뺍니다.
         */
        const tx = (width / 2) - cx * s;
        const ty = (height / 2) - cy * s;

        return { currentTx: tx, currentTy: ty, currentScale: s };
    }, [currentSec, width, height, timeline, targets]);



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
