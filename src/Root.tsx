import React from 'react';
import { Composition, staticFile, AbsoluteFill, Sequence } from 'remotion';
import { ThemeComparison } from './components/Theme';
import { PieChart } from './components/PieChart';
import { NarratedScene } from './components/NarratedScene';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import ancLeaderData from './data/anc_leader.json';

// 오디오와 자막이 포함된 하이라이트 씬 래퍼 (데이터 연동)
const HighlightSceneWithNarration: React.FC<any> = (props) => {
  return (
    <NarratedScene
      audioSrc={staticFile('narration_audio/anc_leader.wav')}
      subtitles={ancLeaderData.word_timestamps}
    >
      {/* chartProps가 전달되면 파이차트를 오버레이 */}
      {props.chartProps && (
        <Sequence
          from={props.chartProps.startFrame ?? 0}
          durationInFrames={props.chartProps.durationInFrames ?? 300}
          style={{ zIndex: 10 }}
        >
          <AnimatedPieChart {...props.chartProps} />
        </Sequence>
      )}

      <ThemeComparison {...props} />

    </NarratedScene>
  );
};

interface AnimatedChartProps {
  chartData: any[];
  size?: number;
  containerStyle?: React.CSSProperties;
  springConfig?: { damping: number; stiffness: number };
  initialScale?: number;
}

const AnimatedPieChart: React.FC<AnimatedChartProps> = ({
  chartData,
  size = 400,
  containerStyle,
  springConfig = { damping: 15, stiffness: 60 },
  initialScale = 0.8
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chartProgress = spring({
    frame,
    fps,
    config: springConfig,
  });

  return (
    <AbsoluteFill style={containerStyle}>
      <div style={{
        opacity: chartProgress,
        transform: `scale(${interpolate(chartProgress, [0, 1], [initialScale, 1])})`
      }}>
        <PieChart data={chartData} size={size} />
      </div>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
        component={HighlightSceneWithNarration}
        // 오디오 실제 길이에 맞춰 전체 duration 결정 (예시 데이터 기준 약 43초)
        durationInFrames={Math.ceil((ancLeaderData.narration_audio.actual_duration_sec + 1) * 30)}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          sequences: [
            {
              // review_card_data.image_path / review_card_data.size 에서 추출
              images: [
                { src: 'card_combined_all_blocks.webp', height: 10084 },
              ],
              baseWidth: 1920,
              // scaleMode: 'fixed' → scale은 이미지 대비 고정 배율 (100=화면에 딱 맞음, 120=1.2배 확대)
              // 같은 scale이면 줌 변화 없이 카메라 팬만 발생
              scaleMode: 'fixed' as const,
              parallaxFactor: 0.35,
              scenes: [
                { start: 1, end: 3, target: { type: 'pen', bboxes: [{ x1: 216, y1: 170, x2: 463, y2: 188 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 4, end: 6, target: { type: 'pen', bboxes: [{ x1: 432, y1: 606, x2: 631, y2: 624 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 7, end: 9, target: { type: 'pen', bboxes: [{ x1: 216, y1: 962, x2: 463, y2: 980 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 10, end: 12, target: { type: 'pen', bboxes: [{ x1: 593, y1: 1338, x2: 828, y2: 1356 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 13, end: 15, target: { type: 'pen', bboxes: [{ x1: 416, y1: 1994, x2: 670, y2: 2012 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 16, end: 18, target: { type: 'pen', bboxes: [{ x1: 908, y1: 2470, x2: 1004, y2: 2488 }, { x1: 40, y1: 2490, x2: 183, y2: 2508 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 19, end: 21, target: { type: 'pen', bboxes: [{ x1: 152, y1: 3146, x2: 401, y2: 3164 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 22, end: 24, target: { type: 'pen', bboxes: [{ x1: 271, y1: 4042, x2: 517, y2: 4060 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 25, end: 27, target: { type: 'pen', bboxes: [{ x1: 954, y1: 4498, x2: 987, y2: 4516 }, { x1: 40, y1: 4518, x2: 237, y2: 4536 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 28, end: 30, target: { type: 'pen', bboxes: [{ x1: 429, y1: 5014, x2: 603, y2: 5032 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 31, end: 33, target: { type: 'pen', bboxes: [{ x1: 240, y1: 5590, x2: 495, y2: 5608 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 34, end: 36, target: { type: 'pen', bboxes: [{ x1: 686, y1: 5946, x2: 904, y2: 5964 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 37, end: 39, target: { type: 'pen', bboxes: [{ x1: 603, y1: 6358, x2: 908, y2: 6376 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 40, end: 42, target: { type: 'pen', bboxes: [{ x1: 164, y1: 6814, x2: 410, y2: 6832 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 43, end: 45, target: { type: 'pen', bboxes: [{ x1: 289, y1: 7266, x2: 480, y2: 7284 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 46, end: 48, target: { type: 'pen', bboxes: [{ x1: 107, y1: 7702, x2: 348, y2: 7720 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 49, end: 51, target: { type: 'pen', bboxes: [{ x1: 494, y1: 8198, x2: 716, y2: 8216 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 52, end: 54, target: { type: 'pen', bboxes: [{ x1: 731, y1: 8614, x2: 978, y2: 8632 }, { x1: 40, y1: 8634, x2: 91, y2: 8652 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 55, end: 57, target: { type: 'pen', bboxes: [{ x1: 524, y1: 8926, x2: 837, y2: 8944 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 58, end: 60, target: { type: 'pen', bboxes: [{ x1: 494, y1: 9322, x2: 716, y2: 9340 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true },
                { start: 61, end: 63, target: { type: 'pen', bboxes: [{ x1: 908, y1: 9858, x2: 984, y2: 9876 }, { x1: 40, y1: 9878, x2: 145, y2: 9896 }] }, centerOffset: { x: 0.05, y: 0 }, scale: 200, easing: 'smooth', draw: true }
              ],

              bufferSeconds: 1,
            },
          ],
          chartProps: {
            startFrame: 30, // 1초 지점에 차트 등장
            durationInFrames: 600, // 약 20초간 생존
            size: 800,
            containerStyle: { justifyContent: 'center', alignItems: 'center', top: '-10%', left: '25%' },
            chartData: [
              { label: "Positive", value: 45, patternImage: staticFile("blue-pattern.png"), durationFrames: 60 },
              { label: "Negative", value: 35, patternImage: staticFile("red-pattern.png"), durationFrames: 90 },
              { label: "Neutral", value: 20, patternImage: staticFile("gray-pattern.png"), durationFrames: 100 }
            ]
          }
        }}
      />
    </>
  );
};