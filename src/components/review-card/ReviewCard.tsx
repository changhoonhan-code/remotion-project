import React, { useRef, useLayoutEffect } from 'react';
import './ReviewCard.css';
import { ReviewCardProps } from './types';
import { getImageUrl } from './utils/imageHelpers';
import { splitByHighlight } from './utils/textHighlight';
import { StarFilled, StarEmpty } from './ui/Stars';

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
