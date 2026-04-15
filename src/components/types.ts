/**
 * 템플릿에 주입할 Props 타입 정의 (데이터 기반 설계)
 * 모든 컴포넌트가 공유하는 타입들을 한 곳에 모아 관리합니다.
 */
import { CameraKeyframe } from './CameraLayer';
import { CircleAnimationOptions } from './CircleOverlay';

// ==========================================
// 하이라이트 관련
// ==========================================

/**
 * 하이라이트 강조 영역의 박스 좌표, 크기 및 그리기 타이밍 정보입니다.
 */
export type HighlightConfig = {
    type?: 'circle' | 'pen';
    relativeX: number; // 원본 이미지에서 가로 위치 비율 (0 ~ 1)
    relativeY: number; // 원본 이미지에서 세로 위치 비율 (0 ~ 1)
    widthPx: number;   // 브라우저 렌더링 기준 하이라이트될 텍스트 영역의 너비 (픽셀)
    heightPx: number;  // 브라우저 렌더링 기준 하이라이트될 텍스트 영역의 높이 (픽셀)
    drawStartTime?: number; // 그리기가 시작될 영상 시점 (초)
    drawDuration?: number;  // 그리기를 하는 데 걸리는 시간 (초)
    options?: CircleAnimationOptions;
};

// ==========================================
// 타임라인 관련
// ==========================================

/**
 * 통합 타임라인에서 사용할 타겟 설정 타입입니다.
 */
export type TargetConfig =
    | { type: 'thumbnail'; x1: number; y1: number; x2: number; y2: number; baseW?: number; baseH?: number }
    | { type: 'circle'; x1: number; y1: number; x2: number; y2: number; baseW?: number; baseH?: number; options?: CircleAnimationOptions }
    | { type: 'pen'; x1: number; y1: number; x2: number; y2: number; baseW?: number; baseH?: number; options?: CircleAnimationOptions }
    | { type: 'center' }
    | { type: 'coords'; x: number; y: number };

/**
 * 통합 타임라인의 각 장면(Scene) 정의입니다.
 */
export interface TimelineScene {
    start: number;          // 장면이 시작되는 시간 (초)
    end: number;            // 장면이 유지되는 끝 시간 (초)
    target: TargetConfig;   // 무엇을 비출지
    scale: number;          // 줌 배율
    easing?: 'snap' | 'smooth' | 'bezier';
    bezierPoints?: [number, number, number, number];
    draw?: boolean;         // 이 시점에 그리기 시작할지 여부
}

// ==========================================
// 시퀀스 / Props 관련
// ==========================================

/**
 * 개별 카메라 워킹 시퀀스의 설정 정보입니다.
 * 각 시퀀스는 독립적인 이미지, 장면 타임라인, 하이라이트 등을 가집니다.
 */
export interface CameraWalkingSequenceConfig {
    imageSrc: string;
    imageAspectRatio?: number;
    baseWidth?: number;
    baseHeight?: number;
    scenes?: TimelineScene[];
    highlights?: HighlightConfig[];
    cameraTimeline?: CameraKeyframe[];
    circleOptions?: CircleAnimationOptions;
    noisePeakRatio?: number;              // 기본값 0.6
    parallaxFactor?: number;
    backgroundSrc?: string;
    bufferSeconds?: number;               // 시퀀스 끝 여유 시간 (기본 1초)
}

/**
 * CircleOnCard 컴포넌트가 외부로부터 주입받는 모든 설정값들입니다.
 * sequences[] 배열을 통해 멀티 시퀀스를 지원하며, 기존 flat props도 하위호환으로 유지됩니다.
 */
export interface DataDrivenTemplateProps {
    [key: string]: unknown;                // CalculateMetadataFunction 제약 조건용 인덱스 시그니처
    sequences?: CameraWalkingSequenceConfig[];
    // 아래는 단일 시퀀스 하위호환용
    imageSrc?: string;
    imageAspectRatio?: number;
    baseWidth?: number;
    baseHeight?: number;
    highlights?: HighlightConfig[];
    cameraTimeline?: CameraKeyframe[];
    scenes?: TimelineScene[];
    circleOptions?: CircleAnimationOptions;
    noisePeakRatio?: number;
    parallaxFactor?: number;
    backgroundSrc?: string;
}
