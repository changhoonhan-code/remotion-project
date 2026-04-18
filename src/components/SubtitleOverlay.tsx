import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { WordTimestamp } from './types';

/**
 * 가라오케 스타일 자막 오버레이 컴포넌트
 * CSS transition 대신 Remotion의 interpolate를 사용하여
 * 프레임 단위 렌더링에서도 정확한 싱크를 보장합니다.
 */
export const SubtitleOverlay: React.FC<{ subtitles?: WordTimestamp[] }> = ({ subtitles }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    // 현재 프레임을 초 단위로 변환 (Remotion의 프레임 기반 시간 체계)
    const sec = frame / fps;

    // 단어들을 문장(또는 적절한 길이의 구) 단위로 묶기
    const sentences = useMemo(() => {
        if (!subtitles || subtitles.length === 0) return [];
        const result: WordTimestamp[][] = [];
        let currentSentence: WordTimestamp[] = [];

        for (const w of subtitles) {
            currentSentence.push(w);
            // 마침표, 물음표, 느낌표, 콜론 등이 있거나 12단어 초과 시 청크 분리
            if (/[.?!:]/.test(w.word) || currentSentence.length > 12) {
                result.push(currentSentence);
                currentSentence = [];
            }
        }
        if (currentSentence.length > 0) result.push(currentSentence);
        return result;
    }, [subtitles]);

    if (sentences.length === 0) return null;

    // 현재 시간에 맞는 문장 라인 찾기
    let activeSentenceIdx = sentences.findIndex(
        (s) => s[s.length - 1].time_end >= sec
    );

    // 비디오 끝부분 처리 (시간 초과 시 마지막 텍스트 유지)
    if (activeSentenceIdx === -1) {
        activeSentenceIdx = sentences.length - 1;
    }

    const activeSentence = sentences[activeSentenceIdx];

    // 현재 시간이 문장의 첫 단어보다 1초 이상 전이면 자막 숨기기
    const firstWordStartTime = activeSentence[0].time_start;
    if (sec < firstWordStartTime - 1.0) {
        return null;
    }

    return (
        <div
            style={{
                position: 'absolute',
                bottom: '8%',
                left: 0,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 60,
                pointerEvents: 'none',
            }}
        >
            {/* 검은색 반투명 둥근 배경 (가독성 확보) */}
            <div
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: '20px 48px',
                    borderRadius: '24px',
                    maxWidth: '85%',
                    textAlign: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    rowGap: '12px',
                    columnGap: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                {activeSentence.map((w, idx) => {
                    // 가라오케 타이밍 판정 (Remotion 프레임 기반 비교)
                    const isPassed = sec >= w.time_end;
                    const isCurrent = sec >= w.time_start && sec < w.time_end;

                    // 현재 단어의 읽기 진행률 (0 ~ 1) — interpolate로 정밀 계산
                    const wordProgress = isCurrent
                        ? interpolate(
                              sec,
                              [w.time_start, w.time_end],
                              [0, 1],
                              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                          )
                        : isPassed
                          ? 1
                          : 0;

                    // 스타일 계산 (CSS transition 제거, 모두 interpolate 기반)
                    const color =
                        isPassed || isCurrent
                            ? '#FACC15'
                            : 'rgba(255, 255, 255, 0.4)';

                    // 현재 읽히는 단어에 팝업 효과 (시작점에서 순간적으로 커졌다가 안정)
                    const scale = isCurrent
                        ? interpolate(wordProgress, [0, 0.3, 1], [1.0, 1.18, 1.12], {
                              extrapolateRight: 'clamp',
                          })
                        : 1.0;

                    // 현재/지나간 단어에 네온 번짐 효과
                    const glowOpacity = isPassed || isCurrent ? 0.5 : 0;
                    const textShadow =
                        glowOpacity > 0
                            ? `0px 0px 12px rgba(250, 204, 21, ${glowOpacity})`
                            : 'none';

                    // 현재 단어 살짝 위로 뜨는 효과
                    const yOffset = isCurrent
                        ? interpolate(wordProgress, [0, 0.3, 1], [0, -5, -3], {
                              extrapolateRight: 'clamp',
                          })
                        : 0;

                    return (
                        <span
                            key={idx}
                            style={{
                                color,
                                transform: `scale(${scale}) translateY(${yOffset}px)`,
                                textShadow,
                                display: 'inline-block',
                                fontSize: '46px',
                                fontFamily: '"Inter", sans-serif',
                                fontWeight: 700,
                                letterSpacing: '-0.02em',
                                margin: '0 6px',
                            }}
                        >
                            {w.word}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};
