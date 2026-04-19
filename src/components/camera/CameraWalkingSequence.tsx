import React, { useMemo } from 'react';
import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
    Img,
    staticFile,
} from 'remotion';
import { CameraLayer, CameraKeyframe } from './layers/CameraLayer';
import { CircleOverlay } from '../effects/CircleOverlay';
import { PenHighlight } from '../effects/PenHighlight';
import { BackgroundLayer } from './layers/BackgroundLayer';
import { MotionBlurLayer } from './layers/MotionBlurLayer';
import { useCameraTargets } from './hooks/useCameraTargets';
import { useCameraState } from './hooks/useCameraState';
import { HighlightConfig, TimelineScene, StripImage } from './types';
import { DrawingAnimationOptions } from '../effects/types';
import { buildHighlightsFromScenes, buildCameraTimeline } from './utils/timeline';

/**
 * CameraWalkingSequence에 주입되는 Props입니다.
 * 각 시퀀스가 독립적으로 카메라 워킹, 이미지, 하이라이트를 렌더링합니다.
 */
interface CameraWalkingSequenceProps {
    images?: StripImage[];
    imageAspectRatio?: number;
    baseWidth?: number;
    scenes?: TimelineScene[];
    highlights?: HighlightConfig[];
    cameraTimeline?: CameraKeyframe[];
    circleOptions?: DrawingAnimationOptions;
    noisePeakRatio?: number;
    parallaxFactor?: number;
    backgroundSrc?: string;
    offsetSeconds?: number;
    scaleMode?: 'fixed' | 'target';
}

/**
 * [추출] 카메라 워킹 레이어 컴포넌트
 * Sequence 내부에서 렌더링되므로 useCurrentFrame()이 시퀀스 시작 기준 0부터 반환됩니다.
 * 각 시퀀스의 scenes 시간이 그대로 동작합니다.
 */
export const CameraWalkingSequence: React.FC<CameraWalkingSequenceProps> = ({
    images,
    imageAspectRatio,
    baseWidth,
    scenes,
    highlights = [],
    cameraTimeline = [],
    circleOptions = {},
    noisePeakRatio = 0.6,
    parallaxFactor = 0.15,
    backgroundSrc,
    offsetSeconds = 0,
    scaleMode = 'target',
}) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    // [보안] 프레임이 음수(-1 등)일 경우 MediaSession API 에러를 방지하기 위해 0으로 제한합니다.
    const sec = Math.max(0, frame) / (fps || 30);

    const bw = baseWidth ?? 1024;

    // [UPDATE] 스트립 이미지 높이 계산 로직 추가
    const totalHeight = useMemo(() => {
        if (images && images.length > 0) {
            return images.reduce((acc, img) => acc + img.height, 0);
        }
        return 410; // Fallback
    }, [images]);

    // 내부 연산은 모두 totalHeight를 따릅니다.
    const bh = totalHeight;

    // 이미지 가세비 결정
    const finalAspectRatio = useMemo(() => {
        if (imageAspectRatio) return imageAspectRatio;
        return bw / totalHeight;
    }, [imageAspectRatio, bw, totalHeight]);

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

    // contain 축소 보정을 위해 뷰포트 크기(width, height)와 scaleMode를 함께 전달
    const finalCameraTimeline = useMemo(() =>
        buildCameraTimeline(offsetScenes, offsetCameraTimeline ?? [], bw, bh, width, height, scaleMode),
        [offsetScenes, offsetCameraTimeline, bw, bh, width, height, scaleMode]);

    // 개별 하이라이트 계산 시 사용할 기본 배율값들
    const { widthScale: defaultWidthScale = 1.05, heightScale: defaultHeightScale = 1.8 } = circleOptions;

    /**
     * 모든 좌표 계산의 기준점 수립 (커스텀 훅으로 분리됨)
     */
    const targets = useCameraTargets({
        width,
        height,
        finalAspectRatio,
        finalHighlights,
        defaultWidthScale,
        defaultHeightScale,
        bw,
        bh,
    });

    /**
     * 실시간 카메라 상태 보간 계산 (커스텀 훅으로 분리됨)
     */
    const cameraState = useCameraState({
        sec,
        width,
        height,
        finalCameraTimeline,
        targets,
    });

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
                    {/* 렌더링할 메인 스트립 이미지 (세피아 및 밝기 보정 필터 적용) */}
                    {images && images.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            left: targets.imgOffsetX,
                            top: targets.imgOffsetY,
                            width: targets.imgRenderWidth,
                            height: targets.imgRenderHeight,
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            {images.map((img, idx) => {
                                const renderSrc = img.src.startsWith('http') || img.src.startsWith('data:') || img.src.startsWith('blob:') || img.src.includes('/')
                                    ? img.src
                                    : staticFile(img.src);
                                return (
                                    <Img
                                        key={idx}
                                        src={renderSrc}
                                        // 이미지가 투명해졌으므로 자체적으로 multiply 블렌딩을 주어 배경 레이어에 텍스트가 자연스럽게 스며들도록 합니다
                                        style={{ width: '100%', height: 'auto', mixBlendMode: 'multiply', filter: 'sepia(0.15) brightness(0.98)' }}
                                        alt={`Target Content ${idx}`}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {/* 이제 이미지가 투명 배경이므로, 이전에 사용하던 사각형 형태의 상아색 multiply 레이어는 불필요하여 제거합니다. */}

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
