import { useMemo } from 'react';
import { HighlightConfig } from '../types';

interface UseCameraTargetsProps {
    width: number;
    height: number;
    finalAspectRatio: number;
    finalHighlights: HighlightConfig[];
    defaultWidthScale?: number;
    defaultHeightScale?: number;
    bw: number;
    bh: number;
}

/**
 * 뷰포트 크기와 기본 크기를 비교하여 letter/pillar box를 자체 계산하고,
 * 하이라이트(타겟)의 상대 좌표(relativeX, y)를 절대 픽셀 기준(x, y, size)으로 치환합니다.
 */
export function useCameraTargets({
    width,
    height,
    finalAspectRatio,
    finalHighlights,
    defaultWidthScale = 1.05,
    defaultHeightScale = 1.8,
    bw,
    bh
}: UseCameraTargetsProps) {
    return useMemo(() => {
        // 이미지 가세비(finalAspectRatio)가 뷰포트 비율(width/height)보다 작으면 세로가 꽉 차게 렌더링 (object-fit: contain 효과)
        const isHeightConstrained = (width / height) > finalAspectRatio;
        const imgRenderWidth = isHeightConstrained ? height * finalAspectRatio : width;
        const imgRenderHeight = isHeightConstrained ? height : width / finalAspectRatio;

        // 정중앙 정렬을 위한 오프셋 (세로가 꽉 차면 좌우 여백, 가로가 꽉 차면 상하 여백)
        const imgOffsetX = (width - imgRenderWidth) / 2;
        const imgOffsetY = (height - imgRenderHeight) / 2;

        return {
            imgRenderWidth,
            imgRenderHeight,
            imgOffsetX,
            imgOffsetY,
            cardCenter: { x: width / 2, y: height / 2 },
            highlights: finalHighlights.map(h => {
                const scaleX = imgRenderWidth / bw;
                const scaleY = imgRenderHeight / bh;

                const hWidthScale = h.options?.widthScale ?? defaultWidthScale;
                const hHeightScale = h.options?.heightScale ?? defaultHeightScale;

                const scaledTextWidth = h.widthPx * scaleX;
                const scaledTextHeight = h.heightPx * scaleY;

                return {
                    x: imgOffsetX + (imgRenderWidth * h.relativeX) + scaledTextWidth / 2,
                    y: imgOffsetY + (imgRenderHeight * h.relativeY) + scaledTextHeight / 2,
                    size: {
                        width: scaledTextWidth * hWidthScale,
                        height: scaledTextHeight * hHeightScale
                    }
                };
            })
        };
    }, [width, height, finalAspectRatio, finalHighlights, defaultWidthScale, defaultHeightScale, bw, bh]);
}
