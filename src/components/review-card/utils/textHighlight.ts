/**
 * 하이라이트할 문구를 찾아서 앞/중간/뒤로 쪼개는 헬퍼. 
 * 파이썬의 find_normalized 와 동일한 로직을 수행합니다.
 */
export function splitByHighlight(text: string, highlight?: string) {
    if (!highlight) return [text];
    
    // 무시할 특수문자 (공백, 줄바꿈, 구두점 등)
    const ignoreRegex = /[.,'%+\- \n\r]/;
    const cleanSearch = highlight.split('').filter(c => !ignoreRegex.test(c)).join('').toLowerCase();
    
    if (!cleanSearch) return [text];

    let tIdx = 0;
    while (tIdx < text.length) {
        if (!ignoreRegex.test(text[tIdx]) && text[tIdx].toLowerCase() === cleanSearch[0]) {
            let tempTIdx = tIdx;
            let sIdx = 0;
            // 텍스트와 검색어 매칭 확인
            while (tempTIdx < text.length && sIdx < cleanSearch.length) {
                if (ignoreRegex.test(text[tempTIdx])) {
                    tempTIdx++;
                    continue;
                }
                if (text[tempTIdx].toLowerCase() === cleanSearch[sIdx]) {
                    tempTIdx++;
                    sIdx++;
                } else {
                    break;
                }
            }
            if (sIdx === cleanSearch.length) {
                // 정확히 찾았을 경우 분할 리턴
                return [
                    text.substring(0, tIdx),       // Prefix
                    text.substring(tIdx, tempTIdx),// Highlighted
                    text.substring(tempTIdx)       // Suffix
                ];
            }
        }
        tIdx++;
    }
    return [text];
}
