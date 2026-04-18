import React from 'react';
import { AbsoluteFill, Audio, Sequence } from 'remotion';
import { SubtitleOverlay } from './SubtitleOverlay';
import { WordTimestamp } from './types';

export interface NarratedSceneProps {
    audioSrc?: string;          // 오디오 파일 위치 (ex: staticFile('narration_audio/anc_leader.wav'))
    subtitles?: WordTimestamp[]; // 음성 동기화용 단어 단위 타임스탬프
    children: React.ReactNode;  // 내부에 들어갈 시각적 컴포넌트
}

/**
 * 시각 컴포넌트(ThemeComparison 등)의 코드를 수정하지 않고
 * 오디오 레이어와 자막 레이어만을 오버레이 해주는 "완벽히 분리된" Wrapper 컴포넌트입니다.
 */
export const NarratedScene: React.FC<NarratedSceneProps> = ({
    audioSrc,
    subtitles,
    children
}) => {
    return (
        <AbsoluteFill>
            {/* 1. 백그라운드 시각 효과: 기존 씬 무수정 그대로 렌더링 */}
            <Sequence name="Visual Layer" style={{ zIndex: 0 }}>
                {children}
            </Sequence>

            {/* 2. 오디오 재생 엔진: Remotion이 프레임과 싱크를 맞춰 재생 */}
            {audioSrc && (
                <Sequence name="Audio Track" layout="none">
                    <Audio src={audioSrc} />
                </Sequence>
            )}

            {/* 3. 자막 (가라오케 효과): 최상단(zIndex 60 이상) UI 분리 */}
            {subtitles && subtitles.length > 0 && (
                <Sequence name="Subtitle Layer" style={{ zIndex: 60 }}>
                    <SubtitleOverlay subtitles={subtitles} />
                </Sequence>
            )}
        </AbsoluteFill>
    );
};
