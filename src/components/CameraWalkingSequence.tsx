import React, { useMemo } from 'react';
import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
    Img,
    Easing,
} from 'remotion';
import { CameraLayer, CameraKeyframe } from './CameraLayer';
import { CircleOverlay, CircleAnimationOptions } from './CircleOverlay';
import { PenHighlight } from './PenHighlight';
import { BackgroundLayer } from './BackgroundLayer';
import { MotionBlurLayer } from './MotionBlurLayer';
import { HighlightConfig, TimelineScene } from './types';
import { buildHighlightsFromScenes, buildCameraTimeline } from './sceneHelpers';

// 기본 이미지 비율
const DEFAULT_ASPECT_RATIO = 1024 / 410;

/**
 * CameraWalkingSequence에 주입되는 Props입니다.
 * 각 시퀀스가 독립적으로 카메라 워킹, 이미지, 하이라이트를 렌더링합니다.
 */
interface CameraWalkingSequenceProps {
    imageSrc: string;
    imageAspectRatio?: number;
    baseWidth?: number;
    baseHeight?: number;
    scenes?: TimelineScene[];
    highlights?: HighlightConfig[];
    cameraTimeline?: CameraKeyframe[];
    circleOptions?: CircleAnimationOptions;
    noisePeakRatio?: number;
    parallaxFactor?: number;
    backgroundSrc?: string;
    offsetSeconds?: number;
}

/**
 * [추출] 카메라 워킹 레이어 컴포넌트
 * Sequence 내부에서 렌더링되므로 useCurrentFrame()이 시퀀스 시작 기준 0부터 반환됩니다.
 * 각 시퀀스의 scenes 시간이 그대로 동작합니다.
 */
export const CameraWalkingSequence: React.FC<CameraWalkingSequenceProps> = ({
    imageSrc,
    imageAspectRatio,
    baseWidth,
    baseHeight,
    scenes,
    highlights = [],
    cameraTimeline = [],
    circleOptions = {},
    noisePeakRatio = 0.6,
    parallaxFactor = 0.15,
    backgroundSrc,
    offsetSeconds = 0,
}) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    // [보안] 프레임이 음수(-1 등)일 경우 MediaSession API 에러를 방지하기 위해 0으로 제한합니다.
    const sec = Math.max(0, frame) / (fps || 30);

    const bw = baseWidth ?? 1024;
    const bh = baseHeight ?? 410;

    // 이미지 가세비 결정
    const finalAspectRatio = useMemo(() => {
        if (imageAspectRatio) return imageAspectRatio;
        if (baseWidth && baseHeight) return baseWidth / baseHeight;
        return DEFAULT_ASPECT_RATIO;
    }, [imageAspectRatio, baseWidth, baseHeight]);

    // 타임라인 데이터에 오프셋 적용
    const offsetScenes = useMemo(() =>
        scenes?.map(s => ({
            ...s,
            start: s.start - offsetSeconds,
            end: s.end - offsetSeconds,
        })),
    [scenes, offsetSeconds]);

    const offsetCameraTimeline = useMemo(() =>
        cameraTimeline?.map(kf => ({
            ...kf,
            time: kf.time < 900 ? kf.time - offsetSeconds : kf.time,
        })),
    [cameraTimeline, offsetSeconds]);

    const finalHighlights = useMemo(() =>
        buildHighlightsFromScenes(offsetScenes, highlights, bw, bh),
    [offsetScenes, highlights, bw, bh]);

    const finalCameraTimeline = useMemo(() =>
        buildCameraTimeline(offsetScenes, offsetCameraTimeline ?? [], bw, bh),
    [offsetScenes, offsetCameraTimeline, bw, bh]);

    // 개별 하이라이트 계산 시 사용할 기본 배율값들
    const { widthScale: defaultWidthScale = 1.05, heightScale: defaultHeightScale = 1.8 } = circleOptions;

    /**
     * 모든 좌표 계산의 기준점 수립:
     * 이미지의 배율에 맞춰 화면 내 픽셀 좌표들을 미리 계산합니다.
     */
    const targets = useMemo(() => {
        // 이미지 가세비(finalAspectRatio)가 뷰포트 비율(width/height)보다 작으면 세로가 꽉 차게 렌더링 (object-fit: contain 효과)
        const isHeightConstrained = (width / height) > finalAspectRatio;
        const imgRenderWidth = isHeightConstrained ? height * finalAspectRatio : width;
        const imgRenderHeight = isHeightConstrained ? height : width / finalAspectRatio;
        
        // 정중앙 정렬을 위한 오프셋 (세로가 꽉 차면 좌우 여백, 가로가 꽉 차면 상하 여백)
        const imgOffsetX = (width - imgRenderWidth) / 2;
        const imgOffsetY = (height - imgRenderHeight) / 2;

        return {
            imgRenderWidth,
            imgRenderHeight,
            imgOffsetX,
            imgOffsetY,
            cardCenter: { x: width / 2, y: height / 2 },
            highlights: finalHighlights.map(h => {
                const scaleX = imgRenderWidth / bw;
                const scaleY = imgRenderHeight / bh;

                const hWidthScale = h.options?.widthScale ?? defaultWidthScale;
                const hHeightScale = h.options?.heightScale ?? defaultHeightScale;

                const scaledTextWidth = h.widthPx * scaleX;
                const scaledTextHeight = h.heightPx * scaleY;

                return {
                    x: imgOffsetX + (imgRenderWidth * h.relativeX) + scaledTextWidth / 2,
                    y: imgOffsetY + (imgRenderHeight * h.relativeY) + scaledTextHeight / 2,
                    size: {
                        width: scaledTextWidth * hWidthScale,
                        height: scaledTextHeight * hHeightScale
                    }
                };
            })
        };
    }, [width, height, finalAspectRatio, finalHighlights, defaultWidthScale, defaultHeightScale, bw, bh]);

    /**
     * 실시간 카메라 상태 보간 계산
     */
    const cameraState = useMemo(() => {
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

        // 현재 구간 찾기
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

    return (
        <AbsoluteFill>
            {/* 모션 블러 레이어: 카메라 이동을 감시하여 현장감을 부여합니다. */}
            <MotionBlurLayer
                timeline={finalCameraTimeline}
                currentSec={sec}
                noisePeakRatio={noisePeakRatio}
            >
                {/* 배경 레이어: 패러랙스 효과를 통해 공간의 깊이감을 더합니다. */}
                <BackgroundLayer
                    src={backgroundSrc}
                    currentScale={cameraState.scale}
                    cx={cameraState.cx}
                    cy={cameraState.cy}
                    parallaxFactor={parallaxFactor}
                />

                {/* 카메라 워킹 레이어: 모든 메인 콘텐츠가 포함됨 */}
                <CameraLayer
                    currentTx={cameraState.tx}
                    currentTy={cameraState.ty}
                    currentScale={cameraState.scale}
                >
                    {/* 렌더링할 메인 이미지 (세피아 및 밝기 보정 필터 적용) */}
                    <Img
                        src={imageSrc}
                        style={{
                            position: 'absolute', 
                            left: targets.imgOffsetX,
                            top: targets.imgOffsetY,
                            width: targets.imgRenderWidth, 
                            height: targets.imgRenderHeight, 
                            zIndex: 1,
                            filter: 'sepia(0.15) brightness(0.98)',
                        }}
                        alt="Target Content"
                    />

                    {/* 종이 표면 느낌을 주기 위해 곱하기(multiply) 모드로 씌운 상아색 레이어. 
                        이미지가 있는 영역에만 딱 맞게 씌워 레터박스를 침범하지 않게 함 */}
                    <div style={{
                        position: 'absolute', 
                        left: targets.imgOffsetX,
                        top: targets.imgOffsetY,
                        width: targets.imgRenderWidth, 
                        height: targets.imgRenderHeight,
                        backgroundColor: '#F7EEDF', mixBlendMode: 'multiply', opacity: 0.6,
                        zIndex: 2, pointerEvents: 'none'
                    }} />

                    {/* 여러 개의 하이라이트가 순차적/개별적으로 그려지는 오버레이들 */}
                    {finalHighlights.map((h, i) => {
                        const hTarget = targets.highlights[i];
                        const { drawStartTime = 0, drawDuration = 1 } = h;

                        const startTime = drawStartTime ?? 999999;
                        const drawProgress = interpolate(
                            sec,
                            [startTime, startTime + drawDuration],
                            [0, 1],
                            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                        );

                        return h.type === 'pen' ? (
                            <PenHighlight
                                key={i}
                                centerX={hTarget.x}
                                centerY={hTarget.y}
                                width={hTarget.size.width}
                                height={hTarget.size.height}
                                drawProgress={drawProgress}
                                startTime={startTime}
                                drawDuration={drawDuration}
                                options={{ ...circleOptions, ...h.options }}
                            />
                        ) : (
                            <CircleOverlay
                                key={i}
                                centerX={hTarget.x}
                                centerY={hTarget.y}
                                width={hTarget.size.width}
                                height={hTarget.size.height}
                                drawProgress={drawProgress}
                                options={{ ...circleOptions, ...h.options }}
                            />
                        );
                    })}
                </CameraLayer>
            </MotionBlurLayer>
        </AbsoluteFill>
    );
};
