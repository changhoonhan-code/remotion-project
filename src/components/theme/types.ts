import { CameraWalkingSequenceConfig, HighlightConfig, TimelineScene } from '../camera/types';
import { CameraKeyframe } from '../camera/layers/CameraLayer';
import { DrawingAnimationOptions } from '../effects/types';

// ==========================================
// 시퀀스 / Props 관련 (테마 통합)
// ==========================================

/**
 * ThemeComparison 컴포넌트가 외부로부터 주입받는 모든 설정값들입니다.
 * sequences[] 배열을 통해 멀티 시퀀스를 지원하며, 기존 flat props도 하위호환으로 유지됩니다.
 */
export interface DataDrivenTemplateProps {
    [key: string]: unknown;                
    sequences?: CameraWalkingSequenceConfig[];
    
    // 아래는 단일 시퀀스 하위호환용
    imageAspectRatio?: number;
    baseWidth?: number;
    highlights?: HighlightConfig[];
    cameraTimeline?: CameraKeyframe[];
    scenes?: TimelineScene[];
    circleOptions?: DrawingAnimationOptions;
    noisePeakRatio?: number;
    parallaxFactor?: number;
    backgroundSrc?: string;
}
