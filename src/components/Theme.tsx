import React, { useMemo } from 'react';
import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
    staticFile,
    Img,
} from 'remotion';
import { NoiseOverlay } from './NoiseOverlay';
import { CameraLayer, CameraKeyframe } from './CameraLayer';
import { CircleOverlay, CircleAnimationOptions } from './CircleOverlay';
import { PenHighlight } from './PenHighlight';
import { CalculateMetadataFunction } from 'remotion';

// ==========================================
// 1. 템플릿에 주입할 Props 타입 정의 (데이터 기반 설계)
// ==========================================

/**
 * 하이라이트 강조 영역의 박스 좌표, 크기 및 그리기 타이밍 정보입니다.
 */
export type HighlightConfig = {
    type?: 'circle' | 'pen'; // [추가] 타입 구분
    relativeX: number; // 원본 이미지에서 가로 위치 비율 (0 ~ 1)
    relativeY: number; // 원본 이미지에서 세로 위치 비율 (0 ~ 1)
    widthPx: number;   // 브라우저 렌더링 기준 하이라이트될 텍스트 영역의 너비 (픽셀)
    heightPx: number;  // 브라우저 렌더링 기준 하이라이트될 텍스트 영역의 높이 (픽셀)
    drawStartTime?: number; // 동그라미/펜 그리기가 시작될 영상 시점 (초)
    drawDuration?: number;  // 그리기를 하는 데 걸리는 시간 (초)
    options?: CircleAnimationOptions; // 이 영역에만 적용할 스타일 옵션
};

/**
 * [신규] 통합 타임라인에서 사용할 타겟 설정 타입입니다. (방식 B: 객체형)
 */
export type TargetConfig =
    | { type: 'thumbnail'; x1: number; y1: number; x2: number; y2: number; baseW?: number; baseH?: number }
    | { type: 'circle'; x1: number; y1: number; x2: number; y2: number; baseW?: number; baseH?: number; options?: CircleAnimationOptions }
    | { type: 'pen'; x1: number; y1: number; x2: number; y2: number; baseW?: number; baseH?: number; options?: CircleAnimationOptions }
    | { type: 'center' }
    | { type: 'coords'; x: number; y: number };

/**
 * [신규] 통합 타임라인의 각 장면(Scene) 정의입니다.
 * 시작(start)과 끝(end) 시간을 가지며, 해당 구간의 카메라와 애니메이션 상태를 결정합니다.
 */
export interface TimelineScene {
    start: number;          // 장면이 시작되는 시간 (초)
    end: number;            // 장면이 유지되는 끝 시간 (초)
    target: TargetConfig;   // 무엇을 비출지
    scale: number;          // 줌 배율
    easing?: 'snap' | 'smooth' | 'bezier'; // 이동 시 적용할 이징
    bezierPoints?: [number, number, number, number];
    draw?: boolean;         // 해당 하이라이트(index 기준)를 이 시점에 그리기 시작할지 여부
}

/**
 * 컴포넌트 전체가 외부로부터 주입받을 수 있는 모든 설정값들입니다.
 */
export interface DataDrivenTemplateProps {
    [key: string]: unknown;                // CalculateMetadataFunction 제약 조건을 위한 인덱스 시그니처
    imageSrc?: string;                // 표시할 이미지 경로 (staticFile 등)
    imageAspectRatio?: number;        // [Optional] 이미지 원본 비율 (미입력 시 baseWidth/baseHeight 기준 계산)
    baseWidth?: number;               // 이미지의 기준 너비 (PIL 좌표 기준용)
    baseHeight?: number;              // 이미지의 기준 높이 (PIL 좌표 기준용)
    highlights?: HighlightConfig[];   // 강조할 영역들의 리스트 (배열)
    cameraTimeline?: CameraKeyframe[];// [Legacy] 시간대별 카메라 움직임 시나리오
    scenes?: TimelineScene[];          // [New] 통합 타임라인 시나리오
    circleOptions?: CircleAnimationOptions; // [변경] 하이라이트의 공통 기본 스타일 옵션
    noisePeakRatio?: number;          // 카메라 워킹 중 노이즈가 최대 강도를 유지하는 비율 (0 ~ 1, 기본값 0.6)
}

// 기본 이미지 비율 (바뀔 수 있으므로 상수로 선언)
const DEFAULT_ASPECT_RATIO = 1024 / 410;

// ==========================================
// 2. 컴포넌트 선언 및 로직 구현
// ==========================================
export const CircleOnCard: React.FC<DataDrivenTemplateProps> = ({
    imageSrc = staticFile('card_R1HZODJ2ZI3AYF.png'),
    imageAspectRatio = DEFAULT_ASPECT_RATIO,
    highlights = [
        {
            relativeX: 0.60,
            relativeY: 0.41,
            widthPx: 240,
            heightPx: 45,
            drawStartTime: 10.0,
            drawDuration: 1.0
        }
    ],
    cameraTimeline = [
        { time: 0.0, targetCoords: { x: 65 / 1024, y: 275 / 410 }, scale: 4.5 },
        { time: 1.0, targetCoords: { x: 65 / 1024, y: 275 / 410 }, scale: 4.5 },
        { time: 1.5, targetCoords: { x: 155 / 1024, y: 275 / 410 }, scale: 4.5, easingType: 'smooth' },
        { time: 2.5, targetCoords: { x: 155 / 1024, y: 275 / 410 }, scale: 4.5 },
        { time: 3.0, targetCoords: { x: 245 / 1024, y: 275 / 410 }, scale: 4.5, easingType: 'smooth' },
        { time: 4.0, targetCoords: { x: 245 / 1024, y: 275 / 410 }, scale: 4.5 },
        { time: 4.5, targetCoords: { x: 335 / 1024, y: 275 / 410 }, scale: 4.5, easingType: 'smooth' },
        { time: 5.5, targetCoords: { x: 335 / 1024, y: 275 / 410 }, scale: 4.5 },
        { time: 6.3, targetCoords: 'center', scale: 0.7, easingType: 'snap' },
        { time: 8.0, targetCoords: 'center', scale: 0.7 },
        { time: 10.0, targetCoords: { x: 0.60, y: 0.41 }, scale: 3.0, easingType: 'snap' },
        { time: 999.0, targetCoords: { x: 0.60, y: 0.41 }, scale: 3.0 },
    ],
    circleOptions = {},
    noisePeakRatio = 0.6,
    scenes,
    baseWidth,
    baseHeight,
}) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig(); // 비디오 설정(너비, 높이 등) 가져오기

    // [보안] 프레임이 음수(-1 등)일 경우 MediaSession API 에러를 방지하기 위해 0으로 제한합니다.
    const sec = Math.max(0, frame) / (fps || 30);

    // [보강] 이미지 가세비 결정: 직접 입력값이 없으면 기준 해상도를 활용해 자동 계산
    const finalAspectRatio = useMemo(() => {
        if (imageAspectRatio) return imageAspectRatio;
        if (baseWidth && baseHeight) return baseWidth / baseHeight;
        return DEFAULT_ASPECT_RATIO;
    }, [imageAspectRatio, baseWidth, baseHeight]);

    /**
     * [신규] 통합 타임라인(scenes)이 제공될 경우, 이를 기반으로 데이터 재구성
     */
    const { finalHighlights, finalCameraTimeline } = useMemo(() => {
        // [추가] 픽셀당 그리는 시간 기준 (100px당 0.3초)
        const SECONDS_PER_100PX = 0.3;

        // 1. scenes가 있다면 거기서 모든 하이라이트 정보를 추출합니다. (인덱스 프리 방식)
        let hData: HighlightConfig[] = highlights;

        if (scenes && scenes.length > 0) {
            const extractedHighlights: HighlightConfig[] = [];
            const hMap = new Map<string, number>(); // "x,y" 기반 중복 체크 (픽셀 기준)

            scenes.forEach(scene => {
                if (scene.target.type === 'circle' || scene.target.type === 'pen') {
                    const { x1, y1, x2, y2, baseW, baseH, options } = scene.target;
                    // 개별 설정이 없으면 최상위 baseWidth/baseHeight 사용 (없으면 기본값 1024/410)
                    const bw = baseW ?? baseWidth ?? 1024;
                    const bh = baseH ?? baseHeight ?? 410;

                    const key = `${scene.target.type}:${x1},${y1},${x2},${y2}`;

                    if (!hMap.has(key)) {
                        hMap.set(key, extractedHighlights.length);
                        extractedHighlights.push({
                            type: scene.target.type,
                            relativeX: x1 / bw,
                            relativeY: y1 / bh,
                            widthPx: x2 - x1,
                            heightPx: y2 - y1,
                            options,
                            drawStartTime: scene.draw ? scene.start : undefined,
                            drawDuration: Math.max(0.3, ((x2 - x1) / 100) * SECONDS_PER_100PX)
                        });
                    } else if (scene.draw) {
                        const idx = hMap.get(key)!;
                        if (extractedHighlights[idx].drawStartTime === undefined) {
                            extractedHighlights[idx].drawStartTime = scene.start;
                        }
                    }
                }
            });

            // [보강] 모든 하이라이트가 최소한의 drawStartTime을 갖도록 보장합니다 (명시적 draw가 없는 경우 대비)
            extractedHighlights.forEach(h => {
                if (h.drawStartTime === undefined) {
                    h.drawStartTime = 9999; // 화면에 나타나지 않도록 뒤로 미룸
                }
            });

            hData = extractedHighlights;

        } else {
            // 레거시 지원: 직접 highlights 배열을 사용할 경우 duration 계산
            hData = hData.map(h => ({
                ...h,
                drawDuration: h.drawDuration ?? Math.max(0.3, (h.widthPx / 100) * SECONDS_PER_100PX)
            }));
        }

        // 2. scenes를 CameraLayer가 이해할 수 있는 CameraKeyframe 배열로 변환
        let ctData: CameraKeyframe[] = cameraTimeline;
        if (scenes && scenes.length > 0) {
            ctData = [];
            scenes.forEach(scene => {
                const bw = (scene.target as any).baseW ?? baseWidth ?? 1024;
                const bh = (scene.target as any).baseH ?? baseHeight ?? 410;

                // [핵심] scale을 '화면 가로비 대비 점유율(%)'로 해석하여 실제 확대 배율(computedScale) 계산
                // 공식: (목표점유율 / 100) * (이미지너비 / 타겟너비)
                let computedScale = scene.scale / 100; // 기본값 (너비 정보 없을 때)

                if (scene.target.type === 'thumbnail' || scene.target.type === 'circle' || scene.target.type === 'pen') {
                    const { x1, x2 } = scene.target;
                    const targetWidth = Math.abs(x2 - x1);
                    if (targetWidth > 0) {
                        computedScale = (scene.scale / 100) * (bw / targetWidth);
                    }
                }

                const baseKf = {
                    time: scene.start,
                    scale: computedScale,
                    easingType: scene.easing,
                    bezierPoints: scene.bezierPoints,
                };

                let kf: CameraKeyframe;
                if (scene.target.type === 'thumbnail' || scene.target.type === 'circle' || scene.target.type === 'pen') {
                    const { x1, y1, x2, y2 } = scene.target;
                    const centerXRatio = (x1 + x2) / 2 / bw;
                    const centerYRatio = (y1 + y2) / 2 / bh;
                    kf = { ...baseKf, targetCoords: { x: centerXRatio, y: centerYRatio } };
                } else if (scene.target.type === 'center') {
                    kf = { ...baseKf, targetCoords: 'center' };
                } else { // 'coords'
                    kf = { ...baseKf, targetCoords: { x: (scene.target as any).x, y: (scene.target as any).y } };
                }

                ctData.push(kf);
                ctData.push({ ...kf, time: scene.end, easingType: 'smooth' });
            });

            ctData.sort((a, b) => a.time - b.time);
            if (ctData.length > 0) {
                const last = ctData[ctData.length - 1];
                ctData.push({ ...last, time: 999.0 });
            }
        }

        return { finalHighlights: hData, finalCameraTimeline: ctData };
    }, [highlights, cameraTimeline, scenes, baseWidth, baseHeight]);

    // 개별 하이라이트 계산 시 사용할 기본 배율값들 (전체 옵션에서 참조)
    const { widthScale: defaultWidthScale = 1.05, heightScale: defaultHeightScale = 1.8 } = circleOptions;

    /**
     * [학습 포인트] 모든 좌표 계산의 기준점 수립:
     * 이미지의 배율에 맞춰 화면 내 픽셀 좌표들을 미리 계산(targets)합니다.
     * 이를 통해 CameraLayer와 HighlightOverlay가 동일한 좌표계를 공유하게 됩니다.
     */
    const targets = useMemo(() => {
        const imgRenderWidth = width;
        const imgRenderHeight = imgRenderWidth / finalAspectRatio;
        const imgOffsetY = (height - imgRenderHeight) / 2;

        return {
            imgRenderWidth,
            imgRenderHeight,
            imgOffsetY,
            // 카드 전체의 정중앙 지점
            cardCenter: { x: imgRenderWidth / 2, y: imgOffsetY + imgRenderHeight / 2 },


            // 여러 개의 하이라이트 영역 계산
            highlights: finalHighlights.map(h => {
                // [학습 포인트] 렌더링 배율(Scale) 계산:
                // 원본 이미지 대비 비디오에서 이미지가 얼마나 확대/축소되었는지 확인합니다.
                const bw = baseWidth ?? 1024;
                const bh = baseHeight ?? 410;
                const scaleX = imgRenderWidth / bw;
                const scaleY = imgRenderHeight / bh;

                // 개별 옵션 우선, 없으면 전역 옵션, 그것도 없으면 기본값(1.05, 1.8) 적용
                const hWidthScale = h.options?.widthScale ?? defaultWidthScale;
                const hHeightScale = h.options?.heightScale ?? defaultHeightScale;

                // [회심의 수정] 텍스트 영역의 크기와 중심점을 비디오 픽셀 단위로 정확히 환산합니다.
                const scaledTextWidth = h.widthPx * scaleX;
                const scaledTextHeight = h.heightPx * scaleY;

                return {
                    // 시작점(비율)에 스케일링된 텍스트 너비의 절반을 더해 정확한 '중앙'을 잡습니다.
                    x: imgRenderWidth * h.relativeX + scaledTextWidth / 2,
                    y: imgOffsetY + (imgRenderHeight * h.relativeY) + scaledTextHeight / 2,
                    size: {
                        width: scaledTextWidth * hWidthScale,
                        height: scaledTextHeight * hHeightScale
                    }
                };
            })
        };
    }, [width, height, finalAspectRatio, finalHighlights, defaultWidthScale, defaultHeightScale, baseWidth, baseHeight]);



    // ==========================================
    // [보강] 동적 노이즈(Noise) 계산 로직
    // 카메라가 실제로 이동 중일 때 노이즈 강도를 높여 워킹 효과를 극대화합니다.
    // JSON.stringify를 통해 객체 형태의 타겟 좌표 변화도 정확히 감지합니다.
    // ==========================================
    const noiseOpacityBoost = useMemo(() => {
        if (finalCameraTimeline.length < 2) return 0;

        // 1. 현재 시간이 속한 타임라인 구간 찾기
        let currentK = 0;
        while (currentK < finalCameraTimeline.length - 1 && sec > finalCameraTimeline[currentK + 1].time) {
            currentK++;
        }
        const k1 = finalCameraTimeline[currentK];
        const k2 = finalCameraTimeline[currentK + 1];

        // 2. 다음 키프레임이 없거나 정지 상태인 구간이면 무시
        if (!k2 || k2.time <= k1.time) return 0;

        // 3. 실제로 이동(위치 또는 스케일 변화)이 발생하는지 확인
        const isTargetChanged = JSON.stringify(k1.targetCoords) !== JSON.stringify(k2.targetCoords);
        const isScaleChanged = k1.scale !== k2.scale;

        if (!isTargetChanged && !isScaleChanged) return 0;

        // 4. 이동 진행률(0~1) 계산
        const progress = (sec - k1.time) / (k2.time - k1.time);

        // 5. 사다리꼴(Trapezoidal) 형태의 선형 부스트 값 생성 (0 -> 1 -> 1 -> 0)
        // noisePeakRatio를 기반으로 상승/유지/하강 구간을 자동 계산합니다.
        const riseThreshold = (1 - noisePeakRatio) / 2;
        const sustainStart = riseThreshold;
        const sustainEnd = 1 - riseThreshold;

        const intensity = interpolate(progress, [0, sustainStart, sustainEnd, 1], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        });

        return intensity * 0.5; // 최대 0.5까지 노이즈 오퍼시티 대폭 추가 (시인성 확보)
    }, [sec, finalCameraTimeline, noisePeakRatio]);


    return (
        <AbsoluteFill>
            {/* [핵심] 카메라 이동 시 영상 전체에 블러를 적용하는 컨테이너 */}
            {/* noiseOpacityBoost가 높아질수록 블러가 강해지며, 가장자리 번짐 방지를 위해 미세하게 스케일을 키웁니다. */}
            <AbsoluteFill style={{
                filter: `blur(${noiseOpacityBoost * 10}px)`,
                transform: `scale(${1 + (noiseOpacityBoost * 0.03)})`,
            }}>
                {/* 배경 이미지 레이어 */}
                <AbsoluteFill>
                    <Img
                        src={staticFile('background.png')}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                        }}
                        alt="Background"
                    />
                </AbsoluteFill>

                {/* 카메라 워킹 레이어: 모든 메인 콘텐츠(이미지, 하이라이트)가 포함됨 */}
                <CameraLayer
                    width={width}
                    height={height}
                    currentSec={sec}
                    timeline={finalCameraTimeline}
                    targets={targets}
                >
                    {/* 렌더링할 메인 이미지 (세피아 및 밝기 보정 필터 적용) */}
                    <Img
                        src={imageSrc}
                        style={{
                            position: 'absolute', width: '100%', height: '100%', objectFit: 'contain', zIndex: 1,
                            filter: 'sepia(0.15) brightness(0.98)',
                        }}
                        alt="Target Content"
                    />

                    {/* 종이 표면 느낌을 주기 위해 곱하기(multiply) 모드로 씌운 상아색 레이어 */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: '#F7EEDF', mixBlendMode: 'multiply', opacity: 0.6,
                        zIndex: 2, pointerEvents: 'none'
                    }} />

                    {/* [핵심] 여러 개의 하이라이트가 순차적/개별적으로 그려지는 오버레이들 */}
                    {finalHighlights.map((h, i) => {
                        const hTarget = targets.highlights[i];
                        const { drawStartTime = 0, drawDuration = 1 } = h;

                        // [학습 포인트] 안전한 애니메이션 진행률 계산:
                        // drawStartTime이 없는 경우(undefined), interpolate가 크래시되지 않도록 
                        // 매우 큰 값을 기본값으로 주어 애니메이션이 영원히 시작되지 않게 처리합니다.
                        const startTime = drawStartTime ?? 999999;
                        const progress = interpolate(
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
                                drawProgress={progress}
                                options={{ ...circleOptions, ...h.options }}
                            />
                        ) : (
                            <CircleOverlay
                                key={i}
                                centerX={hTarget.x}
                                centerY={hTarget.y}
                                width={hTarget.size.width}
                                height={hTarget.size.height}
                                drawProgress={progress}
                                options={{ ...circleOptions, ...h.options }}
                            />
                        );
                    })}
                </CameraLayer>
            </AbsoluteFill>

            {/* [통합] 전체 영상 위에 균일하게 덮이는 노이즈 레이어 (블러 그룹 밖에 설계하여 입자 선명도 유지) */}
            <NoiseOverlay
                opacity={0.35 + noiseOpacityBoost}
                baseFrequency={0.8 - (noiseOpacityBoost * 0.4)}
                grainSize={1.0 + (noiseOpacityBoost * 4.0)}
                blendMode="multiply"
                zIndex={40}
            />

            {/* 화면 가장자리를 어둡게 하여 몰입감을 높여주는 비네팅 효과 */}
            <AbsoluteFill style={{
                background: 'radial-gradient(circle at center, rgba(0,0,0,0) 65%, rgba(0,0,0,0.15) 120%)',
                zIndex: 50, pointerEvents: 'none'
            }} />
        </AbsoluteFill>
    );
};

/**
 * [신규] scenes 배열을 기반으로 영상의 전체 길이를 동적으로 계산하는 함수입니다.
 * props의 scenes 내용이 바뀌면 Remotion Studio가 이 함수를 호출하여 길이를 자동 조절합니다.
 */
export const calculateCircleOnCardMetadata: CalculateMetadataFunction<DataDrivenTemplateProps> = ({
    props,
    defaultProps,
}) => {
    try {
        const scenes = props?.scenes ?? defaultProps?.scenes ?? [];
        const fps = 30; // 기본 fps

        if (!scenes || scenes.length === 0) {
            return { durationInFrames: 360 }; // 기본 12초
        }

        // 1. 모든 장면 중 가장 늦게 끝나는(end) 시간 찾기
        // [보안] scenes가 비어있을 경우 Math.max가 -Infinity를 반환하지 않도록 0을 포함합니다.
        const lastEndTime = Math.max(0, ...scenes.map(s => (typeof s?.end === 'number' ? s.end : 0)));

        // 2. 시각적 여운을 위한 버퍼(1초) 추가
        const bufferSeconds = 1;
        const totalDurationSeconds = lastEndTime + bufferSeconds;

        const duration = Math.max(1, Math.ceil(totalDurationSeconds * fps));
        
        if (isNaN(duration)) {
            console.error("CalculateMetadata resulted in NaN duration", { scenes, totalDurationSeconds });
            return { durationInFrames: 300 };
        }

        return {
            durationInFrames: duration,
        };
    } catch (e) {
        console.error("Error in calculateCircleOnCardMetadata:", e);
        return { durationInFrames: 300 };
    }
};