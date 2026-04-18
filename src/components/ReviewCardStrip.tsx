import React, { useState, useEffect, useCallback } from 'react';
import { AbsoluteFill, delayRender, continueRender } from 'remotion';
import { ReviewCard, ReviewProps } from './ReviewCard';
import { SceneConfig } from './types';

interface ReviewCardStripProps {
  reviews: ReviewProps[];
  onMeasureComplete: (measurements: { bboxes: any[], totalHeight: number }) => void;
}

export const ReviewCardStrip: React.FC<ReviewCardStripProps> = ({
  reviews,
  onMeasureComplete,
}) => {
  const [handle] = useState(() => delayRender('Measuring Review DOM Elements'));
  const [measurements, setMeasurements] = useState<Record<string, DOMRect>>({});
  
  const handleMeasure = useCallback((reviewId: string, rect: DOMRect) => {
    setMeasurements((prev) => ({
      ...prev,
      [reviewId]: rect
    }));
  }, []);

  useEffect(() => {
    // Only continue if we have measured all reviews that have highlights
    const expectedMeasures = reviews.filter(r => r.highlight_phrase).length;
    const currentMeasures = Object.keys(measurements).length;

    if (currentMeasures > 0 && currentMeasures >= expectedMeasures) {
      // Build exactly the output the parent expects
      const mainContainer = document.getElementById('review-strip-container');
      const totalHeight = mainContainer ? mainContainer.scrollHeight : 2000;

      // Extract bboxes to pass to parent
      const bboxes = reviews.map(r => {
        if (!r.highlight_phrase || !measurements[r.review_id]) {
          return null;
        }
        const rect = measurements[r.review_id];
        return {
          x1: rect.left,
          y1: rect.top,
          x2: rect.right,
          y2: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      }).filter(Boolean);

      onMeasureComplete({ bboxes, totalHeight });
      continueRender(handle);
    }
  }, [measurements, reviews, handle, onMeasureComplete]);

  // If no highlights expected, just continue directly
  useEffect(() => {
    const expectedMeasures = reviews.filter(r => r.highlight_phrase).length;
    if (expectedMeasures === 0) {
      onMeasureComplete({ bboxes: [], totalHeight: 1000 });
      continueRender(handle);
    }
  }, [reviews, handle, onMeasureComplete]);

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <div 
        id="review-strip-container"
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 20, 
          padding: 40,
          width: '100%',
          alignItems: 'center'
        }}
      >
        {reviews.map((review) => (
          <ReviewCard 
            key={review.review_id}
            {...review}
            onMeasure={handleMeasure}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
