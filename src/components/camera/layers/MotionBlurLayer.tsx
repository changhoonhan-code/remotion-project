import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { CameraKeyframe } from './CameraLayer';

interface MotionBlurLayerProps {
    timeline: CameraKeyframe[]; // 카메라 타임라인 데이터 (움직임 감지용)
    currentSec: number;         // 현재 재생 시간
    noisePeakRatio?: number;    // 노이즈가 최대 강도를 유지하는 비율 (0 ~ 1)
    children: React.ReactNode;
}

/**
 * [신규] 카메라 이동 감지 및 모션 블러 효과 레이어
 * 카메라가 움직이는 시점에 자동으로 블러와 미세 이동 효과를 자식들에게 적용합니다.
 */
export const MotionBlurLayer: React.FC<MotionBlurLayerProps> = ({
    timeline,
    currentSec,
    noisePeakRatio = 0.6,
    children,
}) => {
    /**
     * [학습 포인트] 카메라 움직임 감지(Watching) 로직:
     * 1. 현재 시간이 어느 구간(K1 -> K2)에 속해 있는지 찾습니다.
     * 2. K1과 K2 사이에 실제로 좌표나 줌의 변화가 있는지 확인합니다.
     * 3. 그 구간의 진행률에 따라 '블러 강도'를 사다리꼴(Trapezoidal) 형태로 계산합니다.
     */
    const intensity = useMemo(() => {
        if (timeline.length < 2) return 0;

        // 1. 현재 구간 찾기
        let currentK = 0;
        while (currentK < timeline.length - 1 && currentSec > timeline[currentK + 1].time) {
            currentK++;
        }
        const k1 = timeline[currentK];
        const k2 = timeline[currentK + 1];

        // 2. 이동/배율 변화가 없는 정지 구간이면 0 반환
        if (!k1 || !k2 || k2.time <= k1.time) return 0;
        const isTargetChanged = JSON.stringify(k1.targetCoords) !== JSON.stringify(k2.targetCoords);
        const isScaleChanged = k1.scale !== k2.scale;
        if (!isTargetChanged && !isScaleChanged) return 0;

        // 3. 진행도(0 ~ 1) 계산
        const progress = (currentSec - k1.time) / (k2.time - k1.time);

        // 4. 모션 블러 강도(intensity) 계산 (0 -> 1 -> 1 -> 0)
        const riseThreshold = (1 - noisePeakRatio) / 2;
        const sustainStart = riseThreshold;
        const sustainEnd = 1 - riseThreshold;

        return interpolate(progress, 
            [0, sustainStart, sustainEnd, 1], 
            [0, 1, 1, 0], 
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
    }, [timeline, currentSec, noisePeakRatio]);

    // 최종 블러 픽셀값 및 미세 스케일 보정
    const blurAmount = intensity * 10; // 최대 10px 블러
    const scaleBoost = 1 + (intensity * 0.03); // 블러 시 가장자리 여백 확보를 위한 3% 확대

    return (
        <AbsoluteFill style={{
            filter: `blur(${blurAmount}px)`,
            transform: `scale(${scaleBoost})`,
            zIndex: 1,
        }}>
            {children}
        </AbsoluteFill>
    );
};
