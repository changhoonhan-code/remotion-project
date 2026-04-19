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
    start?: number;
    duration?: number;
}

export interface ReviewCardProps {
    data: ReviewData;
    onMeasureHighlight?: (bbox: { x1: number, y1: number, x2: number, y2: number }) => void;
}
