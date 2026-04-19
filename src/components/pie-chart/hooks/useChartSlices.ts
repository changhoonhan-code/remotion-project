import { useMemo } from 'react';
import { ChartSlice } from '../types';

export interface EvaluatedSlice extends ChartSlice {
  targetValue: number;
  start: number;
  end: number;
  startFrame: number;
  endFrame: number;
}

export const useChartSlices = (data: ChartSlice[]): EvaluatedSlice[] => {
  return useMemo(() => {
    const startAngle = -Math.PI / 2; // 상단(12시 방향)에서 무조건 동시 시작

    // 배열의 역순으로(가장 상단에 올 작은 조각부터) 값을 누적합 합니다.
    // 첫번째 조각(가장 큰 조각)은 가장 아래에 깔리며, 누적값이 100이 되어 완전한 원이 됩니다.
    let accumulatedValue = 0;
    const evaluatedSlices = [...data].reverse().map((d) => {
      accumulatedValue += d.value;
      return {
        ...d,
        targetValue: accumulatedValue // 이 조각이 그려야 할 12시 기준 목표 퍼센트
      };
    }).reverse();

    return evaluatedSlices.map((d) => {
      const endAngle = startAngle + (d.targetValue / 100) * 2 * Math.PI;
      
      // 모든 조각이 동시에 그려지기 시작하도록 startFrame을 0으로 고정합니다.
      const startFrame = 0;
      const endFrame = d.durationFrames; // 프레임 단위입니다.

      return { ...d, start: startAngle, end: endAngle, startFrame, endFrame };
    });
  }, [data]);
};
