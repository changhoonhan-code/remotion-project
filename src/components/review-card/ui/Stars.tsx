import React from 'react';

// 아마존 꽉 찬 별 SVG
export const StarFilled: React.FC = () => (
    <svg className="star-icon" width="14" height="14" viewBox="-45 25 600 580" fill="#FF9E60" xmlns="http://www.w3.org/2000/svg">
        <path d="M256 38.013l68.17 210.1h221.03l-178.8 129.9 68.31 210.15L256 458.11l-178.71 130.05 68.3-210.15L-33.2 248.11H187.83L256 38.01z" stroke="#FF9E60" strokeWidth="20" strokeLinejoin="round"/>
    </svg>
);

// 아마존 빈 별 SVG
export const StarEmpty: React.FC = () => (
    <svg className="star-icon" width="14" height="14" viewBox="-45 25 600 580" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M256 38.013l68.17 210.1h221.03l-178.8 129.9 68.31 210.15L256 458.11l-178.71 130.05 68.3-210.15L-33.2 248.11H187.83L256 38.01z" stroke="#FF9E60" strokeWidth="20" strokeLinejoin="round"/>
    </svg>
);
