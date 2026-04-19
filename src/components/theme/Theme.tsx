import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    Sequence,
} from 'remotion';
import { NoiseOverlay } from '../NoiseOverlay';
import { CameraWalkingSequence } from '../camera';
import { DataDrivenTemplateProps } from './types';
import { useThemeSequences } from './hooks/useThemeSequences';
import { useGlobalNoiseBoost } from './hooks/useGlobalNoiseBoost';

// ==========================================
// 오케스트레이터 컴포넌트
// ==========================================

export const ThemeComparison: React.FC<DataDrivenTemplateProps> = (props) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // 입력된 Props를 정규화하고 타임라인 구간을 할당 (커스텀 훅 위임)
    const { sequences, sequenceTimeline } = useThemeSequences(props, fps);

    // 전체 영상 시간에 걸쳐 카메라 움직임에 따른 노이즈 강도를 계산 (커스텀 훅 위임)
    const globalNoiseBoost = useGlobalNoiseBoost(frame, fps, sequences, sequenceTimeline);

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
                        images={seq.images}
                        imageAspectRatio={seq.imageAspectRatio}
                        baseWidth={seq.baseWidth}
                        scenes={seq.scenes}
                        highlights={seq.highlights}
                        cameraTimeline={seq.cameraTimeline}
                        circleOptions={seq.circleOptions}
                        noisePeakRatio={seq.noisePeakRatio}
                        parallaxFactor={seq.parallaxFactor}
                        backgroundSrc={seq.backgroundSrc}
                        offsetSeconds={sequenceTimeline[i].offsetSeconds}
                        scaleMode={seq.scaleMode}
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
