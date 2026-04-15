/**
 * CircleOnCard 오케스트레이터 컴포넌트
 * sequences[] 배열을 순회하며 각 카메라 워킹 시퀀스를 Remotion <Sequence>로 순차 배치합니다.
 * 타입 정의는 types.ts, 변환 로직은 sceneHelpers.ts에 위치합니다.
 */
import React, { useMemo } from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    staticFile,
    Sequence,
    CalculateMetadataFunction,
} from 'remotion';
import { NoiseOverlay } from './NoiseOverlay';
import { CameraKeyframe } from './CameraLayer';
import { CircleAnimationOptions } from './CircleOverlay';
import { CameraWalkingSequence } from './CameraWalkingSequence';
import {
    HighlightConfig,
    TimelineScene,
    CameraWalkingSequenceConfig,
    DataDrivenTemplateProps,
} from './types';
import {
    buildCameraTimeline,
    computeNoiseBoost,
    getAbsoluteTimeRange,
} from './sceneHelpers';

// re-export: Root.tsx 등 외부에서 Theme 경로로 타입을 참조하는 기존 코드 호환
export type { HighlightConfig, TargetConfig, TimelineScene, CameraWalkingSequenceConfig, DataDrivenTemplateProps } from './types';
export { buildHighlightsFromScenes, buildCameraTimeline, computeNoiseBoost, calcSequenceDuration, getAbsoluteTimeRange } from './sceneHelpers';

// ==========================================
// 기본값 상수
// ==========================================

const DEFAULT_IMAGE = 'card_R1HZODJ2ZI3AYF.png';
const DEFAULT_HIGHLIGHTS: HighlightConfig[] = [
    { relativeX: 0.60, relativeY: 0.41, widthPx: 240, heightPx: 45, drawStartTime: 10.0, drawDuration: 1.0 }
];
const DEFAULT_CAMERA_TIMELINE: CameraKeyframe[] = [
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
];

// ==========================================
// 오케스트레이터 컴포넌트
// ==========================================

export const CircleOnCard: React.FC<DataDrivenTemplateProps> = (props) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // 정규화: sequences[]가 있으면 사용, 없으면 기존 flat props를 단일 시퀀스로 래핑
    const sequences = useMemo<CameraWalkingSequenceConfig[]>(() => {
        if (props.sequences && (props.sequences as CameraWalkingSequenceConfig[]).length > 0) {
            return props.sequences as CameraWalkingSequenceConfig[];
        }
        return [{
            imageSrc: (props.imageSrc as string) ?? staticFile(DEFAULT_IMAGE),
            imageAspectRatio: props.imageAspectRatio as number | undefined,
            baseWidth: props.baseWidth as number | undefined,
            baseHeight: props.baseHeight as number | undefined,
            scenes: props.scenes as TimelineScene[] | undefined,
            highlights: (props.highlights as HighlightConfig[] | undefined) ?? DEFAULT_HIGHLIGHTS,
            cameraTimeline: (props.cameraTimeline as CameraKeyframe[] | undefined) ?? DEFAULT_CAMERA_TIMELINE,
            circleOptions: (props.circleOptions as CircleAnimationOptions | undefined) ?? {},
            noisePeakRatio: (props.noisePeakRatio as number | undefined) ?? 0.6,
            parallaxFactor: (props.parallaxFactor as number | undefined) ?? 0.15,
            backgroundSrc: props.backgroundSrc as string | undefined,
        }];
    }, [props]);

    // 각 시퀀스의 절대 위치(from)와 재생 시간(duration) 계산
    const sequenceTimeline = useMemo(() =>
        sequences.map(seq => {
            const { start, end } = getAbsoluteTimeRange(seq);
            return {
                from: Math.floor(start * fps),
                duration: Math.max(1, Math.ceil((end - start) * fps)),
                offsetSeconds: start
            };
        }),
    [sequences, fps]);

    // 전역 노이즈 부스트: 현재 활성 시퀀스의 카메라 이동 상태를 기반으로 계산
    const globalNoiseBoost = useMemo(() => {
        let activeIndex = 0;
        let localFrame = frame;
        for (let i = 0; i < sequenceTimeline.length; i++) {
            const { from, duration } = sequenceTimeline[i];
            if (frame >= from && frame < from + duration) {
                activeIndex = i;
                localFrame = frame - from;
                break;
            }
            if (i === sequenceTimeline.length - 1) {
                activeIndex = i;
                localFrame = frame - from;
            }
        }

        const activeSeq = sequences[activeIndex];
        const localSec = Math.max(0, localFrame) / (fps || 30);
        const bw = activeSeq.baseWidth ?? 1024;
        const bh = activeSeq.baseHeight ?? 410;

        const timeline = buildCameraTimeline(
            activeSeq.scenes, activeSeq.cameraTimeline ?? [], bw, bh,
        );
        return computeNoiseBoost(timeline, localSec, activeSeq.noisePeakRatio ?? 0.6);
    }, [frame, fps, sequences, sequenceTimeline]);

    return (
        <AbsoluteFill>
            {/* 카메라 워킹 시퀀스들을 순차적으로 배치 */}
            {sequences.map((seq, i) => (
                <Sequence
                    key={i}
                    from={sequenceTimeline[i].from}
                    durationInFrames={sequenceTimeline[i].duration}
                    name={`CameraWalk-${i}`}
                >
                    <CameraWalkingSequence
                        imageSrc={seq.imageSrc}
                        imageAspectRatio={seq.imageAspectRatio}
                        baseWidth={seq.baseWidth}
                        baseHeight={seq.baseHeight}
                        scenes={seq.scenes}
                        highlights={seq.highlights}
                        cameraTimeline={seq.cameraTimeline}
                        circleOptions={seq.circleOptions}
                        noisePeakRatio={seq.noisePeakRatio}
                        parallaxFactor={seq.parallaxFactor}
                        backgroundSrc={seq.backgroundSrc}
                        offsetSeconds={sequenceTimeline[i].offsetSeconds}
                    />
                </Sequence>
            ))}

            {/* 전체 영상 위에 균일하게 덮이는 노이즈 레이어 */}
            <NoiseOverlay
                opacity={0.35 + globalNoiseBoost}
                baseFrequency={0.8 - (globalNoiseBoost * 0.4)}
                grainSize={1.0 + (globalNoiseBoost * 4.0)}
                blendMode="multiply"
                zIndex={40}
            />

            {/* 비네팅 효과 */}
            <AbsoluteFill style={{
                background: 'radial-gradient(circle at center, rgba(0,0,0,0) 65%, rgba(0,0,0,0.15) 120%)',
                zIndex: 50, pointerEvents: 'none'
            }} />
        </AbsoluteFill>
    );
};

// ==========================================
// 동적 duration 계산 (멀티 시퀀스 지원)
// ==========================================

export const calculateCircleOnCardMetadata: CalculateMetadataFunction<DataDrivenTemplateProps> = ({
    props,
    defaultProps,
}) => {
    try {
        const fps = 30;
        const merged = { ...defaultProps, ...props };

        // 멀티 시퀀스 모드: 모든 시퀀스의 마지막 end 시간을 찾아 전체 길이 결정
        const sequences = merged?.sequences as CameraWalkingSequenceConfig[] | undefined;
        if (sequences && sequences.length > 0) {
            const maxEnd = Math.max(...sequences.map(seq => getAbsoluteTimeRange(seq).end));
            return { durationInFrames: Math.max(1, Math.ceil(maxEnd * fps)) };
        }

        // 하위호환: 단일 scenes 기반
        const scenes = (merged?.scenes as TimelineScene[] | undefined) ?? [];
        if (!scenes || scenes.length === 0) return { durationInFrames: 360 };

        const lastEndTime = Math.max(0, ...scenes.map(s => (typeof s?.end === 'number' ? s.end : 0)));
        const duration = Math.max(1, Math.ceil((lastEndTime + 1) * fps));

        if (isNaN(duration)) {
            console.error("CalculateMetadata resulted in NaN duration", { scenes });
            return { durationInFrames: 300 };
        }
        return { durationInFrames: duration };
    } catch (e) {
        console.error("Error in calculateCircleOnCardMetadata:", e);
        return { durationInFrames: 300 };
    }
};
