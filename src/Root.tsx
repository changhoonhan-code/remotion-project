import React from 'react';
import { Composition, staticFile } from 'remotion';
import { CircleOnCard, calculateCircleOnCardMetadata } from './components/Theme';
import { ChartAnimation } from './components/ChartAnimation';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ChartAnimation"
        component={ChartAnimation as any}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          titleText: "How Americans split their political loyalties",
          subTitleText: "Based on national survey data collected by Gallup in 2024, showing how U.S. adults identify politically across the two major parties and independents.",
          chartData: [
            { label: "Democrats", value: 49, color: "#3498db", patternImage: staticFile("blue-pattern.png") },
            { label: "Republicans", value: 49, color: "#e74c3c", patternImage: staticFile("red-pattern.png") },
            { label: "Others", value: 2, color: "#bdc3c7", patternImage: staticFile("gray-pattern.png") },
          ],
          timing: {
            title: [15, 90],
            subTitle: [45, 75],
            chart: 70,
            legendStart: 110,
            legendGap: 15,
          }
        }}
      />
      <Composition
        id="CircleOnCard-Multi"
        component={CircleOnCard}
        calculateMetadata={calculateCircleOnCardMetadata}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          sequences: [
            {
              imageSrc: staticFile('card_R1HZODJ2ZI3AYF.png'),
              baseWidth: 1024,
              baseHeight: 410,
              parallaxFactor: 0.2,
              scenes: [
                // 썸네일 줌인 (scale: 40은 타겟이 화면 가로의 40%를 차지한다는 의미)
                { start: 0.0, end: 1.0, target: { type: 'thumbnail', x1: 20, y1: 220, x2: 100, y2: 300 }, scale: 40 },
                { start: 1.5, end: 2.5, target: { type: 'thumbnail', x1: 105, y1: 220, x2: 185, y2: 300 }, scale: 40, easing: 'smooth' },
                { start: 3.0, end: 4.0, target: { type: 'thumbnail', x1: 196, y1: 220, x2: 276, y2: 300 }, scale: 40, easing: 'smooth' },
                { start: 4.5, end: 5.5, target: { type: 'thumbnail', x1: 283, y1: 220, x2: 363, y2: 300 }, scale: 40, easing: 'smooth' },

                // 중앙 조경 (scale: 70은 이미지 가로가 화면의 70%를 차지한다는 의미)
                { start: 6.3, end: 8.0, target: { type: 'center' }, scale: 70, easing: 'smooth' },

                // 하이라이트 줌인 (scale: 60은 텍스트 길이에 상관없이 항상 화면 가로의 60% 점유)
                { start: 10.0, end: 12.0, target: { type: 'circle', x1: 359, y1: 172, x2: 600, y2: 185 }, scale: 60, easing: 'smooth', draw: true },
                { start: 13.0, end: 15.0, target: { type: 'circle', x1: 205, y1: 130, x2: 364, y2: 145 }, scale: 60, easing: 'smooth', draw: true },
                { start: 16.0, end: 18.0, target: { type: 'pen', x1: 359, y1: 172, x2: 600, y2: 185 }, scale: 60, easing: 'smooth', draw: true },
              ],
              bufferSeconds: 1,
            },
            {
              imageSrc: staticFile('card_R1HZODJ2ZI3AYF.png'),
              baseWidth: 1024,
              baseHeight: 410,
              parallaxFactor: 0.15,
              scenes: [
                { start: 19.0, end: 21.0, target: { type: 'center' }, scale: 80 },
                { start: 22.0, end: 24.0, target: { type: 'thumbnail', x1: 20, y1: 220, x2: 100, y2: 300 }, scale: 50, easing: 'smooth' },
                { start: 25.0, end: 27.0, target: { type: 'pen', x1: 205, y1: 130, x2: 364, y2: 145 }, scale: 60, easing: 'smooth', draw: true },
              ],
              bufferSeconds: 1,
            },
          ],
        }}
      />

      {/* ==========================================
         fit_stability_context 나레이션 동기화 하이라이트 씬
         - 이미지: card_combined_fit_stability_context.png (1024x1012)
         - evidence_quotes[0] "stayed securely in place the entire time"
           bbox: normCenter(0.312, 0.1769) normSize(0.241, 0.0178)
           -> 픽셀: x1=196 y1=170 x2=443 y2=188
           -> 나레이션 연결: "While 87 reviewers praise the secure fit" (6.0s~8.6s)
         - evidence_quotes[1] "sweat in these they constantly rotate"
           bbox: normCenter(0.6743, 0.5484) normSize(0.2289, 0.0178)
           -> 픽셀: x1=573 y1=546 x2=808 y2=564
           -> 나레이션 연결: "heavy sweating causes the buds to rotate" (9.6s~13.2s)
         ========================================== */}
      <Composition
        id="HighlightScene"
        component={CircleOnCard}
        calculateMetadata={calculateCircleOnCardMetadata}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          sequences: [
            {
              // review_card_data.image_path / review_card_data.size 에서 추출
              imageSrc: staticFile('card_combined_fit_stability_context.png'),
              baseWidth: 1024,
              baseHeight: 1012,
              parallaxFactor: 0.15,
              scenes: [
                // 0.0~2.6s: "But here's the variable nobody talks about: sweat." -> 전체 카드 소개
                { start: 0.0, end: 4.8, target: { type: 'center' }, scale: 80 },

                // 6.0~9.2s: 나레이션 "While 87 reviewers praise the secure fit"
                // -> evidence[0] anchor: "stayed securely in place the entire time" 하이라이트
                {
                  start: 6.0, end: 9.2,
                  target: { type: 'pen', x1: 196, y1: 170, x2: 443, y2: 188 },
                  scale: 60, easing: 'smooth', draw: true
                },

                // 9.6~13.2s: 나레이션 "a subset report heavy sweating causes the buds to rotate"
                // -> evidence[1] contrast: "sweat in these they constantly rotate" 하이라이트
                {
                  start: 9.6, end: 13.2,
                  target: { type: 'pen', x1: 573, y1: 546, x2: 808, y2: 564 },
                  scale: 60, easing: 'smooth', draw: true
                },

                // 14.0~20.2s: "Sweat acts as a lubricant... hook-stabilized designs." -> 줌아웃 전체 조감
                { start: 14.0, end: 20.2, target: { type: 'center' }, scale: 80, easing: 'smooth' },

                // 21.0~35.6s: "The pattern suggests... loses its grip." -> 유지하며 나레이션 마무리
                { start: 21.0, end: 35.6, target: { type: 'center' }, scale: 80 },
              ],
              bufferSeconds: 1,
            },
          ],
        }}
      />
    </>
  );
};