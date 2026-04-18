/**
 * scenes ↔ CameraKeyframe 변환, 하이라이트 추출, 노이즈 계산 등
 * 순수 함수(Pure Function)만 모아둔 유틸리티 모듈입니다.
 * React Hook에 의존하지 않으므로 어디서든 자유롭게 호출할 수 있습니다.
 */
import { interpolate } from 'remotion';
import { CameraKeyframe } from './CameraLayer';
import {
    HighlightConfig,
    TimelineScene,
    CameraWalkingSequenceConfig,
} from './types';

// 픽셀당 그리는 시간 기준 (100px당 0.3초)
const SECONDS_PER_100PX = 0.3;

// ==========================================
// 1. 하이라이트 추출
// ==========================================

/**
 * scenes 배열에서 하이라이트(circle/pen) 정보를 추출합니다.
 * scenes가 없으면 기존 highlights 배열을 그대로 반환합니다.
 */
export function buildHighlightsFromScenes(
    scenes: TimelineScene[] | undefined,
    highlights: HighlightConfig[],
    baseWidth: number,
    baseHeight: number,
): HighlightConfig[] {
    if (scenes && scenes.length > 0) {
        const extracted: HighlightConfig[] = [];
        const hMap = new Map<string, number>();

        scenes.forEach(scene => {
            if (scene.target.type === 'circle' || scene.target.type === 'pen') {
                const target = scene.target;
                const bw = target.baseW ?? baseWidth;
                const bh = target.baseH ?? baseHeight;
                const options = target.options;

                // bboxes 배열 필수 순회
                const boxes = target.bboxes;

                let accumulatedDrawDelay = 0;

                boxes.forEach((box) => {
                    const { x1, y1, x2, y2 } = box;
                    const key = `${target.type}:${x1},${y1},${x2},${y2}`;

                    const drawDuration = Math.max(0.3, ((x2 - x1) / 100) * SECONDS_PER_100PX);
                    const drawStartTime = scene.draw ? scene.start + accumulatedDrawDelay : undefined;

                    if (!hMap.has(key)) {
                        hMap.set(key, extracted.length);
                        extracted.push({
                            type: target.type as 'circle' | 'pen',
                            relativeX: x1 / bw,
                            relativeY: y1 / bh,
                            widthPx: x2 - x1,
                            heightPx: y2 - y1,
                            options,
                            drawStartTime,
                            drawDuration,
                        });
                    } else if (scene.draw) {
                        const idx = hMap.get(key)!;
                        if (extracted[idx].drawStartTime === undefined) {
                            extracted[idx].drawStartTime = drawStartTime;
                        }
                    }
                    // 다음 줄은 이전 줄이 그려진 시간만큼 뒤에 시작되도록 지연 시간 누적
                    accumulatedDrawDelay += drawDuration;
                });
            }
        });

        // 명시적 draw가 없는 하이라이트는 화면에 나타나지 않도록 뒤로 미룸
        extracted.forEach(h => {
            if (h.drawStartTime === undefined) h.drawStartTime = 9999;
        });

        return extracted;
    }

    // 레거시: highlights 배열에 duration 자동 계산
    return highlights.map(h => ({
        ...h,
        drawDuration: h.drawDuration ?? Math.max(0.3, (h.widthPx / 100) * SECONDS_PER_100PX),
    }));
}

// ==========================================
// 2. 카메라 타임라인 변환
// ==========================================

/**
 * scenes 배열을 CameraKeyframe 배열로 변환합니다.
 * scenes가 없으면 기존 cameraTimeline을 그대로 반환합니다.
 *
 * viewportWidth / viewportHeight를 받아 object-fit: contain 축소 비율을 보정합니다.
 * scaleMode에 따라 scale 해석이 달라집니다:
 *   'fixed': scale = 이미지 원본 가로 대비 고정 배율 (100=화면에 딱 맞음, 120=1.2배 확대)
 *            같은 scale이면 줌 변화 없이 카메라 팬만 발생
 *   'target' (기본): circle/pen/thumbnail에서 타겟이 화면 가로의 scale%를 차지하도록 자동 줌 계산
 */
export function buildCameraTimeline(
    scenes: TimelineScene[] | undefined,
    cameraTimeline: CameraKeyframe[],
    baseWidth: number,
    baseHeight: number,
    viewportWidth?: number,
    viewportHeight?: number,
    scaleMode: 'fixed' | 'target' = 'target',
): CameraKeyframe[] {
    if (!scenes || scenes.length === 0) return cameraTimeline;

    // contain 보정 비율 계산: 이미지가 뷰포트에 contain으로 렌더링될 때
    // 실제 렌더링 가로와 뷰포트 가로의 비율을 구한다.
    // 이 비율이 1보다 크면 이미지 가로가 축소되었다는 뜻이므로 scale을 보정해야 한다.
    let containCompensation = 1;
    if (viewportWidth && viewportHeight) {
        const imageAspect = baseWidth / baseHeight;
        const viewportAspect = viewportWidth / viewportHeight;
        // 세로 기준 렌더링 (이미지가 뷰포트보다 세로로 긴 경우)
        if (viewportAspect > imageAspect) {
            const imgRenderWidth = viewportHeight * imageAspect;
            containCompensation = viewportWidth / imgRenderWidth;
        }
        // 가로 기준 렌더링이면 imgRenderWidth = viewportWidth이므로 보정 불필요 (1.0)
    }

    const result: CameraKeyframe[] = [];

    scenes.forEach(scene => {
        const target = scene.target;
        const bw = ('baseW' in target ? target.baseW : undefined) ?? baseWidth;
        const bh = ('baseH' in target ? target.baseH : undefined) ?? baseHeight;

        // 기본 배율: contain 보정 포함한 고정 배율
        // scale:100 = 이미지 원본 가로가 화면 가로에 정확히 맞는 크기
        let computedScale = (scene.scale / 100) * containCompensation;
        let centerXRatio = 0.5;
        let centerYRatio = 0.5;

        if (target.type === 'circle' || target.type === 'pen') {
            const boxes = target.bboxes;

            // 메가 바운딩 박스 → 카메라가 바라볼 중심점 계산
            const minX = Math.min(...boxes.map(b => b.x1));
            const maxX = Math.max(...boxes.map(b => b.x2));
            const minY = Math.min(...boxes.map(b => b.y1));
            const maxY = Math.max(...boxes.map(b => b.y2));

            // target 모드: 타겟이 화면 가로의 scale%를 차지하도록 추가 배율 적용
            if (scaleMode === 'target') {
                const targetWidth = Math.abs(maxX - minX);
                if (targetWidth > 0) {
                    computedScale = (scene.scale / 100) * containCompensation * (bw / targetWidth);
                }
            }
            // fixed 모드: computedScale 그대로 (고정 배율)

            centerXRatio = (minX + maxX) / 2 / bw;
            centerYRatio = (minY + maxY) / 2 / bh;
        } else if (target.type === 'thumbnail') {
            // target 모드: 썸네일이 화면 가로의 scale%를 차지하도록 추가 배율 적용
            if (scaleMode === 'target') {
                const targetWidth = Math.abs(target.x2 - target.x1);
                if (targetWidth > 0) {
                    computedScale = (scene.scale / 100) * containCompensation * (bw / targetWidth);
                }
            }
            // fixed 모드: computedScale 그대로 (고정 배율)

            centerXRatio = (target.x1 + target.x2) / 2 / bw;
            centerYRatio = (target.y1 + target.y2) / 2 / bh;
        }

        // 카메라 중심점 보정: centerOffset이 있으면 계산된 중심에 오프셋 적용
        if (scene.centerOffset) {
            centerXRatio += (scene.centerOffset.x ?? 0);
            centerYRatio += (scene.centerOffset.y ?? 0);
        }

        const baseKf = {
            time: scene.start,
            scale: computedScale,
            easingType: scene.easing,
            bezierPoints: scene.bezierPoints,
        };

        let kf: CameraKeyframe;
        if (target.type === 'thumbnail' || target.type === 'circle' || target.type === 'pen') {
            kf = { ...baseKf, targetCoords: { x: centerXRatio, y: centerYRatio } };
        } else if (target.type === 'center') {
            kf = { ...baseKf, targetCoords: 'center' };
        } else {
            kf = { ...baseKf, targetCoords: { x: target.x, y: target.y } };
        }

        result.push(kf);
        result.push({ ...kf, time: scene.end, easingType: 'smooth' });
    });

    result.sort((a, b) => a.time - b.time);
    if (result.length > 0) {
        result.push({ ...result[result.length - 1], time: 999.0 });
    }

    return result;
}

// ==========================================
// 3. 노이즈 부스트 계산
// ==========================================

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

// ==========================================
// 4. 시퀀스 재생 시간 및 절대 범위 계산
// ==========================================

/**
 * 시퀀스 내 모든 장면(scenes)과 카메라 키프레임의 절대 시간 범위를 계산합니다.
 */
export function getAbsoluteTimeRange(seq: CameraWalkingSequenceConfig): { start: number; end: number } {
    const scenes = seq.scenes || [];
    const timeline = seq.cameraTimeline || [];
    const buffer = seq.bufferSeconds ?? 1;

    // 장면이나 타임라인이 없는 경우 기본값 (0~12초)
    if (scenes.length === 0 && timeline.length === 0) {
        return { start: 0, end: 12 };
    }

    const allStarts = [
        ...(scenes.map(s => s.start)),
        ...(timeline.filter(kf => kf.time < 900).map(kf => kf.time))
    ];

    const allEnds = [
        ...(scenes.map(s => s.end)),
        ...(timeline.filter(kf => kf.time < 900).map(kf => kf.time))
    ];

    const minStart = allStarts.length > 0 ? Math.min(...allStarts) : 0;
    const maxEnd = allEnds.length > 0 ? Math.max(...allEnds) : 0;

    return { start: minStart, end: maxEnd + buffer };
}

/**
 * 시퀀스 설정으로부터 프레임 단위의 재생 시간을 계산합니다.
 * (기존 calcSequenceDuration은 getAbsoluteTimeRange 기반으로 리팩토링)
 */
export function calcSequenceDuration(seq: CameraWalkingSequenceConfig, fps: number): number {
    const { start, end } = getAbsoluteTimeRange(seq);
    return Math.max(1, Math.ceil((end - start) * fps));
}
