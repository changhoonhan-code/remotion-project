import { CameraWalkingSequenceConfig, TimelineScene } from '../../camera/types';
import { CameraKeyframe } from '../../camera/layers/CameraLayer';

/**
 * 시퀀스 내 모든 장면(scenes)과 카메라 키프레임의 절대 시간 범위를 계산합니다.
 */
export function getAbsoluteTimeRange(seq: CameraWalkingSequenceConfig): { start: number; end: number } {
    const scenes = seq.scenes || [];
    const timeline = seq.cameraTimeline || [];
    const buffer = seq.bufferSeconds ?? 1;

    // 장면이나 타임라인이 없는 경우 기본값 (0~12초)
    if (scenes.length === 0 && timeline.length === 0) {
        return { start: 0, end: 12 };
    }

    const allStarts = [
        ...(scenes.map((s: TimelineScene) => s.start)),
        ...(timeline.filter((kf: CameraKeyframe) => kf.time < 900).map((kf: CameraKeyframe) => kf.time))
    ];

    const allEnds = [
        ...(scenes.map((s: TimelineScene) => s.end)),
        ...(timeline.filter((kf: CameraKeyframe) => kf.time < 900).map((kf: CameraKeyframe) => kf.time))
    ];

    const minStart = allStarts.length > 0 ? Math.min(...allStarts) : 0;
    const maxEnd = allEnds.length > 0 ? Math.max(...allEnds) : 0;

    return { start: minStart, end: maxEnd + buffer };
}

/**
 * 시퀀스 설정으로부터 프레임 단위의 재생 시간을 계산합니다.
 */
export function calcSequenceDuration(seq: CameraWalkingSequenceConfig, fps: number): number {
    const { start, end } = getAbsoluteTimeRange(seq);
    return Math.max(1, Math.ceil((end - start) * fps));
}
