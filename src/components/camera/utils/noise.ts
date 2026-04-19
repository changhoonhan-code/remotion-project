import { interpolate } from 'remotion';
import { CameraKeyframe } from '../layers/CameraLayer';

/**
 * 카메라 이동 중 노이즈 강도를 높여 워킹 효과를 극대화합니다.
 * 사다리꼴(Trapezoidal) 형태의 부스트 곡선을 사용합니다.
 */
export function computeNoiseBoost(
    timeline: CameraKeyframe[],
    sec: number,
    noisePeakRatio: number,
): number {
    if (timeline.length < 2) return 0;

    let currentK = 0;
    while (currentK < timeline.length - 1 && sec > timeline[currentK + 1].time) {
        currentK++;
    }
    const k1 = timeline[currentK];
    const k2 = timeline[currentK + 1];

    if (!k2 || k2.time <= k1.time) return 0;

    const isTargetChanged = JSON.stringify(k1.targetCoords) !== JSON.stringify(k2.targetCoords);
    const isScaleChanged = k1.scale !== k2.scale;
    if (!isTargetChanged && !isScaleChanged) return 0;

    const progress = (sec - k1.time) / (k2.time - k1.time);
    const riseThreshold = (1 - noisePeakRatio) / 2;

    const intensity = interpolate(
        progress,
        [0, riseThreshold, 1 - riseThreshold, 1],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );

    return intensity * 0.5;
}
