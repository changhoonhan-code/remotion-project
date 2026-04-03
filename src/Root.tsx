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
        id="CircleOnCard-Partial"
        component={CircleOnCard}
        calculateMetadata={calculateCircleOnCardMetadata}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          imageSrc: staticFile('card_R1HZODJ2ZI3AYF.png'), // 실제 파일명으로 수정
          baseWidth: 1024,
          baseHeight: 410,
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
        }}
      />
    </>
  );
};