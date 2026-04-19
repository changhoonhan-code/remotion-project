import { CalculateMetadataFunction } from 'remotion';
import { CameraWalkingSequenceConfig, TimelineScene } from '../camera/types';
import { DataDrivenTemplateProps } from './types';
import { getAbsoluteTimeRange } from './utils/time';

// ==========================================
// 동적 duration 계산 (멀티 시퀀스 지원)
// ==========================================

export const calculateThemeComparisonMetadata: CalculateMetadataFunction<DataDrivenTemplateProps> = ({
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
        console.error("Error in calculateThemeComparisonMetadata:", e);
        return { durationInFrames: 300 };
    }
};
