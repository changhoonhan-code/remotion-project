/**
 * 루트 레벨의 범용 타입 선언 
 * (추후 Subtitle 등 세부 컴포넌트로 분리될 수 있습니다)
 */

// ==========================================
// 오디오 / 자막 관련
// ==========================================

/**
 * 음성 나레이션의 개별 단어 타임스탬프 정보입니다. (가라오케 효과 등에 사용)
 */
export interface WordTimestamp {
    word: string;
    time_start: number;
    time_end: number;
    text_start?: number;
    text_end?: number;
}
