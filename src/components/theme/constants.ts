import { CameraKeyframe } from '../camera/layers/CameraLayer';
import { HighlightConfig } from '../camera/types';

export const DEFAULT_IMAGE = 'card_R1HZODJ2ZI3AYF.png';
export const DEFAULT_HIGHLIGHTS: HighlightConfig[] = [
    { relativeX: 0.60, relativeY: 0.41, widthPx: 240, heightPx: 45, drawStartTime: 10.0, drawDuration: 1.0 }
];
export const DEFAULT_CAMERA_TIMELINE: CameraKeyframe[] = [
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
