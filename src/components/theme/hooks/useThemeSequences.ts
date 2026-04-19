import { useMemo } from 'react';
import { staticFile } from 'remotion';
import { CameraWalkingSequenceConfig, TimelineScene } from '../../camera/types';
import { DataDrivenTemplateProps } from '../types';
import { DrawingAnimationOptions } from '../../effects/types';
import { DEFAULT_IMAGE, DEFAULT_HIGHLIGHTS, DEFAULT_CAMERA_TIMELINE } from '../constants';
import { getAbsoluteTimeRange } from '../utils/time';

export function useThemeSequences(props: DataDrivenTemplateProps, fps: number) {
    // 정규화: sequences[]가 있으면 사용, 없으면 기존 flat props를 단일 시퀀스로 래핑
    const sequences = useMemo<CameraWalkingSequenceConfig[]>(() => {
        if (props.sequences && (props.sequences as CameraWalkingSequenceConfig[]).length > 0) {
            return props.sequences as CameraWalkingSequenceConfig[];
        }
        return [{
            images: [{
                src: staticFile(DEFAULT_IMAGE),
                height: 410
            }],
            imageAspectRatio: props.imageAspectRatio as number | undefined,
            baseWidth: props.baseWidth as number | undefined,
            scenes: props.scenes as TimelineScene[] | undefined,
            highlights: props.highlights ?? DEFAULT_HIGHLIGHTS,
            cameraTimeline: props.cameraTimeline ?? DEFAULT_CAMERA_TIMELINE,
            circleOptions: (props.circleOptions as DrawingAnimationOptions | undefined) ?? {},
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

    return { sequences, sequenceTimeline };
}
