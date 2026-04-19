// Re-export UI Component
export { ThemeComparison } from './Theme';

// Re-export Metadata calculation function
export { calculateThemeComparisonMetadata } from './metadata';

// Re-export Constants if needed externally
export { DEFAULT_IMAGE, DEFAULT_HIGHLIGHTS, DEFAULT_CAMERA_TIMELINE } from './constants';

// Re-export Types for backwards compatibility (originally in Theme.tsx)
export type { 
    HighlightConfig, 
    TargetConfig, 
    TimelineScene, 
    CameraWalkingSequenceConfig 
} from '../camera/types';
export type { DataDrivenTemplateProps } from './types';

// Re-export helpers
export { 
    buildHighlightsFromScenes, 
    buildCameraTimeline 
} from '../camera/utils/timeline';

export {
    computeNoiseBoost
} from '../camera/utils/noise';

export {
    calcSequenceDuration, 
    getAbsoluteTimeRange 
} from './utils/time';
