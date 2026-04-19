import { useMemo } from 'react';
import { CameraWalkingSequenceConfig } from '../../camera/types';
import { buildCameraTimeline } from '../../camera/utils/timeline';
import { computeNoiseBoost } from '../../camera/utils/noise';

export function useGlobalNoiseBoost(
    frame: number, 
    fps: number, 
    sequences: CameraWalkingSequenceConfig[], 
    sequenceTimeline: Array<{ from: number, duration: number, offsetSeconds: number }>
) {
    return useMemo(() => {
        let activeIndex = 0;
        for (let i = 0; i < sequenceTimeline.length; i++) {
            const { from, duration } = sequenceTimeline[i];
            if (frame >= from && frame < from + duration) {
                activeIndex = i;
                break;
            }
            if (i === sequenceTimeline.length - 1) {
                activeIndex = i;
            }
        }

        const activeSeq = sequences[activeIndex];
        const globalSec = Math.max(0, frame) / (fps || 30);
        const bw = activeSeq.baseWidth ?? 1024;
        const bh = activeSeq.images && activeSeq.images.length > 0
            ? activeSeq.images.reduce((acc: number, img: any) => acc + img.height, 0)
            : 410; // Fallback

        const timeline = buildCameraTimeline(
            activeSeq.scenes, activeSeq.cameraTimeline ?? [], bw, bh,
        );
        return computeNoiseBoost(timeline, globalSec, activeSeq.noisePeakRatio ?? 0.6);
    }, [frame, fps, sequences, sequenceTimeline]);
}
