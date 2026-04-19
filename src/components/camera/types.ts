import { CameraKeyframe } from './layers/CameraLayer';
import { DrawingAnimationOptions } from '../effects/types';

// ==========================================
// 하이라이트 관련
// ==========================================

export type HighlightConfig = {
    type?: 'circle' | 'pen';
    relativeX: number; 
    relativeY: number; 
    widthPx: number;   
    heightPx: number;  
    drawStartTime?: number; 
    drawDuration?: number;  
    options?: DrawingAnimationOptions;
};

// ==========================================
// 타임라인 관련
// ==========================================

export interface BBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export type TargetConfig =
    | { type: 'thumbnail'; x1: number; y1: number; x2: number; y2: number; baseW?: number; baseH?: number }
    | { type: 'circle'; bboxes: BBox[]; baseW?: number; baseH?: number; options?: DrawingAnimationOptions }
    | { type: 'pen'; bboxes: BBox[]; baseW?: number; baseH?: number; options?: DrawingAnimationOptions }
    | { type: 'center' }
    | { type: 'coords'; x: number; y: number };

export interface TimelineScene {
    start: number;          
    end: number;            
    target: TargetConfig;   
    scale: number;          
    easing?: 'snap' | 'smooth' | 'bezier';
    bezierPoints?: [number, number, number, number];
    draw?: boolean;         
    centerOffset?: { x?: number; y?: number };
}

// ==========================================
// 시퀀스 관련
// ==========================================

export interface StripImage {
    src: string;
    height: number;
}

export interface CameraWalkingSequenceConfig {
    images?: StripImage[];
    imageAspectRatio?: number;
    baseWidth?: number;
    scenes?: TimelineScene[];
    highlights?: HighlightConfig[];
    cameraTimeline?: CameraKeyframe[];
    circleOptions?: DrawingAnimationOptions;
    noisePeakRatio?: number;              
    parallaxFactor?: number;
    backgroundSrc?: string;
    bufferSeconds?: number;               
    scaleMode?: 'target' | 'fixed';
}
