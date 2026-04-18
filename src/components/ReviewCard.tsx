import React, { useRef, useLayoutEffect } from 'react';
import { staticFile } from 'remotion';
import './ReviewCard.css';
export interface ReviewData {
    review_id: string;
    reviewer_name: string;
    avatar_url?: string;
    rating: number; // 0-5
    title: string;
    date_text: string;
    variant_text?: string;
    is_verified?: boolean;
    body: string;
    helpful_text?: string;
    images?: string[]; 
    highlight_phrase?: string;
}

interface ReviewCardProps {
    data: ReviewData;
    onMeasureHighlight?: (bbox: { x1: number, y1: number, x2: number, y2: number }) => void;
}

// 상대 경로인 경우 Remotion의 public 폴더 참조를 위해 staticFile로 감싸주는 헬퍼
const getImageUrl = (url: string) => {
    if (url.startsWith('http') || url.startsWith('data:')) {
        return url;
    }
    return staticFile(url);
};


/**
 * 하이라이트할 문구를 찾아서 앞/중간/뒤로 쪼개는 헬퍼. 
 * 파이썬의 find_normalized 와 동일한 로직을 수행합니다.
 */
function splitByHighlight(text: string, highlight?: string) {
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

// 아마존 꽉 찬 별 SVG
const StarFilled = () => (
    <svg className="star-icon" width="14" height="14" viewBox="-45 25 600 580" fill="#FF9E60" xmlns="http://www.w3.org/2000/svg">
        <path d="M256 38.013l68.17 210.1h221.03l-178.8 129.9 68.31 210.15L256 458.11l-178.71 130.05 68.3-210.15L-33.2 248.11H187.83L256 38.01z" stroke="#FF9E60" strokeWidth="20" strokeLinejoin="round"/>
    </svg>
);

// 아마존 빈 별 SVG
const StarEmpty = () => (
    <svg className="star-icon" width="14" height="14" viewBox="-45 25 600 580" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M256 38.013l68.17 210.1h221.03l-178.8 129.9 68.31 210.15L256 458.11l-178.71 130.05 68.3-210.15L-33.2 248.11H187.83L256 38.01z" stroke="#FF9E60" strokeWidth="20" strokeLinejoin="round"/>
    </svg>
);

export const ReviewCard: React.FC<ReviewCardProps> = ({ data, onMeasureHighlight }) => {
    const highlightRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 하이라이트 문구 파싱 (Prefix, Target, Suffix)
    const textParts = splitByHighlight(data.body, data.highlight_phrase);

    useLayoutEffect(() => {
        // 리모션 렌더링 시점에 하이라이트 Box의 실제 픽셀 좌표를 콜백으로 상위에 전달
        if (highlightRef.current && containerRef.current && onMeasureHighlight) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const elmRect = highlightRef.current.getBoundingClientRect();
            
            // 컨테이너 기준 상대 좌표(픽셀)로 변환
            const x1 = elmRect.left - containerRect.left;
            const y1 = elmRect.top - containerRect.top;
            const w = elmRect.width;
            const h = elmRect.height;
            
            onMeasureHighlight({
                x1: x1,
                y1: y1,
                x2: x1 + w,
                y2: y1 + h,
            });
        }
    }, [data, onMeasureHighlight]);

    return (
        <div className="review-card-container" ref={containerRef}>
            {/* 프로필 헤더 */}
            <div className="profile-section">
                <div className="avatar-container">
                    {data.avatar_url ? (
                        <img src={getImageUrl(data.avatar_url)} alt="Profile" className="avatar-image" />
                    ) : (
                        <div style={{ backgroundColor: '#E6E6E6', width: '100%', height: '100%' }} />
                    )}
                </div>
                {/* 이름은 프라이버시를 위해 살짝 블러 처리 적용 */}
                <span className="reviewer-name reviewer-name-blurred">
                    {data.reviewer_name}
                </span>
            </div>

            {/* 별점 & 제목 */}
            <div className="rating-title-section">
                <div className="stars-container">
                    {[1, 2, 3, 4, 5].map((idx) => (
                        idx <= data.rating ? <StarFilled key={idx} /> : <StarEmpty key={idx} />
                    ))}
                </div>
                <span className="review-title">{data.title}</span>
            </div>

            {/* 날짜 */}
            <div className="review-date">{data.date_text}</div>

            {/* 옵션 및 구매인증 */}
            {(data.variant_text || data.is_verified) && (
                <div className="format-strip">
                    {data.variant_text && <span>{data.variant_text}</span>}
                    {data.variant_text && data.is_verified && <span className="format-separator">|</span>}
                    {data.is_verified && <span className="verified-purchase">Verified Purchase</span>}
                </div>
            )}

            {/* 본문 코멘트 */}
            <div className="review-body">
                {textParts.length === 3 ? (
                    <>
                        <span>{textParts[0]}</span>
                        <span className="highlight-target" ref={highlightRef} id={`bbox-target-${data.review_id}`}>
                            {textParts[1]}
                        </span>
                        <span>{textParts[2]}</span>
                    </>
                ) : (
                    <span>{textParts[0]}</span>
                )}
            </div>

            {/* 썸네일 이미지 */}
            {data.images && data.images.length > 0 && (
                <div className="review-thumbnails">
                    {data.images.map((url, i) => (
                        <img key={i} src={getImageUrl(url)} alt={`Review img ${i}`} className="review-thumbnail-img" />
                    ))}
                </div>
            )}

            {/* 도움이 됨 버튼 */}
            {data.helpful_text && (
                <div className="helpful-section">
                    {data.helpful_text}
                </div>
            )}
            
            <div className="helpful-button-row">
                <button className="helpful-button">Helpful</button>
                <span className="report-text">| &nbsp; Report</span>
            </div>
        </div>
    );
};
