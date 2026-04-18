import { useMemo } from 'react';
import { Easing, interpolate } from 'remotion';
import { CameraKeyframe } from '../layers/CameraLayer';

export interface TargetsInfo {
    imgRenderWidth: number;
    imgRenderHeight: number;
    imgOffsetX: number;
    imgOffsetY: number;
    cardCenter: { x: number; y: number };
}

interface UseCameraStateProps {
    sec: number;
    width: number;
    height: number;
    finalCameraTimeline: CameraKeyframe[];
    targets: TargetsInfo;
}

/**
 * 프레임 구간(현재 시간 sec)을 찾아서,
 * 선형/베지어 보간(interpolate)을 통해 최종 카메라 렌더링 상태(tx, ty, scale)를 도출합니다.
 */
export function useCameraState({
    sec,
    width,
    height,
    finalCameraTimeline,
    targets
}: UseCameraStateProps) {
    return useMemo(() => {
        if (finalCameraTimeline.length === 0) {
            return { tx: 0, ty: 0, scale: 1, cx: width / 2, cy: height / 2 };
        }

        // 타겟 지점들을 실제 픽셀 좌표로 환산
        const parsedKeyframes = finalCameraTimeline.map(kf => {
            let cx = targets.cardCenter.x;
            let cy = targets.cardCenter.y;

            if (kf.targetCoords === 'center') {
                cx = targets.cardCenter.x;
                cy = targets.cardCenter.y;
            } else if (typeof kf.targetCoords === 'object') {
                cx = targets.imgOffsetX + (targets.imgRenderWidth * kf.targetCoords.x);
                cy = targets.imgOffsetY + (targets.imgRenderHeight * kf.targetCoords.y);
            }

            return {
                time: kf.time,
                cx, cy, scale: kf.scale,
                easingType: kf.easingType || 'smooth',
                bezierPoints: kf.bezierPoints
            };
        });

        // 현재 구간 찾기 (선형 탐색. 이후 최적화 가능)
        let currentK = 0;
        while (currentK < parsedKeyframes.length - 1 && sec > parsedKeyframes[currentK + 1].time) {
            currentK++;
        }
        const k1 = parsedKeyframes[currentK];
        const k2 = parsedKeyframes[currentK + 1];

        // 보간 진행률 계산
        let progress = 0;
        if (k2 && k2.time > k1.time) {
            let easingFn = Easing.inOut(Easing.cubic);
            if (k2.easingType === 'snap') {
                easingFn = Easing.bezier(0.1, 1.0, 0.3, 1.0);
            } else if (k2.easingType === 'bezier' && k2.bezierPoints) {
                easingFn = Easing.bezier(...k2.bezierPoints);
            }

            progress = interpolate(sec, [k1.time, k2.time], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: easingFn
            });
        }

        // 최종 상태값 결정
        const nextCx = k2 ? k2.cx : k1.cx;
        const nextCy = k2 ? k2.cy : k1.cy;
        const nextScale = k2 ? k2.scale : k1.scale;

        const cxValue = k1.cx + (nextCx - k1.cx) * progress;
        const cyValue = k1.cy + (nextCy - k1.cy) * progress;
        const sValue = k1.scale + (nextScale - k1.scale) * progress;

        const txValue = (width / 2) - cxValue * sValue;
        const tyValue = (height / 2) - cyValue * sValue;

        return { tx: txValue, ty: tyValue, scale: sValue, cx: cxValue, cy: cyValue };
    }, [sec, width, height, finalCameraTimeline, targets]);
}
