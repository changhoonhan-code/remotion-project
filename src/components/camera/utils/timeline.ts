/**
 * scenes ↔ CameraKeyframe 변환, 하이라이트 추출 등
 * 순수 함수(Pure Function)만 모아둔 유틸리티 모듈입니다.
 * React Hook에 의존하지 않으므로 어디서든 자유롭게 호출할 수 있습니다.
 */
import { CameraKeyframe } from '../layers/CameraLayer';
import { HighlightConfig, TimelineScene, BBox } from '../types';

// 픽셀당 그리는 시간 기준 (100px당 0.3초)
const SECONDS_PER_100PX = 0.3;

// ==========================================
// 1. 하이라이트 추출
// ==========================================

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

                boxes.forEach((box: BBox) => {
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
                    accumulatedDrawDelay += drawDuration;
                });
            }
        });

        extracted.forEach(h => {
            if (h.drawStartTime === undefined) h.drawStartTime = 9999;
        });

        return extracted;
    }

    return highlights.map(h => ({
        ...h,
        drawDuration: h.drawDuration ?? Math.max(0.3, (h.widthPx / 100) * SECONDS_PER_100PX),
    }));
}

// ==========================================
// 2. 카메라 타임라인 변환
// ==========================================

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

    let containCompensation = 1;
    if (viewportWidth && viewportHeight) {
        const imageAspect = baseWidth / baseHeight;
        const viewportAspect = viewportWidth / viewportHeight;
        if (viewportAspect > imageAspect) {
            const imgRenderWidth = viewportHeight * imageAspect;
            containCompensation = viewportWidth / imgRenderWidth;
        }
    }

    const result: CameraKeyframe[] = [];

    scenes.forEach(scene => {
        const target = scene.target;
        const bw = ('baseW' in target ? target.baseW : undefined) ?? baseWidth;
        const bh = ('baseH' in target ? target.baseH : undefined) ?? baseHeight;

        let computedScale = (scene.scale / 100) * containCompensation;
        let centerXRatio = 0.5;
        let centerYRatio = 0.5;

        if (target.type === 'circle' || target.type === 'pen') {
            const boxes = target.bboxes;

            const minX = Math.min(...boxes.map((b: BBox) => b.x1));
            const maxX = Math.max(...boxes.map((b: BBox) => b.x2));
            const minY = Math.min(...boxes.map((b: BBox) => b.y1));
            const maxY = Math.max(...boxes.map((b: BBox) => b.y2));

            if (scaleMode === 'target') {
                const targetWidth = Math.abs(maxX - minX);
                if (targetWidth > 0) {
                    computedScale = (scene.scale / 100) * containCompensation * (bw / targetWidth);
                }
            }

            centerXRatio = (minX + maxX) / 2 / bw;
            centerYRatio = (minY + maxY) / 2 / bh;
        } else if (target.type === 'thumbnail') {
            if (scaleMode === 'target') {
                const targetWidth = Math.abs(target.x2 - target.x1);
                if (targetWidth > 0) {
                    computedScale = (scene.scale / 100) * containCompensation * (bw / targetWidth);
                }
            }

            centerXRatio = (target.x1 + target.x2) / 2 / bw;
            centerYRatio = (target.y1 + target.y2) / 2 / bh;
        }

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
