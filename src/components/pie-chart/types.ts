/**
 * 차트 슬라이스 한 조각의 상세 데이터를 정의합니다.
 */
export interface ChartSlice {
    label: string;
    value: number; // 0 ~ 100 사이의 퍼센트
    color: string; // 현재 사용되지 않지만 데이터 스키마상 유지
    patternImage: string; // (필수) 배경 이미지 패턴 경로
    durationFrames: number; // (추가) 이 조각이 그려지는 데 할당할 프레임 수
  }
  
  export interface PieChartProps {
    data: ChartSlice[];
    size: number;
  }
