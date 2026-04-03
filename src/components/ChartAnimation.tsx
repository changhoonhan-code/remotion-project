import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence } from "remotion";
import { HighFidelityBackground } from "./HighFidelityBackground";
import { PieChart } from "./PieChart";

/**
 * [차트 데이터 타입 정의]
 */
export interface ChartDataItem {
  label: string;
  value: number;
  color: string;
  patternImage: string;
}

/**
 * [애니메이션 씬별 타이밍 정의]
 */
export interface SceneTiming {
  title: [number, number];    // 시작, 종료 프레임
  subTitle: [number, number]; // 시작, 종료 프레임
  chart: number;              // 시작 프레임
  legendStart: number;        // 첫 아이템 시작 프레임
  legendGap: number;          // 아이템간 간격 (프레임)
}

/**
 * [컴포넌트 Props 정의]
 */
export interface ChartAnimationProps {
  [key: string]: unknown;
  titleText: string;
  subTitleText: string;
  chartData: ChartDataItem[];
  timing: SceneTiming;
}

/**
 * [1. 타이틀 세션 컴포넌트]
 * 시퀀스 내에서 상대적인 프레임을 사용합니다.
 */
const AnimationHeader: React.FC<{
  title: string;
  subTitle: string;
  timing: SceneTiming;
}> = ({ title, subTitle, timing }) => {
  const frame = useCurrentFrame();

  const titleShowCount = Math.floor(
    interpolate(frame, timing.title, [0, title.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const subTitleOpacity = interpolate(frame, timing.subTitle, [0, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div className="mb-20 text-left max-w-[1200px] mt-20 ml-20">
      <h1
        className="text-7xl font-bold text-slate-800 leading-tight tracking-tight mb-4"
        style={{
          fontFamily: "Playfair Display, Georgia, serif",
          filter: "brightness(0.9) contrast(1.1)"
        }}
      >
        {title.slice(0, titleShowCount)}
        {titleShowCount < title.length && (
          <span className="inline-block w-1.5 h-14 bg-slate-800 ml-1 translate-y-2 animate-pulse" />
        )}
      </h1>
      <p
        className="text-2xl italic text-slate-600 font-serif leading-relaxed"
        style={{ opacity: subTitleOpacity }}
      >
        {subTitle}
      </p>
    </div>
  );
};

/**
 * [2. 메인 차트 컴포넌트]
 */
const ChartSection: React.FC<{
  data: ChartDataItem[];
  timing: number;
}> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 시퀀스 내에서는 0프레임부터 시작하는 spring을 사용합니다.
  const chartProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 60 },
  });

  return (
    <div className="flex flex-row items-center justify-around flex-grow mt-32 px-20">
      <div
        className="relative"
        style={{
          transform: `scale(${interpolate(chartProgress, [0, 1], [0.8, 1])})`,
          opacity: chartProgress
        }}
      >
        <PieChart data={data} size={600} drawProgress={chartProgress} />
      </div>
      {/* 범례 영역을 위해 공간을 확보합니다. (LegendSection에서 별도로 처리) */}
      <div className="w-[400px]" />
    </div>
  );
};

/**
 * [3. 범례 리스트 컴포넌트]
 */
const LegendSection: React.FC<{
  data: ChartDataItem[];
  legendGap: number;
}> = ({ data, legendGap }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div className="flex flex-row items-center justify-around flex-grow mt-32 px-20">
      <div className="w-[600px]" /> {/* 차트 위치를 비워둡니다. */}
      <div className="flex flex-col gap-12 w-[400px]">
        {data.map((item, i) => {
          const individualSpr = spring({
            frame: frame - (i * legendGap),
            fps,
            config: { damping: 14, stiffness: 100 },
          });

          return (
            <div
              key={item.label}
              className="flex items-center gap-6"
              style={{
                opacity: individualSpr,
                transform: `translateX(${interpolate(individualSpr, [0, 1], [40, 0])}px)`
              }}
            >
              <div
                className="w-5 h-5 rounded-sm"
                style={{
                  backgroundColor: item.color,
                  boxShadow: `0 0 10px ${item.color}33`,
                  filter: "saturate(0.8) brightness(1.1)"
                }}
              />

              <div className="flex flex-col">
                <span className="text-3xl font-bold text-slate-700 font-sans tracking-wide">
                  {item.label}
                </span>
                <span
                  className="text-5xl font-black text-slate-800 mt-1"
                  style={{
                    opacity: interpolate(
                      frame,
                      [i * 10 + 40, i * 10 + 70],
                      [0, 1],
                      { extrapolateRight: 'clamp' }
                    )
                  }}
                >
                  {item.value}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * [메인 차트 애니메이션 컴포넌트]
 * <Sequence>를 사용하여 애니메이션 구간을 물리적으로 분리합니다.
 */
export const ChartAnimation: React.FC<ChartAnimationProps> = ({
  titleText,
  subTitleText,
  chartData,
  timing
}) => {
  return (
    <AbsoluteFill className="bg-white overflow-hidden">
      {/* 0. 커스텀 배경 (정지 상태로 전체 유지) */}
      <HighFidelityBackground />

      {/* 1. 헤더 시퀀스 (타이틀 등장 시점부터) */}
      <Sequence from={0}>
        <AnimationHeader
          title={titleText}
          subTitle={subTitleText}
          timing={timing}
        />
      </Sequence>

      {/* 2. 차트 시퀀스 (차트가 시작되는 시점부터) */}
      <Sequence from={timing.chart}>
        <AbsoluteFill>
          <ChartSection data={chartData} timing={timing.chart} />
        </AbsoluteFill>
      </Sequence>

      {/* 3. 범례 시퀀스 (범례 첫 시작 시점부터) */}
      <Sequence from={timing.legendStart}>
        <AbsoluteFill>
          <LegendSection data={chartData} legendGap={timing.legendGap} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
